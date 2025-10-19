"""
Pydantic schemas for API validation
"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum


class EmployeeType(str, Enum):
    INSTALLER = "installer"
    PRODUCER = "producer"
    BOTH = "both"


class TaskType(str, Enum):
    INSTALLATION = "installation"
    PRODUCTION = "production"


class TaskStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# Employee Schemas
class EmployeeBase(BaseModel):
    name: str
    email: EmailStr
    employee_type: EmployeeType
    max_hours_per_week: float = 40.0


class EmployeeCreate(EmployeeBase):
    google_calendar_id: Optional[str] = None


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    employee_type: Optional[EmployeeType] = None
    max_hours_per_week: Optional[float] = None
    is_active: Optional[bool] = None


class EmployeeResponse(EmployeeBase):
    id: int
    google_calendar_id: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    task_type: TaskType
    start_time: datetime
    end_time: datetime
    estimated_hours: float
    location: Optional[str] = None
    weather_dependent: bool = False
    priority: int = Field(default=1, ge=1, le=5)


class TaskCreate(TaskBase):
    employee_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    employee_id: Optional[int] = None
    location: Optional[str] = None
    priority: Optional[int] = Field(default=None, ge=1, le=5)


class TaskResponse(TaskBase):
    id: int
    status: TaskStatus
    employee_id: Optional[int]
    google_event_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskWithEmployee(TaskResponse):
    employee: Optional[EmployeeResponse] = None


# Weather Schemas
class WeatherCondition(BaseModel):
    condition: str
    temperature: float
    description: str
    suitable_for_installation: bool


class WeatherForecast(BaseModel):
    date: datetime
    condition: str
    temperature: float
    description: str
    suitable_for_installation: bool


class WeatherResponse(BaseModel):
    current: WeatherCondition
    forecast: List[WeatherForecast]


# Chat Schemas
class ChatMessage(BaseModel):
    message: str
    context: Optional[dict] = None


class ChatResponse(BaseModel):
    response: str
    action_taken: Optional[str] = None
    data: Optional[dict] = None


# Planning Schemas
class PlanningRequest(BaseModel):
    task_type: TaskType
    estimated_hours: float
    title: str
    description: Optional[str] = None
    preferred_date: Optional[datetime] = None
    weather_dependent: bool = True
    priority: int = Field(default=3, ge=1, le=5)


class PlanningResponse(BaseModel):
    success: bool
    message: str
    suggested_dates: List[datetime]
    assigned_employee: Optional[EmployeeResponse] = None
    task: Optional[TaskResponse] = None


# Availability Schemas
class AvailabilityRequest(BaseModel):
    employee_id: Optional[int] = None
    start_date: datetime
    end_date: datetime


class EmployeeAvailability(BaseModel):
    employee: EmployeeResponse
    available_slots: List[dict]
    total_hours_scheduled: float
    available_hours: float


class AvailabilityResponse(BaseModel):
    employees: List[EmployeeAvailability]


