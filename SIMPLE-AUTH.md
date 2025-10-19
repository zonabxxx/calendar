# 🔐 Jednoduchý prístup k Google Kalendáru - BEZ OAuth

## 💡 Princíp

Namiesto OAuth credentials používame:
1. **Google Apps Script** - beží pod VAŠÍM Google účtom
2. **API kľúč** - jednoduchý string na autentifikáciu
3. **URL endpoint** - verejná adresa na volanie

**Výhody:**
- ✅ Žiadne OAuth credentials
- ✅ Žiadny Google Cloud Console
- ✅ Jednoduchý setup (5 minút)
- ✅ Funguje pre viacero ľudí (každý má svoj script)

---

## 🚀 SETUP (5 minút)

### KROK 1: Nasadiť Google Apps Script

1. **Ísť na:** https://script.google.com
2. **New project**
3. **Skopírovať kód** z `GoogleAppsScript-Simple.gs`
4. **Deploy** → **New deployment** → **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. **Skopírovať URL** (začína `https://script.google.com/macros/s/...`)

### KROK 2: Vytvoriť API kľúč

V Apps Script kóde nájdite:
```javascript
const API_KEY = 'moj-super-tajny-kluc-123';
```

**Zmeňte na vlastný náhodný string!** Napríklad:
```javascript
const API_KEY = 'firma-kalendar-2025-xyz789';
```

### KROK 3: Nastaviť v aplikácii

V `.env` súbore:
```
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/VAŠID/exec
CALENDAR_API_KEY=firma-kalendar-2025-xyz789
```

**HOTOVO!** Žiadne OAuth, žiadne credentials!

---

## 👥 Pre viacero zamestnancov

**Každý zamestnanec:**
1. Nasadí vlastný Apps Script (pod svojim Google účtom)
2. Dostane vlastnú URL a API kľúč
3. Pridá do aplikácie

**V aplikácii:**
```javascript
// Konfigurácia zamestnancov
const employees = [
  {
    name: 'Juraj Martinkovych',
    scriptUrl: 'https://script.google.com/macros/s/ABC123.../exec',
    apiKey: 'juraj-kluc-xyz'
  },
  {
    name: 'Peter Novák',
    scriptUrl: 'https://script.google.com/macros/s/DEF456.../exec',
    apiKey: 'peter-kluc-abc'
  }
];
```

---

## 🔒 Bezpečnosť

### API kľúč:
- ✅ Jednoduchý string
- ✅ Kontroluje sa v Apps Script
- ✅ Neplatný kľúč = zamietnutý prístup

### URL:
- ✅ Obsahuje náhodný token (ťažko uhádnuť)
- ✅ Môžete ju zmeniť (nový deployment)
- ✅ Viete deaktivovať (disable deployment)

### Oprávnenia:
- ✅ Script beží pod VAŠÍM Google účtom
- ✅ Má prístup k VAŠIM kalendárom
- ✅ Nikto iný nevidí vaše heslá

---

## 📱 Ako to použiť

### Pre používateľa:
1. Otvorí aplikáciu
2. Zadá **API kľúč** (ako heslo)
3. Aplikácia sa pripojí k jeho kalendáru
4. Vidí a upravuje udalosti

### Žiadne OAuth popup!
### Žiadne "Allow access"!
### Jednoducho zadať kľúč a je to!

---

## 🎯 Výhody tohto prístupu

| Vlastnosť | OAuth | Apps Script + API Key |
|-----------|-------|----------------------|
| Setup | Zložitý | Jednoduchý |
| Google Console | Potrebný | Nie |
| Credentials | Client ID/Secret | URL + kľúč |
| Pre používateľa | OAuth popup | Zadá kľúč |
| Multi-účet | Automatické | Manuálne (každý má kľúč) |
| Revoke prístup | OAuth panel | Disable script |

---

## 💼 Reálny príklad

**Firma má 5 zamestnancov:**

1. **Každý zamestnanec:**
   - Ide na script.google.com
   - Vytvorí projekt z template kódu
   - Deploy ako Web App
   - Dostane URL + vymyslí API kľúč

2. **Admin aplikácie:**
   - Pridá všetkých do config súboru
   - Deploy aplikáciu

3. **Používanie:**
   ```
   📱 Aplikácia: "Zadajte API kľúč"
   👤 Zamestnanec: "juraj-kluc-xyz"
   ✅ Aplikácia: Pripojená k Jurajovmu kalendáru!
   ```

---

## 🔄 Prepínanie účtov

```
┌─────────────────────────────┐
│  Vyber zamestanca:          │
│  ○ Juraj Martinkovych       │
│  ○ Peter Novák              │
│  ● Zuzana Horváthová        │
│                             │
│  API kľúč: [zuzana-xyz]     │
│  [Pripojiť]                 │
└─────────────────────────────┘
```

---

## ⚡ Rýchly start

1. Skopírujte `GoogleAppsScript-Simple.gs`
2. Deploy na script.google.com
3. Zmeňte API_KEY v kóde
4. Skopírujte URL do `.env`
5. Spustite `npm run simple`

**Bez OAuth, bez credentials, bez komplikácií!** 🎉

---

## 🆚 Porovnanie

### Thunderbird/Outlook spôsob:
- Zadáte email + heslo
- Aplikácia sa prihlási za vás
- ❌ **Google to zablokoval** (security risk)

### Náš spôsob (Apps Script):
- Zadáte API kľúč (nie heslo!)
- Script beží pod vaším účtom
- ✅ **Google to povoľuje** (bezpečné)

---

Chcete tento jednoduchší prístup? Vytvorím `GoogleAppsScript-Simple.gs` a `simple-server.js`! 🚀

