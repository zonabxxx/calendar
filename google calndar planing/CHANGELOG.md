# 📋 Changelog

Všetky dôležité zmeny v projekte.

## [1.0.0] - 2025-10-14

### ✨ Pridané

#### Základné funkcie
- 🤖 AI Chat agent s OpenAI GPT-4 integráciou
- 🌦️ Automatické plánovanie podľa počasia (OpenWeatherMap API)
- 📅 Google Calendar integrácia pre zamestnancov
- 👥 Kompletná správa zamestnancov (CRUD operácie)
- ✅ Správa úloh s automatickým priradením
- 🎯 Inteligentný scheduler s optimalizáciou

#### Backend (FastAPI)
- RESTful API s kompletnou dokumentáciou
- SQLAlchemy ORM s podporou SQLite/PostgreSQL
- Pydantic validácia dát
- CORS middleware
- Health check endpointy
- Automatické vytvorenie databázy

#### Frontend
- Moderný webový interface s gradientovým dizajnom
- Real-time chat s AI agentom
- Dashboard s počasím a štatistikami
- Prehľad zamestnancov a úloh
- Formuláre pre vytváranie zamestnancov/úloh
- Responzívny dizajn

#### Services
- **Google Calendar Service**: OAuth2, CRUD operácie, kontrola dostupnosti
- **Weather Service**: Aktuálne počasie, predpoveď, vhodnosť pre inštalácie
- **AI Agent**: Konverzačné rozhranie, inteligentné odporúčania
- **Scheduler**: Automatické priradenie, optimalizácia, kontrola vyťaženia

#### Modely
- Employee: Typy (installer/producer/both), kalendár, hodiny
- Task: Typy (installation/production), stavy, priorty
- WeatherLog: Historické záznamy počasia

#### API Endpoints
- `/employees` - Správa zamestnancov
- `/tasks` - Správa úloh
- `/weather` - Počasie a predpoveď
- `/chat` - AI asistent
- `/planning` - Inteligentné plánovanie
- `/stats` - Štatistiky

#### Dokumentácia
- 📖 README.md - Hlavný prehľad
- 📘 setup_guide.md - Detailný setup
- 📙 API_DOCUMENTATION.md - API dokumentácia
- 📗 USAGE_EXAMPLES.md - Príklady použitia
- 📕 QUICK_START.md - 5 minútový štart
- 🐳 DOCKER.md - Docker guide

#### DevOps
- Dockerfile pre kontajnerizáciu
- docker-compose.yml s nginx
- GitHub Actions ready
- Health checks
- Automatické zálohovanie

#### Utility nástroje
- `test_setup.py` - Overenie konfigurácie
- `utils/db_utils.py` - Databázové nástroje
- `utils/generate_sample_data.py` - Generátor dát
- `tests/test_basic.py` - Unit testy
- `run.sh` - Automatické spustenie

### 🎨 Dizajn

- Moderný gradient dizajn (purple/blue)
- Emoji ikony pre lepšiu UX
- Animácie a prechody
- Responzívny layout (grid system)
- Custom scrollbars
- Modal dialógy

### 🔧 Konfigurácia

- Environment variables (.env)
- Jednoduchá konfigurácia API kľúčov
- Flexibilná databáza (SQLite/PostgreSQL)
- Nastaviteľné pracovné hodiny
- Konfigurovateľná lokácia počasia

### 📊 Plánovanie

#### Pravidlá plánovania
- Pekné počasie → Inštalácie
- Zlé počasie → Výroba
- Kontrola dostupnosti v kalendári
- Rešpektovanie max. hodín týždenne
- Priority úloh (1-5)
- Automatické priradenie najvhodnejšieho zamestnanca

#### AI funkcie
- Spracovanie prírodného jazyka
- Automatické rozpoznanie zámerov
- Kontext-aware odpovede
- Function calling
- Návrhy termínov
- Kontrola dostupnosti

### 🌍 Lokalizácia

- Slovenský jazyk v UI
- Slovenské dátumové formáty
- Časová zóna: Europe/Bratislava
- Slovenské popisy a manuály

### 🔒 Bezpečnosť

- OAuth2 pre Google Calendar
- Environment variables pre API kľúče
- Input validácia (Pydantic)
- SQL injection ochrana (SQLAlchemy)
- CORS konfigurácia

### 📦 Závislosti

#### Python packages
- FastAPI 0.104.1 - Web framework
- uvicorn 0.24.0 - ASGI server
- SQLAlchemy 2.0.23 - ORM
- OpenAI 1.3.7 - AI integrácia
- google-api-python-client 2.108.0 - Calendar API
- requests 2.31.0 - HTTP klient
- python-dotenv 1.0.0 - Env variables
- pydantic 2.5.0 - Validácia

### 🐛 Známe problémy

- Google Calendar vyžaduje manuálnu autorizáciu pri prvom spustení
- Free tier OpenWeatherMap má limit 60 volaní/minútu
- SQLite nie je vhodný pre vysokú záťaž (použite PostgreSQL)

### 📝 Poznámky

- Projekt je pripravený na produkčné nasadenie
- Docker podporuje škálovanie
- API je RESTful a dobre dokumentované
- Frontend je statický (možno nahradiť React/Vue)

---

## Budúce verzie

### [1.1.0] - Plánované
- 📧 Email notifikácie
- 📱 Mobile responsive frontend
- 🔔 Push notifikácie
- 📊 Pokročilé reporty a grafy
- 🔄 Automatická synchronizácia s externými systémami
- 🌐 Multi-language support
- 👤 User authentication & roles
- 📱 Progressive Web App (PWA)

### [1.2.0] - Plánované
- 🤖 Machine learning pre predikciu vyťaženia
- 📈 Analytics a insights
- 🔗 Integrácia s inými kalendármi (Outlook, iCal)
- 💬 Slack/Teams integrácia
- 🗺️ Mapa inštalácií
- 📸 Fotodokumentácia úloh
- ⏱️ Time tracking

---

**Verzia:** 1.0.0  
**Dátum vydania:** 14. október 2025  
**Status:** Stable ✅


