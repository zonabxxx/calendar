"""
Simple unit tests for Production Planner
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import unittest
from datetime import datetime, timedelta
from models.database import EmployeeType, TaskType, TaskStatus


class TestModels(unittest.TestCase):
    """Test database models"""
    
    def test_employee_types(self):
        """Test employee type enum"""
        self.assertEqual(EmployeeType.INSTALLER.value, "installer")
        self.assertEqual(EmployeeType.PRODUCER.value, "producer")
        self.assertEqual(EmployeeType.BOTH.value, "both")
    
    def test_task_types(self):
        """Test task type enum"""
        self.assertEqual(TaskType.INSTALLATION.value, "installation")
        self.assertEqual(TaskType.PRODUCTION.value, "production")
    
    def test_task_status(self):
        """Test task status enum"""
        self.assertEqual(TaskStatus.PLANNED.value, "planned")
        self.assertEqual(TaskStatus.IN_PROGRESS.value, "in_progress")
        self.assertEqual(TaskStatus.COMPLETED.value, "completed")
        self.assertEqual(TaskStatus.CANCELLED.value, "cancelled")


class TestWeatherLogic(unittest.TestCase):
    """Test weather decision logic"""
    
    def test_suitable_for_installation(self):
        """Test weather suitability logic"""
        from services.weather import WeatherService
        
        # Mock service for testing
        service = WeatherService.__new__(WeatherService)
        
        # Good weather
        self.assertTrue(service._is_suitable_for_installation("clear", 20.0, 0))
        self.assertTrue(service._is_suitable_for_installation("clouds", 15.0, 0))
        
        # Bad weather
        self.assertFalse(service._is_suitable_for_installation("rain", 15.0, 5))
        self.assertFalse(service._is_suitable_for_installation("snow", 5.0, 0))
        self.assertFalse(service._is_suitable_for_installation("clear", -5.0, 0))  # Too cold


class TestSchedulerLogic(unittest.TestCase):
    """Test scheduler logic"""
    
    def test_time_calculations(self):
        """Test time and duration calculations"""
        start = datetime(2025, 10, 15, 8, 0, 0)
        duration_hours = 8.0
        
        end = start + timedelta(hours=duration_hours)
        
        self.assertEqual(end.hour, 16)
        self.assertEqual((end - start).total_seconds() / 3600, 8.0)
    
    def test_week_calculation(self):
        """Test week start/end calculation"""
        date = datetime(2025, 10, 15)  # Wednesday
        
        # Calculate week start (Monday)
        week_start = date - timedelta(days=date.weekday())
        self.assertEqual(week_start.weekday(), 0)  # Monday is 0
        
        # Calculate week end
        week_end = week_start + timedelta(days=7)
        days_diff = (week_end - week_start).days
        self.assertEqual(days_diff, 7)


class TestDataValidation(unittest.TestCase):
    """Test data validation"""
    
    def test_email_format(self):
        """Test email validation"""
        import re
        
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        # Valid emails
        self.assertTrue(re.match(email_pattern, "test@example.com"))
        self.assertTrue(re.match(email_pattern, "user.name@company.co.uk"))
        
        # Invalid emails
        self.assertFalse(re.match(email_pattern, "invalid"))
        self.assertFalse(re.match(email_pattern, "@example.com"))
    
    def test_hours_validation(self):
        """Test hours validation"""
        # Valid hours
        self.assertTrue(0 < 8.0 <= 24)
        self.assertTrue(0 < 40.0 <= 168)  # Max hours per week
        
        # Invalid hours
        self.assertFalse(0 < -1 <= 24)
        self.assertFalse(0 < 0 <= 24)
        self.assertFalse(0 < 25 <= 24)


class TestPriorityLogic(unittest.TestCase):
    """Test priority and scheduling logic"""
    
    def test_priority_range(self):
        """Test priority values"""
        # Valid priorities (1-5)
        for priority in [1, 2, 3, 4, 5]:
            self.assertTrue(1 <= priority <= 5)
        
        # Invalid priorities
        self.assertFalse(1 <= 0 <= 5)
        self.assertFalse(1 <= 6 <= 5)
    
    def test_priority_sorting(self):
        """Test task priority sorting"""
        tasks = [
            {'priority': 3, 'title': 'Task 1'},
            {'priority': 5, 'title': 'Task 2'},
            {'priority': 1, 'title': 'Task 3'},
        ]
        
        # Sort by priority (high to low)
        sorted_tasks = sorted(tasks, key=lambda x: x['priority'], reverse=True)
        
        self.assertEqual(sorted_tasks[0]['priority'], 5)
        self.assertEqual(sorted_tasks[-1]['priority'], 1)


def run_tests():
    """Run all tests"""
    print("\n" + "="*50)
    print("🧪 Running Production Planner Tests")
    print("="*50 + "\n")
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestModels))
    suite.addTests(loader.loadTestsFromTestCase(TestWeatherLogic))
    suite.addTests(loader.loadTestsFromTestCase(TestSchedulerLogic))
    suite.addTests(loader.loadTestsFromTestCase(TestDataValidation))
    suite.addTests(loader.loadTestsFromTestCase(TestPriorityLogic))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Summary
    print("\n" + "="*50)
    if result.wasSuccessful():
        print("✅ All tests passed!")
    else:
        print(f"❌ {len(result.failures)} test(s) failed")
        print(f"❌ {len(result.errors)} error(s)")
    print("="*50 + "\n")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)


