TCS Marketplace Build46 Neon Persistent Marketplace

This overlay replaces production db.json and Render local image storage for listing workflows.
- Listings, approvals, edits, reports, enquiries and deletion use Neon PostgreSQL.
- Images upload to Neon Object Storage through its S3-compatible API.
- Permanent delete removes Object Storage files first, then deletes the PostgreSQL row.
- Render is stateless API execution only.

Apply this overlay to the current arltowing/marketplace repository root.
Keep the current GitHub Pages frontend and SEO files.
Configure all variables in RENDER_NEON_ENVIRONMENT.txt, then deploy.
Expected health build: 46-neon-persistent-marketplace
