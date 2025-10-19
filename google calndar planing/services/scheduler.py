"""
Intelligent scheduler for task planning
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models.database import Employee, Task, EmployeeType, TaskType, TaskStatus
from services.google_calendar import get_calendar_service
from services.weather import get_weather_service


class Scheduler:
    """Intelligent task scheduler"""
    
    def __init__(self, db: Session):
        self.db = db
        self.calendar_service = get_calendar_service()
        self.weather_service = get_weather_service()
    
    def find_best_employee(
        self,
        task_type: TaskType,
        start_time: datetime,
        duration_hours: float,
        required_skills: Optional[List[str]] = None
    ) -> Optional[Employee]:
        """
        Find the best available employee for a task
        
        Criteria:
        1. Employee type matches task type
        2. Available in calendar
        3. Not overloaded (weekly hours)
        4. Has required skills (future feature)
        """
        # Determine required employee type
        if task_type == TaskType.INSTALLATION:
            required_types = [EmployeeType.INSTALLER, EmployeeType.BOTH]
        else:  # PRODUCTION
            required_types = [EmployeeType.PRODUCER, EmployeeType.BOTH]
        
        # Get eligible employees
        employees = self.db.query(Employee).filter(
            and_(
                Employee.is_active == True,
                Employee.employee_type.in_(required_types)
            )
        ).all()
        
        if not employees:
            return None
        
        # Score each employee
        scored_employees = []
        end_time = start_time + timedelta(hours=duration_hours)
        
        for employee in employees:
            score = 0
            
            # Check calendar availability
            if employee.google_calendar_id:
                is_available = self.calendar_service.check_availability(
                    employee.google_calendar_id,
                    start_time,
                    end_time
                )
                if not is_available:
                    continue  # Skip if not available
                score += 10
            
            # Check weekly hours
            week_start = start_time - timedelta(days=start_time.weekday())
            week_end = week_start + timedelta(days=7)
            
            weekly_tasks = self.db.query(Task).filter(
                and_(
                    Task.employee_id == employee.id,
                    Task.start_time >= week_start,
                    Task.start_time < week_end,
                    Task.status.in_([TaskStatus.PLANNED, TaskStatus.IN_PROGRESS])
                )
            ).all()
            
            total_hours = sum(task.estimated_hours for task in weekly_tasks)
            available_hours = employee.max_hours_per_week - total_hours
            
            if available_hours < duration_hours:
                continue  # Skip if overloaded
            
            # Prefer employees with more availability
            score += (available_hours / employee.max_hours_per_week) * 5
            
            # Prefer exact type match
            if employee.employee_type != EmployeeType.BOTH:
                score += 2
            
            scored_employees.append((employee, score))
        
        if not scored_employees:
            return None
        
        # Return employee with highest score
        scored_employees.sort(key=lambda x: x[1], reverse=True)
        return scored_employees[0][0]
    
    def suggest_installation_dates(
        self,
        duration_hours: float,
        preferred_date: Optional[datetime] = None,
        days_to_check: int = 14
    ) -> List[Tuple[datetime, Dict]]:
        """
        Suggest dates suitable for installation based on weather
        
        Returns:
            List of (datetime, weather_info) tuples
        """
        start_date = preferred_date or datetime.now()
        
        suitable_days = self.weather_service.find_suitable_installation_days(
            start_date=start_date,
            days_needed=days_to_check
        )
        
        return suitable_days
    
    def create_and_schedule_task(
        self,
        title: str,
        task_type: TaskType,
        start_time: datetime,
        duration_hours: float,
        description: Optional[str] = None,
        location: Optional[str] = None,
        employee_id: Optional[int] = None,
        weather_dependent: bool = True,
        priority: int = 3
    ) -> Tuple[Optional[Task], str]:
        """
        Create a task and schedule it with an employee
        
        Returns:
            (Task, message) tuple
        """
        # Check weather suitability for installations
        if task_type == TaskType.INSTALLATION and weather_dependent:
            recommendation = self.weather_service.get_recommendation(start_time)
            if recommendation != 'installation':
                return None, f"Počasie dňa {start_time.strftime('%Y-%m-%d')} nie je vhodné na inštaláciu."
        
        # Find employee if not specified
        if employee_id:
            employee = self.db.query(Employee).filter(Employee.id == employee_id).first()
            if not employee:
                return None, "Zamestnanec nebol nájdený."
        else:
            employee = self.find_best_employee(
                task_type=task_type,
                start_time=start_time,
                duration_hours=duration_hours
            )
            if not employee:
                return None, "Nie je dostupný žiadny vhodný zamestnanec."
        
        # Create task
        end_time = start_time + timedelta(hours=duration_hours)
        task = Task(
            title=title,
            description=description,
            task_type=task_type,
            status=TaskStatus.PLANNED,
            start_time=start_time,
            end_time=end_time,
            estimated_hours=duration_hours,
            employee_id=employee.id,
            location=location,
            weather_dependent=weather_dependent,
            priority=priority
        )
        
        self.db.add(task)
        self.db.flush()  # Get task ID
        
        # Create calendar event
        if employee.google_calendar_id:
            event_description = description or ""
            event_description += f"\n\nTyp: {task_type.value}"
            event_description += f"\nPriradené: {employee.name}"
            
            event_id = self.calendar_service.create_event(
                calendar_id=employee.google_calendar_id,
                summary=title,
                description=event_description,
                start_time=start_time,
                end_time=end_time,
                location=location
            )
            
            if event_id:
                task.google_event_id = event_id
        
        self.db.commit()
        
        return task, f"Úloha '{title}' bola naplánovaná pre {employee.name} na {start_time.strftime('%Y-%m-%d %H:%M')}."
    
    def get_employee_workload(
        self,
        employee_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> Dict:
        """
        Get employee workload statistics
        
        Returns:
            Dict with hours scheduled, available, and tasks
        """
        employee = self.db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            return None
        
        tasks = self.db.query(Task).filter(
            and_(
                Task.employee_id == employee_id,
                Task.start_time >= start_date,
                Task.start_time < end_date,
                Task.status.in_([TaskStatus.PLANNED, TaskStatus.IN_PROGRESS])
            )
        ).all()
        
        total_hours = sum(task.estimated_hours for task in tasks)
        
        # Calculate weeks in period
        days = (end_date - start_date).days
        weeks = days / 7
        max_hours = employee.max_hours_per_week * weeks
        
        return {
            'employee': employee,
            'total_hours_scheduled': total_hours,
            'max_hours': max_hours,
            'available_hours': max_hours - total_hours,
            'tasks': tasks,
            'utilization_percent': (total_hours / max_hours * 100) if max_hours > 0 else 0
        }
    
    def get_all_employees_availability(
        self,
        date: datetime
    ) -> List[Dict]:
        """
        Get availability for all employees on a specific date
        
        Returns:
            List of dicts with employee and their free slots
        """
        employees = self.db.query(Employee).filter(Employee.is_active == True).all()
        availability = []
        
        for employee in employees:
            if employee.google_calendar_id:
                free_slots = self.calendar_service.get_free_slots(
                    calendar_id=employee.google_calendar_id,
                    date=date
                )
            else:
                # Default 8-hour workday if no calendar
                free_slots = [{
                    'start': date.replace(hour=8, minute=0),
                    'end': date.replace(hour=17, minute=0)
                }]
            
            # Get weekly hours
            week_start = date - timedelta(days=date.weekday())
            week_end = week_start + timedelta(days=7)
            workload = self.get_employee_workload(employee.id, week_start, week_end)
            
            availability.append({
                'employee': employee,
                'free_slots': free_slots,
                'available_hours': workload['available_hours'],
                'utilization_percent': workload['utilization_percent']
            })
        
        return availability
    
    def optimize_schedule(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict:
        """
        Optimize schedule based on weather and employee availability
        
        This is a placeholder for more advanced optimization logic
        """
        # Get weather forecast
        forecast = self.weather_service.get_forecast(days=14)
        
        # Get unassigned tasks
        unassigned_tasks = self.db.query(Task).filter(
            and_(
                Task.employee_id == None,
                Task.start_time >= start_date,
                Task.start_time < end_date,
                Task.status == TaskStatus.PLANNED
            )
        ).all()
        
        assigned = 0
        failed = 0
        
        for task in unassigned_tasks:
            employee = self.find_best_employee(
                task_type=task.task_type,
                start_time=task.start_time,
                duration_hours=task.estimated_hours
            )
            
            if employee:
                task.employee_id = employee.id
                assigned += 1
            else:
                failed += 1
        
        self.db.commit()
        
        return {
            'assigned': assigned,
            'failed': failed,
            'message': f"Priradených: {assigned}, Nepodarilo sa: {failed}"
        }


