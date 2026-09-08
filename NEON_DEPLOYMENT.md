# Neon deployment

1. Create a Neon project and copy the pooled connection string.
2. Add `DATABASE_URL` to the Node hosting environment. Never commit it to GitHub.
3. Deploy the complete repository to any Node 20 host. Render is not required.
4. The app creates `marketplace_state` automatically and imports `db.json` only when Neon is empty.
5. Open `/api/health`; `database.mode` must show `neon-postgres`.
6. Keep uploaded listing images on object storage or a persistent disk. Neon stores advert data, not image files.

For a separate GitHub Pages frontend, edit `runtime-config.js` so the value is the deployed API origin.
