"""
Test script to list all Google Calendars
"""
import os
import pickle
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

def get_credentials():
    """Get Google Calendar credentials"""
    creds = None
    
    # Token file stores the user's access and refresh tokens
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    
    # If there are no valid credentials available, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if os.path.exists('credentials.json'):
                flow = InstalledAppFlow.from_client_secrets_file(
                    'credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)
            else:
                raise FileNotFoundError("credentials.json not found!")
        
        # Save the credentials for the next run
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    
    return creds

def list_all_calendars():
    """List all calendars accessible to the user"""
    print("\n🔍 Načítavam zoznam kalendárov...\n")
    
    try:
        creds = get_credentials()
        service = build('calendar', 'v3', credentials=creds)
        
        # Call the Calendar API
        print("=" * 80)
        print("📅 ZOZNAM VŠETKÝCH KALENDÁROV")
        print("=" * 80)
        
        calendar_list = service.calendarList().list().execute()
        calendars = calendar_list.get('items', [])
        
        if not calendars:
            print('❌ Nenašli sa žiadne kalendáre.')
            return
        
        print(f"\n✅ Našlo sa {len(calendars)} kalendárov:\n")
        
        for idx, calendar in enumerate(calendars, 1):
            cal_id = calendar['id']
            cal_name = calendar.get('summary', 'Bez názvu')
            cal_description = calendar.get('description', '')
            cal_timezone = calendar.get('timeZone', 'N/A')
            access_role = calendar.get('accessRole', 'N/A')
            primary = '⭐ HLAVNÝ' if calendar.get('primary', False) else ''
            
            print(f"{idx}. {cal_name} {primary}")
            print(f"   📧 ID: {cal_id}")
            print(f"   🌍 Časové pásmo: {cal_timezone}")
            print(f"   🔐 Prístup: {access_role}")
            if cal_description:
                print(f"   📝 Popis: {cal_description}")
            print()
        
        print("=" * 80)
        print(f"\n✅ Prepojenie s Google Calendar funguje!")
        print(f"✅ Máte prístup k {len(calendars)} kalendárom")
        print("\n💡 Tieto kalendáre môžeme použiť pre plánovanie zamestnancov!")
        print("=" * 80)
        
        # Create a simple mapping file
        print("\n📝 Vytváram mapping súbor...\n")
        
        with open('calendar_mapping.txt', 'w', encoding='utf-8') as f:
            f.write("# MAPPING KALENDÁROV\n")
            f.write("# Formát: Názov kalendára | Calendar ID | Pozícia | Oddelenie\n\n")
            
            for calendar in calendars:
                if not calendar.get('primary', False):  # Skip primary calendar
                    cal_name = calendar.get('summary', 'Bez názvu')
                    cal_id = calendar['id']
                    f.write(f"{cal_name}|{cal_id}|[POZÍCIA]|[ODDELENIE]\n")
        
        print("✅ Súbor 'calendar_mapping.txt' vytvorený!")
        print("   Prosím vyplňte pozície a oddelenia v tomto súbore.")
        
    except Exception as e:
        print(f"\n❌ Chyba pri načítaní kalendárov: {e}")
        print("\n💡 Tip: Možno potrebujete:")
        print("   1. Povoliť Google Calendar API v Cloud Console")
        print("   2. Stiahnuť správny credentials.json")
        print("   3. Autorizovať aplikáciu")

if __name__ == '__main__':
    list_all_calendars()

