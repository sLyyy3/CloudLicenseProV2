# 🐛 DEBUG: Keys werden nicht angezeigt

## ✅ Was funktioniert:
- Kauf funktioniert (keine Fehler mehr)
- Keys werden in DB gespeichert (reseller_product_id Error ist weg)

## ❌ Was nicht funktioniert:
- Keys werden im Customer Dashboard nicht angezeigt

---

## 🔍 DEBUGGING SCHRITTE

### SCHRITT 1: Prüfe Browser Console

**Öffne Browser Console (F12) und prüfe beim Laden von `/customer-dashboard`:**

**Was siehst du?**

**Option A - Keys werden gefunden:**
```
🔍 Lade Daten für email@example.com...
📦 1 Bestellungen gefunden
🔑 3 Keys gefunden: [...]
  - Key XXXX-XXXX... → Product Name
✅ Insgesamt 3 Keys geladen und enriched
```
→ **Problem:** Keys werden geladen aber nicht angezeigt (UI Problem)

**Option B - Keine Keys gefunden:**
```
🔍 Lade Daten für email@example.com...
📦 1 Bestellungen gefunden
🔑 0 Keys gefunden: []
⚠️ KEINE KEYS GEFUNDEN! Prüfe ob customer_keys Tabelle existiert...
```
→ **Problem:** RLS Policy blockiert oder Email stimmt nicht überein

**Option C - Fehler beim Laden:**
```
❌ Fehler beim Laden der Keys: {code: "...", message: "..."}
```
→ **Problem:** Datenbankfehler oder RLS Policy

---

### SCHRITT 2: Prüfe Datenbank direkt (Supabase Dashboard)

Gehe zu **Supabase Dashboard → SQL Editor** und führe aus:

```sql
-- 1. Prüfe ob Keys gespeichert wurden
SELECT * FROM customer_keys ORDER BY created_at DESC LIMIT 10;
```

**Ergebnis A:** Keys sind da
→ Problem ist RLS Policy oder Email-Mismatch

**Ergebnis B:** Keine Keys
→ Keys werden nicht gespeichert trotz erfolgreicher Message

---

### SCHRITT 3: Prüfe RLS Policies

```sql
-- Prüfe welche Policies existieren
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'customer_keys';
```

**Erwartetes Ergebnis:**
```
policyname: "Customers can view own keys"
cmd: "SELECT"
qual: auth.jwt() ->> 'email' = customer_email
```

**Problem möglich:** RLS Policy existiert nicht oder ist falsch konfiguriert

---

### SCHRITT 4: Prüfe Email Match

```sql
-- Prüfe ob auth.jwt() → 'email' mit customer_email übereinstimmt
SELECT
  auth.jwt() ->> 'email' as jwt_email,
  customer_email,
  key_code,
  created_at
FROM customer_keys
ORDER BY created_at DESC
LIMIT 5;
```

**Erwartetes Ergebnis:**
```
jwt_email     | customer_email   | key_code
-----------   | --------------   | --------
user@mail.com | user@mail.com    | KEY-XXX
```

**Problem möglich:** jwt_email ist NULL oder unterscheidet sich

---

### SCHRITT 5: Prüfe Table Schema

```sql
-- Zeige alle Spalten von customer_keys
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'customer_keys'
ORDER BY ordinal_position;
```

**Erwartetes Schema:**
```
column_name           | data_type | is_nullable
--------------------- | --------- | -----------
id                    | uuid      | NO
customer_email        | text      | NO
key_code              | text      | NO
status                | text      | YES
order_id              | uuid      | YES
reseller_product_id   | uuid      | YES
created_at            | timestamp | YES
updated_at            | timestamp | YES
```

---

## 🔧 MÖGLICHE FIXES

### FIX 1: RLS Policy fehlt oder ist falsch

**Lösung:**
```sql
-- Drop alte Policy
DROP POLICY IF EXISTS "Customers can view own keys" ON customer_keys;

-- Neue Policy erstellen
CREATE POLICY "Customers can view own keys" ON customer_keys
  FOR SELECT USING (auth.jwt() ->> 'email' = customer_email);

-- Prüfe ob RLS aktiviert ist
ALTER TABLE customer_keys ENABLE ROW LEVEL SECURITY;
```

### FIX 2: Email Mismatch

**Wenn auth.jwt() → 'email' NULL ist:**

Option A: User ist nicht eingeloggt
→ Navigate zu /login

Option B: Policy muss auth.uid() verwenden

**Versuche alternative Policy:**
```sql
DROP POLICY IF EXISTS "Customers can view own keys" ON customer_keys;

CREATE POLICY "Customers can view own keys" ON customer_keys
  FOR SELECT USING (
    auth.jwt() ->> 'email' = customer_email
    OR
    auth.uid() IS NOT NULL
  );
```

### FIX 3: Tabelle hat falsches Schema

**Falls reseller_product_id immer noch NOT NULL ist:**
```sql
-- Ändere zu nullable
ALTER TABLE customer_keys
ALTER COLUMN reseller_product_id DROP NOT NULL;
```

---

## 📋 QUICK DIAGNOSTIC SCRIPT

Kopiere das hier in **Supabase SQL Editor** und führe aus:

```sql
-- ========================================
-- COMPLETE DIAGNOSTIC CHECK
-- ========================================

-- 1. Zeige aktuelle Keys
SELECT 'STEP 1: Current Keys' as step;
SELECT customer_email, key_code, status, created_at, reseller_product_id
FROM customer_keys
ORDER BY created_at DESC
LIMIT 5;

-- 2. Zeige RLS Policies
SELECT 'STEP 2: RLS Policies' as step;
SELECT tablename, policyname, cmd, qual::text
FROM pg_policies
WHERE tablename = 'customer_keys';

-- 3. Prüfe RLS Status
SELECT 'STEP 3: RLS Enabled' as step;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'customer_keys';

-- 4. Zeige Schema
SELECT 'STEP 4: Table Schema' as step;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_keys'
ORDER BY ordinal_position;

-- 5. Teste Auth
SELECT 'STEP 5: Current Auth Email' as step;
SELECT auth.jwt() ->> 'email' as current_user_email;
```

---

## 🎯 BITTE SENDE MIR:

1. **Browser Console Output** (F12 beim Laden von `/customer-dashboard`)
2. **SQL Diagnostic Script Ergebnis** (von oben)
3. **Welche Email du beim Login verwendest**

Dann kann ich dir den exakten Fix geben!
