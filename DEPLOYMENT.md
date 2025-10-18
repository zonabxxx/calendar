# 🚀 Deployment na Vercel - Krok po Kroku

## ✅ Lokálne testovanie (HOTOVO)

Server beží lokálne na http://localhost:3000 a funguje správne!

## 📦 Deployment na Vercel

### Krok 1: Prihláste sa do Vercel

```bash
vercel login
```

Vyberte si prihlásenie cez:
- GitHub
- GitLab  
- Bitbucket
- Email

### Krok 2: Prvý Deployment (Preview)

```bash
cd "/Users/polepime.sk/Documents/cursor_workspace/google calndar juraj"
vercel
```

Vercel sa vás spýta:
- **Set up and deploy?** → **Y** (yes)
- **Which scope?** → Vyberte váš účet
- **Link to existing project?** → **N** (no)
- **What's your project's name?** → Stlačte Enter (použije `google-calndar-juraj`)
- **In which directory is your code located?** → `./` (stlačte Enter)
- **Want to modify these settings?** → **N** (no)

### Krok 3: Production Deployment

Po úspešnom preview deploymente:

```bash
vercel --prod
```

### Krok 4: Získajte URL

Po deploymente dostanete URL ako:
```
https://google-calndar-juraj.vercel.app
```

Alebo zistíte URL cez:
```bash
vercel ls
```

## 🔗 Pripojenie v ChatGPT Kit

1. Otvorte ChatGPT Kit
2. Nájdite "Connect to MCP Server"
3. Vyplňte:
   - **URL:** `https://VASA-URL.vercel.app` (vaša Vercel URL)
   - **Label:** `Google Calendar`
   - **Description:** `Môj Google Kalendár`
   - **Authentication:** Access token / API key (nechajte prázdne)
4. Kliknite "Connect"

## 🧪 Test Production URL

Po deploymente otestujte:

```bash
# Health check
curl https://VASA-URL.vercel.app

# List tools
curl -X POST https://VASA-URL.vercel.app/mcp/tools/list \
  -H "Content-Type: application/json" \
  -d '{}'

# Test get events
curl -X POST https://VASA-URL.vercel.app/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name":"get_calendar_events","arguments":{"maxResults":5}}'
```

## 📝 Dôležité poznámky

### Google Apps Script musí byť nastavený:
1. Otvorte https://script.google.com
2. Nájdite váš projekt
3. Kliknite **Deploy** → **Manage deployments**
4. Uistite sa že:
   - Execute as: **Me**
   - Who has access: **Anyone**

### Aktualizácia kódu:
Po akejkoľvek zmene v kóde:
```bash
vercel --prod
```

### Zobrazenie logov:
```bash
vercel logs [deployment-url]
```

### Zmazanie projektu:
```bash
vercel remove google-calndar-juraj
```

## 🎉 Hotovo!

Po deploymente budete môcť:
1. ✅ Používať MCP server z ChatGPT Kit
2. ✅ Čítať udalosti z Google Kalendára
3. ✅ Vytvárať nové udalosti
4. ✅ Upravovať existujúce udalosti
5. ✅ Mazať udalosti

## 🆘 Riešenie problémov

**Server nefunguje:**
```bash
vercel logs
```

**Chcem zmeniť nastavenia:**
```bash
vercel
# Pri otázke "Want to modify these settings?" → Y
```

**Chcem iný názov projektu:**
Upravte `name` v `package.json` a deployujte znova.

