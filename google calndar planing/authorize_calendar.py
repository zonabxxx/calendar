"""
Authorize Google Calendar access
"""
import os
import pickle
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/calendar']

print("\n" + "="*80)
print("🔐 AUTORIZÁCIA GOOGLE CALENDAR")
print("="*80)

# Check if already authorized
if os.path.exists('token.pickle'):
    print("\n✅ Token už existuje, skúšam ho obnoviť...")
    with open('token.pickle', 'rb') as token:
        creds = pickle.load(token)
    
    if creds and creds.valid:
        print("✅ Token je platný! Kalendáre sú pripojené.")
        
        # Test connection
        service = build('calendar', 'v3', credentials=creds)
        calendars = service.calendarList().list().execute().get('items', [])
        
        print(f"\n📅 Našlo sa {len(calendars)} kalendárov:")
        for cal in calendars[:10]:
            print(f"  ✓ {cal.get('summary', 'Unnamed')}")
        
        print("\n✅ Prepojenie funguje!")
        exit(0)
    else:
        print("⚠️ Token expiroval, potrebujem nový...")

# Need new authorization
print("\n🔓 Potrebujem autorizáciu...")
print("\n📝 INŠTRUKCIE:")
print("1. Otvorí sa prehliadač s Google prihlásením")
print("2. Prihláste sa do účtu: juraj@adsun.sk")
print("3. Povoľte prístup k kalendárom")
print("4. Po povolení sa okno zatvorí automaticky")
print("\n" + "="*80)

input("\n⏸️  Stlačte ENTER pre pokračovanie...")

flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
creds = flow.run_local_server(port=0)

# Save credentials
with open('token.pickle', 'wb') as token:
    pickle.dump(creds, token)

print("\n✅ Autorizácia úspešná!")
print("✅ Token uložený do token.pickle")

# Test connection
service = build('calendar', 'v3', credentials=creds)
calendars = service.calendarList().list().execute().get('items', [])

print(f"\n📅 Našlo sa {len(calendars)} kalendárov:")
for cal in calendars:
    print(f"  ✓ {cal.get('summary', 'Unnamed')}")

print("\n✅ Prepojenie s Google Calendar je hotové!")
print("✅ Teraz môžete spustiť: npm run dev")

