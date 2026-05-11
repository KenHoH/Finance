# Deploy Checklist

## Frontend

- Build with `VITE_API_URL` pointing to the deployed backend URL.
- Serve the built `dist` folder with SPA fallback to `index.html`.

## Backend

- Run `npm run build` before deploy. This also runs `prisma generate`.
- Run `npx prisma migrate deploy` against the production database before starting the app.
- Set `NODE_ENV=production`.
- Set `FRONTEND_URL` to the deployed frontend origin.
- Set `ALLOWED_ORIGINS` to every trusted frontend origin, comma-separated.
- Set `COOKIE_SAMESITE=none` and use HTTPS for cross-domain frontend/backend deployments.
- Set `COOKIE_DOMAIN` only when the frontend and backend share a parent domain.
- Set `REDIS_URL` or the `REDIS_HOST` / `REDIS_PORT` variables for BullMQ.
- Set `OCR_SERVICE_URL` to the deployed OCR service URL.

## OCR Service

- Set `GROQ_API_KEY`.
- Set `ALLOWED_ORIGINS` to trusted backend/frontend origins.

## Secrets

- Rotate any secrets that were pasted into chat or committed locally.
- Never commit `.env` files.
