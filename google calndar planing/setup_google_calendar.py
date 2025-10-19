"""
Google Calendar Authorization Helper
Pomocný skript pre prvú autorizáciu Google Calendar
"""
import os
import sys
from pathlib import Path

print("\n" + "="*60)
print("📅 Google Calendar - Autorizačný pomocník")
print("="*60 + "\n")

# Check if credentials.json exists
credentials_file = Path("credentials.json")

if not credentials_file.exists():
    print("❌ Súbor credentials.json nebol nájdený!\n")
    print("📝 Kroky na získanie credentials.json:\n")
    print("1. Otvorte: https://console.cloud.google.com/")
    print("2. Vytvorte nový projekt (alebo vyberte existujúci)")
    print("3. Povoľte Google Calendar API")
    print("   - Menu → APIs & Services → Library")
    print("   - Vyhľadajte 'Google Calendar API'")
    print("   - Kliknite 'Enable'")
    print("\n4. Vytvorte OAuth 2.0 credentials:")
    print("   - Menu → APIs & Services → Credentials")
    print("   - Kliknite 'Create Credentials' → 'OAuth client ID'")
    print("   - Application type: Desktop app")
    print("   - Stiahnite JSON súbor")
    print("   - Premenujte na 'credentials.json'")
    print("   - Umiestnite do root zložky projektu")
    print("\n5. Nastavte OAuth consent screen:")
    print("   - User Type: External")
    print("   - Pridajte svoj Gmail do Test users")
    print("\n📚 Detailný návod: GOOGLE_CALENDAR_SETUP.md")
    print("\n" + "="*60)
    sys.exit(1)

print("✅ credentials.json nájdený!\n")

# Check if token.pickle exists
token_file = Path("token.pickle")

if token_file.exists():
    print("✅ token.pickle existuje - už ste autorizovaný!")
    print("\n📊 Status:")
    print("   - Autorizácia: Dokončená")
    print("   - Google Calendar: Aktívny")
    print("\n💡 Pre opätovnú autorizáciu:")
    print("   - Vymažte token.pickle")
    print("   - Spustite tento skript znova")
    print("\n" + "="*60)
    sys.exit(0)

print("⚠️  Ešte nie ste autorizovaný.\n")
print("🔐 Spúšťam autorizačný proces...\n")

try:
    # Import services
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from services.google_calendar import GoogleCalendarService
    
    print("📂 Inicializujem Google Calendar service...")
    calendar_service = GoogleCalendarService()
    
    print("✅ Autorizácia úspešná!")
    print("✅ token.pickle bol vytvorený")
    print("\n📊 Google Calendar je pripravený na použitie!")
    
    # Test - list calendars
    print("\n📅 Testujem prístup ku kalendárom...")
    if calendar_service.service:
        calendar_list = calendar_service.service.calendarList().list().execute()
        calendars = calendar_list.get('items', [])
        print(f"✅ Prístup funguje! Našiel som {len(calendars)} kalendárov.")
        
        if calendars:
            print("\n📋 Vaše kalendáre:")
            for cal in calendars[:5]:
                print(f"   - {cal['summary']}")
            if len(calendars) > 5:
                print(f"   ... a ďalších {len(calendars) - 5}")
    
    print("\n" + "="*60)
    print("🎉 Úspech! Google Calendar je pripojený!")
    print("="*60)
    print("\n💡 Teraz môžete:")
    print("   1. Vytvoriť zamestnancov (automaticky sa vytvoria kalendáre)")
    print("   2. Pridať úlohy (automaticky sa vytvoria eventy)")
    print("   3. Kontrolovať dostupnosť")
    print("\n🚀 Spustite server: uvicorn main:app --reload")
    print("\n" + "="*60)
    
except FileNotFoundError as e:
    print(f"\n❌ Chyba: {e}")
    print("\n📝 Uistite sa, že credentials.json je správny:")
    print("   - Musí byť stiahnutý z Google Cloud Console")
    print("   - Musí byť pre Desktop app (nie Web app)")
    print("   - Musí obsahovať client_id a client_secret")
    sys.exit(1)
    
except Exception as e:
    print(f"\n❌ Chyba pri autorizácii: {e}")
    print("\n🔧 Riešenie:")
    print("   1. Skontrolujte, že Google Calendar API je povolené")
    print("   2. Skontrolujte OAuth consent screen nastavenia")
    print("   3. Pridajte svoj Gmail do Test users")
    print("   4. Pre viac info: GOOGLE_CALENDAR_SETUP.md")
    sys.exit(1)


