"""
Google Calendar API integration
"""
import os
import pickle
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import pytz

# Scopes required for calendar access
SCOPES = ['https://www.googleapis.com/auth/calendar']


class GoogleCalendarService:
    """Service for managing Google Calendar operations"""
    
    def __init__(self):
        self.creds = None
        self.service = None
        self._initialize_credentials()
    
    def _initialize_credentials(self):
        """Initialize Google Calendar credentials"""
        # Token file stores the user's access and refresh tokens
        if os.path.exists('token.pickle'):
            with open('token.pickle', 'rb') as token:
                self.creds = pickle.load(token)
        
        # If there are no valid credentials available, let the user log in
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())
            else:
                if os.path.exists('credentials.json'):
                    flow = InstalledAppFlow.from_client_secrets_file(
                        'credentials.json', SCOPES)
                    self.creds = flow.run_local_server(port=0)
                else:
                    raise FileNotFoundError(
                        "credentials.json not found. Please download it from Google Cloud Console."
                    )
            
            # Save the credentials for the next run
            with open('token.pickle', 'wb') as token:
                pickle.dump(self.creds, token)
        
        self.service = build('calendar', 'v3', credentials=self.creds)
    
    def get_calendar_id(self, calendar_name: str) -> Optional[str]:
        """Get calendar ID by name, create if doesn't exist"""
        try:
            # List all calendars
            calendar_list = self.service.calendarList().list().execute()
            
            for calendar in calendar_list.get('items', []):
                if calendar['summary'] == calendar_name:
                    return calendar['id']
            
            # Create new calendar if not found
            calendar = {
                'summary': calendar_name,
                'timeZone': 'Europe/Bratislava'
            }
            created_calendar = self.service.calendars().insert(body=calendar).execute()
            return created_calendar['id']
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return None
    
    def create_event(
        self,
        calendar_id: str,
        summary: str,
        description: str,
        start_time: datetime,
        end_time: datetime,
        location: Optional[str] = None,
        attendees: Optional[List[str]] = None
    ) -> Optional[str]:
        """Create a new calendar event"""
        try:
            # Ensure datetime objects are timezone-aware
            timezone = pytz.timezone('Europe/Bratislava')
            if start_time.tzinfo is None:
                start_time = timezone.localize(start_time)
            if end_time.tzinfo is None:
                end_time = timezone.localize(end_time)
            
            event = {
                'summary': summary,
                'description': description,
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': 'Europe/Bratislava',
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': 'Europe/Bratislava',
                },
            }
            
            if location:
                event['location'] = location
            
            if attendees:
                event['attendees'] = [{'email': email} for email in attendees]
            
            created_event = self.service.events().insert(
                calendarId=calendar_id,
                body=event
            ).execute()
            
            return created_event.get('id')
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return None
    
    def update_event(
        self,
        calendar_id: str,
        event_id: str,
        summary: Optional[str] = None,
        description: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        location: Optional[str] = None
    ) -> bool:
        """Update an existing calendar event"""
        try:
            # Get existing event
            event = self.service.events().get(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            
            # Update fields if provided
            if summary:
                event['summary'] = summary
            if description:
                event['description'] = description
            if location:
                event['location'] = location
            
            if start_time:
                timezone = pytz.timezone('Europe/Bratislava')
                if start_time.tzinfo is None:
                    start_time = timezone.localize(start_time)
                event['start'] = {
                    'dateTime': start_time.isoformat(),
                    'timeZone': 'Europe/Bratislava',
                }
            
            if end_time:
                timezone = pytz.timezone('Europe/Bratislava')
                if end_time.tzinfo is None:
                    end_time = timezone.localize(end_time)
                event['end'] = {
                    'dateTime': end_time.isoformat(),
                    'timeZone': 'Europe/Bratislava',
                }
            
            self.service.events().update(
                calendarId=calendar_id,
                eventId=event_id,
                body=event
            ).execute()
            
            return True
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return False
    
    def delete_event(self, calendar_id: str, event_id: str) -> bool:
        """Delete a calendar event"""
        try:
            self.service.events().delete(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            return True
        except HttpError as error:
            print(f"An error occurred: {error}")
            return False
    
    def get_events(
        self,
        calendar_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        max_results: int = 100
    ) -> List[Dict]:
        """Get events from calendar within date range"""
        try:
            if not start_date:
                start_date = datetime.utcnow()
            if not end_date:
                end_date = start_date + timedelta(days=30)
            
            # Ensure timezone awareness
            timezone = pytz.timezone('Europe/Bratislava')
            if start_date.tzinfo is None:
                start_date = timezone.localize(start_date)
            if end_date.tzinfo is None:
                end_date = timezone.localize(end_date)
            
            events_result = self.service.events().list(
                calendarId=calendar_id,
                timeMin=start_date.isoformat(),
                timeMax=end_date.isoformat(),
                maxResults=max_results,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            return events_result.get('items', [])
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return []
    
    def check_availability(
        self,
        calendar_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> bool:
        """Check if a time slot is available (no conflicting events)"""
        events = self.get_events(calendar_id, start_time, end_time)
        return len(events) == 0
    
    def get_free_slots(
        self,
        calendar_id: str,
        date: datetime,
        working_hours_start: int = 8,
        working_hours_end: int = 17,
        slot_duration_hours: float = 1.0
    ) -> List[Dict[str, datetime]]:
        """Get available time slots for a given date"""
        timezone = pytz.timezone('Europe/Bratislava')
        
        # Set working hours
        day_start = date.replace(hour=working_hours_start, minute=0, second=0, microsecond=0)
        day_end = date.replace(hour=working_hours_end, minute=0, second=0, microsecond=0)
        
        if day_start.tzinfo is None:
            day_start = timezone.localize(day_start)
        if day_end.tzinfo is None:
            day_end = timezone.localize(day_end)
        
        # Get existing events
        events = self.get_events(calendar_id, day_start, day_end)
        
        # Generate potential slots
        free_slots = []
        current_time = day_start
        slot_delta = timedelta(hours=slot_duration_hours)
        
        while current_time + slot_delta <= day_end:
            slot_end = current_time + slot_delta
            
            # Check if slot conflicts with any event
            is_free = True
            for event in events:
                event_start = datetime.fromisoformat(event['start'].get('dateTime', event['start'].get('date')))
                event_end = datetime.fromisoformat(event['end'].get('dateTime', event['end'].get('date')))
                
                # Check for overlap
                if (current_time < event_end and slot_end > event_start):
                    is_free = False
                    break
            
            if is_free:
                free_slots.append({
                    'start': current_time,
                    'end': slot_end
                })
            
            current_time += timedelta(hours=0.5)  # Check every 30 minutes
        
        return free_slots


# Singleton instance
_calendar_service = None


def get_calendar_service() -> GoogleCalendarService:
    """Get or create Google Calendar service instance"""
    global _calendar_service
    if _calendar_service is None:
        _calendar_service = GoogleCalendarService()
    return _calendar_service


