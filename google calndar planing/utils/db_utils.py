"""
Utility scripts for Production Planner
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.database import Base, Employee, Task, WeatherLog
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./production_planner.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def reset_database():
    """Reset database - DELETE ALL DATA"""
    print("⚠️  WARNING: This will delete ALL data!")
    response = input("Are you sure? Type 'yes' to confirm: ")
    
    if response.lower() != 'yes':
        print("Cancelled.")
        return
    
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating fresh tables...")
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database reset complete!")


def backup_database():
    """Backup SQLite database"""
    if "sqlite" not in DATABASE_URL:
        print("⚠️  Backup only works for SQLite databases")
        return
    
    db_file = DATABASE_URL.replace("sqlite:///./", "")
    
    if not os.path.exists(db_file):
        print(f"❌ Database file not found: {db_file}")
        return
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"backup_{timestamp}_{db_file}"
    
    import shutil
    shutil.copy2(db_file, backup_file)
    
    print(f"✅ Database backed up to: {backup_file}")


def export_to_csv():
    """Export all data to CSV files"""
    import csv
    
    db = SessionLocal()
    
    # Export employees
    employees = db.query(Employee).all()
    with open('export_employees.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['ID', 'Name', 'Email', 'Type', 'Max Hours/Week', 'Active'])
        for emp in employees:
            writer.writerow([
                emp.id, emp.name, emp.email, emp.employee_type.value,
                emp.max_hours_per_week, emp.is_active
            ])
    print(f"✅ Exported {len(employees)} employees to export_employees.csv")
    
    # Export tasks
    tasks = db.query(Task).all()
    with open('export_tasks.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['ID', 'Title', 'Type', 'Status', 'Start', 'Hours', 'Employee', 'Location'])
        for task in tasks:
            writer.writerow([
                task.id, task.title, task.task_type.value, task.status.value,
                task.start_time, task.estimated_hours,
                task.employee.name if task.employee else 'N/A',
                task.location or 'N/A'
            ])
    print(f"✅ Exported {len(tasks)} tasks to export_tasks.csv")
    
    db.close()


def show_statistics():
    """Show database statistics"""
    db = SessionLocal()
    
    total_employees = db.query(Employee).count()
    active_employees = db.query(Employee).filter(Employee.is_active == True).count()
    
    total_tasks = db.query(Task).count()
    
    from models.database import TaskStatus
    planned_tasks = db.query(Task).filter(Task.status == TaskStatus.PLANNED).count()
    in_progress_tasks = db.query(Task).filter(Task.status == TaskStatus.IN_PROGRESS).count()
    completed_tasks = db.query(Task).filter(Task.status == TaskStatus.COMPLETED).count()
    
    print("\n" + "="*50)
    print("📊 DATABASE STATISTICS")
    print("="*50)
    print(f"\n👥 Employees:")
    print(f"   Total: {total_employees}")
    print(f"   Active: {active_employees}")
    
    print(f"\n✅ Tasks:")
    print(f"   Total: {total_tasks}")
    print(f"   Planned: {planned_tasks}")
    print(f"   In Progress: {in_progress_tasks}")
    print(f"   Completed: {completed_tasks}")
    
    # Tasks by type
    from models.database import TaskType
    installations = db.query(Task).filter(Task.task_type == TaskType.INSTALLATION).count()
    productions = db.query(Task).filter(Task.task_type == TaskType.PRODUCTION).count()
    
    print(f"\n📦 Tasks by type:")
    print(f"   Installations: {installations}")
    print(f"   Productions: {productions}")
    
    # Upcoming tasks
    now = datetime.now()
    week_later = now + timedelta(days=7)
    upcoming = db.query(Task).filter(
        Task.start_time >= now,
        Task.start_time <= week_later
    ).count()
    
    print(f"\n📅 Upcoming (next 7 days): {upcoming}")
    
    db.close()


def clean_old_tasks():
    """Delete completed tasks older than 90 days"""
    db = SessionLocal()
    
    cutoff_date = datetime.now() - timedelta(days=90)
    
    from models.database import TaskStatus
    old_tasks = db.query(Task).filter(
        Task.status == TaskStatus.COMPLETED,
        Task.end_time < cutoff_date
    ).all()
    
    count = len(old_tasks)
    
    if count == 0:
        print("No old tasks to clean.")
        db.close()
        return
    
    print(f"Found {count} completed tasks older than 90 days.")
    response = input("Delete them? (yes/no): ")
    
    if response.lower() == 'yes':
        for task in old_tasks:
            db.delete(task)
        db.commit()
        print(f"✅ Deleted {count} old tasks")
    else:
        print("Cancelled.")
    
    db.close()


def main():
    """Main menu"""
    print("\n" + "="*50)
    print("🛠️  Production Planner - Utility Tools")
    print("="*50)
    print("\n1. Show statistics")
    print("2. Backup database")
    print("3. Export to CSV")
    print("4. Clean old tasks (>90 days)")
    print("5. Reset database (⚠️  DELETES ALL DATA)")
    print("0. Exit")
    
    choice = input("\nSelect option: ")
    
    if choice == "1":
        show_statistics()
    elif choice == "2":
        backup_database()
    elif choice == "3":
        export_to_csv()
    elif choice == "4":
        clean_old_tasks()
    elif choice == "5":
        reset_database()
    elif choice == "0":
        print("Goodbye!")
        return
    else:
        print("Invalid option")
    
    # Ask if want to continue
    print("\n" + "-"*50)
    response = input("Continue? (y/n): ")
    if response.lower() == 'y':
        main()


if __name__ == "__main__":
    main()


