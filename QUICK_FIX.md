# 🚀 QUICK FIX: Keys nicht sichtbar

## ⚡ SCHNELLSTE LÖSUNG (2 Minuten)

### Option A: RLS Temporär deaktivieren (zum Testen)

Gehe zu **Supabase Dashboard → SQL Editor** und führe aus:

```sql
-- Deaktiviere RLS temporär um zu testen ob das das Problem ist
ALTER TABLE customer_keys DISABLE ROW LEVEL SECURITY;
```

**Dann:**
1. Refresh das Customer Dashboard (F5)
2. Siehst du jetzt die Keys?

**JA → Problem ist RLS Policy** (gehe zu Fix 1)
**NEIN → Problem ist woanders** (gehe zu Fix 2)

---

## FIX 1: RLS Policy Problem

**Das Problem:** Die Policy ist zu restriktiv oder verwendet falschen Auth-Check

**Die Lösung:**

```sql
-- 1. RLS wieder aktivieren
ALTER TABLE customer_keys ENABLE ROW LEVEL SECURITY;

-- 2. Alte Policy löschen
DROP POLICY IF EXISTS "Customers can view own keys" ON customer_keys;

-- 3. NEUE Policy mit auth.uid() statt auth.jwt()
CREATE POLICY "Customers can view own keys" ON customer_keys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = customer_keys.customer_email
    )
  );

-- 4. Zusätzliche Policy für Inserts
DROP POLICY IF EXISTS "Allow authenticated inserts" ON customer_keys;
CREATE POLICY "Allow authenticated inserts" ON customer_keys
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

**Test danach:**
```sql
-- Prüfe ob Policy richtig ist
SELECT * FROM pg_policies WHERE tablename = 'customer_keys';
```

---

## FIX 2: Keys werden nicht gespeichert

**Test ob Keys überhaupt in DB sind:**

```sql
-- Zeige ALLE Keys (ignoriert RLS)
-- Musst als Admin ausführen (Supabase Dashboard → SQL Editor)
SELECT
  customer_email,
  key_code,
  status,
  reseller_product_id,
  created_at
FROM customer_keys
ORDER BY created_at DESC
LIMIT 10;
```

**Ergebnis A: Keys sind da**
→ Problem ist RLS (zurück zu Fix 1)

**Ergebnis B: Keine Keys**
→ Keys werden nicht gespeichert, prüfe Browser Console bei Kauf

---

## FIX 3: ALTERNATIVE - Öffentliche Policy (weniger sicher, aber funktioniert)

**Wenn nichts anderes funktioniert:**

```sql
-- Vorsicht: Erlaubt jedem eingeloggten User ALLE Keys zu sehen
DROP POLICY IF EXISTS "Customers can view own keys" ON customer_keys;

CREATE POLICY "Allow all authenticated users to view keys" ON customer_keys
  FOR SELECT USING (auth.uid() IS NOT NULL);
```

**Dann teste** - wenn es funktioniert, ist das Problem die Email-Verknüpfung

---

## 🔥 NUCLEAR OPTION: Komplett neu erstellen

**Wenn GAR NICHTS funktioniert:**

```sql
-- 1. Tabelle löschen (ACHTUNG: Alle Daten weg!)
DROP TABLE IF EXISTS customer_keys CASCADE;

-- 2. Neu erstellen mit korrektem Schema
CREATE TABLE customer_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  key_code TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  order_id UUID REFERENCES customer_orders(id) ON DELETE SET NULL,
  reseller_product_id UUID REFERENCES reseller_products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX idx_customer_keys_email ON customer_keys(customer_email);
CREATE INDEX idx_customer_keys_order_id ON customer_keys(order_id);
CREATE INDEX idx_customer_keys_reseller_product_id ON customer_keys(reseller_product_id);
CREATE INDEX idx_customer_keys_status ON customer_keys(status);
CREATE INDEX idx_customer_keys_key_code ON customer_keys(key_code);

-- 4. RLS
ALTER TABLE customer_keys ENABLE ROW LEVEL SECURITY;

-- 5. Einfache Policy (funktioniert garantiert)
CREATE POLICY "enable_read_for_authenticated_users" ON customer_keys
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "enable_insert_for_authenticated_users" ON customer_keys
  FOR INSERT TO authenticated WITH CHECK (true);
```

**Danach:**
- Neuen Kauf tätigen
- Dashboard sollte Keys zeigen

---

## 🎯 EMPFOHLENE REIHENFOLGE:

1. **ZUERST:** RLS deaktivieren (testen)
2. **WENN KEYS SICHTBAR:** Fix 1 anwenden (RLS Policy)
3. **WENN KEYS NICHT SICHTBAR:** SQL Query ausführen (prüfen ob Keys da sind)
4. **WENN GAR NICHTS HILFT:** Nuclear Option

---

## 📊 WAS SOLLTE IN BROWSER CONSOLE STEHEN?

**Beim Kauf (ResellerShop):**
```
🛒 Kauf starten: Product Name x 1
💾 Speichere 1 Keys für user@email.com...
✅ 1 Keys erfolgreich gespeichert!
✅ Kauf erfolgreich!
```

**Beim Dashboard laden:**
```
🔍 Lade Daten für user@email.com...
📦 1 Bestellungen gefunden
🔑 1 Keys gefunden: [Object]
  - Key ABC123DEFG... → Product Name
✅ Insgesamt 1 Keys geladen und enriched
```

**Wenn du stattdessen siehst:**
```
🔑 0 Keys gefunden: []
⚠️ KEINE KEYS GEFUNDEN!
```
→ RLS blockiert oder Keys nicht in DB

---

## ⚡ TESTE JETZT:

1. Öffne **Supabase Dashboard → SQL Editor**
2. Kopiere das hier:

```sql
-- Quick Test Script
ALTER TABLE customer_keys DISABLE ROW LEVEL SECURITY;
SELECT 'RLS disabled - refresh dashboard now' as message;
```

3. Führe aus
4. Refresh Customer Dashboard (F5)
5. Siehst du Keys? **Sag mir JA oder NEIN**

Dann gebe ich dir den exakten nächsten Schritt!
