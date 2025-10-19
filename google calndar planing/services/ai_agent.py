"""
AI Agent Service using OpenAI GPT-4

This service provides intelligent planning and scheduling assistance.
It can work in two modes:
1. AI Mode (with OpenAI API key) - Full GPT-4 capabilities
2. Fallback Mode (without API key) - Rule-based responses
"""

import os
import json
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from openai import OpenAI


class AIAgent:
    """
    AI Agent for production planning and scheduling
    
    Features:
    - Natural language processing
    - Context-aware responses
    - Weather-based recommendations
    - Employee availability checking
    - Task creation assistance
    - Fallback mode when no API key available
    """
    
    def __init__(self):
        """Initialize AI Agent with optional OpenAI integration"""
        api_key = os.getenv("OPENAI_API_KEY")
        self.use_ai = bool(api_key)
        
        if self.use_ai:
            try:
                self.client = OpenAI(api_key=api_key)
                print("✅ AI Agent initialized with OpenAI GPT-4")
            except Exception as e:
                print(f"⚠️ OpenAI initialization failed: {e}")
                self.use_ai = False
                self.client = None
        else:
            self.client = None
            print("⚠️ Running in FALLBACK mode - no AI (OpenAI API key not set)")
        
        self.system_prompt = """Si inteligentný asistent pre plánovanie výroby a inštalácií.
Tvoja úloha je pomáhať s:
- Vytváranie plánov úloh
- Priradenie zamestnancov
- Kontrola dostupnosti
- Odporúčania na základe počasia
- Optimalizácia rozvrhu

Vždy odpovedaj po slovensky, stručne a prakticky.
Ak potrebuješ vykonať akciu (napr. vytvoriť úlohu), vráť action v JSON formáte.
"""
    
    def chat(
        self,
        message: str,
        context: Optional[Dict] = None
    ) -> Dict:
        """
        Process user message and return response
        
        Args:
            message: User's message
            context: Optional context (weather, employees, tasks, etc.)
        
        Returns:
            Dict with response, suggestions, and optional action
        """
        if not self.use_ai:
            return self._fallback_chat(message, context)
        
        try:
            # Prepare context for GPT
            context_str = self._format_context(context or {})
            
            # Prepare messages
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": f"{message}\n\nKontext:\n{context_str}"}
            ]
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            
            ai_response = response.choices[0].message.content
            
            # Parse response
            result = {
                "response": ai_response,
                "suggestions": self._extract_suggestions(ai_response, context),
                "action_type": None,
                "action_params": None
            }
            
            # Detect if action should be taken
            action = self._detect_action(message, ai_response, context)
            if action:
                result["action_type"] = action["type"]
                result["action_params"] = action["params"]
            
            return result
            
        except Exception as e:
            print(f"❌ OpenAI API Error: {e}")
            # Fallback to rule-based
            return self._fallback_chat(message, context)
    
    def _fallback_chat(self, message: str, context: Optional[Dict] = None) -> Dict:
        """
        Fallback chat when AI is not available
        Uses rule-based responses
        """
        message_lower = message.lower()
        context = context or {}
        
        # Weather queries
        if any(word in message_lower for word in ['počasie', 'weather', 'prší', 'slnko', 'dážď']):
            return self._handle_weather_query(context)
        
        # Employee queries
        if any(word in message_lower for word in ['zamestnanc', 'employee', 'pracovník', 'dostupn']):
            return self._handle_employee_query(message_lower, context)
        
        # Task creation
        if any(word in message_lower for word in ['vytvor', 'pridaj', 'naplánuj', 'create', 'add']):
            return self._handle_task_creation(message, context)
        
        # Planning queries
        if any(word in message_lower for word in ['plán', 'rozvrh', 'schedule', 'kedy']):
            return self._handle_planning_query(context)
        
        # Greeting
        if any(word in message_lower for word in ['ahoj', 'hello', 'dobrý', 'hi', 'hey']):
            return {
                "response": "Ahoj! Som váš plánovací asistent. Môžem vám pomôcť s:\n"
                           "• Plánovaním úloh\n"
                           "• Priradením zamestnancov\n"
                           "• Kontrolou počasia\n"
                           "• Odporúčaniami na optimalizáciu\n\n"
                           "Čo potrebujete?",
                "suggestions": [
                    "Aké je dnes počasie?",
                    "Kto je dnes dostupný?",
                    "Vytvor novú úlohu"
                ],
                "action_type": None,
                "action_params": None
            }
        
        # Default response
        return {
            "response": "Prepáčte, nerozumiem presne čo potrebujete. "
                       "Môžete sa opýtať na počasie, dostupnosť zamestnancov, "
                       "alebo ma požiadať o vytvorenie úlohy.",
            "suggestions": [
                "Aké je počasie?",
                "Kto je dostupný zajtra?",
                "Vytvor inštaláciu na budúci týždeň"
            ],
            "action_type": None,
            "action_params": None
        }
    
    def _handle_weather_query(self, context: Dict) -> Dict:
        """Handle weather-related queries"""
        weather = context.get('weather', {})
        
        if not weather:
            return {
                "response": "Nemám informácie o počasí. Skontrolujte nastavenie Weather API.",
                "suggestions": ["Skúsiť neskôr"],
                "action_type": None,
                "action_params": None
            }
        
        temp = weather.get('temperature', 'N/A')
        desc = weather.get('description', 'neznáme')
        recommendation = weather.get('recommendation', 'unknown')
        
        if recommendation == 'installation':
            msg = f"🌤️ Počasie je vhodné pre inštalácie!\n" \
                  f"Teplota: {temp}°C\n" \
                  f"Podmienky: {desc}\n\n" \
                  f"Odporúčam naplánovať vonkajšie práce."
        elif recommendation == 'production':
            msg = f"🌧️ Počasie nie je ideálne pre inštalácie.\n" \
                  f"Teplota: {temp}°C\n" \
                  f"Podmienky: {desc}\n\n" \
                  f"Odporúčam zamerať sa na výrobu v dielni."
        else:
            msg = f"📊 Aktuálne počasie:\n" \
                  f"Teplota: {temp}°C\n" \
                  f"Podmienky: {desc}"
        
        return {
            "response": msg,
            "suggestions": [
                "Kto je dostupný pre inštalácie?" if recommendation == 'installation' else "Kto môže pracovať na výrobe?",
                "Naplánuj úlohu"
            ],
            "action_type": None,
            "action_params": None
        }
    
    def _handle_employee_query(self, message: str, context: Dict) -> Dict:
        """Handle employee-related queries"""
        employees = context.get('employees', [])
        
        if not employees:
            return {
                "response": "Nenašiel som žiadnych zamestnancov v systéme. Pridajte najprv zamestnancov.",
                "suggestions": ["Pridať zamestnanca"],
                "action_type": None,
                "action_params": None
            }
        
        # Count by type
        installers = [e for e in employees if e.get('employee_type') in ['installer', 'both']]
        producers = [e for e in employees if e.get('employee_type') in ['producer', 'both']]
        
        msg = f"👥 Máte celkom {len(employees)} zamestnancov:\n\n"
        msg += f"🔧 Inštalatéri: {len(installers)}\n"
        msg += f"🏭 Výrobcovia: {len(producers)}\n\n"
        
        if 'dostupn' in message or 'available' in message:
            msg += "Pre kontrolu dostupnosti konkrétneho dňa uveďte dátum."
        
        return {
            "response": msg,
            "suggestions": [
                "Kto je dostupný zajtra?",
                "Vytvor úlohu"
            ],
            "action_type": None,
            "action_params": None
        }
    
    def _handle_task_creation(self, message: str, context: Dict) -> Dict:
        """Handle task creation requests"""
        message_lower = message.lower()
        
        # Detect task type
        task_type = 'production'
        if any(word in message_lower for word in ['inštalác', 'install', 'montáž']):
            task_type = 'installation'
        
        return {
            "response": f"Môžem vytvoriť novú úlohu typu '{task_type}'. "
                       f"Prosím špecifikujte:\n"
                       f"• Názov úlohy\n"
                       f"• Dátum a čas\n"
                       f"• Trvanie (hodiny)\n"
                       f"• Popis",
            "suggestions": [
                f"Vytvor {task_type} na zajtra o 9:00",
                "Zruš"
            ],
            "action_type": "request_task_details",
            "action_params": {"type": task_type}
        }
    
    def _handle_planning_query(self, context: Dict) -> Dict:
        """Handle planning and scheduling queries"""
        tasks = context.get('tasks', [])
        weather = context.get('weather', {})
        
        msg = f"📅 Plánovanie:\n\n"
        
        if tasks:
            msg += f"Máte {len(tasks)} naplánovaných úloh v najbližších 7 dňoch.\n\n"
        else:
            msg += "Nemáte žiadne naplánované úlohy.\n\n"
        
        # Weather-based recommendation
        if weather:
            rec = weather.get('recommendation', 'unknown')
            if rec == 'installation':
                msg += "💡 Odporúčanie: Počasie je vhodné pre inštalácie."
            elif rec == 'production':
                msg += "💡 Odporúčanie: Zamerajte sa na výrobu v dielni."
        
        return {
            "response": msg,
            "suggestions": [
                "Vytvor novú úlohu",
                "Zobraz zamestnancov",
                "Aké je počasie?"
            ],
            "action_type": None,
            "action_params": None
        }
    
    def _format_context(self, context: Dict) -> str:
        """Format context dictionary for GPT"""
        parts = []
        
        if 'weather' in context:
            weather = context['weather']
            parts.append(f"Počasie: {weather.get('temperature')}°C, {weather.get('description')}")
        
        if 'employees' in context:
            employees = context['employees']
            parts.append(f"Zamestnanci: {len(employees)} aktívnych")
        
        if 'tasks' in context:
            tasks = context['tasks']
            parts.append(f"Úlohy: {len(tasks)} naplánovaných")
        
        return "\n".join(parts) if parts else "Žiadny kontext"
    
    def _extract_suggestions(self, response: str, context: Dict) -> List[str]:
        """Extract relevant suggestions based on response and context"""
        suggestions = []
        
        response_lower = response.lower()
        
        if 'počasie' in response_lower:
            suggestions.append("Aké je počasie zajtra?")
        
        if 'zamestnanc' in response_lower:
            suggestions.append("Kto je dostupný?")
        
        if 'úloha' in response_lower or 'task' in response_lower:
            suggestions.append("Vytvor novú úlohu")
        
        # Default suggestions
        if not suggestions:
            suggestions = [
                "Aké je počasie?",
                "Kto je dostupný?",
                "Vytvor úlohu"
            ]
        
        return suggestions[:3]  # Max 3 suggestions
    
    def _detect_action(self, message: str, response: str, context: Dict) -> Optional[Dict]:
        """Detect if an action should be taken based on the conversation"""
        message_lower = message.lower()
        response_lower = response.lower()
        
        # Task creation
        if any(word in message_lower for word in ['vytvor', 'pridaj', 'naplánuj', 'create']):
            if any(word in message_lower for word in ['úloha', 'task', 'inštalác', 'výrob']):
                return {
                    "type": "create_task",
                    "params": self._extract_task_params(message)
                }
        
        return None
    
    def _extract_task_params(self, message: str) -> Dict:
        """Extract task parameters from message"""
        message_lower = message.lower()
        
        # Detect task type
        task_type = 'production'
        if any(word in message_lower for word in ['inštalác', 'install', 'montáž']):
            task_type = 'installation'
        
        # Try to detect date
        today = datetime.now()
        start_time = today
        
        if 'zajtra' in message_lower or 'tomorrow' in message_lower:
            start_time = today + timedelta(days=1)
        elif 'dnes' in message_lower or 'today' in message_lower:
            start_time = today
        
        # Default duration
        duration = 4.0  # 4 hours
        
        return {
            "task_type": task_type,
            "start_time": start_time.isoformat(),
            "duration_hours": duration,
            "title": f"Nová {task_type} úloha",
            "description": message
        }


# Singleton instance
_ai_agent_instance = None


def get_ai_agent() -> AIAgent:
    """Get or create AI Agent instance"""
    global _ai_agent_instance
    if _ai_agent_instance is None:
        _ai_agent_instance = AIAgent()
    return _ai_agent_instance
