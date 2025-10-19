"""
Test script to verify setup and create sample data
"""
import os
import sys
from datetime import datetime, timedelta

# Check if .env file exists
if not os.path.exists('.env'):
    print("❌ .env súbor nebol nájdený!")
    print("📝 Vytvorte .env súbor podľa .env.example")
    sys.exit(1)

print("✅ .env súbor existuje")

# Check if credentials.json exists
if not os.path.exists('credentials.json'):
    print("⚠️  credentials.json nebol nájdený")
    print("📝 Stiahnite credentials.json z Google Cloud Console")
    print("   Aplikácia bude fungovať, ale bez Google Calendar integrácie")
else:
    print("✅ credentials.json existuje")

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Check required environment variables
required_vars = {
    'OPENAI_API_KEY': 'OpenAI API kľúč',
    'WEATHER_API_KEY': 'Weather API kľúč',
}

missing_vars = []
for var, desc in required_vars.items():
    if not os.getenv(var):
        print(f"❌ {var} nie je nastavený ({desc})")
        missing_vars.append(var)
    else:
        print(f"✅ {var} je nastavený")

if missing_vars:
    print("\n❌ Chýbajúce environment premenné!")
    print("📝 Upravte .env súbor a doplňte chýbajúce hodnoty")
    sys.exit(1)

print("\n" + "="*50)
print("🎉 Základná konfigurácia je v poriadku!")
print("="*50)

# Test imports
print("\n📦 Testujem importy...")
try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from models.database import Base, Employee, Task, EmployeeType, TaskType
    from services import get_weather_service
    print("✅ Všetky importy sú v poriadku")
except ImportError as e:
    print(f"❌ Chyba pri importe: {e}")
    print("📝 Spustite: pip install -r requirements.txt")
    sys.exit(1)

# Test database
print("\n💾 Testujem databázu...")
try:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./production_planner.db")
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    # Check if database has data
    employee_count = db.query(Employee).count()
    task_count = db.query(Task).count()
    
    print(f"✅ Databáza je pripojená")
    print(f"   - Zamestnanci: {employee_count}")
    print(f"   - Úlohy: {task_count}")
    
    # Offer to create sample data
    if employee_count == 0:
        print("\n❓ Chcete vytvoriť ukážkové dáta? (y/n)")
        response = input().strip().lower()
        
        if response == 'y':
            print("\n📝 Vytváram ukážkové dáta...")
            
            # Create sample employees
            employees_data = [
                {"name": "Ján Nový", "email": "jan.novy@firma.sk", "type": EmployeeType.BOTH},
                {"name": "Peter Inštalátor", "email": "peter.instalator@firma.sk", "type": EmployeeType.INSTALLER},
                {"name": "Mária Výrobná", "email": "maria.vyrobna@firma.sk", "type": EmployeeType.PRODUCER},
            ]
            
            for emp_data in employees_data:
                employee = Employee(
                    name=emp_data["name"],
                    email=emp_data["email"],
                    employee_type=emp_data["type"],
                    max_hours_per_week=40.0,
                    is_active=True
                )
                db.add(employee)
            
            db.commit()
            print("✅ Vytvorených 3 ukážkových zamestnancov")
            
            # Create sample tasks
            tomorrow = datetime.now() + timedelta(days=1)
            tomorrow = tomorrow.replace(hour=8, minute=0, second=0, microsecond=0)
            
            tasks_data = [
                {
                    "title": "Inštalácia solárnych panelov - Bratislava",
                    "type": TaskType.INSTALLATION,
                    "hours": 8,
                    "description": "Inštalácia 10 solárnych panelov na rodinnom dome"
                },
                {
                    "title": "Výroba rámov pre projekty",
                    "type": TaskType.PRODUCTION,
                    "hours": 6,
                    "description": "Príprava nosných konštrukcií"
                },
            ]
            
            employees = db.query(Employee).all()
            
            for i, task_data in enumerate(tasks_data):
                start_time = tomorrow + timedelta(days=i)
                end_time = start_time + timedelta(hours=task_data["hours"])
                
                task = Task(
                    title=task_data["title"],
                    description=task_data["description"],
                    task_type=task_data["type"],
                    start_time=start_time,
                    end_time=end_time,
                    estimated_hours=task_data["hours"],
                    employee_id=employees[i % len(employees)].id if employees else None,
                    weather_dependent=task_data["type"] == TaskType.INSTALLATION
                )
                db.add(task)
            
            db.commit()
            print("✅ Vytvorených 2 ukážkové úlohy")
    
    db.close()
    
except Exception as e:
    print(f"❌ Chyba pri testovaní databázy: {e}")
    sys.exit(1)

# Test Weather API
print("\n🌤️  Testujem Weather API...")
try:
    weather_service = get_weather_service()
    current_weather = weather_service.get_current_weather()
    
    if current_weather and current_weather.get('condition') != 'unknown':
        print(f"✅ Weather API funguje")
        print(f"   - Podmienky: {current_weather.get('description', 'N/A')}")
        print(f"   - Teplota: {current_weather.get('temperature', 0):.1f}°C")
        print(f"   - Vhodné na inštaláciu: {'Áno' if current_weather.get('suitable_for_installation') else 'Nie'}")
    else:
        print("⚠️  Weather API nefunguje správne")
        print("   - Skontrolujte WEATHER_API_KEY v .env")
except Exception as e:
    print(f"⚠️  Chyba pri testovaní Weather API: {e}")
    print("   - Aplikácia bude fungovať, ale bez počasia")

# Test OpenAI API (simple check)
print("\n🤖 Testujem OpenAI API...")
try:
    from services import get_ai_agent
    ai_agent = get_ai_agent()
    print("✅ OpenAI API je nakonfigurované")
    print("   - AI chat bude fungovať")
except Exception as e:
    print(f"⚠️  Problém s OpenAI API: {e}")
    print("   - Skontrolujte OPENAI_API_KEY v .env")

# Final summary
print("\n" + "="*50)
print("🎉 SETUP TEST DOKONČENÝ")
print("="*50)
print("\n📋 Ďalšie kroky:")
print("1. Spustite server: uvicorn main:app --reload")
print("2. Otvorte frontend: open frontend/index.html")
print("3. Pre Google Calendar: http://localhost:8000/auth/login")
print("4. API dokumentácia: http://localhost:8000/docs")
print("\n✨ Všetko je pripravené na použitie!")


