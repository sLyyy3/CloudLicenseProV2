# 🚀 Reseller-Upload System - Komplette Anleitung

## 📖 Übersicht

Das System funktioniert jetzt wie **Sellix, Shoppy.gg, und Selly.gg** - perfekt für Gaming Cheat/Tool Reseller (Elitepvpers, UnknownCheats Style)!

## 🎯 Der neue Workflow

```
Developer (extern) → Generiert Keys → Teilt Keys extern (Discord/Telegram)
                                              ↓
                                        Reseller → Lädt Keys hoch
                                              ↓
                                        Customer → Kauft im Reseller Shop
```

---

## 👨‍💻 DEVELOPER WORKFLOW

### 1. Keys generieren
- Gehe zu: `/dev-key-generator`
- Wähle dein Produkt aus
- Konfiguriere:
  - **Prefix**: z.B. "CS2" oder "APEX"
  - **Länge**: 8-32 Zeichen
  - **Menge**: Bis zu 10.000 Keys auf einmal!
- Klicke "Keys generieren"

### 2. Keys exportieren
- **Download als .txt** - Eine Zeile pro Key
- **Download als .csv** - CSV Format für Excel
- **Copy to Clipboard** - Direkt kopieren

### 3. Keys verteilen (EXTERN)
- Schicke Keys an deine Reseller via:
  - Discord DM
  - Telegram
  - Email
  - Forum PM (Elitepvpers, UnknownCheats, etc.)

---

## 💼 RESELLER WORKFLOW

### 1. Keys hochladen
- Gehe zu: `/reseller-key-upload`
- Fülle Produkt Info aus:
  - **Produkt Name**: z.B. "CS2 Cheat Premium"
  - **Beschreibung**: Was macht dein Produkt?
  - **Verkaufspreis**: Dein eigener Preis in Euro!

### 2. Keys einfügen
**Option A: Text einfügen**
- Füge Keys ein (ein Key pro Zeile)
- Klicke "Keys validieren"
- Grüne Keys = Gültig ✅
- Rote Keys = Ungültig ❌

**Option B: Datei hochladen**
- Klicke "Datei hochladen"
- Wähle .txt oder .csv Datei
- System validiert automatisch

### 3. Hochladen & Verkaufen
- Klicke "Keys hochladen"
- Keys sind jetzt in deinem Inventar (`/reseller-inventory`)
- Customers können sie in deinem Shop kaufen!

### 4. Deinen Shop Link teilen
- Dein Shop Link: `http://yoursite.com/reseller-shop/:your-id`
- Teile diesen Link überall:
  - In deiner Forum Signatur
  - Discord Status
  - Social Media

---

## 👤 CUSTOMER WORKFLOW

### 1. Reseller Shop besuchen
- Gehe zu: `/reseller-shops` → Wähle einen Reseller
- ODER: Klicke direkt auf Reseller Shop Link

### 2. Produkte durchsuchen
- Siehst verfügbare Produkte
- Preise (vom Reseller festgelegt)
- Verfügbare Menge (Keys auf Lager)

### 3. Kaufen
- Wähle Menge (1-X Keys)
- Klicke "Kaufen"
- Keys werden sofort geliefert!

### 4. Keys abrufen
- Gehe zu: `/customer-dashboard` oder `/licenses`
- Alle gekauften Keys sind dort gespeichert
- Keys können kopiert werden

---

## 🔧 TECHNISCHE DETAILS

### Inventory System
- **Speicherung**: JSON array in `reseller_products.keys_pool`
- **Verteilung**: FIFO (First In First Out)
- **Beispiel**:
  ```json
  {
    "keys_pool": "[\"KEY-1\", \"KEY-2\", \"KEY-3\"]",
    "quantity_available": 3
  }
  ```

### Purchase Flow
1. Customer kauft 1 Key
2. System holt `keys_pool` aus DB
3. Nimmt ersten Key aus Array: `keys_pool[0]`
4. Entfernt Key aus Array
5. Speichert verbleibende Keys zurück
6. `quantity_available = remainingKeys.length`

### Key Validation
- **Minimum**: 8 Zeichen
- **Nicht erlaubt**: Leerzeichen
- **Format**: Beliebig (z.B. KEY-XXXX-XXXX)

---

## 📊 NEUE FEATURES

### ✅ Developer Bulk Key Generator
- **Route**: `/dev-key-generator`
- **Funktion**: Bulk-Generierung von Keys
- **Limit**: 10.000 Keys pro Batch
- **Export**: .txt, .csv, Clipboard

### ✅ Reseller Key Upload
- **Route**: `/reseller-key-upload`
- **Funktion**: Keys hochladen die extern erhalten wurden
- **Input**: Text Area + File Upload
- **Validation**: Auto-Validierung mit visueller Anzeige

### ✅ FIFO Purchase System
- **Funktion**: Keys aus Inventar-Pool verteilen
- **Algorithmus**: First In First Out
- **Auto-Update**: Inventory wird automatisch aktualisiert

---

## ⚙️ SETUP & INSTALLATION

### 1. Datenbank Migration ausführen
```bash
# Gehe zu Supabase Dashboard → SQL Editor
# Führe diese Migration aus:
```

```sql
ALTER TABLE reseller_products
ADD COLUMN IF NOT EXISTS keys_pool TEXT DEFAULT '[]';
```

Siehe auch: `MIGRATION_KEYS_POOL.md`

### 2. Development Server starten
```bash
npm install
npm run dev
```

### 3. Öffne Browser
```
http://localhost:5173
```

---

## 🎮 USE CASES

### Gaming Cheat Reseller (Elitepvpers/UnknownCheats)
```
1. Developer erstellt CS2 Cheat
2. Developer generiert 1000 Keys
3. Developer schickt 100 Keys an Reseller via Discord
4. Reseller lädt Keys hoch, setzt Preis auf €15/Key
5. Reseller postet Shop Link im Forum
6. Customers kaufen Keys für CS2 Cheat
7. Reseller verdient €15 pro Verkauf
```

### Software License Reseller
```
1. Developer hat Windows Software
2. Developer generiert License Keys
3. Developer gibt Keys an autorisierten Reseller
4. Reseller verkauft in eigenem Shop
5. Customers erhalten sofort License Key
```

---

## ❌ WAS WURDE ENTFERNT?

### Developer Marketplace (deprecated)
- **Route**: `/reseller-marketplace` (auskommentiert)
- **Grund**: Passt nicht zum neuen Modell
- **Ersetzt durch**: Externe Key-Verteilung + Upload System

---

## 🐛 TROUBLESHOOTING

### "400 Bad Request" bei Reseller-Abfragen
**Problem**: `user_email` Feld existiert nicht
**Lösung**: System verwendet jetzt `organization_id` ✅

### "keys_pool column does not exist"
**Problem**: Datenbank-Migration nicht ausgeführt
**Lösung**: Siehe `MIGRATION_KEYS_POOL.md`

### "Keine Keys verfügbar"
**Problem**: Reseller hat keine Keys hochgeladen
**Lösung**: Gehe zu `/reseller-key-upload` und lade Keys hoch

### Dev Server startet nicht
**Problem**: Dependencies nicht installiert
**Lösung**: `npm install` ausführen

---

## 📁 NEUE DATEIEN

- `src/pages/DeveloperKeyGenerator.tsx` - Bulk Key Generator
- `src/pages/ResellerKeyUpload.tsx` - Key Upload System
- `MIGRATION_KEYS_POOL.md` - Datenbank Migration Anleitung
- `README_RESELLER_SYSTEM.md` - Diese Datei

---

## 🔄 UPDATES & COMMITS

### Commit 1: Major System Overhaul
```
🚀 MAJOR: Reseller-Upload Business Model - External Key Distribution System
- Developer Bulk Key Generator (10k keys/batch)
- Reseller Key Upload/Import System
- FIFO Purchase Flow
- Removed Developer Marketplace
```

### Commit 2: Authentication Fix
```
Fix: Reseller authentication in Key Upload - Use organization_id instead of user_email
```

---

## 📞 SUPPORT

Bei Fragen oder Problemen:
1. Prüfe diese Anleitung
2. Prüfe `MIGRATION_KEYS_POOL.md`
3. Prüfe Browser Console für Fehler
4. Prüfe Supabase Logs

---

**Version**: 2.0
**Letztes Update**: 2025-11-14
**Status**: ✅ Production Ready
