A microservice to unfurl Open Graph data from URLs.

## Endpoints

Base URL: https://unfurl.artlu.workers.dev

| Method | Path | Description |
| --- | --- | --- |
| GET | `/?u=<url>` | Unfurl Open Graph & Twitter Card data for `<url>` as JSON. Without `?u`, serves a landing page. |
| GET | `/health` | Health check, returns `ok`. |
| POST | `/bust` | Evict a URL from cache. Body: `{"url": "https://example.com"}`. |

Add `?pretty` to any request for pretty-printed JSON.

Successful unfurls are cached in Cloudflare KV indefinitely, keyed by the `u` param — POST to `/bust` to refresh a URL.

## Development

Requires [Bun](https://bun.sh).

```sh
bun install
bunx wrangler types  # generate worker types (required before bun check)
bun dev              # dev server at http://localhost:8787 (local KV sim)
bun check
bun run deploy       # requires Cloudflare auth (wrangler login)
```

Built with [Hono](https://hono.dev) on Cloudflare Workers.
