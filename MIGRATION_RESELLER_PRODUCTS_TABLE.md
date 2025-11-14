# 🔧 KRITISCHE MIGRATION: Reseller-Upload System Tabellen-Update

## ⚠️ WICHTIG: Diese Migration ist ERFORDERLICH für das neue System!

Die `reseller_products` Tabelle hat noch die ALTE Marketplace-Struktur. Wir müssen sie für das neue Reseller-Upload System anpassen!

---

## 📋 Was wird geändert?

### ALTE Struktur (Marketplace):
```
- product_id (Foreign Key zum Developer-Produkt)
- developer_id (Wer hat's erstellt)
- developer_name
- purchase_price (Was Reseller bezahlt hat)
- resale_price (Verkaufspreis)
- quantity_purchased (Gekaufte Menge)
- quantity_available (Verfügbar)
- quantity_sold (Verkauft)
```

### NEUE Struktur (Upload System):
```
- reseller_id (Wem gehört's)
- product_name (Name des Produkts)
- description (Beschreibung - NEU!)
- reseller_price (Verkaufspreis)
- quantity_available (Aus keys_pool berechnet)
- quantity_sold (Verkauft)
- status (active/inactive)
- keys_pool (JSON Array von Keys - NEU!)
- created_at
```

---

## 🚀 Migration SQL

Gehe zu **Supabase Dashboard → SQL Editor** und führe aus:

```sql
-- ========================================
-- RESELLER PRODUCTS TABLE MIGRATION
-- From Marketplace Model to Upload Model
-- ========================================

-- Step 1: Add new columns
ALTER TABLE reseller_products
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS reseller_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS keys_pool TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Migrate data from old structure to new
-- Copy resale_price to reseller_price if it exists
UPDATE reseller_products
SET reseller_price = resale_price
WHERE reseller_price IS NULL AND resale_price IS NOT NULL;

-- Step 3: Drop old marketplace columns (OPTIONAL - only if you're sure!)
-- UNCOMMENT THESE LINES ONLY IF YOU WANT TO REMOVE OLD COLUMNS:
-- ALTER TABLE reseller_products
-- DROP COLUMN IF EXISTS product_id,
-- DROP COLUMN IF EXISTS developer_id,
-- DROP COLUMN IF EXISTS developer_name,
-- DROP COLUMN IF EXISTS purchase_price,
-- DROP COLUMN IF EXISTS resale_price,
-- DROP COLUMN IF EXISTS quantity_purchased;

-- Step 4: Add constraints
ALTER TABLE reseller_products
ALTER COLUMN product_name SET NOT NULL,
ALTER COLUMN reseller_price SET NOT NULL;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN reseller_products.product_name IS 'Name of the product (set by reseller)';
COMMENT ON COLUMN reseller_products.description IS 'Product description (optional, set by reseller)';
COMMENT ON COLUMN reseller_products.reseller_price IS 'Price per key in EUR (set by reseller)';
COMMENT ON COLUMN reseller_products.keys_pool IS 'JSON array of license keys uploaded by reseller. Keys are distributed FIFO.';
COMMENT ON COLUMN reseller_products.status IS 'Product status: active, inactive';

-- Step 6: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_reseller_products_reseller_id ON reseller_products(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_products_status ON reseller_products(status);
```

---

## ⚠️ ALTERNATIVE: Neue Tabelle erstellen (EMPFOHLEN wenn alte Daten wichtig sind)

Wenn du die alten Marketplace-Daten behalten willst, erstelle eine neue Tabelle:

```sql
-- Create new table for upload-based reseller products
CREATE TABLE IF NOT EXISTS reseller_products_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description TEXT,
  reseller_price DECIMAL(10,2) NOT NULL CHECK (reseller_price >= 0),
  quantity_available INTEGER DEFAULT 0 CHECK (quantity_available >= 0),
  quantity_sold INTEGER DEFAULT 0 CHECK (quantity_sold >= 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  keys_pool TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_reseller_products_v2_reseller_id ON reseller_products_v2(reseller_id);
CREATE INDEX idx_reseller_products_v2_status ON reseller_products_v2(status);

-- Add comments
COMMENT ON TABLE reseller_products_v2 IS 'Reseller products with external key upload system (v2)';
COMMENT ON COLUMN reseller_products_v2.keys_pool IS 'JSON array of license keys. Distributed FIFO on purchase.';

-- Enable Row Level Security (RLS)
ALTER TABLE reseller_products_v2 ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Resellers can only see their own products
CREATE POLICY "Resellers can view own products" ON reseller_products_v2
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM resellers WHERE id = reseller_id));

CREATE POLICY "Resellers can insert own products" ON reseller_products_v2
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM resellers WHERE id = reseller_id));

CREATE POLICY "Resellers can update own products" ON reseller_products_v2
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM resellers WHERE id = reseller_id));

CREATE POLICY "Resellers can delete own products" ON reseller_products_v2
  FOR DELETE USING (auth.uid() IN (SELECT user_id FROM resellers WHERE id = reseller_id));
```

Dann in der App `reseller_products` zu `reseller_products_v2` umbenennen!

---

## ✅ Nach der Migration

1. **Server neu starten**: `npm run dev`
2. **Testen**: Gehe zu `/reseller-key-upload`
3. **Produkt erstellen** mit Name, Beschreibung, Preis
4. **Keys hochladen** mit `test-keys.txt`
5. **Inventar prüfen**: `/reseller-inventory`

---

## 🐛 Troubleshooting

### "Could not find 'product_name' column"
→ Migration nicht ausgeführt oder reseller_products existiert nicht

### "Could not find 'description' column"
→ Schritt 1 der Migration nicht ausgeführt

### "Could not find 'keys_pool' column"
→ Schritt 1 der Migration nicht ausgeführt

### Alte Daten werden nicht angezeigt
→ Wenn du reseller_products_v2 erstellt hast, musst du den Code anpassen

---

## 📌 EMPFEHLUNG

**Option 1**: Wenn du KEINE wichtigen Marketplace-Daten hast
→ Lösche die alte Tabelle und erstelle neu:
```sql
DROP TABLE IF EXISTS reseller_products CASCADE;
-- Dann CREATE TABLE aus Option 2 oben
```

**Option 2**: Wenn du alte Daten behalten willst
→ Erstelle `reseller_products_v2` (siehe oben)
→ Ändere im Code alle `reseller_products` zu `reseller_products_v2`

---

**Erstellt**: 2025-11-14
**Für**: Reseller-Upload Business Model
**Priorität**: 🔴 KRITISCH - System funktioniert nicht ohne diese Migration!
