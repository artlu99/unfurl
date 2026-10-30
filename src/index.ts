import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";

import ogs from "open-graph-scraper-lite";

import { hello, landingPage } from "./hello";
import { cacheTagFor, isValidUrl, normalizeUrl, safeFetch } from "./utils";

// How long resolved previews stay in the Cache API (per-colo, best-effort).
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const app = new Hono<{ Bindings: Cloudflare.Env }>();

// The Cache API keys on Request URLs; any hostname works, so build a stable
// synthetic one from the normalized target URL.
const cacheKeyFor = (url: string) =>
  new Request(`https://unfurl.cache/?u=${encodeURIComponent(url)}`);

app
  .use("/", cors()) // TODO: replace open CORS with authentication and CSRF protection
  .use(prettyJSON({ space: 4 })) // to see prettified JSON, add ?pretty at end of url
  .get("/", async (c) => {
    const raw = c.req.query("u");
    if (!raw) return c.html(landingPage(), { headers: hello() });

    const url = normalizeUrl(raw);
    if (!url || !isValidUrl(url)) return c.text("Invalid URL");

    const cache = caches.default;
    const key = cacheKeyFor(url);

    const hit = await cache.match(key);
    if (hit) {
      const res = new Response(hit.body, hit);
      res.headers.set("x-unfurl-cache", "HIT");
      return res;
    }

    const html = await safeFetch(url);
    if (!html) return c.text(`Could not fetch ${url}`);

    const parseResult = ogs({ html, onlyGetOpenGraphInfo: true });
    const res2 = await parseResult;
    const { result } = res2;

    const res = c.json(result, 200, {
      "cache-control": `public, max-age=${CACHE_TTL_SECONDS}`,
      // Lets POST /bust purge this response from Workers Caching globally
      // (ctx.cache.purge by tag). Cloudflare strips the header from the
      // response before it reaches clients.
      "cache-tag": await cacheTagFor(url),
      "x-unfurl-cache": "MISS",
    });
    c.executionCtx.waitUntil(cache.put(key, res.clone()));
    return res;
  })
  .get("/health", async (c) => {
    return c.text("ok");
  })
  .post("/bust", async (c) => {
    const body = await c.req.json();
    const raw = body.url;
    if (!raw) return c.text("Invalid URL");

    const url = normalizeUrl(raw);
    if (!url || !isValidUrl(url)) return c.text("Invalid URL");

    // Outer cache: instant global purge by tag. Inner cache: per-colo delete —
    // inner entries on other colos expire via TTL (see AGENTS.md).
    // (Cast: Hono's bundled ExecutionContext type predates ctx.cache.)
    const { cache } = c.executionCtx as ExecutionContext & {
      cache?: CacheContext;
    };
    const purge = await cache?.purge({
      tags: [await cacheTagFor(url)],
    });
    if (purge && !purge.success) {
      return c.text(
        `Purge failed: ${purge.errors.map((e) => e.message).join("; ")}`,
        500,
      );
    }
    await caches.default.delete(cacheKeyFor(url));
    return c.text("ok");
  });

export default app;
