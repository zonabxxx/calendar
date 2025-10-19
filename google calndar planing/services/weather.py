"""
Weather API integration for planning decisions
"""
import os
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from dotenv import load_dotenv

load_dotenv()


class WeatherService:
    """Service for weather forecasting and installation planning"""
    
    def __init__(self):
        self.api_key = os.getenv("WEATHER_API_KEY")
        self.location = os.getenv("WEATHER_LOCATION", "Bratislava,SK")
        self.base_url = "https://api.openweathermap.org/data/2.5"
        
        if not self.api_key:
            raise ValueError("WEATHER_API_KEY not found in environment variables")
    
    def get_current_weather(self) -> Dict:
        """Get current weather conditions"""
        try:
            url = f"{self.base_url}/weather"
            params = {
                'q': self.location,
                'appid': self.api_key,
                'units': 'metric',
                'lang': 'sk'
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            return self._parse_current_weather(data)
            
        except requests.RequestException as e:
            print(f"Error fetching current weather: {e}")
            return self._get_default_weather()
    
    def get_forecast(self, days: int = 7) -> List[Dict]:
        """Get weather forecast for upcoming days"""
        try:
            url = f"{self.base_url}/forecast"
            params = {
                'q': self.location,
                'appid': self.api_key,
                'units': 'metric',
                'lang': 'sk'
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            return self._parse_forecast(data, days)
            
        except requests.RequestException as e:
            print(f"Error fetching forecast: {e}")
            return []
    
    def _parse_current_weather(self, data: Dict) -> Dict:
        """Parse current weather data"""
        weather = data['weather'][0]
        main = data['main']
        
        condition = weather['main'].lower()
        temperature = main['temp']
        description = weather['description']
        
        suitable_for_installation = self._is_suitable_for_installation(
            condition, 
            temperature,
            data.get('rain', {}).get('1h', 0)
        )
        
        return {
            'condition': condition,
            'temperature': temperature,
            'description': description,
            'suitable_for_installation': suitable_for_installation,
            'humidity': main.get('humidity', 0),
            'wind_speed': data.get('wind', {}).get('speed', 0)
        }
    
    def _parse_forecast(self, data: Dict, days: int) -> List[Dict]:
        """Parse forecast data"""
        forecasts = []
        processed_dates = set()
        
        for item in data['list']:
            dt = datetime.fromtimestamp(item['dt'])
            date_key = dt.date()
            
            # Get one forecast per day (around noon)
            if date_key not in processed_dates and dt.hour >= 11 and dt.hour <= 14:
                weather = item['weather'][0]
                main = item['main']
                
                condition = weather['main'].lower()
                temperature = main['temp']
                description = weather['description']
                
                suitable_for_installation = self._is_suitable_for_installation(
                    condition,
                    temperature,
                    item.get('rain', {}).get('3h', 0)
                )
                
                forecasts.append({
                    'date': dt,
                    'condition': condition,
                    'temperature': temperature,
                    'description': description,
                    'suitable_for_installation': suitable_for_installation,
                    'humidity': main.get('humidity', 0),
                    'wind_speed': item.get('wind', {}).get('speed', 0)
                })
                
                processed_dates.add(date_key)
                
                if len(forecasts) >= days:
                    break
        
        return forecasts
    
    def _is_suitable_for_installation(
        self,
        condition: str,
        temperature: float,
        rain_amount: float = 0
    ) -> bool:
        """
        Determine if weather is suitable for outdoor installation
        
        Pravidlá:
        - Pekné počasie (clear, sunny, clouds) -> inštalácia
        - Zlé počasie (rain, drizzle, thunderstorm, snow) -> výroba
        - Teplota pod 0°C -> nie je vhodné
        - Silný dážď -> nie je vhodné
        """
        bad_conditions = ['rain', 'drizzle', 'thunderstorm', 'snow', 'mist', 'fog']
        
        # Check temperature
        if temperature < 0:
            return False
        
        # Check rain amount (in mm)
        if rain_amount > 1:
            return False
        
        # Check general condition
        if condition in bad_conditions:
            return False
        
        return True
    
    def _get_default_weather(self) -> Dict:
        """Return default weather when API fails"""
        return {
            'condition': 'unknown',
            'temperature': 15.0,
            'description': 'Počasie nedostupné',
            'suitable_for_installation': False,
            'humidity': 50,
            'wind_speed': 0
        }
    
    def find_suitable_installation_days(
        self,
        start_date: datetime,
        days_needed: int,
        min_temp: float = 5.0
    ) -> List[Tuple[datetime, Dict]]:
        """
        Find days suitable for installation within forecast period
        
        Args:
            start_date: Starting date for search
            days_needed: Number of suitable days needed
            min_temp: Minimum acceptable temperature
        
        Returns:
            List of tuples (date, weather_data) for suitable days
        """
        forecast = self.get_forecast(days=14)
        suitable_days = []
        
        for day_forecast in forecast:
            if day_forecast['date'] >= start_date:
                if (day_forecast['suitable_for_installation'] and 
                    day_forecast['temperature'] >= min_temp):
                    suitable_days.append((day_forecast['date'], day_forecast))
                    
                    if len(suitable_days) >= days_needed:
                        break
        
        return suitable_days
    
    def get_recommendation(self, date: datetime = None) -> str:
        """
        Get work recommendation based on weather
        
        Returns: 'installation' or 'production'
        """
        if date is None or date.date() == datetime.now().date():
            weather = self.get_current_weather()
        else:
            forecast = self.get_forecast(days=14)
            weather = None
            for day in forecast:
                if day['date'].date() == date.date():
                    weather = day
                    break
            
            if not weather:
                return 'production'  # Default to production if no data
        
        if weather['suitable_for_installation']:
            return 'installation'
        else:
            return 'production'


# Singleton instance
_weather_service = None


def get_weather_service() -> WeatherService:
    """Get or create Weather service instance"""
    global _weather_service
    if _weather_service is None:
        _weather_service = WeatherService()
    return _weather_service


