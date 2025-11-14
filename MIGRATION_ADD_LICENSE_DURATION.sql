-- ============================================
-- MIGRATION: Add license_duration to reseller_products
-- ============================================
-- Run this in Supabase SQL Editor

-- Add license_duration column to reseller_products
ALTER TABLE reseller_products
ADD COLUMN IF NOT EXISTS license_duration INTEGER DEFAULT 30;

-- Add comment
COMMENT ON COLUMN reseller_products.license_duration IS 'License duration in days (0 = lifetime, 1 = 1 day, 30 = 30 days, 365 = 1 year)';

-- Verify the change
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'reseller_products'
ORDER BY ordinal_position;
