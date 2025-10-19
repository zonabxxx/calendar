# 📁 Štruktúra projektu

```
google calndar planing/
│
├── 📄 main.py                      # Hlavná FastAPI aplikácia
├── 📄 requirements.txt             # Python závislosti
├── 📄 .env.example                 # Príklad konfigurácie
├── 📄 .gitignore                   # Git ignore súbor
├── 📄 Dockerfile                   # Docker image definícia
├── 📄 docker-compose.yml           # Docker Compose konfigurácia
├── 📄 nginx.conf                   # Nginx konfigurácia
├── 📄 run.sh                       # Automatický startup skript
├── 📄 test_setup.py                # Testovací skript setupu
│
├── 📂 models/                      # Databázové modely a schémy
│   ├── __init__.py
│   ├── database.py                 # SQLAlchemy modely
│   └── schemas.py                  # Pydantic schémy
│
├── 📂 services/                    # Biznis logika a služby
│   ├── __init__.py
│   ├── google_calendar.py          # Google Calendar integrácia
│   ├── weather.py                  # Weather API integrácia
│   ├── ai_agent.py                 # OpenAI AI agent
│   └── scheduler.py                # Plánovacia logika
│
├── 📂 frontend/                    # Webový frontend
│   ├── index.html                  # Hlavná stránka
│   ├── style.css                   # Štýly
│   └── app.js                      # JavaScript logika
│
├── 📂 utils/                       # Pomocné utility
│   ├── __init__.py
│   ├── db_utils.py                 # Databázové nástroje
│   └── generate_sample_data.py    # Generátor ukážkových dát
│
├── 📂 tests/                       # Testy
│   ├── __init__.py
│   └── test_basic.py               # Základné unit testy
│
└── 📂 docs/                        # Dokumentácia
    ├── README.md                   # Hlavný prehľad
    ├── QUICK_START.md              # Rýchly štart
    ├── setup_guide.md              # Detailný setup
    ├── API_DOCUMENTATION.md        # API dokumentácia
    ├── USAGE_EXAMPLES.md           # Príklady použitia
    ├── DOCKER.md                   # Docker guide
    ├── CHANGELOG.md                # História zmien
    ├── ROADMAP.md                  # Plány do budúcnosti
    └── PROJECT_STRUCTURE.md        # Tento súbor
```

## 📦 Hlavné komponenty

### 🔧 Backend (main.py)

Hlavná FastAPI aplikácia obsahuje:
- **REST API endpointy** pre všetky operácie
- **CORS middleware** pre komunikáciu s frontendom
- **Database session management**
- **Error handling**
- **Auto-generated API dokumentácia** (Swagger/ReDoc)

**Hlavné sekcie:**
```
- Auth endpoints (/auth/*)
- Employee endpoints (/employees/*)
- Task endpoints (/tasks/*)
- Weather endpoints (/weather/*)
- Chat endpoints (/chat)
- Planning endpoints (/planning/*)
- Stats endpoints (/stats/*)
```

### 🗄️ Models

#### database.py
SQLAlchemy modely pre databázu:
- **Employee** - Zamestnanci s typom, kalendárom, hodinami
- **Task** - Úlohy s typom, stavom, priradením
- **WeatherLog** - Historické záznamy počasia

Podporované databázy: SQLite, PostgreSQL, MySQL

#### schemas.py
Pydantic schémy pre API validáciu:
- **Request schemas** - Validácia vstupov
- **Response schemas** - Formátovanie výstupov
- **Type enums** - Employee types, Task types, statuses

### ⚙️ Services

#### google_calendar.py (345 riadkov)
- OAuth2 autentifikácia
- CRUD operácie pre eventy
- Kontrola dostupnosti
- Hľadanie voľných slotov
- Multi-calendar podpora

#### weather.py (230 riadkov)
- OpenWeatherMap API integrácia
- Aktuálne počasie
- 14-dňová predpoveď
- Logika vhodnosti pre inštalácie
- Slovenský popis počasia

#### ai_agent.py (210 riadkov)
- OpenAI GPT-4 integrácia
- Function calling
- Konverzačné rozhranie
- Context-aware odpovede
- Slovenský jazyk

#### scheduler.py (290 riadkov)
- Inteligentné priradenie zamestnancov
- Kontrola vyťaženia
- Optimalizácia plánu
- Návrh termínov podľa počasia
- Kalkulácia dostupnosti

### 🎨 Frontend

#### index.html (200 riadkov)
- Responzívny layout
- 3-stĺpcový grid design
- Modal dialógy
- Formuláre
- Chat interface

#### style.css (500+ riadkov)
- Moderný gradient dizajn
- Animácie a transitions
- Responzívne breakpointy
- Custom scrollbars
- Component styling

#### app.js (400+ riadkov)
- API komunikácia
- Chat logika
- Dynamic rendering
- Form handling
- Real-time updates

### 🛠️ Utilities

#### db_utils.py
Databázové nástroje:
- Reset databázy
- Backup/restore
- Export do CSV
- Štatistiky
- Čistenie starých dát

#### generate_sample_data.py
Generátor ukážkových dát:
- 6 vzorových zamestnancov
- 20+ vzorových úloh
- Realistické dáta
- Rôzne typy a stavy

#### test_setup.py
Testovací skript:
- Kontrola konfigurácie
- Overenie API kľúčov
- Test databázy
- Test Weather API
- Test OpenAI API

### 🧪 Tests

#### test_basic.py
Unit testy pre:
- Databázové modely
- Weather logiku
- Scheduler kalkulácie
- Data validáciu
- Priority systém

## 🐳 Docker

### Dockerfile
Multi-stage build:
- Python 3.11 slim base
- Optimalizované vrstvy
- Health checks
- Production-ready

### docker-compose.yml
Služby:
- **api** - Backend API
- **frontend** - Nginx server
- **postgres** (optional) - Databáza

## 📚 Dokumentácia

### README.md
- Hlavný prehľad projektu
- Quick start guide
- Funkcie a features
- Základná dokumentácia

### QUICK_START.md
- 5-minútový setup
- Najrýchlejší spôsob spustenia
- Prvé kroky

### setup_guide.md
- Detailný setup návod
- Získanie API kľúčov
- Google Calendar setup
- Riešenie problémov

### API_DOCUMENTATION.md
- Kompletná API dokumentácia
- Request/Response príklady
- Error handling
- Authentication

### USAGE_EXAMPLES.md
- Praktické príklady
- Python skripty
- cURL príkazy
- JavaScript príklady
- Reálne scenáre

### DOCKER.md
- Docker setup
- docker-compose usage
- Production deployment
- Užitočné príkazy

### CHANGELOG.md
- História verzií
- Zoznam funkcií
- Breaking changes
- Migration guides

### ROADMAP.md
- Plány do budúcnosti
- Feature requests
- Timeline
- Community voting

## 🔑 Kľúčové súbory

### .env.example
Template pre konfiguráciu:
```env
OPENAI_API_KEY=...
WEATHER_API_KEY=...
GOOGLE_CLIENT_ID=...
DATABASE_URL=...
```

### credentials.json
Google OAuth credentials (netrackovaný)

### token.pickle
Google OAuth token cache (netrackovaný)

### production_planner.db
SQLite databáza (netrackovaná)

## 📊 Štatistiky kódu

```
Python:        ~2500 riadkov
JavaScript:    ~400 riadkov
HTML:          ~200 riadkov
CSS:           ~500 riadkov
Dokumentácia:  ~3000 riadkov
─────────────────────────
Celkom:        ~6600 riadkov
```

## 🎯 Design patterns

### Backend
- **Repository pattern** - Databázový prístup
- **Service layer** - Biznis logika
- **Dependency injection** - FastAPI Depends
- **Singleton** - Service instances

### Frontend
- **Module pattern** - JavaScript organizácia
- **Event-driven** - User interactions
- **RESTful client** - API komunikácia

## 🔐 Bezpečnosť

### Environment variables
- API kľúče v .env
- Git ignored
- Docker secrets ready

### Input validation
- Pydantic schemas
- Type checking
- SQL injection ochrana

### Authentication
- OAuth2 pre Google
- Token-based auth ready
- CORS konfigurácia

## 🚀 Deployment

### Development
```bash
./run.sh
```

### Production
```bash
docker-compose up -d
```

### Testing
```bash
python tests/test_basic.py
```

## 📈 Škálovateľnosť

### Horizontálne
- Stateless API
- Docker containers
- Load balancing ready

### Vertikálne
- PostgreSQL podpora
- Connection pooling
- Async operations (FastAPI)

## 🔧 Konfigurácia

### Environment premenné
- Flexibilná konfigurácia
- Development/Production ready
- Docker Compose integration

### Database
- SQLite pre development
- PostgreSQL pre production
- Migrations support (Alembic)

## 📝 Code quality

### Style
- PEP 8 compliant
- Type hints
- Docstrings
- Comments v slovenčine

### Testing
- Unit tests
- Integration tests ready
- Setup tests

### Documentation
- Inline comments
- API documentation
- User guides
- Examples

---

**Verzia:** 1.0.0  
**Posledná aktualizácia:** 14. október 2025


