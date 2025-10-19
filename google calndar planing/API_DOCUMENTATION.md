# 📡 API Dokumentácia

## Base URL
```
http://localhost:8000
```

Interaktívna dokumentácia: http://localhost:8000/docs

---

## 🔐 Autentifikácia

### GET /auth/login
Inicializuje Google Calendar OAuth flow.

**Response:**
```json
{
  "message": "Please check your browser for Google authentication",
  "status": "authenticated"
}
```

---

## 👥 Zamestnanci (Employees)

### GET /employees
Získa zoznam zamestnancov.

**Query Parameters:**
- `skip` (int): Počet preskočených záznamov (default: 0)
- `limit` (int): Maximálny počet záznamov (default: 100)
- `is_active` (bool): Filtrovať iba aktívnych (optional)

**Response:**
```json
[
  {
    "id": 1,
    "name": "Ján Nový",
    "email": "jan.novy@firma.sk",
    "employee_type": "both",
    "google_calendar_id": "calendar-id",
    "max_hours_per_week": 40.0,
    "is_active": true,
    "created_at": "2025-10-14T10:00:00",
    "updated_at": "2025-10-14T10:00:00"
  }
]
```

### POST /employees
Vytvorí nového zamestnanca.

**Request Body:**
```json
{
  "name": "Ján Nový",
  "email": "jan.novy@firma.sk",
  "employee_type": "both",
  "max_hours_per_week": 40.0,
  "google_calendar_id": null
}
```

**Employee Types:**
- `installer` - Inštalátor
- `producer` - Výrobca
- `both` - Oboje

**Response:** 201 Created + Employee object

### GET /employees/{employee_id}
Získa detaily zamestnanca.

**Response:** Employee object

### PUT /employees/{employee_id}
Aktualizuje zamestnanca.

**Request Body:** (všetky polia sú optional)
```json
{
  "name": "Nové meno",
  "email": "novy@email.sk",
  "employee_type": "installer",
  "max_hours_per_week": 35.0,
  "is_active": true
}
```

### DELETE /employees/{employee_id}
Deaktivuje zamestnanca (soft delete).

**Response:**
```json
{
  "message": "Employee deactivated"
}
```

---

## ✅ Úlohy (Tasks)

### GET /tasks
Získa zoznam úloh s filtrami.

**Query Parameters:**
- `skip` (int): Počet preskočených (default: 0)
- `limit` (int): Max počet (default: 100)
- `employee_id` (int): Filter podľa zamestnanca
- `task_type` (str): Filter podľa typu (installation/production)
- `status` (str): Filter podľa stavu
- `start_date` (datetime): Filter od dátumu
- `end_date` (datetime): Filter do dátumu

**Response:**
```json
[
  {
    "id": 1,
    "title": "Inštalácia solárnych panelov",
    "description": "Inštalácia na rodinnom dome",
    "task_type": "installation",
    "status": "planned",
    "start_time": "2025-10-15T08:00:00",
    "end_time": "2025-10-15T16:00:00",
    "estimated_hours": 8.0,
    "employee_id": 1,
    "employee": {
      "id": 1,
      "name": "Ján Nový",
      "email": "jan.novy@firma.sk"
    },
    "google_event_id": "event-id",
    "location": "Bratislava",
    "weather_dependent": true,
    "priority": 3,
    "created_at": "2025-10-14T10:00:00",
    "updated_at": "2025-10-14T10:00:00"
  }
]
```

**Task Types:**
- `installation` - Inštalácia
- `production` - Výroba

**Task Status:**
- `planned` - Naplánované
- `in_progress` - Prebieha
- `completed` - Dokončené
- `cancelled` - Zrušené

### POST /tasks
Vytvorí novú úlohu s automatickým priradením zamestnanca.

**Request Body:**
```json
{
  "title": "Inštalácia solárnych panelov",
  "description": "Inštalácia na rodinnom dome",
  "task_type": "installation",
  "start_time": "2025-10-15T08:00:00",
  "estimated_hours": 8.0,
  "location": "Bratislava",
  "weather_dependent": true,
  "priority": 3,
  "employee_id": null
}
```

**Response:** 201 Created + Task object

### GET /tasks/{task_id}
Získa detail úlohy.

**Response:** Task object s employee

### PUT /tasks/{task_id}
Aktualizuje úlohu.

**Request Body:** (všetky polia sú optional)
```json
{
  "title": "Nový názov",
  "status": "in_progress",
  "start_time": "2025-10-16T08:00:00",
  "employee_id": 2
}
```

### DELETE /tasks/{task_id}
Vymaže úlohu (hard delete).

**Response:**
```json
{
  "message": "Task deleted"
}
```

---

## 🌤️ Počasie (Weather)

### GET /weather
Získa aktuálne počasie.

**Response:**
```json
{
  "condition": "clear",
  "temperature": 22.5,
  "description": "jasná obloha",
  "suitable_for_installation": true,
  "humidity": 65,
  "wind_speed": 3.2
}
```

### GET /weather/forecast
Získa predpoveď počasia.

**Query Parameters:**
- `days` (int): Počet dní (default: 7, max: 14)

**Response:**
```json
{
  "forecast": [
    {
      "date": "2025-10-15T12:00:00",
      "condition": "clear",
      "temperature": 23.0,
      "description": "jasná obloha",
      "suitable_for_installation": true,
      "humidity": 60,
      "wind_speed": 2.5
    }
  ]
}
```

### GET /weather/recommendation
Získa odporúčanie práce na základe počasia.

**Query Parameters:**
- `date` (datetime): Dátum (optional, default: dnes)

**Response:**
```json
{
  "date": "2025-10-15T00:00:00",
  "recommendation": "installation",
  "message": "Odporúčanie: Inštalácia"
}
```

**Recommendations:**
- `installation` - Vhodné na inštalácie (pekné počasie)
- `production` - Vhodné na výrobu (zlé počasie)

---

## 💬 AI Chat

### POST /chat
Chat s AI agentom pre plánovanie.

**Request Body:**
```json
{
  "message": "Naplánuj inštaláciu pre Jána na zajtra",
  "context": {
    "employees": [],
    "weather": {},
    "tasks": []
  }
}
```

**Response:**
```json
{
  "response": "Rozumiem, vytvorím inštalačnú úlohu pre Jána Nového na zajtra.",
  "action_taken": "create_task",
  "data": {
    "task_id": 5,
    "message": "Úloha 'Inštalácia' bola naplánovaná pre Ján Nový na 2025-10-15 08:00."
  }
}
```

**Action Types:**
- `create_task` - Vytvorenie úlohy
- `check_availability` - Kontrola dostupnosti
- `suggest_dates` - Návrh termínov
- `null` - Iba odpoveď bez akcie

---

## 📅 Plánovanie (Planning)

### POST /planning/suggest
Inteligentný návrh termínov pre úlohu.

**Request Body:**
```json
{
  "task_type": "installation",
  "estimated_hours": 8.0,
  "title": "Veľká inštalácia",
  "description": "Popis úlohy",
  "preferred_date": "2025-10-15T00:00:00",
  "weather_dependent": true,
  "priority": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Našiel som 5 vhodných termínov",
  "suggested_dates": [
    "2025-10-15T08:00:00",
    "2025-10-16T08:00:00",
    "2025-10-18T08:00:00"
  ],
  "assigned_employee": {
    "id": 1,
    "name": "Ján Nový"
  },
  "task": null
}
```

### GET /planning/availability
Získa dostupnosť zamestnanca/ov pre dátum.

**Query Parameters:**
- `date` (datetime): Dátum
- `employee_id` (int): ID zamestnanca (optional)

**Response - konkrétny zamestnanec:**
```json
{
  "employee": {
    "id": 1,
    "name": "Ján Nový"
  },
  "date": "2025-10-15T00:00:00",
  "free_slots": [
    {
      "start": "2025-10-15T08:00:00",
      "end": "2025-10-15T09:00:00"
    }
  ],
  "workload": {
    "total_hours_scheduled": 16.0,
    "max_hours": 40.0,
    "available_hours": 24.0,
    "utilization_percent": 40.0
  }
}
```

**Response - všetci zamestnanci:**
```json
{
  "date": "2025-10-15T00:00:00",
  "employees": [
    {
      "employee": {...},
      "free_slots": [...],
      "available_hours": 24.0,
      "utilization_percent": 40.0
    }
  ]
}
```

### POST /planning/optimize
Optimalizuje plán pre časové obdobie.

**Query Parameters:**
- `start_date` (datetime): Začiatok obdobia
- `end_date` (datetime): Koniec obdobia (optional, default: +7 dní)

**Response:**
```json
{
  "assigned": 5,
  "failed": 1,
  "message": "Priradených: 5, Nepodarilo sa: 1"
}
```

---

## 📊 Štatistiky (Statistics)

### GET /stats/overview
Získa prehľadové štatistiky.

**Response:**
```json
{
  "total_employees": 10,
  "total_tasks": 45,
  "upcoming_tasks": 8,
  "system_status": "operational"
}
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "detail": "Email already registered"
}
```

### 404 Not Found
```json
{
  "detail": "Employee not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error message"
}
```

---

## 📝 Poznámky

### Formát dátumov
Všetky dátumy používajú ISO 8601 formát:
```
2025-10-15T08:00:00
```

### Časové pásmo
Predvolené časové pásmo: `Europe/Bratislava`

### Rate Limiting
Momentálne nie je implementované, ale odporúčame max 100 requestov/minútu.

### CORS
API akceptuje requesty z akýchkoľvek domén (`allow_origins: ["*"]`).
Pre produkciu odporúčame obmedziť na konkrétne domény.

---

## 🔧 Testovanie API

### Swagger UI
Interaktívne testovanie: http://localhost:8000/docs

### Postman Collection
Môžete importovať API do Postman pomocou OpenAPI schema:
http://localhost:8000/openapi.json

### Príklad testovania (Python)
```python
import requests

BASE_URL = "http://localhost:8000"

# Test vytvorenia zamestnanca
response = requests.post(f"{BASE_URL}/employees", json={
    "name": "Test User",
    "email": "test@example.com",
    "employee_type": "both"
})

assert response.status_code == 201
employee = response.json()
print(f"Vytvorený zamestnanec ID: {employee['id']}")

# Test získania počasia
response = requests.get(f"{BASE_URL}/weather")
assert response.status_code == 200
weather = response.json()
print(f"Teplota: {weather['temperature']}°C")
```


