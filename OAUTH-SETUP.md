# 🔐 Google OAuth Calendar App - Setup Guide

## 🎯 Čo toto riešenie umožňuje:

✅ **Prihlásenie cez Google účet** (Sign in with Google)
✅ **Prístup k vlastným kalendárom** (bez Apps Script)
✅ **Prepínanie medzi účtami** (viacero Google účtov)
✅ **Bezpečné** (OAuth 2.0 tokens)
✅ **Prístup k Gmail, Drive, atď.** (voliteľné)

---

## 📋 KROK 1: Google Cloud Console Setup

### A. Vytvorte nový projekt

1. **Ísť na:** https://console.cloud.google.com
2. **Vytvoriť nový projekt:**
   - Kliknúť na dropdown hore (vedľa "Google Cloud")
   - **"NEW PROJECT"**
   - Názov: `Calendar Management App`
   - Kliknúť **"CREATE"**

### B. Povoľte Calendar API

1. V ľavom menu: **"APIs & Services"** → **"Library"**
2. Vyhľadať: **"Google Calendar API"**
3. Kliknúť na ňu a **"ENABLE"**
4. (Voliteľné) Povoliť aj **"Gmail API"** ak chcete Gmail

### C. Vytvorte OAuth 2.0 Credentials

1. V ľavom menu: **"APIs & Services"** → **"Credentials"**
2. Kliknúť **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**

3. **Ak prvýkrát:**
   - Najprv musíte nakonfigurovať **"OAuth consent screen"**
   - Vybrať **"External"** (pre testing)
   - App name: `Calendar Manager`
   - User support email: váš email
   - Developer email: váš email
   - **SAVE**

4. **Scopes (povolenia):**
   - Kliknúť **"ADD OR REMOVE SCOPES"**
   - Vybrať:
     - ✅ `Google Calendar API` - `.../auth/calendar`
     - ✅ `Google Calendar API` - `.../auth/calendar.readonly`
     - ✅ (Voliteľné) `Gmail API` - `.../auth/gmail.readonly`
   - **UPDATE**

5. **Test users:**
   - Pridať svoje emaily (+ emaily kolegov)
   - **SAVE**

6. **Späť na Credentials:**
   - **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
   - Application type: **"Web application"**
   - Name: `Calendar Web App`
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3001
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:3001/auth/callback
     ```
   - Kliknúť **"CREATE"**

7. **SKOPÍROVAŤ:**
   - ✅ **Client ID** (začína `xxxxx.apps.googleusercontent.com`)
   - ✅ **Client Secret** (začína `GOCSPX-...`)

---

## 🔧 KROK 2: Nainštalovať dependencies

```bash
npm install passport passport-google-oauth20 express-session
```

---

## 🔐 KROK 3: Vytvoriť `.env` súbor

```bash
nano .env
```

Pridať:
```
# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/callback

# Session Secret (vygenerujte náhodný string)
SESSION_SECRET=super-tajny-kluc-123456789

# OpenAI (voliteľné pre ChatGPT)
OPENAI_API_KEY=sk-proj-...

# Server
PORT=3001
NODE_ENV=development
```

---

## 🚀 KROK 4: Spustiť OAuth server

```bash
npm run oauth
```

---

## 📱 KROK 5: Prihlásenie

1. **Otvorte prehliadač:** http://localhost:3001
2. **Kliknite "Sign in with Google"**
3. **Vyberte Google účet**
4. **Povoľte prístup** k kalendáru
5. **Hotovo!** Uvidíte svoje kalendáre

---

## 🔄 KROK 6: Prepínanie účtov

**Pridať druhý účet:**
1. Kliknúť na avatar/menu
2. **"Add another account"**
3. Prihlásiť sa s iným Google účtom
4. **Switch account** - prepínať medzi účtami

---

## 🎨 Funkcie aplikácie:

### ✅ **Multi-Account Support**
```
👤 Účet 1: juraj@firma.sk (CEO)
👤 Účet 2: peter@firma.sk (Sales)  
👤 Účet 3: osobny@gmail.com (Osobný)
```

### ✅ **Prístup k:**
- 📅 Google Calendar (všetky kalendáre)
- 📧 Gmail (voliteľné)
- 📁 Google Drive (voliteľné)
- 👥 Google Contacts (voliteľné)

### ✅ **Bezpečnosť:**
- 🔒 OAuth 2.0 tokens (refresh & access)
- 🔐 Tokens uložené šifrované
- ⏱️ Automatické refresh pri vypršaní
- 🚪 Odhlásenie = revoke tokens

---

## 🌐 KROK 7: Production Deployment

### Pre Vercel/produkciu:

1. **Upraviť Authorized URIs v Google Console:**
   ```
   https://vasa-domena.vercel.app
   https://vasa-domena.vercel.app/auth/callback
   ```

2. **Upraviť `.env` pre production:**
   ```
   GOOGLE_CALLBACK_URL=https://vasa-domena.vercel.app/auth/callback
   NODE_ENV=production
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

---

## 🔍 Troubleshooting

### "Access blocked: This app's request is invalid"
- Skontrolujte Authorized redirect URIs v Google Console
- Musia presne zodpovedať (http vs https, port, path)

### "Error 401: invalid_client"
- Client ID alebo Secret je nesprávny
- Skontrolujte `.env` súbor

### "Error 403: access_denied"
- Používateľ nie je v test users
- Pridajte email do "Test users" v OAuth consent screen

### Tokens expirujú:
- Aplikácia automaticky refreshuje tokens
- Ak problém pretrváva, odhláste sa a znova prihláste

---

## 📊 Výhody OAuth riešenia vs Apps Script:

| Vlastnosť | Apps Script | OAuth |
|-----------|-------------|-------|
| **Setup** | Jednoduchší | Zložitejší (prvýkrát) |
| **Bezpečnosť** | Verejná URL | Token-based |
| **Multi-účet** | ❌ | ✅ |
| **Limit requests** | Nižší | Vyšší |
| **Prístup k iným API** | Obmedzený | Plný (Gmail, Drive...) |
| **User experience** | Bez prihlásenia | Google login |

---

## 🎯 Ďalšie kroky:

Po úspešnom prihlásení:
- ✅ Vidíte všetky svoje kalendáre
- ✅ Môžete prepínať medzi účtami
- ✅ Vytvárate udalosti vo svojom mene
- ✅ (Voliteľné) Prístup k Gmail, Drive, atď.

---

## 🚀 Ready to start?

1. Vytvorte Google Cloud projekt
2. Povoľte Calendar API
3. Vytvorte OAuth credentials
4. Skopírujte do `.env`
5. Spustite `npm run oauth`
6. Otvorte http://localhost:3001

**Prihlásenie cez Google je READY!** 🎉

