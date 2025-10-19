# 📚 Príklady použitia

## AI Chat príkazy

### Základné operácie

```
"Pridaj úlohu inštalácia pre Jána Nového na zajtra"
→ Vytvorí inštalačnú úlohu, automaticky pridelí Jánovi

"Naplánuj výrobu na utorok o 8:00 na 6 hodín"
→ Vytvorí výrobnú úlohu, nájde vhodného zamestnanca

"Kto je voľný v piatok?"
→ Zobrazí dostupnosť všetkých zamestnancov
```

### Práca s počasím

```
"Aké je počasie tento týždeň?"
→ Zobrazí predpoveď počasia a vhodnosť pre inštalácie

"Kedy bude pekné počasie na inštaláciu?"
→ Nájde najbližšie dni vhodné na vonkajšie práce

"Naplánuj inštaláciu na 3 dni keď bude slnečno"
→ Inteligentne nájde vhodné termíny podľa počasia
```

### Prehľady a štatistiky

```
"Ukáž úlohy na tento týždeň"
→ Zoznam všetkých naplánovaných úloh

"Aké úlohy má Peter?"
→ Úlohy konkrétneho zamestnanca

"Kto je najviac vyťažený?"
→ Analýza vyťaženosti zamestnancov
```

## API Príklady (cURL)

### Vytvorenie zamestnanca

```bash
curl -X POST "http://localhost:8000/employees" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ján Nový",
    "email": "jan.novy@firma.sk",
    "employee_type": "both",
    "max_hours_per_week": 40
  }'
```

### Vytvorenie úlohy s automatickým priradením

```bash
curl -X POST "http://localhost:8000/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Inštalácia solárnych panelov",
    "task_type": "installation",
    "start_time": "2025-10-15T08:00:00",
    "estimated_hours": 8,
    "description": "Inštalácia na rodinnom dome",
    "weather_dependent": true,
    "priority": 3
  }'
```

### Získanie predpovede počasia

```bash
curl "http://localhost:8000/weather/forecast?days=7"
```

### Chat s AI agentom

```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Naplánuj inštaláciu na zajtra pre Jána"
  }'
```

### Získanie dostupnosti zamestnanca

```bash
curl "http://localhost:8000/planning/availability?date=2025-10-15T00:00:00&employee_id=1"
```

### Návrh termínov pre úlohu

```bash
curl -X POST "http://localhost:8000/planning/suggest" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Veľká inštalácia",
    "task_type": "installation",
    "estimated_hours": 16,
    "weather_dependent": true,
    "priority": 5
  }'
```

### Optimalizácia plánu

```bash
curl -X POST "http://localhost:8000/planning/optimize?start_date=2025-10-15T00:00:00&end_date=2025-10-22T00:00:00"
```

## Python príklady

### Použitie v Python skripte

```python
import requests
from datetime import datetime, timedelta

API_URL = "http://localhost:8000"

# Vytvorenie zamestnanca
def create_employee(name, email, emp_type="both"):
    response = requests.post(f"{API_URL}/employees", json={
        "name": name,
        "email": email,
        "employee_type": emp_type,
        "max_hours_per_week": 40
    })
    return response.json()

# Vytvorenie úlohy
def create_task(title, task_type, start_time, hours):
    response = requests.post(f"{API_URL}/tasks", json={
        "title": title,
        "task_type": task_type,
        "start_time": start_time.isoformat(),
        "estimated_hours": hours,
        "weather_dependent": task_type == "installation"
    })
    return response.json()

# Získanie počasia
def get_weather():
    response = requests.get(f"{API_URL}/weather")
    return response.json()

# Použitie
if __name__ == "__main__":
    # Vytvor zamestnanca
    employee = create_employee("Test User", "test@example.com")
    print(f"Vytvorený zamestnanec: {employee['name']}")
    
    # Získaj počasie
    weather = get_weather()
    print(f"Počasie: {weather['description']}, {weather['temperature']}°C")
    
    # Vytvor úlohu
    tomorrow = datetime.now() + timedelta(days=1)
    tomorrow = tomorrow.replace(hour=8, minute=0)
    
    if weather['suitable_for_installation']:
        task = create_task(
            "Inštalácia z Python scriptu",
            "installation",
            tomorrow,
            8
        )
        print(f"Vytvorená úloha: {task['title']}")
```

## JavaScript/Frontend príklady

### Vytvorenie úlohy cez fetch

```javascript
async function createTask(taskData) {
  const response = await fetch('http://localhost:8000/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData)
  });
  
  return await response.json();
}

// Použitie
const newTask = await createTask({
  title: "Nová inštalácia",
  task_type: "installation",
  start_time: "2025-10-15T08:00:00",
  estimated_hours: 8,
  weather_dependent: true
});
```

### Chat s AI

```javascript
async function sendChatMessage(message) {
  const response = await fetch('http://localhost:8000/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message })
  });
  
  return await response.json();
}

// Použitie
const aiResponse = await sendChatMessage(
  "Naplánuj inštaláciu na najbližší slnečný deň"
);
console.log(aiResponse.response);
```

## Scenáre použitia

### Scenár 1: Plánovanie týždňa s ohľadom na počasie

```python
from datetime import datetime, timedelta
import requests

API_URL = "http://localhost:8000"

# 1. Získaj predpoveď počasia
forecast = requests.get(f"{API_URL}/weather/forecast?days=7").json()

# 2. Nájdi slnečné dni
sunny_days = [
    day for day in forecast['forecast']
    if day['suitable_for_installation']
]

print(f"Slnečné dni: {len(sunny_days)}")

# 3. Naplánuj inštalácie na slnečné dni
for day in sunny_days[:3]:  # Prvé 3 slnečné dni
    start_time = datetime.fromisoformat(day['date'])
    start_time = start_time.replace(hour=8, minute=0)
    
    response = requests.post(f"{API_URL}/tasks", json={
        "title": f"Inštalácia - {start_time.strftime('%d.%m.')}",
        "task_type": "installation",
        "start_time": start_time.isoformat(),
        "estimated_hours": 8,
        "weather_dependent": True
    })
    
    print(f"Naplánované: {response.json()['title']}")

# 4. Naplánuj výrobu na daždivé dni
rainy_days = [
    day for day in forecast['forecast']
    if not day['suitable_for_installation']
]

for day in rainy_days[:2]:
    start_time = datetime.fromisoformat(day['date'])
    start_time = start_time.replace(hour=8, minute=0)
    
    response = requests.post(f"{API_URL}/tasks", json={
        "title": f"Výroba - {start_time.strftime('%d.%m.')}",
        "task_type": "production",
        "start_time": start_time.isoformat(),
        "estimated_hours": 8,
        "weather_dependent": False
    })
    
    print(f"Naplánované: {response.json()['title']}")
```

### Scenár 2: Kontrola dostupnosti pred plánovaním

```python
import requests
from datetime import datetime

API_URL = "http://localhost:8000"

def plan_with_availability_check(date_str):
    # Získaj dostupnosť všetkých zamestnancov
    date = datetime.fromisoformat(date_str)
    
    availability = requests.get(
        f"{API_URL}/planning/availability",
        params={"date": date.isoformat()}
    ).json()
    
    # Nájdi zamestnanca s najväčšou dostupnosťou
    best_employee = max(
        availability['employees'],
        key=lambda e: len(e['free_slots'])
    )
    
    print(f"Najdostupnejší: {best_employee['employee']['name']}")
    print(f"Voľné sloty: {len(best_employee['free_slots'])}")
    
    # Vytvor úlohu pre tohto zamestnanca
    if best_employee['free_slots']:
        first_slot = best_employee['free_slots'][0]
        
        response = requests.post(f"{API_URL}/tasks", json={
            "title": "Automaticky naplánovaná úloha",
            "task_type": "installation",
            "start_time": first_slot['start'],
            "estimated_hours": 4,
            "employee_id": best_employee['employee']['id']
        })
        
        return response.json()

# Použitie
task = plan_with_availability_check("2025-10-15T00:00:00")
print(f"Vytvorená úloha: {task['title']}")
```

### Scenár 3: Hromadné plánovanie cez AI

```python
import requests

API_URL = "http://localhost:8000"

tasks_to_plan = [
    "Naplánuj inštaláciu pre Jána na najbližší slnečný deň",
    "Pridaj výrobu na utorok na 6 hodín",
    "Vytvor inštaláciu v Bratislave na 2 dni",
]

for task_description in tasks_to_plan:
    response = requests.post(f"{API_URL}/chat", json={
        "message": task_description
    })
    
    result = response.json()
    print(f"✓ {result['response']}")
    
    if result.get('action_taken'):
        print(f"  Akcia: {result['action_taken']}")
```

## Tipy a triky

### 1. Hromadná aktualizácia úloh

```bash
# Získaj všetky úlohy
curl "http://localhost:8000/tasks" > tasks.json

# Aktualizuj konkrétnu úlohu
curl -X PUT "http://localhost:8000/tasks/1" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### 2. Export dát do CSV (Python)

```python
import requests
import csv

tasks = requests.get("http://localhost:8000/tasks").json()

with open('tasks.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'title', 'type', 'start_time'])
    writer.writeheader()
    for task in tasks:
        writer.writerow({
            'id': task['id'],
            'title': task['title'],
            'type': task['task_type'],
            'start_time': task['start_time']
        })
```

### 3. Automatické plánovanie každý týždeň (cron job)

```bash
# Pridajte do crontab (crontab -e):
0 9 * * 1 curl -X POST "http://localhost:8000/planning/optimize?start_date=$(date -I)&end_date=$(date -d '+7 days' -I)"
```

### 4. Notifikácie cez webhook

```python
def notify_on_weather_change():
    weather = requests.get("http://localhost:8000/weather").json()
    
    if not weather['suitable_for_installation']:
        # Pošli notifikáciu
        send_slack_notification(
            "⚠️ Zlé počasie - presunúť inštalácie na výrobu!"
        )
```

## Dokumentácia API

Kompletná interaktívna API dokumentácia je dostupná na:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc


