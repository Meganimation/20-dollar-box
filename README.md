# 20 Dollar Box

React + Vite frontend with an Express + Stripe backend.

## Environment

### Frontend

Copy `.env.example` to `.env` if you need to override the API host:

```bash
cp .env.example .env
```

- `VITE_API_BASE_URL` (optional): full backend origin (for split frontend/backend deployments). Leave empty when frontend and backend are served from the same host.

### Backend

Copy `server/.env.sample` to `server/.env` and fill Stripe keys:

```bash
cp server/.env.sample server/.env
```

Required:
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`

Optional:
- `PORT` (default `5252`)
- `STATIC_DIR` (default `../dist`)
- `CORS_ORIGIN` (set this in production if frontend is hosted on another domain)

## Local development

```bash
npm ci
cd server && npm ci && cd ..
```

Run frontend:

```bash
npm run dev
```

Run backend:

```bash
cd server && npm start
```

## Production deployment

1. Build frontend:
   ```bash
   npm run build
   ```
2. Configure `server/.env` for production keys and host settings.
3. Start backend:
   ```bash
   cd server && npm start
   ```

The backend serves both `/public` assets and the built frontend from `STATIC_DIR`.
