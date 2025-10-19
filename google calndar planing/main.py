"""
Main FastAPI application for Production Planner
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Optional
import os
from dotenv import load_dotenv

from models.database import Base, Employee, Task, WeatherLog
from models.schemas import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse,
    TaskCreate, TaskUpdate, TaskResponse, TaskWithEmployee,
    WeatherResponse, ChatMessage, ChatResponse,
    PlanningRequest, PlanningResponse,
    AvailabilityRequest, AvailabilityResponse
)
from services import get_calendar_service, get_weather_service, get_ai_agent, Scheduler

load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./production_planner.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Production Planner API...")
    yield
    # Shutdown
    print("👋 Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Production Planner API",
    description="AI-powered production and installation planning system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "message": "Production Planner API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


# ==================== AUTH ENDPOINTS ====================

@app.get("/auth/login")
async def google_auth_login():
    """Initiate Google Calendar OAuth flow"""
    try:
        calendar_service = get_calendar_service()
        return {
            "message": "Please check your browser for Google authentication",
            "status": "authenticated" if calendar_service.service else "pending"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== EMPLOYEE ENDPOINTS ====================

@app.get("/employees", response_model=List[EmployeeResponse])
async def get_employees(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all employees"""
    query = db.query(Employee)
    if is_active is not None:
        query = query.filter(Employee.is_active == is_active)
    employees = query.offset(skip).limit(limit).all()
    return employees


@app.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db)
):
    """Create a new employee"""
    # Check if email already exists
    existing = db.query(Employee).filter(Employee.email == employee.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create Google Calendar if not provided
    calendar_service = get_calendar_service()
    calendar_id = employee.google_calendar_id
    
    if not calendar_id:
        calendar_id = calendar_service.get_calendar_id(f"Kalendár - {employee.name}")
    
    db_employee = Employee(
        name=employee.name,
        email=employee.email,
        employee_type=employee.employee_type,
        google_calendar_id=calendar_id,
        max_hours_per_week=employee.max_hours_per_week
    )
    
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    
    return db_employee


@app.get("/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: int, db: Session = Depends(get_db)):
    """Get employee by ID"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@app.put("/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: int,
    employee_update: EmployeeUpdate,
    db: Session = Depends(get_db)
):
    """Update employee"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    update_data = employee_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)
    
    db.commit()
    db.refresh(employee)
    return employee


@app.delete("/employees/{employee_id}")
async def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    """Delete (deactivate) employee"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    employee.is_active = False
    db.commit()
    return {"message": "Employee deactivated"}


# ==================== TASK ENDPOINTS ====================

@app.get("/tasks", response_model=List[TaskWithEmployee])
async def get_tasks(
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[int] = None,
    task_type: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Get all tasks with filters"""
    query = db.query(Task)
    
    if employee_id:
        query = query.filter(Task.employee_id == employee_id)
    if task_type:
        query = query.filter(Task.task_type == task_type)
    if status:
        query = query.filter(Task.status == status)
    if start_date:
        query = query.filter(Task.start_time >= start_date)
    if end_date:
        query = query.filter(Task.start_time <= end_date)
    
    tasks = query.offset(skip).limit(limit).all()
    return tasks


@app.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db)
):
    """Create a new task"""
    scheduler = Scheduler(db)
    
    db_task, message = scheduler.create_and_schedule_task(
        title=task.title,
        task_type=task.task_type,
        start_time=task.start_time,
        duration_hours=task.estimated_hours,
        description=task.description,
        location=task.location,
        employee_id=task.employee_id,
        weather_dependent=task.weather_dependent,
        priority=task.priority
    )
    
    if not db_task:
        raise HTTPException(status_code=400, detail=message)
    
    return db_task


@app.get("/tasks/{task_id}", response_model=TaskWithEmployee)
async def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get task by ID"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db)
):
    """Update task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    # Update Google Calendar event if needed
    if task.google_event_id and task.employee:
        calendar_service = get_calendar_service()
        calendar_service.update_event(
            calendar_id=task.employee.google_calendar_id,
            event_id=task.google_event_id,
            summary=task.title,
            description=task.description,
            start_time=task.start_time,
            end_time=task.end_time,
            location=task.location
        )
    
    db.commit()
    db.refresh(task)
    return task


@app.delete("/tasks/{task_id}")
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Delete from Google Calendar
    if task.google_event_id and task.employee:
        calendar_service = get_calendar_service()
        calendar_service.delete_event(
            calendar_id=task.employee.google_calendar_id,
            event_id=task.google_event_id
        )
    
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}


# ==================== WEATHER ENDPOINTS ====================

@app.get("/weather")
async def get_current_weather():
    """Get current weather"""
    weather_service = get_weather_service()
    current = weather_service.get_current_weather()
    return current


@app.get("/weather/forecast")
async def get_weather_forecast(days: int = 7):
    """Get weather forecast"""
    weather_service = get_weather_service()
    forecast = weather_service.get_forecast(days=days)
    return {"forecast": forecast}


@app.get("/weather/recommendation")
async def get_weather_recommendation(date: Optional[datetime] = None):
    """Get work recommendation based on weather"""
    weather_service = get_weather_service()
    recommendation = weather_service.get_recommendation(date)
    return {
        "date": date or datetime.now(),
        "recommendation": recommendation,
        "message": f"Odporúčanie: {'Inštalácia' if recommendation == 'installation' else 'Výroba'}"
    }


# ==================== AI CHAT ENDPOINTS ====================

@app.post("/chat", response_model=ChatResponse)
async def chat(
    message: ChatMessage,
    db: Session = Depends(get_db)
):
    """Chat with AI agent"""
    ai_agent = get_ai_agent()
    
    # Prepare context
    context = message.context or {}
    
    if 'employees' not in context:
        employees = db.query(Employee).filter(Employee.is_active == True).all()
        context['employees'] = [
            {"id": e.id, "name": e.name, "employee_type": e.employee_type.value}
            for e in employees
        ]
    
    if 'weather' not in context:
        weather_service = get_weather_service()
        context['weather'] = weather_service.get_current_weather()
    
    if 'tasks' not in context:
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        week_later = today + timedelta(days=7)
        tasks = db.query(Task).filter(
            Task.start_time >= today,
            Task.start_time <= week_later
        ).all()
        context['tasks'] = [{"id": t.id, "title": t.title} for t in tasks]
    
    # Get AI response
    response = ai_agent.chat(message.message, context)
    
    # Execute action if requested
    action_result = None
    if response.get('action_type') == 'create_task':
        params = response['parameters']
        scheduler = Scheduler(db)
        
        # Find employee by name if provided
        employee_id = None
        if params.get('employee_name'):
            employee = db.query(Employee).filter(
                Employee.name.ilike(f"%{params['employee_name']}%")
            ).first()
            if employee:
                employee_id = employee.id
        
        # Parse date
        start_time = datetime.fromisoformat(params.get('start_date', datetime.now().isoformat()))
        hours = params.get('hours', 8.0)
        
        task, msg = scheduler.create_and_schedule_task(
            title=params['title'],
            task_type=params['task_type'],
            start_time=start_time,
            duration_hours=hours,
            description=params.get('description'),
            employee_id=employee_id
        )
        
        action_result = {"task_id": task.id if task else None, "message": msg}
    
    return ChatResponse(
        response=response['response'],
        action_taken=response.get('action_type'),
        data=action_result
    )


# ==================== PLANNING ENDPOINTS ====================

@app.post("/planning/suggest", response_model=PlanningResponse)
async def suggest_planning(
    request: PlanningRequest,
    db: Session = Depends(get_db)
):
    """Get intelligent planning suggestions"""
    scheduler = Scheduler(db)
    weather_service = get_weather_service()
    
    # Get weather forecast
    forecast = weather_service.get_forecast(days=14)
    
    # Find suitable dates
    suggested_dates = []
    if request.task_type.value == "installation":
        suitable_days = scheduler.suggest_installation_dates(
            duration_hours=request.estimated_hours,
            preferred_date=request.preferred_date or datetime.now()
        )
        suggested_dates = [day[0] for day in suitable_days[:5]]
    else:
        # For production, any day works
        start = request.preferred_date or datetime.now()
        suggested_dates = [start + timedelta(days=i) for i in range(5)]
    
    # Find best employee
    if suggested_dates:
        best_date = suggested_dates[0]
        employee = scheduler.find_best_employee(
            task_type=request.task_type,
            start_time=best_date,
            duration_hours=request.estimated_hours
        )
    else:
        employee = None
        best_date = None
    
    return PlanningResponse(
        success=len(suggested_dates) > 0,
        message=f"Našiel som {len(suggested_dates)} vhodných termínov" if suggested_dates else "Nenašiel som vhodné termíny",
        suggested_dates=suggested_dates,
        assigned_employee=employee,
        task=None
    )


@app.get("/planning/availability")
async def get_availability(
    date: datetime,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get employee availability for a specific date"""
    scheduler = Scheduler(db)
    
    if employee_id:
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        week_start = date - timedelta(days=date.weekday())
        week_end = week_start + timedelta(days=7)
        workload = scheduler.get_employee_workload(employee_id, week_start, week_end)
        
        calendar_service = get_calendar_service()
        free_slots = []
        if employee.google_calendar_id:
            free_slots = calendar_service.get_free_slots(
                calendar_id=employee.google_calendar_id,
                date=date
            )
        
        return {
            "employee": employee,
            "date": date,
            "free_slots": free_slots,
            "workload": workload
        }
    else:
        availability = scheduler.get_all_employees_availability(date)
        return {"date": date, "employees": availability}


@app.post("/planning/optimize")
async def optimize_schedule(
    start_date: datetime,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Optimize schedule for a date range"""
    if not end_date:
        end_date = start_date + timedelta(days=7)
    
    scheduler = Scheduler(db)
    result = scheduler.optimize_schedule(start_date, end_date)
    
    return result


# ==================== CALENDAR MANAGEMENT ENDPOINTS ====================

@app.get("/calendars/list")
async def list_calendars():
    """List all available Google Calendars"""
    try:
        calendar_service = get_calendar_service()
        
        if not calendar_service.service:
            raise HTTPException(
                status_code=503,
                detail="Calendar service not authenticated. Please authenticate first at /auth/login"
            )
        
        calendar_list = calendar_service.service.calendarList().list().execute()
        calendars = calendar_list.get('items', [])
        
        # Format calendar data
        calendar_data = []
        for cal in calendars:
            calendar_data.append({
                "id": cal['id'],
                "name": cal.get('summary', 'Unnamed'),
                "description": cal.get('description', ''),
                "timezone": cal.get('timeZone', 'UTC'),
                "access_role": cal.get('accessRole', 'reader'),
                "is_primary": cal.get('primary', False),
                "color": cal.get('backgroundColor', '#039BE5')
            })
        
        return {
            "total": len(calendar_data),
            "calendars": calendar_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch calendars: {str(e)}")


@app.post("/employees/{employee_id}/link-calendar")
async def link_employee_calendar(
    employee_id: int,
    calendar_id: str,
    db: Session = Depends(get_db)
):
    """Link a Google Calendar to an employee"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Store calendar_id in employee record
    employee.google_calendar_id = calendar_id
    db.commit()
    db.refresh(employee)
    
    return {
        "message": f"Calendar linked to {employee.name}",
        "employee_id": employee_id,
        "calendar_id": calendar_id
    }


# ==================== STATISTICS ENDPOINTS ====================

@app.get("/stats/overview")
async def get_stats_overview(db: Session = Depends(get_db)):
    """Get overview statistics"""
    total_employees = db.query(Employee).filter(Employee.is_active == True).count()
    total_tasks = db.query(Task).count()
    
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    week_later = today + timedelta(days=7)
    
    upcoming_tasks = db.query(Task).filter(
        Task.start_time >= today,
        Task.start_time <= week_later
    ).count()
    
    return {
        "total_employees": total_employees,
        "total_tasks": total_tasks,
        "upcoming_tasks": upcoming_tasks,
        "system_status": "operational"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


