# Server

## Environment

Copy `.env.sample` to `.env`:

```bash
cp .env.sample .env
```

Required:
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`

Optional:
- `PORT` (default `5252`)
- `STATIC_DIR` (default `../dist`)
- `CORS_ORIGIN` (frontend origin when hosted separately)
- `RATE_LIMIT_WINDOW_MS` (default `60000`)
- `RATE_LIMIT_MAX_REQUESTS` (default `120`)

## Run

```bash
npm ci
npm start
```

## Health check

`GET /healthz` returns `200` with `{ "status": "ok" }`.
