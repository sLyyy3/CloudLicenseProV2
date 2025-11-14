-- ============================================
-- CLOUDLICENSEPRO V2 - COMPLETE DATABASE SETUP
-- ============================================
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy this ENTIRE file
-- 4. Execute it
-- 5. Done!
-- ============================================

-- ============================================
-- STEP 1: Drop existing tables (CAREFUL!)
-- ============================================
-- Uncomment these lines if you want to start fresh
-- WARNING: This will delete ALL data!

-- DROP TABLE IF EXISTS customer_keys CASCADE;
-- DROP TABLE IF EXISTS customer_orders CASCADE;
-- DROP TABLE IF EXISTS reseller_products CASCADE;
-- DROP TABLE IF EXISTS reseller_sales CASCADE;

-- ============================================
-- STEP 2: Create customer_orders table
-- ============================================

CREATE TABLE IF NOT EXISTS customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_orders_email ON customer_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON customer_orders(status);
CREATE INDEX IF NOT EXISTS idx_customer_orders_created_at ON customer_orders(created_at DESC);

COMMENT ON TABLE customer_orders IS 'Customer purchase orders from all shops';
COMMENT ON COLUMN customer_orders.items IS 'JSONB array of {product_id, product_name, price, quantity}';

-- ============================================
-- STEP 3: Create customer_keys table
-- ============================================

CREATE TABLE IF NOT EXISTS customer_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  key_code TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked')),
  order_id UUID REFERENCES customer_orders(id) ON DELETE SET NULL,
  reseller_product_id UUID,  -- Nullable, references reseller_products(id) but no FK constraint to avoid circular dependency
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_keys_email ON customer_keys(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_keys_order_id ON customer_keys(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_keys_reseller_product_id ON customer_keys(reseller_product_id);
CREATE INDEX IF NOT EXISTS idx_customer_keys_status ON customer_keys(status);
CREATE INDEX IF NOT EXISTS idx_customer_keys_key_code ON customer_keys(key_code);
CREATE INDEX IF NOT EXISTS idx_customer_keys_created_at ON customer_keys(created_at DESC);

COMMENT ON TABLE customer_keys IS 'License keys purchased by customers';
COMMENT ON COLUMN customer_keys.reseller_product_id IS 'NULL for developer direct sales, UUID for reseller sales';

-- ============================================
-- STEP 4: Create/Update reseller_products table
-- ============================================

CREATE TABLE IF NOT EXISTS reseller_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL,  -- References resellers(id) but no FK to avoid dependency issues
  product_name TEXT NOT NULL,
  description TEXT,
  reseller_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity_available INTEGER DEFAULT 0,
  quantity_sold INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  keys_pool TEXT DEFAULT '[]',  -- JSON array stored as TEXT
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reseller_products_reseller_id ON reseller_products(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_products_status ON reseller_products(status);
CREATE INDEX IF NOT EXISTS idx_reseller_products_created_at ON reseller_products(created_at DESC);

COMMENT ON TABLE reseller_products IS 'Products listed by resellers with key inventory';
COMMENT ON COLUMN reseller_products.keys_pool IS 'JSON array of license keys as TEXT (FIFO distribution)';

-- ============================================
-- STEP 5: Create reseller_sales table (optional tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS reseller_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reseller_sales_reseller_id ON reseller_sales(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_sales_customer_email ON reseller_sales(customer_email);
CREATE INDEX IF NOT EXISTS idx_reseller_sales_created_at ON reseller_sales(created_at DESC);

COMMENT ON TABLE reseller_sales IS 'Sales tracking for reseller analytics';

-- ============================================
-- STEP 6: Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on customer tables
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Customers can view own orders" ON customer_orders;
DROP POLICY IF EXISTS "Allow authenticated order inserts" ON customer_orders;
DROP POLICY IF EXISTS "Customers can view own keys" ON customer_keys;
DROP POLICY IF EXISTS "Allow authenticated key inserts" ON customer_keys;

-- ============================================
-- POLICY 1: Customer Orders - Read Access
-- ============================================
-- Allow customers to view their own orders
CREATE POLICY "Customers can view own orders" ON customer_orders
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = customer_email
  );

-- ============================================
-- POLICY 2: Customer Orders - Insert Access
-- ============================================
-- Allow authenticated users to create orders
CREATE POLICY "Allow authenticated order inserts" ON customer_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- ============================================
-- POLICY 3: Customer Keys - Read Access
-- ============================================
-- Allow customers to view their own keys
CREATE POLICY "Customers can view own keys" ON customer_keys
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = customer_email
  );

-- ============================================
-- POLICY 4: Customer Keys - Insert Access
-- ============================================
-- Allow authenticated users to insert keys (during purchase)
CREATE POLICY "Allow authenticated key inserts" ON customer_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- ============================================
-- STEP 7: Verification Queries
-- ============================================

-- Run these to verify everything is set up correctly:

-- Check tables exist
SELECT 'Tables Check:' as info;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customer_orders', 'customer_keys', 'reseller_products', 'reseller_sales')
ORDER BY table_name;

-- Check RLS is enabled
SELECT 'RLS Status:' as info;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('customer_orders', 'customer_keys')
  AND schemaname = 'public';

-- Check policies
SELECT 'RLS Policies:' as info;
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('customer_orders', 'customer_keys')
ORDER BY tablename, policyname;

-- Check indexes
SELECT 'Indexes:' as info;
SELECT tablename, indexname
FROM pg_indexes
WHERE tablename IN ('customer_orders', 'customer_keys', 'reseller_products')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- STEP 8: Test Data (Optional - uncomment to insert)
-- ============================================

-- Uncomment to insert test data:
/*
-- Insert test order
INSERT INTO customer_orders (customer_email, total_amount, status, items)
VALUES (
  'test@example.com',
  9.99,
  'completed',
  '[{"product_id": "test-123", "product_name": "Test Product", "price": 9.99, "quantity": 1}]'::jsonb
);

-- Insert test key
INSERT INTO customer_keys (customer_email, key_code, status, reseller_product_id)
VALUES (
  'test@example.com',
  'TEST-KEY-1234-5678-ABCD-EFGH',
  'active',
  NULL
);

-- Verify test data
SELECT 'Test Data:' as info;
SELECT * FROM customer_orders WHERE customer_email = 'test@example.com';
SELECT * FROM customer_keys WHERE customer_email = 'test@example.com';
*/

-- ============================================
-- DONE!
-- ============================================

SELECT '✅ Database setup complete!' as status,
       'All tables, indexes, and RLS policies have been created.' as message,
       'You can now test the purchase flow.' as next_step;
