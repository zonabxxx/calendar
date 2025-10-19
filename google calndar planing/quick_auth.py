"""
Quick Calendar Authorization
"""
import os
import pickle
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/calendar']

if os.path.exists('token.pickle'):
    with open('token.pickle', 'rb') as token:
        creds = pickle.load(token)
    
    if creds and creds.valid:
        service = build('calendar', 'v3', credentials=creds)
        calendars = service.calendarList().list().execute().get('items', [])
        print(f"✅ Už ste prihlásení! {len(calendars)} kalendárov.")
        exit(0)

print("🔓 Otváram prehliadač pre prihlásenie...")
flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
creds = flow.run_local_server(port=0)

with open('token.pickle', 'wb') as token:
    pickle.dump(creds, token)

service = build('calendar', 'v3', credentials=creds)
calendars = service.calendarList().list().execute().get('items', [])

print(f"\n✅ Úspešne pripojených {len(calendars)} kalendárov!")
for cal in calendars:
    print(f"  • {cal.get('summary', 'Unnamed')}")

