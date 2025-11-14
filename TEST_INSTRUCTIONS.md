# 🧪 STEP-BY-STEP TEST INSTRUCTIONS

## ⚠️ WICHTIG: Folge GENAU dieser Reihenfolge!

---

## PHASE 1: DATABASE SETUP (5 Minuten)

### Schritt 1.1: Supabase SQL ausführen

1. **Öffne Supabase Dashboard**
2. **Gehe zu: SQL Editor** (linkes Menü)
3. **Öffne die Datei:** `COMPLETE_DATABASE_SETUP.sql`
4. **Kopiere den KOMPLETTEN Inhalt**
5. **Füge ein in SQL Editor**
6. **Klicke "RUN"**

**Erwartetes Ergebnis:**
```
✅ Database setup complete!
All tables, indexes, and RLS policies have been created.
```

### Schritt 1.2: Verifizierung

Im gleichen SQL Editor, führe aus:

```sql
-- Zeige alle Tabellen
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('customer_orders', 'customer_keys', 'reseller_products')
ORDER BY table_name;
```

**Erwartetes Ergebnis:**
```
customer_keys
customer_orders
reseller_products
```

✅ **Wenn du diese 3 Tabellen siehst → Weiter zu Phase 2**
❌ **Wenn nicht → SQL nochmal ausführen**

---

## PHASE 2: CODE VORBEREITUNG (2 Minuten)

### Schritt 2.1: Dev Server starten

```bash
cd /home/user/CloudLicenseProV2
npm install
npm run dev
```

**Warte bis:**
```
  ➜  Local:   http://localhost:5173/
```

---

## PHASE 3: RESELLER SETUP (5 Minuten)

### Schritt 3.1: Als Reseller einloggen

1. Öffne: `http://localhost:5173/login`
2. Logge dich mit Reseller-Account ein
3. Gehe zu: **Key Upload** (`/reseller-key-upload`)

### Schritt 3.2: Test Keys erstellen

**Option A: Eigene Keys generieren**
1. Gehe zu `/dev-key-generator`
2. Generiere 5 Keys
3. Download als .txt

**Option B: Manuelle Keys (schneller)**
Erstelle eine Datei `test-keys.txt` mit:
```
TEST-KEY-1111-AAAA-BBBB-CCCC
TEST-KEY-2222-DDDD-EEEE-FFFF
TEST-KEY-3333-GGGG-HHHH-IIII
TEST-KEY-4444-JJJJ-KKKK-LLLL
TEST-KEY-5555-MMMM-NNNN-OOOO
```

### Schritt 3.3: Keys hochladen

1. Auf `/reseller-key-upload`:
   - **Product Name:** "Test Gaming Cheat"
   - **Beschreibung:** "Test Produkt für Debugging"
   - **Preis:** 5.99
   - **Keys File:** Wähle `test-keys.txt`
   - Klicke **"Keys hochladen"**

**Erwartete Meldung:**
```
✅ Keys erfolgreich hochgeladen!
5 Keys wurden zu Test Gaming Cheat hinzugefügt
```

### Schritt 3.4: Inventory prüfen

1. Gehe zu: `/reseller-inventory`
2. **Prüfe:**
   - ✅ Produkt "Test Gaming Cheat" ist sichtbar
   - ✅ "Keys verfügbar: 5"
   - ✅ Preis: €5.99

---

## PHASE 4: CUSTOMER PURCHASE TEST (KRITISCH!)

### Schritt 4.1: Browser Console vorbereiten

**WICHTIG:**
1. **Drücke F12** (öffnet Developer Tools)
2. **Wechsel zum "Console" Tab**
3. **Lasse diesen Tab OFFEN während des gesamten Tests!**

### Schritt 4.2: Als Customer einloggen

1. **NEUEN Inkognito/Private Browser Tab öffnen**
2. Gehe zu: `http://localhost:5173/login`
3. Logge dich mit **CUSTOMER Account** ein (NICHT Reseller!)
4. **F12 drücken** → Console öffnen

### Schritt 4.3: Reseller Shop finden

1. Gehe zu: `/reseller-shops`
2. **Prüfe:** Siehst du Reseller Shops in der Liste?
   - ✅ JA → Klicke auf einen Shop
   - ❌ NEIN → Zurück zu Phase 3, Keys nochmal hochladen

### Schritt 4.4: Purchase Flow (GENAU BEOBACHTEN!)

1. **Im Reseller Shop:**
   - Wähle Produkt "Test Gaming Cheat"
   - Menge: **1**
   - Klicke **"Kaufen"**

2. **SOFORT in Console schauen:**

**ERWARTETE CONSOLE LOGS:**
```
🛒 Kauf starten: Test Gaming Cheat x 1
💾 Speichere 1 Keys für customer@email.com...
✅ 1 Keys erfolgreich gespeichert!
✅ Kauf erfolgreich!
```

3. **Success Dialog erscheint:**
```
✅ Kauf erfolgreich!
🎉 Danke für deinen Kauf!

Produkt: Test Gaming Cheat
Menge: 1 Keys
Preis: €5.99

💡 Deine Keys findest du in Mein Dashboard
```

### Schritt 4.5: KRITISCHER PUNKT - Console Fehler?

**WENN du FEHLER in der Console siehst:**

**Fehler A:**
```
❌ Fehler beim Speichern der Keys: null value in column "reseller_product_id"
```
→ **Stopp! Sende mir diesen Fehler**

**Fehler B:**
```
❌ Fehler beim Speichern der Keys: permission denied for table customer_keys
```
→ **Stopp! RLS Policy Problem, sende mir Screenshot**

**Fehler C:**
```
❌ Fehler beim Speichern der Keys: relation "customer_keys" does not exist
```
→ **Stopp! Tabelle nicht erstellt, gehe zurück zu Phase 1**

**KEIN FEHLER?**
→ ✅ **Perfekt! Weiter zu Schritt 4.6**

### Schritt 4.6: Verify Database (Optional aber empfohlen)

**Gehe zu Supabase Dashboard → SQL Editor:**

```sql
-- Prüfe ob Order erstellt wurde
SELECT * FROM customer_orders ORDER BY created_at DESC LIMIT 1;

-- Prüfe ob Key gespeichert wurde
SELECT * FROM customer_keys ORDER BY created_at DESC LIMIT 1;
```

**Erwartetes Ergebnis:**
```
customer_orders:
- customer_email: deine@email.com
- total_amount: 5.99
- status: completed
- items: [{"product_id": "...", "product_name": "Test Gaming Cheat", ...}]

customer_keys:
- customer_email: deine@email.com
- key_code: TEST-KEY-1111-AAAA-BBBB-CCCC
- status: active
- order_id: <UUID>
- reseller_product_id: <UUID>
```

✅ **Wenn beide Einträge da sind → PERFEKT!**
❌ **Wenn einer fehlt → Screenshot + sende mir**

---

## PHASE 5: CUSTOMER DASHBOARD TEST (DAS EIGENTLICHE PROBLEM!)

### Schritt 5.1: Dashboard aufrufen

1. **Im Customer Browser (F12 noch offen!):**
2. Gehe zu: `/customer-dashboard`
3. **SOFORT in Console schauen!**

### Schritt 5.2: Console Logs prüfen

**ERWARTETE CONSOLE LOGS:**
```
🔍 Lade Daten für customer@email.com...
📦 1 Bestellungen gefunden
🔑 1 Keys gefunden: [{id: "...", key_code: "TEST-KEY-1111-...", ...}]
  - Key TEST-KEY-1... → Test Gaming Cheat
✅ Insgesamt 1 Keys geladen und enriched
```

### Schritt 5.3: UI Prüfung

**Im Dashboard solltest du sehen:**

**Stats Cards (oben):**
- 🔑 **Gesamt Keys:** 1
- ✅ **Aktive Keys:** 1
- 💰 **Ausgegeben:** €5.99
- 📦 **Produkte:** 1

**Keys Sektion:**
```
📦 Test Gaming Cheat (1 Key(s))

  🔑 Aktiv  2025-11-14
  TEST-KEY-1111-AAAA-BBBB-CCCC
  [Copy Button]
```

### Schritt 5.4: PROBLEM SZENARIEN

**SZENARIO A: Console sagt "🔑 0 Keys gefunden"**
```
🔍 Lade Daten für customer@email.com...
📦 1 Bestellungen gefunden
🔑 0 Keys gefunden: []
⚠️ KEINE KEYS GEFUNDEN! Prüfe ob customer_keys Tabelle existiert...
```

**→ SENDE MIR:**
1. Screenshot der Console
2. Ergebnis von diesem SQL:
```sql
-- In Supabase SQL Editor
SELECT
  auth.jwt() ->> 'email' as jwt_email,
  customer_email,
  key_code,
  status
FROM customer_keys
ORDER BY created_at DESC
LIMIT 5;
```

**SZENARIO B: Console zeigt Keys, aber UI ist leer**
```
🔑 1 Keys gefunden: [...]
✅ Insgesamt 1 Keys geladen und enriched
```
**Aber auf der Seite steht "Noch keine Keys"**

**→ SENDE MIR:**
1. Screenshot der Console (mit allen Logs)
2. Screenshot der UI
3. Browser (Chrome/Firefox/Safari?)

**SZENARIO C: Console zeigt Fehler**
```
❌ Fehler beim Laden der Keys: {...}
```

**→ SENDE MIR:**
1. Komplette Fehlermeldung aus Console
2. Screenshot

---

## PHASE 6: ADDITIONAL TESTS

### Test 6.1: Copy Key Button

1. Klicke **"Copy"** Button bei einem Key
2. **Erwartete Meldung:**
   ```
   ✅ Kopiert!
   Key wurde in die Zwischenablage kopiert
   ```
3. **Test:** Füge in Notepad ein (Ctrl+V)
4. **Erwartet:** `TEST-KEY-1111-AAAA-BBBB-CCCC`

### Test 6.2: Copy All Keys

1. Klicke **"Alle Keys kopieren"**
2. **Erwartete Meldung:**
   ```
   ✅ Alle Keys kopiert!
   1 Keys wurden in die Zwischenablage kopiert
   ```

### Test 6.3: Download Keys

1. Klicke **"Als .txt downloaden"**
2. **Datei wird heruntergeladen:** `my-keys-2025-11-14.txt`
3. **Öffne die Datei**
4. **Erwarteter Inhalt:**
   ```
   Test Gaming Cheat: TEST-KEY-1111-AAAA-BBBB-CCCC
   ```

### Test 6.4: Orders Tab

1. Klicke auf **"Bestellungen"** Tab
2. **Du solltest sehen:**
   ```
   🛒 Bestellung #<ID>
   ✅ Abgeschlossen
   14. November 2025, 15:45

   €5.99

   📦 Bestellte Produkte:
   Test Gaming Cheat
   1 × €5.99
   €5.99
   ```

---

## 📊 CHECKLISTE

Nach allen Tests, fülle aus:

### Database Setup:
- [ ] customer_orders Tabelle existiert
- [ ] customer_keys Tabelle existiert
- [ ] reseller_products Tabelle existiert
- [ ] RLS ist aktiviert

### Purchase Flow:
- [ ] Keys hochladen funktioniert
- [ ] Reseller Inventory zeigt Produkte
- [ ] Customer kann Shop sehen
- [ ] Kauf funktioniert ohne Fehler
- [ ] Console zeigt "✅ Keys erfolgreich gespeichert!"
- [ ] Keys sind in Datenbank (SQL Verify)

### Dashboard:
- [ ] Console zeigt "🔑 X Keys gefunden"
- [ ] Stats Cards zeigen korrekte Zahlen
- [ ] Keys werden im UI angezeigt
- [ ] Copy Key funktioniert
- [ ] Copy All funktioniert
- [ ] Download funktioniert
- [ ] Orders Tab zeigt Bestellungen

---

## 🐛 WENN ETWAS NICHT FUNKTIONIERT:

**SENDE MIR:**

1. **Console Screenshot** (gesamter Output)
2. **UI Screenshot** (Dashboard)
3. **SQL Query Ergebnis:**
   ```sql
   SELECT * FROM customer_keys ORDER BY created_at DESC LIMIT 5;
   ```
4. **Welcher Schritt hat NICHT funktioniert?**
5. **Welche Email verwendest du beim Login?**

---

## ✅ ERFOLG KRITERIEN:

**ALLES funktioniert wenn:**
1. ✅ Kauf zeigt "✅ Keys erfolgreich gespeichert!" in Console
2. ✅ Dashboard Console zeigt "🔑 1 Keys gefunden"
3. ✅ Dashboard UI zeigt den Key mit Product Name
4. ✅ Copy/Download Buttons funktionieren
5. ✅ Orders Tab zeigt Bestellung

**Dann ist ALLES OK! 🎉**
