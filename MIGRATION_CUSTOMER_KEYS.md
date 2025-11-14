# 🔧 KRITISCH: customer_keys Tabelle Migration

## ⚠️ WICHTIG: Ohne diese Tabelle können Keys NICHT gespeichert werden!

Die `customer_keys` Tabelle speichert alle Keys die Customers im Reseller Shop kaufen.

---

## 📋 Tabellen-Struktur

```sql
CREATE TABLE IF NOT EXISTS customer_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  key_code TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  order_id UUID REFERENCES customer_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_customer_keys_email ON customer_keys(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_keys_order_id ON customer_keys(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_keys_status ON customer_keys(status);
CREATE INDEX IF NOT EXISTS idx_customer_keys_key_code ON customer_keys(key_code);

-- Comments
COMMENT ON TABLE customer_keys IS 'License keys purchased by customers from reseller shops';
COMMENT ON COLUMN customer_keys.customer_email IS 'Email of customer who purchased the key';
COMMENT ON COLUMN customer_keys.key_code IS 'The actual license key code';
COMMENT ON COLUMN customer_keys.status IS 'Key status: active, inactive, expired';
COMMENT ON COLUMN customer_keys.order_id IS 'Reference to customer_orders table';

-- Enable Row Level Security
ALTER TABLE customer_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Customers can only see their own keys
CREATE POLICY "Customers can view own keys" ON customer_keys
  FOR SELECT USING (
    auth.jwt() ->> 'email' = customer_email
  );

-- RLS Policy: Allow authenticated inserts (for purchase flow)
CREATE POLICY "Allow authenticated inserts" ON customer_keys
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );
```

---

## 🔄 customer_orders Tabelle (falls nicht existiert)

```sql
CREATE TABLE IF NOT EXISTS customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_orders_email ON customer_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON customer_orders(status);

-- Comments
COMMENT ON TABLE customer_orders IS 'Customer orders from reseller shops';
COMMENT ON COLUMN customer_orders.items IS 'JSON array of ordered items with product_name, quantity, price';

-- Enable RLS
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Customers can see own orders
CREATE POLICY "Customers can view own orders" ON customer_orders
  FOR SELECT USING (
    auth.jwt() ->> 'email' = customer_email
  );

-- RLS Policy: Allow authenticated inserts
CREATE POLICY "Allow authenticated inserts" ON customer_orders
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );
```

---

## 🚀 Schnell-Migration (ALLES auf einmal)

Gehe zu **Supabase Dashboard → SQL Editor** und führe aus:

```sql
-- ========================================
-- CUSTOMER KEYS & ORDERS TABLES
-- Complete setup for purchase flow
-- ========================================

-- 1. Create customer_orders table
CREATE TABLE IF NOT EXISTS customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_orders_email ON customer_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON customer_orders(status);

ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own orders" ON customer_orders;
CREATE POLICY "Customers can view own orders" ON customer_orders
  FOR SELECT USING (auth.jwt() ->> 'email' = customer_email);

DROP POLICY IF EXISTS "Allow authenticated inserts" ON customer_orders;
CREATE POLICY "Allow authenticated inserts" ON customer_orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Create customer_keys table
CREATE TABLE IF NOT EXISTS customer_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  key_code TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  order_id UUID REFERENCES customer_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_keys_email ON customer_keys(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_keys_order_id ON customer_keys(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_keys_status ON customer_keys(status);
CREATE INDEX IF NOT EXISTS idx_customer_keys_key_code ON customer_keys(key_code);

ALTER TABLE customer_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own keys" ON customer_keys;
CREATE POLICY "Customers can view own keys" ON customer_keys
  FOR SELECT USING (auth.jwt() ->> 'email' = customer_email);

DROP POLICY IF EXISTS "Allow authenticated inserts" ON customer_keys;
CREATE POLICY "Allow authenticated inserts" ON customer_keys
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Comments
COMMENT ON TABLE customer_orders IS 'Customer orders from reseller shops';
COMMENT ON TABLE customer_keys IS 'License keys purchased by customers';
```

---

## ✅ Verifizierung

Nach der Migration, teste mit SQL:

```sql
-- Prüfe ob Tabellen existieren
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('customer_keys', 'customer_orders');

-- Prüfe Struktur von customer_keys
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_keys';

-- Test-Insert (zum Testen)
INSERT INTO customer_orders (customer_email, total_amount, status, items)
VALUES ('test@test.com', 15.99, 'completed', '[{"product_name":"Test","quantity":1,"price":15.99}]');

INSERT INTO customer_keys (customer_email, key_code, status, order_id)
VALUES ('test@test.com', 'TEST-KEY-1234-5678', 'active', (SELECT id FROM customer_orders WHERE customer_email = 'test@test.com' LIMIT 1));

-- Prüfe ob Test-Daten da sind
SELECT * FROM customer_keys WHERE customer_email = 'test@test.com';

-- Aufräumen
DELETE FROM customer_keys WHERE customer_email = 'test@test.com';
DELETE FROM customer_orders WHERE customer_email = 'test@test.com';
```

---

## 🐛 Troubleshooting

### "customer_keys does not exist"
→ Tabelle nicht erstellt. Führe die SQL Migration aus.

### "column ... does not exist"
→ Tabelle hat falsche Struktur. Lösche und erstelle neu:
```sql
DROP TABLE IF EXISTS customer_keys CASCADE;
DROP TABLE IF NOT EXISTS customer_orders CASCADE;
-- Dann Migration von oben ausführen
```

### Keys werden nicht gespeichert
→ Prüfe RLS Policies:
```sql
SELECT * FROM pg_policies WHERE tablename IN ('customer_keys', 'customer_orders');
```

### Keys werden nicht angezeigt
→ Prüfe ob auth.jwt() ->> 'email' mit customer_email übereinstimmt:
```sql
SELECT auth.jwt() ->> 'email' as jwt_email, * FROM customer_keys;
```

---

## 📊 Was diese Tabellen speichern

### customer_orders
- Alle Bestellungen von Customers
- Items als JSON mit product_name, quantity, price
- Status: pending, completed, failed

### customer_keys
- Alle gekauften Keys
- Verknüpft mit Order via order_id
- Status: active, inactive, expired
- customer_email für RLS Zugriff

---

**Erstellt**: 2025-11-14
**Priorität**: 🔴 KRITISCH - Keys können ohne diese Tabellen nicht gespeichert werden!
