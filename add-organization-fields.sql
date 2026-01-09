-- Add additional organization fields
-- Run this in Supabase SQL Editor

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS vat_nr TEXT,
ADD COLUMN IF NOT EXISTS our_reference TEXT,
ADD COLUMN IF NOT EXISTS bankgiro TEXT,
ADD COLUMN IF NOT EXISTS plusgiro TEXT,
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS bic TEXT,
ADD COLUMN IF NOT EXISTS is_fa_approved BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN organizations.vat_nr IS 'VAT/Moms number (e.g., SE123456789001)';
COMMENT ON COLUMN organizations.our_reference IS 'Our reference person';
COMMENT ON COLUMN organizations.bankgiro IS 'Bankgiro number';
COMMENT ON COLUMN organizations.plusgiro IS 'Plusgiro number';
COMMENT ON COLUMN organizations.iban IS 'IBAN number for international payments';
COMMENT ON COLUMN organizations.bic IS 'BIC/SWIFT code';
COMMENT ON COLUMN organizations.is_fa_approved IS 'F-skatt approved (Tax registration for sole proprietors)';
