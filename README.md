# TCS Marketplace Build27

Customer-facing marketplace for fleet vehicles, towing, TLBs, earthmoving equipment, tractors, trucks, farm implements, industrial equipment, parts and services.

## Public domain
`https://marketplace.tcstowing.co.za`

## Removed
Software products, software downloads, package quarantine, PayFast software checkout and software-product approval.

## Local run
```bash
npm install
npm start
```

## VPS run
```bash
cp .env.example .env
docker compose up -d --build
```

## Persistent data
Keep `data/` and `storage/` backed up. Never commit `.env`.

## Production safety note
The inherited demo-header role mechanism must be replaced with secure login sessions before unrestricted public seller/admin launch. Public browsing can be enabled while admin/seller routes remain restricted.


### Build28 mobile and image hardening
- Responsive phone layout and touch targets.
- No horizontal page overflow.
- Advert photos use contain-fit so vehicles and machinery are not cropped.
- Responsive card, gallery and upload-preview images.
- Mobile filters, forms and action buttons use a single-column layout.
