A microservice to unfurl Open Graph data from URLs.

## Endpoints

Base URL: https://unfurl.artlu.workers.dev

| Method | Path | Description |
| --- | --- | --- |
| GET | `/?u=<url>` | Unfurl Open Graph & Twitter Card data for `<url>` as JSON. Without `?u`, serves a landing page. |
| GET | `/health` | Health check, returns `ok`. |
| POST | `/bust` | Evict a URL from cache. Body: `{"url": "https://example.com"}`. Purges Workers Caching globally by tag; the inner Cache API entry is only cleared on the colo serving the request (elsewhere it expires via TTL). |

Add `?pretty` to any request for pretty-printed JSON.

Successful unfurls are cached for 7 days at two layers: Workers Caching in front of the worker (`cf-cache-status` header; also covers service-binding callers) and the Cache API inside it, keyed on the normalized URL (tracking params, fragment, and host casing stripped; `x-unfurl-cache` header). Deploys start the outer cache cold.

## Development

Requires [Bun](https://bun.sh).

```sh
bun install
bunx wrangler types  # generate worker types (required before bun check)
bun dev              # dev server at http://localhost:8787
bun check
bun run deploy       # requires Cloudflare auth (wrangler login)
```

Built with [Hono](https://hono.dev) on Cloudflare Workers.
