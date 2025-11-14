# 🔧 Datenbank Migration: keys_pool Feld

## ⚠️ WICHTIG: Diese Migration ist erforderlich für das neue Reseller-Upload System!

Das neue System benötigt ein `keys_pool` Feld in der `reseller_products` Tabelle, um die hochgeladenen Keys zu speichern.

## 📋 Was muss gemacht werden?

Gehe in dein **Supabase Dashboard** und führe die folgende SQL-Migration aus:

### SQL Migration

```sql
-- Add keys_pool column to reseller_products table
ALTER TABLE reseller_products
ADD COLUMN IF NOT EXISTS keys_pool TEXT DEFAULT '[]';

-- Add comment for documentation
COMMENT ON COLUMN reseller_products.keys_pool IS 'JSON array of license keys uploaded by reseller. Keys are distributed FIFO (First In First Out) on customer purchases.';

-- Note: description column is NOT required - we removed it from the app
-- The reseller_products table only needs:
-- - reseller_id
-- - product_name
-- - reseller_price
-- - quantity_available
-- - quantity_sold
-- - status
-- - keys_pool (added above)
```

## 🎯 Was macht diese Migration?

1. **Fügt `keys_pool` Spalte hinzu**: Typ `TEXT`, speichert JSON array von Keys
2. **Default Wert**: Leeres JSON Array `[]`
3. **Dokumentation**: Kommentar erklärt den Zweck

## 📦 Datenstruktur

Das `keys_pool` Feld speichert Keys als JSON array:

```json
[
  "KEY-ABCD-1234-5678",
  "KEY-EFGH-9012-3456",
  "KEY-IJKL-7890-1234"
]
```

## 🔄 Wie das System funktioniert

1. **Reseller lädt Keys hoch** → Keys werden zu `keys_pool` array hinzugefügt
2. **Customer kauft X Keys** → Erste X Keys werden aus array genommen (FIFO)
3. **Remaining Keys** → Übrige Keys bleiben im array
4. **quantity_available** → Wird automatisch auf `keys_pool.length` gesetzt

## ✅ Nach der Migration

Nach der Migration kannst du:
- Als Developer: Keys bulk generieren (`/dev-key-generator`)
- Als Reseller: Keys hochladen (`/reseller-key-upload`)
- Als Customer: Keys im Reseller Shop kaufen
- Keys werden automatisch aus dem Pool verteilt

## 🚨 Fehlerbehebung

**Fehler: "keys_pool column does not exist"**
→ Führe die SQL Migration oben aus

**Fehler: "invalid JSON"**
→ Stelle sicher dass keys_pool als TEXT gespeichert ist, nicht als JSONB

**Fehler: "Keine Keys verfügbar"**
→ Reseller muss zuerst Keys hochladen via `/reseller-key-upload`

---

**Migration erstellt am:** 2025-11-14
**Benötigt für:** Reseller-Upload Business Model
**Betroffene Tabelle:** `reseller_products`
