# 🔧 DATABASE SETUP - SCHRITT FÜR SCHRITT

## ⚠️ WICHTIG: Diese SQL-Migration MUSS ausgeführt werden!

Ohne diese Migration werden folgende Fehler auftreten:
- ❌ Key Validator funktioniert nicht (400 Bad Request)
- ❌ `expires_at` Spalte fehlt in `customer_keys`
- ❌ `license_duration` Spalte fehlt in `reseller_products`

---

## 📋 SCHRITT 1: Öffne Supabase SQL Editor

1. Gehe zu [Supabase Dashboard](https://app.supabase.com)
2. Wähle dein Projekt aus
3. Klicke in der linken Sidebar auf **"SQL Editor"**
4. Klicke auf **"New query"**

---

## 📋 SCHRITT 2: Kopiere die SQL-Migration

Öffne die Datei `MIGRATION_COMPLETE_DATABASE_FIX.sql` und kopiere den gesamten Inhalt.

Oder kopiere direkt diesen Code:

```sql
-- =====================================================
-- COMPLETE DATABASE MIGRATION - License Duration System
-- =====================================================

-- 1. Add license_duration to reseller_products
ALTER TABLE reseller_products
ADD COLUMN IF NOT EXISTS license_duration INTEGER DEFAULT 30;

COMMENT ON COLUMN reseller_products.license_duration IS 'License duration in days (0 = lifetime, 1 = 1 day, 30 = 30 days, 365 = 1 year)';

-- 2. Add expires_at to customer_keys
ALTER TABLE customer_keys
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

COMMENT ON COLUMN customer_keys.expires_at IS 'When the license key expires (NULL = lifetime license)';

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_customer_keys_expires_at
ON customer_keys(expires_at)
WHERE expires_at IS NOT NULL;

-- 4. Verify customer_keys structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'customer_keys'
ORDER BY ordinal_position;

-- 5. Verify reseller_products structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'reseller_products'
ORDER BY ordinal_position;
```

---

## 📋 SCHRITT 3: Füge den Code ein und führe ihn aus

1. Füge den kopierten SQL-Code in den SQL Editor ein
2. Klicke auf **"Run"** (oder drücke `Ctrl+Enter` / `Cmd+Enter`)
3. Warte, bis die Ausführung abgeschlossen ist

---

## 📋 SCHRITT 4: Überprüfe die Ergebnisse

Nach der Ausführung solltest du zwei Tabellen sehen:

### ✅ customer_keys Tabelle
Du solltest diese Spalte sehen:
- `expires_at` (TIMESTAMPTZ, nullable)

### ✅ reseller_products Tabelle
Du solltest diese Spalte sehen:
- `license_duration` (INTEGER, default: 30)

---

## 🎯 SCHRITT 5: Teste den Key Validator

1. Gehe zur Landing Page
2. Klicke auf "Key Validator"
3. Gib einen Test-Key ein (z.B. `CS2-PREM-C3F7-Z4Q8-W6T5`)
4. Klicke auf "Validieren"

**Erwartetes Ergebnis:**
- ✅ Keine 400 Fehler mehr in der Konsole
- ✅ Key wird gefunden oder "nicht gefunden" Meldung erscheint
- ✅ Keine roten Fehlermeldungen

---

## 🚨 Fehlerbehebung

### Problem: Migration schlägt fehl
**Lösung:** Überprüfe, ob die Tabellen `customer_keys` und `reseller_products` existieren.

```sql
-- Liste alle Tabellen auf
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

### Problem: Key Validator zeigt immer noch Fehler
**Lösung:**
1. Leere den Browser-Cache (Strg+Shift+Del)
2. Führe `npm run build` erneut aus
3. Lade die Seite neu (Strg+F5)

### Problem: expires_at wird nicht gesetzt beim Kauf
**Lösung:** Stelle sicher, dass:
1. Die Migration erfolgreich war
2. Die App neu gebaut wurde (`npm run build`)
3. Du einen Key mit gesetzter `license_duration` kaufst

---

## ✅ Checkliste

- [ ] SQL-Migration in Supabase ausgeführt
- [ ] `expires_at` Spalte in `customer_keys` vorhanden
- [ ] `license_duration` Spalte in `reseller_products` vorhanden
- [ ] Key Validator getestet - keine 400 Fehler
- [ ] Reseller kann Keys mit Laufzeit hochladen
- [ ] Kunden sehen Ablaufdatum ihrer Keys

---

## 🎉 Fertig!

Nach diesen Schritten sollte alles funktionieren:
- ✅ Key Validator funktioniert einwandfrei
- ✅ License Duration System ist aktiv
- ✅ Kunden sehen Ablaufdaten ihrer Keys
- ✅ Reseller können Laufzeit bei Upload setzen

Bei Problemen schau in die Browser-Konsole (F12) für detaillierte Fehlermeldungen!
