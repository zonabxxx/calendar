# 🚀 Detailný Setup Guide

## Krok 1: Inštalácia Python závislostí

```bash
# Vytvorte virtuálne prostredie
python3 -m venv venv

# Aktivujte virtuálne prostredie
# MacOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Nainštalujte závislosti
pip install -r requirements.txt
```

## Krok 2: Nastavenie Google Calendar API

### 2.1 Vytvorenie Google Cloud projektu

1. Choďte na [Google Cloud Console](https://console.cloud.google.com/)
2. Vytvorte nový projekt alebo vyberte existujúci
3. Názov projektu: "Production Planner" (alebo iný podľa vášho výberu)

### 2.2 Povolenie Google Calendar API

1. V Google Cloud Console prejdite na **APIs & Services** > **Library**
2. Vyhľadajte **Google Calendar API**
3. Kliknite na **Enable**

### 2.3 Vytvorenie OAuth 2.0 credentials

1. Prejdite na **APIs & Services** > **Credentials**
2. Kliknite na **Create Credentials** > **OAuth client ID**
3. Ak je to prvýkrát, musíte nakonfigurovať **OAuth consent screen**:
   - User Type: **External** (pokiaľ nie ste v Google Workspace)
   - App name: "Production Planner"
   - User support email: váš email
   - Developer contact: váš email
   - Scopes: Pridajte `.../auth/calendar`
   - Test users: Pridajte svoje Gmail účty
4. Vytvorte OAuth client ID:
   - Application type: **Desktop app**
   - Name: "Production Planner Desktop"
5. **Stiahnite JSON súbor** a uložte ho ako `credentials.json` do root zložky projektu

## Krok 3: Získanie OpenAI API kľúča

1. Choďte na [OpenAI Platform](https://platform.openai.com/)
2. Vytvorte účet alebo sa prihláste
3. Prejdite na **API Keys**
4. Vytvorte nový API kľúč
5. Skopírujte kľúč (uložte si ho bezpečne - po zavretí sa už nezobrazí)

## Krok 4: Získanie Weather API kľúča

1. Choďte na [OpenWeatherMap](https://openweathermap.org/)
2. Vytvorte účet
3. Prejdite na **API Keys**
4. Skopírujte váš API kľúč (free tier je dostačujúci)

## Krok 5: Konfigurácia .env súboru

Vytvorte súbor `.env` v root zložke projektu:

```bash
cp .env.example .env
```

Upravte `.env` súbor s vašimi API kľúčmi:

```env
# Google Calendar API
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback

# OpenAI API
OPENAI_API_KEY=sk-your-openai-key-here

# Weather API (OpenWeatherMap)
WEATHER_API_KEY=your_weather_api_key_here
WEATHER_LOCATION=Bratislava,SK

# Database (necháte default pre SQLite)
DATABASE_URL=sqlite:///./production_planner.db

# Application
SECRET_KEY=nahradte-toto-nahodnym-stringom-123456
```

## Krok 6: Prvé spustenie

```bash
# Aktivujte virtuálne prostredie (ak ešte nie je)
source venv/bin/activate

# Spustite server
uvicorn main:app --reload
```

Pri prvom spustení:
1. Server sa spustí na http://localhost:8000
2. Otvorte prehliadač a prejdite na http://localhost:8000/auth/login
3. Budete presmerovaní na Google autorizáciu
4. Prihláste sa a povoľte prístup k kalendárom
5. Po úspešnej autorizácii sa vytvorí súbor `token.pickle`

## Krok 7: Otvorenie Frontend

Otvorte `frontend/index.html` v prehliadači:

```bash
# MacOS
open frontend/index.html

# Linux
xdg-open frontend/index.html

# Windows
start frontend/index.html

# Alebo jednoducho otvorte súbor v prehliadači
```

## Krok 8: Testovanie

### Pridanie prvého zamestnanca

1. V rozhraní kliknite na "👤 Nový zamestnanec"
2. Vyplňte údaje:
   - Meno: Ján Nový
   - Email: jan.novy@example.com
   - Typ: Oboje
   - Max. hodín týždenne: 40
3. Kliknite "Vytvoriť"

### Vytvorenie prvej úlohy

1. Kliknite na "➕ Nová úloha"
2. Alebo použite AI chat:
   ```
   Pridaj úlohu inštalácia pre Jána Nového na zajtra
   ```

### Testovanie AI chatu

Skúste tieto príkazy:
- "Aké je počasie na tento týždeň?"
- "Kto je voľný zajtra?"
- "Naplánuj inštaláciu na 3 dni keď bude pekne"
- "Ukáž všetky úlohy"

## Riešenie problémov

### Problém: "credentials.json not found"
**Riešenie:** Uistite sa, že ste stiahli credentials.json z Google Cloud Console a uložili ho do root zložky projektu.

### Problém: "OPENAI_API_KEY not found"
**Riešenie:** Skontrolujte, že súbor `.env` existuje a obsahuje platný OpenAI API kľúč.

### Problém: "Weather API error"
**Riešenie:** Overte, že máte platný OpenWeatherMap API kľúč v `.env` súbore.

### Problém: Frontend sa nepripája k API
**Riešenie:** 
1. Skontrolujte, že backend beží na http://localhost:8000
2. Skontrolujte konzolu v prehliadači na chyby CORS
3. Uistite sa, že `API_URL` v `frontend/app.js` je nastavený správne

### Problém: Google autorizácia zlyhala
**Riešenie:**
1. Skontrolujte, že máte správne nastavený OAuth consent screen
2. Pridajte svoj Gmail účet do Test users
3. Uistite sa, že redirect URI je `http://localhost:8000/auth/callback`

## Pokročilé nastavenia

### Zmena portu servera

```bash
uvicorn main:app --host 0.0.0.0 --port 8080
```

### Použitie PostgreSQL namiesto SQLite

V `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost/production_planner
```

### Produkčné nasadenie

Pre produkčné prostredie:
1. Zmeňte `DEBUG=False`
2. Použite silné `SECRET_KEY`
3. Použite produkčnú databázu (PostgreSQL)
4. Nastavte HTTPS
5. Použite reverse proxy (nginx)
6. Použite process manager (systemd, supervisor)

## Užitočné príkazy

```bash
# Spustenie servera s hot reload
uvicorn main:app --reload

# Spustenie na inom porte
uvicorn main:app --port 8080

# Zobrazenie API dokumentácie
# http://localhost:8000/docs

# Reset databázy (POZOR: vymaže všetky dáta!)
rm production_planner.db
# Server vytvorí novú databázu pri spustení

# Export zoznamu závislostí
pip freeze > requirements.txt

# Kontrola verzií
pip list
```

## Ďalšie kroky

1. **Pridajte zamestnancov** s ich Gmail účtami
2. **Otestujte plánovanie** s rôznymi typmi úloh
3. **Skúste AI asistenta** na automatické plánovanie
4. **Prispôsobte pracovné hodiny** v kóde (`services/scheduler.py`)
5. **Pridajte vlastné pravidlá** pre plánovanie

## Podpora

Ak narazíte na problémy:
1. Skontrolujte logy v terminále
2. Otvorte browser konzolu (F12) pre frontend chyby
3. Overte, že všetky API kľúče sú správne nastavené
4. Skontrolujte, že všetky závislosti sú nainštalované

Viac informácií:
- [FastAPI dokumentácia](https://fastapi.tiangolo.com/)
- [Google Calendar API](https://developers.google.com/calendar)
- [OpenAI API](https://platform.openai.com/docs)


