# ✅ Installation Checklist

Kontrolný zoznam pre úspešnú inštaláciu Production Plannera.

## 📋 Pred inštaláciou

### Systémové požiadavky
- [ ] Python 3.9 alebo vyššie nainštalované
- [ ] pip funkčný a aktualizovaný
- [ ] Git nainštalovaný (voliteľné)
- [ ] Docker nainštalovaný (ak používate Docker)
- [ ] Moderný web prehliadač (Chrome, Firefox, Safari, Edge)

### API Kľúče
- [ ] OpenAI API kľúč získaný ([platform.openai.com](https://platform.openai.com))
- [ ] OpenWeatherMap API kľúč získaný ([openweathermap.org](https://openweathermap.org))
- [ ] Google Cloud projekt vytvorený (voliteľné)
- [ ] Google Calendar API povolené (voliteľné)
- [ ] OAuth 2.0 credentials stiahnuté ako `credentials.json` (voliteľné)

---

## 🛠️ Inštalácia

### Základný setup
- [ ] Projekt stiahnutý/naklonovaný
- [ ] Vstúpené do projekt zložky
- [ ] Virtuálne prostredie vytvorené (`python3 -m venv venv`)
- [ ] Virtuálne prostredie aktivované (`source venv/bin/activate`)
- [ ] Závislosti nainštalované (`pip install -r requirements.txt`)

### Konfigurácia
- [ ] `.env.example` skopírovaný ako `.env`
- [ ] `OPENAI_API_KEY` nastavený v `.env`
- [ ] `WEATHER_API_KEY` nastavený v `.env`
- [ ] `WEATHER_LOCATION` upravený pre vašu lokalitu
- [ ] `credentials.json` umiestnený v root zložke (ak používate Google Calendar)

### Test setupu
- [ ] Spustený `python test_setup.py`
- [ ] Všetky kontroly prešli (✅ zelené)
- [ ] Žiadne kritické chyby (❌ červené)

---

## 🚀 Prvé spustenie

### Backend
- [ ] Server spustený (`uvicorn main:app --reload`)
- [ ] Server beží na http://localhost:8000
- [ ] API dokumentácia prístupná na http://localhost:8000/docs
- [ ] Root endpoint vracia správu
- [ ] Databáza automaticky vytvorená

### Frontend
- [ ] `frontend/index.html` otvorený v prehliadači
- [ ] Stránka sa načíta bez chýb
- [ ] Chat interface je viditeľný
- [ ] API_URL v `app.js` ukazuje na správny backend

### Google Calendar (voliteľné)
- [ ] Navštívené http://localhost:8000/auth/login
- [ ] Presmerovaný na Google OAuth
- [ ] Prihlásený a povolený prístup
- [ ] `token.pickle` súbor vytvorený
- [ ] Test kalendára funguje

---

## 🧪 Funkčné testy

### API testy
- [ ] GET /weather vracia aktuálne počasie
- [ ] GET /weather/forecast vracia predpoveď
- [ ] GET /employees vracia prázdny zoznam (alebo dáta)
- [ ] GET /tasks vracia prázdny zoznam (alebo dáta)
- [ ] GET /stats/overview vracia štatistiky

### Frontend testy
- [ ] Chat input funguje
- [ ] Tlačidlo "Odoslať" funguje
- [ ] Počasie sa zobrazuje správne
- [ ] Štatistiky sa načítavajú
- [ ] Modaly sa otvárajú

### AI Chat testy
- [ ] Správa do chatu sa odosiela
- [ ] AI reaguje na správy
- [ ] Odpovede sú po slovensky
- [ ] Chat history sa zobrazuje

---

## 👥 Prvé dáta

### Pridanie zamestnanca
- [ ] Modal "Nový zamestnanec" sa otvára
- [ ] Všetky polia fungujú
- [ ] Zamestnanec sa vytvorí
- [ ] Zobrazí sa v zozname

### Vytvorenie úlohy
- [ ] Modal "Nová úloha" sa otvára
- [ ] Dátum/čas picker funguje
- [ ] Úloha sa vytvorí
- [ ] Zobrazí sa v zozname
- [ ] Zamestnanec je automaticky priradený

### AI príkazy
- [ ] "Aké je počasie?" funguje
- [ ] "Pridaj úlohu..." vytvorí úlohu
- [ ] "Kto je voľný...?" zobrazí dostupnosť

---

## 🔧 Pokročilé funkcie

### Ukážkové dáta
- [ ] Spustený `python utils/generate_sample_data.py`
- [ ] Vytvorených 6 zamestnancov
- [ ] Vytvorených 20+ úloh
- [ ] Dáta sa zobrazujú vo frontende

### Utility nástroje
- [ ] `python utils/db_utils.py` funguje
- [ ] Export do CSV funguje
- [ ] Backup databázy funguje
- [ ] Štatistiky sa zobrazujú

### Testy
- [ ] `python tests/test_basic.py` prebehol
- [ ] Všetky testy prešli
- [ ] Žiadne errors

---

## 🐳 Docker (voliteľné)

### Docker setup
- [ ] Docker nainštalovaný a beží
- [ ] `.env` súbor nakonfigurovaný
- [ ] `docker-compose up -d` spustený
- [ ] Kontajnery bežia (docker-compose ps)

### Docker testy
- [ ] API prístupné na http://localhost/api/
- [ ] Frontend prístupný na http://localhost
- [ ] API docs na http://localhost/docs
- [ ] Kontajnery sú zdravé (healthy status)

---

## 📊 Verifikácia

### Health checks
- [ ] Backend odpovedá rýchlo (< 500ms)
- [ ] Weather API funguje
- [ ] OpenAI API funguje
- [ ] Databáza je prístupná
- [ ] Frontend sa načítava rýchlo

### Performance
- [ ] Chat odpovedá do 3 sekúnd
- [ ] API volania sú rýchle (< 1s)
- [ ] UI je responzívne
- [ ] Žiadne memory leaky

### Security
- [ ] `.env` je v `.gitignore`
- [ ] `token.pickle` je v `.gitignore`
- [ ] API kľúče nie sú hardcoded
- [ ] CORS je nakonfigurovaný správne

---

## ✅ Finálna kontrola

### Dokumentácia
- [ ] README.md prečítaný
- [ ] QUICK_START.md funguje
- [ ] API dokumentácia prístupná
- [ ] Setup guide je jasný

### Backup
- [ ] Databáza zálohovaná
- [ ] `.env` zazálohovaný
- [ ] `credentials.json` zazálohovaný

### Ready for use
- [ ] Všetko funguje ako má
- [ ] Žiadne kritické chyby
- [ ] Team môže začať používať
- [ ] Admin má prístup

---

## 🎉 Gratulujeme!

Ak ste zaškrtli všetko vyššie, váš Production Planner je plne funkčný! 🚀

### Ďalšie kroky

1. **Pridajte reálnych zamestnancov** s ich emailami
2. **Nastavte Google Calendar** pre každého
3. **Vytvorte prvé reálne úlohy**
4. **Trénujte team** na používanie AI chatu
5. **Monitorujte výkonnosť** prvý týždeň

### Potrebujete pomoc?

- 📚 Dokumentácia: [docs/](docs/)
- 🐛 Problémy: Otvorte issue
- 💬 Otázky: Pozrite FAQ v dokumentácii

### Užitočné príkazy

```bash
# Restart servera
uvicorn main:app --reload

# Generovať ukážkové dáta
python utils/generate_sample_data.py

# Zálohovať databázu
python utils/db_utils.py

# Spustiť testy
python tests/test_basic.py

# Docker restart
docker-compose restart

# Zobraz logy
docker-compose logs -f api
```

---

**Dátum kontroly:** _____________  
**Kontroloval:** _____________  
**Status:** ☐ Passed  ☐ Failed  ☐ Needs review


