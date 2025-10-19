# 🤖 ChatGPT Kalendár Asistent

Inteligentný asistent s prístupom k vášmu Google Kalendáru.

## ⚠️ BEZPEČNOSŤ

**NIKDY** nezdieľajte váš `.env` súbor! Obsahuje citlivé API kľúče.

## 🚀 Inštalácia

1. **Vytvoriť `.env` súbor:**
```bash
cp .env.example .env
```

2. **Upraviť `.env`:**
- Pridajte váš **NOVÝ** OpenAI API kľúč (REVOKE starý!)
- URL je už nastavená

3. **Nainštalovať dependencies:**
```bash
npm install
```

4. **Spustiť agenta:**
```bash
node chatgpt-agent.js
```

## 💬 Použitie

Jednoducho píšte po slovensky:

```
Ty: Ukáž mi udalosti na budúci týždeň

🤖 Asistent: Máš nasledujúce udalosti...

Ty: Pridaj stretnutie so Zuzanou zajtra o 14:00

🤖 Asistent: Ktoré miesto a ako dlho má trvať?

Ty: Bratislava, 1 hodina

🤖 Asistent: Hotovo! Vytvoril som udalosť...
```

## 🛠️ Čo vie robiť

- ✅ Zobraziť udalosti z kalendára
- ✅ Pridávať nové udalosti
- ✅ Inteligentné parsovanie dátumov
- ✅ Komunikácia v slovenčine
- ✅ Konverzačné dopytovanie detailov

## 🔑 Získanie OpenAI API kľúča

1. Ísť na: https://platform.openai.com/api-keys
2. **REVOKE** starý kompromitovaný kľúč
3. Kliknúť "Create new secret key"
4. Skopírovať a vložiť do `.env`

## 📝 Poznámky

- Agent používa GPT-4 (výkonnejší, ale drahší)
- Môžete zmeniť na `gpt-3.5-turbo` v kóde pre lacnejšie volania
- Každý dotaz stojí približne $0.01 - $0.03

## 🆘 Troubleshooting

**"OPENAI_API_KEY is not set":**
- Vytvorte `.env` súbor
- Pridajte API kľúč

**"Error: 401":**
- API kľúč je neplatný
- Vytvorte nový na OpenAI dashboard

