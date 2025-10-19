# 🗓️ AI Production & Installation Planner

Inteligentný systém na plánovanie výroby a inštalácií s automatickým priraďovaním úloh zamestnancom na základe počasia a ich vyťaženia.

## ✨ Funkcie

- 🤖 **AI Chat Agent** - Konverzačné rozhranie pre plánovanie úloh cez OpenAI GPT-4
- 🌦️ **Plánovanie podľa počasia** - Automatické rozhodovanie inštalácia/výroba na základe predpovede
- 📅 **Google Calendar integrácia** - Automatická synchronizácia s kalendármi zamestnancov
- 👥 **Správa zamestnancov** - Sledovanie dostupnosti, vyťaženia a kapacít
- 🎯 **Inteligentné priradenie** - Optimalizácia pridelenia úloh podľa kritérií
- 📊 **Štatistiky a reporty** - Prehľad vyťaženia a výkonnosti
- 🐳 **Docker podpora** - Jednoduché nasadenie pomocou Docker Compose

## 📋 Predpoklady

- Python 3.9+ alebo Docker
- Google Cloud Project s povoleným Calendar API (voliteľné)
- OpenAI API kľúč
- OpenWeatherMap API kľúč (zdarma)

## 🚀 Rýchla inštalácia

### Metóda 1: NPM (najjednoduchšie) ⭐ **ODPORÚČANÉ**

```bash
npm install
npm run dev
```

Spustí backend (port 8000) + frontend (port 3000) súčasne!

### Metóda 2: Bash skript

```bash
./run.sh
```

Tento skript automaticky:
- Vytvorí virtuálne prostredie
- Nainštaluje závislosti
- Overí konfiguráciu
- Spustí server

### Metóda 2: Docker (najjednoduchšie)

```bash
# Vytvorte .env súbor
cp .env.example .env
# Upravte .env s vašimi API kľúčmi

# Spustite všetko
docker-compose up -d

# Aplikácia beží na http://localhost
```

Viac informácií: [DOCKER.md](DOCKER.md)

### Metóda 3: Manuálna inštalácia

1. **Vytvorte virtuálne prostredie:**
```bash
python3 -m venv venv
source venv/bin/activate  # MacOS/Linux
```

2. **Nainštalujte závislosti:**
```bash
pip install -r requirements.txt
```

3. **Nastavte API kľúče:**
```bash
cp .env.example .env
# Upravte .env súbor
```

4. **Spustite server:**
```bash
uvicorn main:app --reload
```

Detailný návod: [setup_guide.md](setup_guide.md)

## 🎮 Použitie

### Prístup k aplikácii

- **Frontend:** Otvorte `frontend/index.html` v prehliadači
- **Backend API:** http://localhost:8000
- **API Dokumentácia:** http://localhost:8000/docs
- **Google Calendar OAuth:** http://localhost:8000/auth/login (voliteľné)

### Prvé kroky

1. **Otvorte frontend** v prehliadači
2. **Pridajte zamestnanca** - kliknite "👤 Nový zamestnanec"
3. **Použite AI chat:**
   ```
   "Pridaj úlohu inštalácia pre Jána na zajtra"
   "Aké je počasie tento týždeň?"
   "Kto je voľný v piatok?"
   ```

## 📖 Použitie

### Chat príkazy:

- "Pridaj úlohu inštalácia pre Jána Nováka na zajtra"
- "Aké je počasie na budúci týždeň?"
- "Kto je voľný v utorok?"
- "Naplánuj inštaláciu na 3 dni keď bude pekne"
- "Ukáž všetky úlohy na tento týždeň"

### API Endpointy:

- `POST /auth/login` - Google autorizácia
- `GET /employees` - Zoznam zamestnancov
- `POST /employees` - Pridať zamestnanca
- `POST /tasks` - Vytvoriť úlohu
- `GET /tasks` - Získať úlohy
- `POST /chat` - AI chat rozhranie
- `GET /weather` - Aktuálne počasie
- `GET /weather/forecast` - Predpoveď počasia

## 🏗️ Architektúra

```
├── main.py                 # FastAPI aplikácia
├── models/
│   ├── database.py        # Database modely
│   └── schemas.py         # Pydantic schémy
├── services/
│   ├── google_calendar.py # Google Calendar API
│   ├── weather.py         # Weather API
│   ├── ai_agent.py        # OpenAI agent
│   └── scheduler.py       # Plánovacia logika
├── frontend/
│   ├── index.html         # Web interface
│   ├── style.css          # Styling
│   └── app.js             # Frontend logika
└── requirements.txt
```

## 🔧 Konfigurácia

### Pravidlá plánovania:

- **Pekné počasie** (slnečno, polojasno): Inštalácie
- **Zlé počasie** (dážď, sneh): Výroba
- Kontrola dostupnosti v kalendári
- Vyťaženie zamestnancov (max hodin/týždeň)

## 🛠️ Utility nástroje

### Testovanie setupu
```bash
python test_setup.py
```

### Generovanie ukážkových dát
```bash
python utils/generate_sample_data.py
```

### Databázové utility
```bash
python utils/db_utils.py
```

Funkcie:
- Export do CSV
- Zálohovanie databázy
- Čistenie starých dát
- Štatistiky

### Spustenie testov
```bash
python tests/test_basic.py
```

## 📚 Dokumentácia

- 📖 [Quick Start](QUICK_START.md) - 5 minútový rýchly štart
- 📘 [Setup Guide](setup_guide.md) - Detailný setup návod
- 📙 [API Documentation](API_DOCUMENTATION.md) - Kompletná API dokumentácia
- 📗 [Usage Examples](USAGE_EXAMPLES.md) - Praktické príklady použitia
- 🐳 [Docker Guide](DOCKER.md) - Docker nasadenie

## 🤝 Prispievanie

Príspevky sú vítané! Otvorte issue alebo pull request.

## 📝 Licencia

MIT License

## 👨‍💻 Autor

Vytvorené pre efektívne plánovanie výroby a inštalácií.

## ⭐ Podpora

Ak vám tento projekt pomohol, dajte mu hviezdu! ⭐

