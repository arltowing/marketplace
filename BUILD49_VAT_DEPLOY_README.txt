TCS Marketplace Build49 - VAT-aware pricing

1. Extract this ZIP.
2. Run Deploy_Build48_Google_Security.ps1. The deployment migration now includes the Build49 VAT columns.
3. Deploy the Neon Function.
4. Upload the complete marketplace-main contents to GitHub.
5. Test Place Advert with all three VAT statuses.
6. Confirm public listings and Admin Manage All Adverts show the same VAT calculation.

Existing adverts migrate to vat_status=no_vat and keep the same customer price.
VAT is never added automatically unless the seller explicitly selects VAT excluded.
