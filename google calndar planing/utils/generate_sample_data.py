"""
Sample data generator for Production Planner
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.database import Base, Employee, Task, EmployeeType, TaskType, TaskStatus
from dotenv import load_dotenv
import random

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./production_planner.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def generate_sample_data():
    """Generate comprehensive sample data"""
    
    db = SessionLocal()
    
    print("🎲 Generating sample data...")
    
    # Sample employees
    employees_data = [
        {"name": "Ján Nový", "email": "jan.novy@firma.sk", "type": EmployeeType.BOTH},
        {"name": "Peter Inštalátor", "email": "peter.instalator@firma.sk", "type": EmployeeType.INSTALLER},
        {"name": "Mária Výrobná", "email": "maria.vyrobna@firma.sk", "type": EmployeeType.PRODUCER},
        {"name": "Lucia Všestranná", "email": "lucia.vsestranna@firma.sk", "type": EmployeeType.BOTH},
        {"name": "Martin Technik", "email": "martin.technik@firma.sk", "type": EmployeeType.INSTALLER},
        {"name": "Eva Majsterka", "email": "eva.majsterka@firma.sk", "type": EmployeeType.PRODUCER},
    ]
    
    employees = []
    for emp_data in employees_data:
        employee = Employee(
            name=emp_data["name"],
            email=emp_data["email"],
            employee_type=emp_data["type"],
            max_hours_per_week=40.0,
            is_active=True
        )
        db.add(employee)
        employees.append(employee)
    
    db.commit()
    print(f"✅ Created {len(employees)} employees")
    
    # Sample tasks for next 2 weeks
    task_templates = [
        {"title": "Inštalácia solárnych panelov - Rodinný dom Bratislava", "type": TaskType.INSTALLATION, "hours": 8, "location": "Bratislava"},
        {"title": "Montáž fotovoltaiky - Administratívna budova", "type": TaskType.INSTALLATION, "hours": 16, "location": "Trnava"},
        {"title": "Výroba nosných konštrukcií", "type": TaskType.PRODUCTION, "hours": 6, "location": "Továreň"},
        {"title": "Príprava rámov pre panely", "type": TaskType.PRODUCTION, "hours": 4, "location": "Továreň"},
        {"title": "Inštalácia domácej elektrárne", "type": TaskType.INSTALLATION, "hours": 12, "location": "Žilina"},
        {"title": "Servisná kontrola inštalácie", "type": TaskType.INSTALLATION, "hours": 3, "location": "Košice"},
        {"title": "Výroba špeciálnych držiakov", "type": TaskType.PRODUCTION, "hours": 8, "location": "Továreň"},
        {"title": "Montáž solárnych kolektorov", "type": TaskType.INSTALLATION, "hours": 6, "location": "Nitra"},
    ]
    
    # Create tasks for next 14 days
    base_date = datetime.now().replace(hour=8, minute=0, second=0, microsecond=0)
    
    tasks_created = 0
    for day in range(14):
        current_date = base_date + timedelta(days=day)
        
        # Skip weekends
        if current_date.weekday() >= 5:
            continue
        
        # Create 1-3 tasks per day
        num_tasks = random.randint(1, 3)
        
        for _ in range(num_tasks):
            template = random.choice(task_templates)
            
            # Find suitable employee
            suitable_employees = [
                emp for emp in employees
                if emp.employee_type == EmployeeType.BOTH or
                (emp.employee_type == EmployeeType.INSTALLER and template["type"] == TaskType.INSTALLATION) or
                (emp.employee_type == EmployeeType.PRODUCER and template["type"] == TaskType.PRODUCTION)
            ]
            
            if not suitable_employees:
                continue
            
            employee = random.choice(suitable_employees)
            
            # Random start time during work hours
            start_hour = random.choice([8, 9, 10, 13, 14])
            start_time = current_date.replace(hour=start_hour)
            end_time = start_time + timedelta(hours=template["hours"])
            
            # Random status based on date
            if current_date < datetime.now():
                status = random.choice([TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS])
            else:
                status = TaskStatus.PLANNED
            
            task = Task(
                title=template["title"],
                description=f"Ukážková úloha - {template['title']}",
                task_type=template["type"],
                status=status,
                start_time=start_time,
                end_time=end_time,
                estimated_hours=template["hours"],
                employee_id=employee.id,
                location=template["location"],
                weather_dependent=template["type"] == TaskType.INSTALLATION,
                priority=random.randint(1, 5)
            )
            
            db.add(task)
            tasks_created += 1
    
    db.commit()
    print(f"✅ Created {tasks_created} tasks")
    
    # Add some unassigned tasks for testing auto-assignment
    unassigned_tasks = [
        {"title": "Urgent - Nová inštalácia potrebuje priradenie", "type": TaskType.INSTALLATION, "hours": 8},
        {"title": "Výroba pre projekt XYZ", "type": TaskType.PRODUCTION, "hours": 6},
    ]
    
    for task_data in unassigned_tasks:
        future_date = datetime.now() + timedelta(days=random.randint(7, 14))
        future_date = future_date.replace(hour=8, minute=0, second=0, microsecond=0)
        
        task = Task(
            title=task_data["title"],
            description="Nepriradená úloha čakajúca na optimalizáciu",
            task_type=task_data["type"],
            status=TaskStatus.PLANNED,
            start_time=future_date,
            end_time=future_date + timedelta(hours=task_data["hours"]),
            estimated_hours=task_data["hours"],
            employee_id=None,
            weather_dependent=task_data["type"] == TaskType.INSTALLATION,
            priority=5
        )
        db.add(task)
    
    db.commit()
    print(f"✅ Created {len(unassigned_tasks)} unassigned tasks")
    
    db.close()
    
    print("\n" + "="*50)
    print("🎉 Sample data generated successfully!")
    print("="*50)
    print(f"\n📊 Summary:")
    print(f"   - Employees: {len(employees)}")
    print(f"   - Tasks: {tasks_created + len(unassigned_tasks)}")
    print(f"   - Unassigned: {len(unassigned_tasks)}")
    print(f"\n💡 Try running the optimizer:")
    print(f"   curl -X POST 'http://localhost:8000/planning/optimize?start_date={datetime.now().isoformat()}'")


if __name__ == "__main__":
    print("\n⚠️  This will add sample data to your database.")
    response = input("Continue? (yes/no): ")
    
    if response.lower() == 'yes':
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        generate_sample_data()
    else:
        print("Cancelled.")


