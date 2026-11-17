-- Build49 VAT-aware listing pricing
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS vat_status TEXT NOT NULL DEFAULT 'no_vat';
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(6,2) NOT NULL DEFAULT 15.00;
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS vat_number TEXT;
ALTER TABLE marketplace_listings DROP CONSTRAINT IF EXISTS marketplace_listings_vat_status_check;
ALTER TABLE marketplace_listings ADD CONSTRAINT marketplace_listings_vat_status_check CHECK (vat_status IN ('no_vat','included','excluded'));
COMMENT ON COLUMN marketplace_listings.vat_status IS 'no_vat, included, or excluded';
COMMENT ON COLUMN marketplace_listings.vat_rate IS 'VAT percentage used for customer price calculation';
