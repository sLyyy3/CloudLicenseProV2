-- =====================================================
-- COMPLETE DATABASE MIGRATION - License Duration System
-- =====================================================
-- Run this in Supabase SQL Editor to fix all database issues
-- Copy and paste the entire content, then execute

-- =====================================================
-- 1. Add license_duration to reseller_products
-- =====================================================
ALTER TABLE reseller_products
ADD COLUMN IF NOT EXISTS license_duration INTEGER DEFAULT 30;

COMMENT ON COLUMN reseller_products.license_duration IS 'License duration in days (0 = lifetime, 1 = 1 day, 30 = 30 days, 365 = 1 year)';

-- =====================================================
-- 2. Add expires_at to customer_keys
-- =====================================================
ALTER TABLE customer_keys
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

COMMENT ON COLUMN customer_keys.expires_at IS 'When the license key expires (NULL = lifetime license)';

-- =====================================================
-- 3. Create index for better performance on expiry queries
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_customer_keys_expires_at
ON customer_keys(expires_at)
WHERE expires_at IS NOT NULL;

-- =====================================================
-- 4. Verify the changes
-- =====================================================
-- This will show you the structure of customer_keys table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'customer_keys'
ORDER BY ordinal_position;

-- =====================================================
-- 5. Verify reseller_products structure
-- =====================================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'reseller_products'
ORDER BY ordinal_position;

-- =====================================================
-- SUCCESS!
-- =====================================================
-- If you see "license_duration" in reseller_products
-- and "expires_at" in customer_keys, you're all set!
-- =====================================================
