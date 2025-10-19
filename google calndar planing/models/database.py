"""
Database models for production planner
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()


class EmployeeType(str, enum.Enum):
    """Typ zamestnanca"""
    INSTALLER = "installer"  # Inštalátor
    PRODUCER = "producer"    # Výrobca
    BOTH = "both"           # Oboje


class TaskType(str, enum.Enum):
    """Typ úlohy"""
    INSTALLATION = "installation"  # Inštalácia
    PRODUCTION = "production"      # Výroba


class TaskStatus(str, enum.Enum):
    """Stav úlohy"""
    PLANNED = "planned"       # Naplánované
    IN_PROGRESS = "in_progress"  # Prebieha
    COMPLETED = "completed"   # Dokončené
    CANCELLED = "cancelled"   # Zrušené


class Employee(Base):
    """Model zamestnanca"""
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    employee_type = Column(Enum(EmployeeType), nullable=False)
    google_calendar_id = Column(String, unique=True, nullable=True)
    max_hours_per_week = Column(Float, default=40.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tasks = relationship("Task", back_populates="employee")

    def __repr__(self):
        return f"<Employee {self.name} ({self.employee_type})>"


class Task(Base):
    """Model úlohy"""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    task_type = Column(Enum(TaskType), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.PLANNED)
    
    # Časové údaje
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    estimated_hours = Column(Float, nullable=False)
    
    # Priradenie
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    # Google Calendar
    google_event_id = Column(String, nullable=True)
    
    # Metadata
    location = Column(String, nullable=True)
    weather_dependent = Column(Boolean, default=False)
    priority = Column(Integer, default=1)  # 1=low, 5=high
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="tasks")

    def __repr__(self):
        return f"<Task {self.title} ({self.task_type})>"


class WeatherLog(Base):
    """Log počasia pre historické účely"""
    __tablename__ = "weather_logs"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False)
    condition = Column(String, nullable=False)  # sunny, rainy, cloudy, etc.
    temperature = Column(Float, nullable=True)
    description = Column(String, nullable=True)
    suitable_for_installation = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<WeatherLog {self.date} - {self.condition}>"


