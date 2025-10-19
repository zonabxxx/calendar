# ⚡ Quick Start - 2 minúty

Najrýchlejší štart Production Plannera.

## 1️⃣ Inštalácia (1 minúta)

```bash
# Nainštalujte závislosti
npm install
```

## 2️⃣ Konfigurácia (30 sekúnd)

```bash
# Skopírujte konfiguračný súbor
cp .env.example .env
```

**Upravte `.env` a pridajte:**
- `OPENAI_API_KEY` - váš OpenAI kľúč ([získať tu](https://platform.openai.com/api-keys))
- `WEATHER_API_KEY` - váš OpenWeatherMap kľúč ([získať tu](https://openweathermap.org/api))

## 3️⃣ Spustenie (30 sekúnd)

```bash
npm run dev
```

## ✅ Hotovo!

Teraz máte:
- ✅ Backend na **http://localhost:8000**
- ✅ Frontend na **http://localhost:3000**
- ✅ API dokumentácia na **http://localhost:8000/docs**
- ✅ AI chat pripravený na použitie

Prehliadač sa automaticky otvorí na http://localhost:3000

## 🎯 Prvé kroky

### 1. Pridajte zamestnanca
Kliknite na "👤 Nový zamestnanec" a vyplňte:
- Meno: Ján Testovací
- Email: jan@test.sk
- Typ: Oboje

### 2. Vytvorte úlohu cez AI
V chate napíšte:
```
Pridaj úlohu inštalácia pre Jána na zajtra
```

### 3. Skontrolujte počasie
Chat príkaz:
```
Aké je počasie tento týždeň?
```

## 🚀 Ďalšie funkcie

- **Automatické plánovanie:** "Naplánuj inštaláciu keď bude pekne"
- **Kontrola dostupnosti:** "Kto je voľný v piatok?"
- **Prehľad úloh:** "Ukáž všetky úlohy na tento týždeň"

## 📚 Ďalšia dokumentácia

- [Detailný Setup Guide](setup_guide.md) - Kompletný návod
- [API Dokumentácia](API_DOCUMENTATION.md) - Všetky API endpointy
- [Príklady použitia](USAGE_EXAMPLES.md) - Praktické príklady
- [README](README.md) - Prehľad projektu

## ⚠️ Problémy?

```bash
# Test všetkých komponentov
python test_setup.py

# Skontrolujte logy
# Backend logy sú v termináli kde beží uvicorn
# Frontend logy v browser console (F12)
```

**Časté problémy:**
- Backend nebeží? → Skontrolujte port 8000
- API nefunguje? → Skontrolujte `.env` súbor
- Chat nefunguje? → Overte OpenAI API kľúč

## 🎉 Enjoy!

Váš AI plánovací systém je pripravený! 🗓️✨


