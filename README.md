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


### Build32 admin access and TCS contacts
- Static test-stage Admin allowlist: Rudolphvanwyk@rocketmail.com, theosteynplant@gmail.com, janplessis@yahoo.co.uk.
- Admin sign-in gate, session-only access and sign-out control.
- TCS support phones, WhatsApp links and public support emails added.
- Production warning retained: real security requires server-side password authentication.


### Build33 high-attention public experience
- Strong new marketplace hero and clearer calls to action.
- Trust strip, category introduction, market identity visual, selling steps and improved public hierarchy.
- Mobile responsive, accessible reduced-motion support and no invented sales claims.
- All Build32 Admin access, contacts, advert photos and approval functions retained.

#### Build35 shared public adverts
- Public website uses the Render API for shared listings across all devices.
- CORS enabled for marketplace.tcstowing.co.za.
- New adverts are stored centrally, remain pending, and become public after Admin approval.
