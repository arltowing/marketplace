TCS Marketplace Build48 - Google Admin Security

The public Google Client ID is already configured.

DEPLOY
1. Extract this ZIP.
2. Run Deploy_Build48_Google_Security.ps1.
3. Complete Neon login only if requested.
4. The script links the existing TCS Marketplace production branch.
5. The script creates Admin users, secure sessions and audit tables.
6. The script redeploys the existing Neon Function named marketplaceapi.
7. Upload the complete marketplace-main contents to GitHub after the deployment succeeds.
8. Do not upload neon-function/.env.local, neon-function/.neon or neon-function/node_modules.
9. Test Google Sign-In at https://marketplace.tcstowing.co.za/admin-login.html.

INITIAL ADMIN ALLOWLIST
- rudolphvanwyk@rocketmail.com
- theosteynplant@gmail.com
- janplessis@yahoo.co.uk

Each address must be represented by a valid Google Account to use Google Sign-In.
No Google Client Secret is used or required.
Admin sessions last eight hours and can be revoked at sign-out.
