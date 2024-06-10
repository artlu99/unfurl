import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";

import ogs from "open-graph-scraper-lite";

import { hello, landingPage } from "./hello";
import { isValidUrl, safeFetch } from "./utils";

type Bindings = {
  KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app
  .use("/", cors()) // TODO: replace open CORS with authentication and CSRF protection
  .use(prettyJSON({ space: 4 })) // to see prettified JSON, add ?pretty at end of url
  .get("/", async (c) => {
    const url = c.req.query("u");
    if (!url) return c.html(landingPage(), { headers: hello() });

    const isCached = await c.env.KV.get(url);
    if (isCached)
      return c.text(isCached, {
        headers: { "content-type": "application/json" },
      });

    if (!isValidUrl(url)) return c.text("Invalid URL");

    const html = await safeFetch(url);
    if (!html) return c.text(`Could not fetch ${url}`);

    const parseResult = ogs({ html, onlyGetOpenGraphInfo: true });
    const res2 = await parseResult;
    const { result } = res2;

    await c.env.KV.put(url, JSON.stringify(result));

    return c.json(result);
  })
  .get("/health", async (c) => {
    return c.text("ok");
  })
  .post("/bust", async (c) => {
    const body = await c.req.json();
    const url = body.url;
    if (!url) return c.text("Invalid URL");

    if (!isValidUrl(url)) return c.text("Invalid URL");

    await c.env.KV.delete(url);
    return c.text("ok");
  });

export default app;
