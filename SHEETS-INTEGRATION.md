# 📊 Google Sheets Integrácia - Automatické vytváranie kalendárov

## 🎯 Čo toto umožňuje:

1. **Google Sheets tabuľka** so zoznamom zamestnancov
2. **Automatické vytváranie kalendárov** pre každého
3. **Synchronizácia** - stlačte tlačidlo a kalendáre sa vytvoria
4. **Zdieľanie** - každý zamestnanec dostane prístup k svojmu kalendáru

---

## 📋 SETUP (5 minút)

### KROK 1: Vytvorte Google Sheets tabuľku

1. **Ísť na:** https://docs.google.com/spreadsheets
2. **Nová tabuľka** (Blank spreadsheet)
3. **Pomenovať:** "Zamestnanci - Kalendáre"

### KROK 2: Štruktúra tabuľky

Prvý list nazvite: **"Zamestnanci"**

**Prvý riadok (hlavička):**
```
| Meno              | Email              | Pozícia  | Farba  |
```

**Príklad dát:**
```
| Juraj Martinkovych | juraj@firma.sk    | CEO      | blue   |
| Peter Novák        | peter@firma.sk    | Sales    | red    |
| Zuzana Horváthová  | zuzana@firma.sk   | Marketing| green  |
| Martin Kováč       | martin@firma.sk   | Developer| orange |
| Anna Nováková      | anna@firma.sk     | HR       | purple |
```

**Dostupné farby:**
- blue, red, green, orange, purple, yellow, pink, cyan

### KROK 3: Získať ID tabuľky

Z URL tabuľky:
```
https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit
                                      ^^^^^^^^
                                      toto je ID
```

**Skopírovať ID!**

### KROK 4: Upraviť Apps Script

1. **Otvoriť** `GoogleAppsScript-WithSheets.gs`
2. **Nájsť riadok 10:**
   ```javascript
   const SPREADSHEET_ID = 'VLOŽTE_ID_VAŠEJ_TABUĽKY';
   ```
3. **Vložiť svoje ID:**
   ```javascript
   const SPREADSHEET_ID = '1ABC...XYZ';
   ```
4. **(Voliteľne) Zmeniť názov listu:**
   ```javascript
   const SHEET_NAME = 'Zamestnanci'; // Ak ste list nazvali inak
   ```

### KROK 5: Deploy Apps Script

1. **script.google.com** → nový projekt
2. **Vložiť kód** z `GoogleAppsScript-WithSheets.gs`
3. **Deploy** → **Web app**
   - Execute as: **Me**
   - Access: **Anyone**
4. **Authorize** → **Advanced** → **Go to Calendar (unsafe)**
   - ⚠️ Potrebuje prístup k Sheets aj Calendar!
5. **Skopírovať URL**

### KROK 6: Synchronizovať kalendáre

**V prehliadači otvoriť:**
```
https://script.google.com/macros/s/VAŠID/exec?action=syncFromSheet
```

**Výsledok:**
```json
{
  "ok": true,
  "message": "Synchronizácia dokončená",
  "results": [
    {
      "name": "Juraj Martinkovych",
      "calendar": "Juraj Martinkovych - CEO",
      "calendarId": "xxx@group.calendar.google.com",
      "status": "created",
      "color": "#039be5"
    },
    ...
  ],
  "created": 5,
  "existing": 0,
  "errors": 0
}
```

---

## 🎨 Ako to funguje

### 1. Tabuľka = Zdroj pravdy
```
📊 Google Sheets
  ↓
  Zoznam zamestnancov
  ↓
  Apps Script načíta dáta
  ↓
  Vytvorí kalendár pre každého
```

### 2. Automatické kalendáre
```
Juraj Martinkovych (CEO)       → 🔵 Modrý kalendár
Peter Novák (Sales)            → 🔴 Červený kalendár
Zuzana Horváthová (Marketing)  → 🟢 Zelený kalendár
Martin Kováč (Developer)       → 🟠 Oranžový kalendár
Anna Nováková (HR)             → 🟣 Fialový kalendár
```

### 3. Automatické zdieľanie
- Ak je zadaný email, kalendár sa automaticky zdieľa
- Zamestnanec dostane prístup (editor)
- Môže si pridávať vlastné udalosti

---

## 🔄 Aktualizácia

**Pridať nového zamestnanca:**
1. Pridať riadok do tabuľky
2. Otvoriť URL: `...?action=syncFromSheet`
3. Nový kalendár sa vytvorí automaticky

**Zmeniť farbu:**
1. Upraviť farbu v tabuľke
2. Synchronizovať znova
3. Kalendáre sa aktualizujú

---

## 📱 API Endpointy

### Načítať dáta z tabuľky
```
GET ?action=getSheetData
```

Odpoveď:
```json
{
  "ok": true,
  "employees": [
    {"name": "Juraj", "email": "juraj@...", "position": "CEO", "color": "blue"},
    ...
  ],
  "count": 5
}
```

### Synchronizovať kalendáre
```
GET ?action=syncFromSheet
```

### Získať všetky kalendáre
```
GET ?action=getCalendars
```

### Získať udalosti
```
GET ?action=getEvents&allCalendars=true
```

---

## 🎯 Použitie v aplikácii

Pridám tlačidlo "Synchronizovať kalendáre" ktoré:
1. Zobrazí zoznam zamestnancov z tabuľky
2. Tlačidlo "Vytvoriť kalendáre"
3. Ukáže výsledok synchronizácie

---

## 💡 Príklady použitia

### Scenár 1: Nová firma
```
1. Vytvoríte tabuľku so všetkými zamestnancami
2. Spustíte synchronizáciu
3. Každý dostane vlastný kalendár
4. Môžete začať plánovať stretnutia
```

### Scenár 2: Pridanie zamestnanca
```
1. Pridáte nový riadok do tabuľky
2. Spustíte synchronizáciu
3. Kalendár sa vytvorí automaticky
4. Email s prístupom príde automaticky
```

### Scenár 3: Reorganizácia
```
1. Upravíte pozície v tabuľke
2. Synchronizujete
3. Kalendáre sa aktualizujú
4. Názvy sa zmenia
```

---

## 🔒 Bezpečnosť

### Oprávnenia:
- ✅ Prístup k Google Sheets (čítanie)
- ✅ Prístup k Calendar (vytváranie kalendárov)
- ✅ Bežia pod VAŠÍM účtom

### Zdieľanie:
- Kalendáre sa automaticky zdieľajú s emailami z tabuľky
- Zamestnanci dostanú **editor** prístup
- Môžu pridávať/upravovať svoje udalosti

---

## 🆚 Výhody tohto prístupu

| Vlastnosť | Manuálne | S Google Sheets |
|-----------|----------|-----------------|
| Vytváranie kalendárov | Ručne po jednom | Automaticky všetky |
| Aktualizácia | Ručná zmena | Upraviť tabuľku + sync |
| Pre nového zamestnanca | 5-10 min | 30 sekúnd |
| Hromadné zmeny | Hodiny | Minúty |
| Centrálna správa | ❌ | ✅ |

---

## ✅ Hotovo!

Teraz máte:
1. ✅ Centrálnu tabuľku so zamestnancami
2. ✅ Automatické vytváranie kalendárov
3. ✅ Jedno-klikové synchronizácie
4. ✅ Automatické zdieľanie

**Chcete aby som pridal UI tlačidlo do webovej aplikácie?** 🚀

