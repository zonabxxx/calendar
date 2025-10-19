# 🌐 Web ChatGPT Kalendár

Krásne webové rozhranie pre ChatGPT kalendár agenta s live náhľadom udalostí.

## ✨ Funkcie

- 💬 **Konverzačné rozhranie** - chatujte prirodzene po slovensky
- 📅 **Live kalendár** - vidíte udalosti v reálnom čase
- 🚀 **Rýchle akcie** - prednastavené otázky jedným klikom
- 🎨 **Moderný dizajn** - responzívne, pekné a intuitívne
- 🔄 **Auto-refresh** - kalendár sa aktualizuje automaticky
- 💡 **Function indicators** - vidíte keď agent volá kalendár

## 🚀 Spustenie

### 1. Nastavte API klúč

Upravte `.env` súbor:
```bash
nano .env
```

Pridajte váš **NOVÝ** OpenAI API kľúč (musíte REVOKE starý!):
```
OPENAI_API_KEY=sk-proj-...váš-nový-kľúč...
GOOGLE_SCRIPT_URL=https://script.google.com/...
PORT=3001
```

### 2. Spustite web server

```bash
npm run web
```

### 3. Otvorte v prehliadači

```
http://localhost:3001
```

## 🎯 Ako používať

### Rýchle akcie (tlačidlá):
- **📅 Tento týždeň** - zobrazí udalosti
- **📆 Zajtra** - čo mám zajtra
- **➕ Pridať** - začne pridávanie udalosti

### Prirodzená konverzácia:
```
Ty: Pridaj stretnutie so Zuzanou zajtra o 14:00
🤖: V akom meste a ako dlho?
Ty: Bratislava, 1 hodina
🤖: ✅ Hotovo! Vytvoril som udalosť...
```

### Inteligentné príkazy:
- "Ukáž mi všetky udalosti tento týždeň"
- "Čo mám v pondelok?"
- "Pridaj cvičenie v utorok o 18:00"
- "Naplanuj mi meeting s tímom budúci štvrtok"

## 🎨 Funkcie rozhrania

### Ľavý panel - Chat:
- Konverzácia s ChatGPT
- Rýchle akcie
- Indikátory volania funkcií
- Reset konverzácie

### Pravý panel - Kalendár:
- Live náhľad udalostí
- Auto-refresh každých 30s
- Manuálne obnovenie (🔄)
- Hover efekty

## 📱 Responzívny dizajn

Web funguje na:
- 💻 Desktop (dual-panel)
- 📱 Mobile (single-panel)
- 📲 Tablet (adaptívny)

## 🔧 Technológie

- **Backend**: Express.js + OpenAI API
- **Frontend**: Vanilla JS (žiadne dependencies!)
- **Styling**: Pure CSS s gradientmi
- **API**: REST endpoints
- **Session**: In-memory (každá tab = nová session)

## 📊 API Endpoints

### Chat:
```
POST /api/chat
Body: { message: "...", sessionId: "..." }
Response: { response: "...", functionCalls: [...] }
```

### Kalendár:
```
GET /api/events
Response: { events: [...] }
```

### Reset:
```
POST /api/reset
Body: { sessionId: "..." }
```

### Health:
```
GET /api/health
Response: { status: "ok", openai: true, calendar: true }
```

## 🌐 Verejný prístup (Cloudflare Tunnel)

Ak chcete sprístupniť web internetu:

```bash
cloudflared tunnel --url http://localhost:3001
```

Dostanete verejnú URL typu:
```
https://xyz.trycloudflare.com
```

## 💰 Náklady

### OpenAI API (GPT-4):
- **Input**: ~$0.03 / 1K tokens
- **Output**: ~$0.06 / 1K tokens
- **Priemerný chat**: $0.01 - $0.05

### Lacnejšia verzia (GPT-3.5):

V `web-server.js` zmeňte:
```javascript
model: 'gpt-3.5-turbo'  // namiesto 'gpt-4'
```

Cena klesne na ~$0.001 - $0.01 per chat.

## 🔒 Bezpečnosť

### ⚠️ DÔLEŽITÉ:
1. **NIKDY** nezdieľajte `.env` súbor
2. **Zrevokujte** starý API kľúč
3. **Používajte** iba nové klúče
4. `.env` je v `.gitignore`

### Pre produkciu:
- Pridajte autentifikáciu
- Rate limiting
- HTTPS (Let's Encrypt)
- Firewall rules

## 🐛 Troubleshooting

**"Cannot connect to server":**
- Skontrolujte či beží server (`npm run web`)
- Port 3001 je voľný

**"OpenAI API error":**
- API kľúč v `.env` je správny
- Kľúč nie je revoked
- Máte kredit na účte

**"Calendar not loading":**
- Google Apps Script URL je správna
- Script je deployed ako Web App
- Permissions sú nastavené

**"Chat is slow":**
- Použite `gpt-3.5-turbo` namiesto `gpt-4`
- Skontrolujte internetové pripojenie

## 📚 Ďalšie možnosti

### Rozšírenia:
- 🔐 Pridať login/registráciu
- 💾 Perzistentné session (Redis)
- 🎤 Voice input
- 📧 Email notifikácie
- 🌍 Multi-language
- 📱 PWA (mobilná appka)

Chcete niečo pridať? Napíšte mi! 🚀

