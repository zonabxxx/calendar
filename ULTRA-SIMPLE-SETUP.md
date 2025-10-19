# ✨ Ultra-Simple Setup - IBA URL!

## 🎯 Najjednoduchší spôsob

**BEZ:**
- ❌ OAuth credentials
- ❌ API kľúčov
- ❌ Google Cloud Console
- ❌ Hesiel

**IBA:**
- ✅ URL vášho Google Apps Script
- ✅ Copy & paste
- ✅ **2 minúty setup!**

---

## 🚀 SETUP (2 minúty)

### KROK 1: Deploy Google Apps Script

1. **Ísť na:** https://script.google.com
2. **New project**
3. **Skopírovať CELÝ kód** z `GoogleAppsScript-NoAuth.gs`
4. **Ctrl+S** (uložiť)
5. **Deploy** → **New deployment** → **Web app**
   ```
   Description: Calendar Bridge
   Execute as: Me
   Who has access: Anyone
   ```
6. **Deploy** → **Authorize** → **Allow**
7. **SKOPÍROVAŤ URL** (začína `https://script.google.com/macros/s/...`)

### KROK 2: Spustiť aplikáciu

```bash
npm run simple
```

### KROK 3: Otvoriť v prehliadači

```
http://localhost:3001
```

### KROK 4: Pripojiť sa

1. **Vložíte URL** z kroku 1
2. **Kliknete "Pripojiť sa"**
3. **HOTOVO!** Vidíte kalendár! 🎉

---

## 👥 Pre viacero ľudí

**Každý:**
1. Nasadí vlastný script (2 min)
2. Vloží vlastnú URL do aplikácie
3. Vidí svoje kalendáre

**Prepínanie:**
```
┌─────────────────────────────┐
│  🚪 Odhlásiť sa              │
│  📎 Pripojiť iný účet        │
└─────────────────────────────┘
```

---

## 🎨 Ako to funguje

### 1. Apps Script beží pod VAŠÍM účtom
```
Váš Google účet
  ↓
Apps Script (nasadený ako Web App)
  ↓
URL endpoint (verejná, ale náhodný token)
  ↓
Aplikácia volá URL
  ↓
Vidí VAŠE kalendáre!
```

### 2. Žiadne heslá, žiadne credentials
```
✅ URL obsahuje náhodný token (ťažko uhádnuť)
✅ Viete deaktivovať deployment (= odpojiť)
✅ Script má iba prístup k VAŠIM dátam
✅ Nikto iný nevidí vaše prihlasovacie údaje
```

---

## 🔒 Bezpečnosť

### URL je náhodná:
```
https://script.google.com/macros/s/
  AKfycbxjYJ1UlHZfzlQdVgesiRnSNHp...  ← náhodný 43-znakový token
/exec
```

### Viete ju deaktivovať:
1. Apps Script → Deploy → Manage deployments
2. Archive deployment = prestane fungovať
3. New deployment = nová URL

### Script beží pod VAŠÍM účtom:
- Má prístup k VAŠIM kalendárom
- Nemá prístup k ničomu inému
- Viete ho kedykoľvek zmazať

---

## 💼 Príklad použitia

### Firma s 5 zamestnancami:

**Pondelok ráno:**

1. **9:00 - Admin** 
   - Pošle email všetkým:
     ```
     Ahoj tím! Používame nový kalendárny systém.
     
     1. Ísť na: script.google.com
     2. New project
     3. Vložiť tento kód: [odkaz]
     4. Deploy ako Web App
     5. Skopírovať URL a vložiť do aplikácie
     
     Hotové za 2 minúty! 🚀
     ```

2. **9:10 - Všetci pripojení**
   - Juraj ✅
   - Peter ✅
   - Zuzana ✅
   - Martin ✅
   - Anna ✅

3. **Používanie:**
   ```
   Každý vidí svoje kalendáre
   Každý spravuje svoje udalosti
   Žiadne zdieľanie hesiel
   Žiadne komplikácie
   ```

---

## 📱 Používateľský zážitok

### Prvé prihlásenie:
```
┌─────────────────────────────────────┐
│  📅 Pripojiť Google Kalendár        │
│                                     │
│  📎 Script URL                      │
│  [paste URL here]                  │
│                                     │
│  [🔗 Pripojiť sa]                  │
└─────────────────────────────────────┘
```

### Po pripojení:
```
┌─────────────────────────────────────┐
│  📅 Kalendár          👤 juraj@... 🚪│
├─────────────────────────────────────┤
│  📋 📅 🗓️ 🔄                        │
├─────────────────────────────────────┤
│  🤝 Stretnutie s klientom           │
│  📅 21. okt, 10:00                  │
│  📍 Bratislava                       │
│  👥 Peter Zuzana                    │
└─────────────────────────────────────┘
```

---

## 🎯 Výhody

| Vlastnosť | OAuth | Apps Script + API Key | IBA URL (tento) |
|-----------|-------|----------------------|-----------------|
| Setup | 😰 Zložitý | 😐 Stredný | 😊 Jednoduchý |
| Google Console | ✅ Potrebný | ❌ | ❌ |
| Pre používateľa | OAuth popup | Zadá kľúč | Vloží URL |
| Čas setup | 30 min | 5 min | **2 min** |
| Bezpečnosť | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## ⚡ Rýchly štart

```bash
# 1. Spustiť server
npm run simple

# 2. Otvoriť prehliadač
open http://localhost:3001

# 3. Vložiť URL scriptu
# 4. HOTOVO!
```

---

## 🆚 Porovnanie s inými riešeniami

### Thunderbird (starý spôsob):
```
❌ Google zablokoval "Less secure apps"
❌ Nefunguje od 2022
```

### Náš spôsob:
```
✅ Používa oficiálne Google Apps Script API
✅ Google to podporuje a povoľuje
✅ Funguje teraz aj v budúcnosti
```

---

## 📖 FAQ

**Q: Je to bezpečné?**
A: Áno! URL obsahuje náhodný token, script beží pod vaším účtom, viete ho deaktivovať.

**Q: Môže niekto iný pristupovať k môjmu kalendáru?**
A: Iba ak im dáte URL. URL je náhodná 43-znakov dlhá, takže ju nemôže nikto uhádnuť.

**Q: Čo ak chcem odpojiť?**
A: Kliknite "🚪" v aplikácii, alebo deaktivujte deployment v Apps Script.

**Q: Môžem prepínať medzi účtami?**
A: Áno! Odhláste sa a pripojte iný účet s inou URL.

**Q: Koľko to stojí?**
A: **ZADARMO!** Apps Script je free do 20,000 volaní/deň.

---

## 🎉 Hotovo!

Teraz máte najjednoduchší kalendárny systém:
- ✅ 2-minútový setup
- ✅ Žiadne credentials
- ✅ Iba URL
- ✅ Copy & paste
- ✅ FUNGUJE! 🚀

