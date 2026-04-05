# test_craving_client.py - Test script for Craving Intensity Forecasting API

import requests
import json
from datetime import datetime, timedelta
import random

# API base URL
BASE_URL = "http://localhost:8001"

def generate_sample_historical_data(days=7, addiction_type="alcohol"):
    """Generate sample historical craving data"""
    historical_data = []
    base_time = datetime.now() - timedelta(days=days)
    
    # Define patterns based on addiction type
    patterns = {
        'alcohol': {
            'peak_hours': [17, 18, 19, 20, 21],  # Evening peaks
            'low_hours': [6, 7, 8, 9, 10],       # Morning lows
            'base_intensity': 4
        },
        'drugs': {
            'peak_hours': [14, 15, 16, 22, 23],  # Afternoon and late night
            'low_hours': [6, 7, 8, 9],           # Early morning
            'base_intensity': 5
        },
        'nicotine': {
            'peak_hours': [8, 12, 16, 20],       # After meals and breaks
            'low_hours': [2, 3, 4, 5],           # Late night/early morning
            'base_intensity': 6
        }
    }
    
    pattern = patterns.get(addiction_type, patterns['alcohol'])
    
    for day in range(days):
        for hour in range(0, 24, 2):  # Every 2 hours
            timestamp = base_time + timedelta(days=day, hours=hour)
            
            # Base intensity with pattern
            if hour in pattern['peak_hours']:
                base_intensity = pattern['base_intensity'] + random.uniform(2, 4)
            elif hour in pattern['low_hours']:
                base_intensity = pattern['base_intensity'] - random.uniform(1, 2)
            else:
                base_intensity = pattern['base_intensity'] + random.uniform(-1, 1)
            
            # Add some stress/mood correlation
            stress = random.uniform(3, 8)
            mood = random.uniform(4, 8)
            sleep_quality = random.uniform(2, 5)
            
            # Adjust craving based on triggers
            craving = base_intensity
            if stress > 6:
                craving += (stress - 6) * 0.5
            if mood < 5:
                craving += (5 - mood) * 0.4
            if sleep_quality < 3:
                craving += (3 - sleep_quality) * 0.3
            
            # Ensure bounds
            craving = max(0, min(10, craving))
            
            historical_data.append({
                "timestamp": timestamp.isoformat(),
                "craving_intensity": round(craving, 1),
                "stress_level": round(stress, 1),
                "mood_score": round(mood, 1),
                "sleep_quality": round(sleep_quality, 1),
                "location_risk": random.choice([True, False]) if random.random() < 0.2 else False,
                "social_trigger": random.choice([True, False]) if random.random() < 0.15 else False,
                "work_stress": random.choice([True, False]) if random.random() < 0.3 else False
            })
    
    return historical_data

def generate_current_triggers(scenario="normal"):
    """Generate current trigger state based on scenario"""
    scenarios = {
        "normal": {
            "stress_level": 4.0,
            "mood_score": 6.5,
            "sleep_quality": 3.5,
            "location_risk": False,
            "social_trigger": False,
            "work_stress": False,
            "fatigue": False,
            "hunger": False,
            "pain": False,
            "social_context": "alone",
            "hours_since_checkin": 2.0,
            "days_since_therapy": 3,
            "medication_taken": True
        },
        "high_stress": {
            "stress_level": 8.5,
            "mood_score": 3.0,
            "sleep_quality": 2.0,
            "location_risk": True,
            "social_trigger": True,
            "work_stress": True,
            "fatigue": True,
            "hunger": False,
            "pain": False,
            "social_context": "risky",
            "hours_since_checkin": 12.0,
            "days_since_therapy": 7,
            "medication_taken": False
        },
        "supportive": {
            "stress_level": 2.0,
            "mood_score": 8.0,
            "sleep_quality": 4.5,
            "location_risk": False,
            "social_trigger": False,
            "work_stress": False,
            "fatigue": False,
            "hunger": False,
            "pain": False,
            "social_context": "supportive",
            "hours_since_checkin": 0.5,
            "days_since_therapy": 1,
            "medication_taken": True
        }
    }
    
    triggers = scenarios.get(scenario, scenarios["normal"])
    triggers["current_time"] = datetime.now().isoformat()
    return triggers

def test_craving_forecast(scenario="normal", addiction_type="alcohol"):
    """Test craving intensity forecasting"""
    print(f"\n🧪 Testing Craving Forecast - Scenario: {scenario.upper()}, Addiction: {addiction_type}")
    print("="*70)
    
    # Generate test data
    historical_data = generate_sample_historical_data(days=10, addiction_type=addiction_type)
    current_triggers = generate_current_triggers(scenario)
    
    # Create request payload
    request_payload = {
        "user_id": f"user_{scenario}_{addiction_type}",
        "historical_data": historical_data,
        "current_triggers": current_triggers,
        "addiction_type": addiction_type,
        "days_in_recovery": 45
    }
    
    try:
        # Make API request
        response = requests.post(f"{BASE_URL}/forecast", json=request_payload)
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"✅ Forecast Generated Successfully!")
            print(f"   User ID: {result['user_id']}")
            print(f"   Model Confidence: {result['model_confidence']:.2f}")
            print(f"   Data Sufficiency: {result['data_sufficiency']}")
            
            # Display next 6 hours forecast
            print(f"\n📈 Next 6 Hours Forecast:")
            for forecast in result['forecasts'][:6]:
                time_offset = forecast['hour_offset']
                intensity = forecast['predicted_intensity']
                risk = forecast['risk_level']
                conf_range = f"{forecast['confidence_lower']:.1f}-{forecast['confidence_upper']:.1f}"
                
                future_time = datetime.now() + timedelta(hours=time_offset)
                time_str = future_time.strftime("%H:%M")
                
                risk_emoji = "🔴" if risk == "High" else "🟡" if risk == "Medium" else "🟢"
                print(f"   {time_str}: {intensity:.1f}/10 {risk_emoji} ({risk}) [{conf_range}]")
            
            # Display peak risk hours
            if result['peak_risk_hours']:
                print(f"\n⚠️  Peak Risk Hours Today: {', '.join([f'{h:02d}:00' for h in result['peak_risk_hours']])}")
            else:
                print(f"\n✅ No High-Risk Hours Identified Today")
            
            # Display next high-risk period
            if result['next_high_risk_period']:
                print(f"🚨 Next High-Risk Period: {result['next_high_risk_period']}")
            
            # Display top trigger sensitivities
            print(f"\n🎯 Top Trigger Sensitivities:")
            for trigger in result['trigger_sensitivity'][:3]:
                sensitivity_emoji = "🔥" if trigger['sensitivity_level'] == "High" else "⚡" if trigger['sensitivity_level'] == "Medium" else "💧"
                print(f"   {sensitivity_emoji} {trigger['trigger_name']}: {trigger['sensitivity_level']} ({trigger['impact_score']:.1f}%)")
            
            # Display intervention recommendations
            print(f"\n💡 Intervention Recommendations:")
            for intervention in result['intervention_recommendations'][:3]:
                priority_emoji = "🚨" if intervention['priority'] == "High" else "⚠️" if intervention['priority'] == "Medium" else "ℹ️"
                future_time = datetime.now() + timedelta(hours=intervention['time_offset'])
                time_str = future_time.strftime("%H:%M")
                print(f"   {priority_emoji} {time_str}: {intervention['description']}")
            
            # Display time patterns
            print(f"\n🕐 High-Risk Time Patterns:")
            high_risk_patterns = [p for p in result['time_patterns'] if p['risk_level'] == 'High']
            if high_risk_patterns:
                for pattern in high_risk_patterns[:3]:
                    print(f"   {pattern['hour']:02d}:00 - Average: {pattern['average_intensity']:.1f}/10")
            else:
                print("   No consistent high-risk time patterns identified")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   {response.text}")
    
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server!")
        print("🔧 Make sure the API is running on http://localhost:8001")
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")

def test_multiple_scenarios():
    """Test multiple scenarios and addiction types"""
    scenarios = ["normal", "high_stress", "supportive"]
    addiction_types = ["alcohol", "drugs", "nicotine", "gaming"]
    
    print("🚀 Starting Comprehensive Craving Forecast Tests\n")
    
    for addiction_type in addiction_types:
        print(f"\n{'='*50}")
        print(f"Testing Addiction Type: {addiction_type.upper()}")
        print(f"{'='*50}")
        
        for scenario in scenarios:
            test_craving_forecast(scenario, addiction_type)

def test_health_check():
    """Test health check endpoint"""
    print("\n🧪 Testing Health Check...")
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Service Status: {result['status']}")
            print(f"   Timestamp: {result['timestamp']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")

def test_patterns_endpoint():
    """Test patterns endpoint"""
    print("\n🧪 Testing Default Patterns...")
    
    try:
        response = requests.get(f"{BASE_URL}/patterns")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Default Patterns Retrieved:")
            
            for addiction_type, patterns in result['default_patterns'].items():
                print(f"\n   {addiction_type.upper()}:")
                print(f"   - Stress Sensitivity: {patterns['stress_sensitivity']}")
                print(f"   - Mood Sensitivity: {patterns['mood_sensitivity']}")
                print(f"   - Social Impact: {patterns['social_impact']}")
                
                # Show peak hours
                hourly = patterns['hourly']
                peak_hours = [i for i, val in enumerate(hourly) if val >= 7]
                if peak_hours:
                    print(f"   - Peak Hours: {', '.join([f'{h:02d}:00' for h in peak_hours])}")
        else:
            print(f"❌ Patterns request failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Patterns test error: {str(e)}")

def generate_sample_requests():
    """Generate sample request examples for documentation"""
    print("\n📝 Sample Request Examples:")
    
    # High-stress scenario example
    high_stress_example = {
        "user_id": "user_example_001",
        "historical_data": generate_sample_historical_data(days=5, addiction_type="alcohol")[:24],  # Last 24 hours
        "current_triggers": generate_current_triggers("high_stress"),
        "addiction_type": "alcohol",
        "days_in_recovery": 30
    }
    
    # Normal scenario example
    normal_example = {
        "user_id": "user_example_002",
        "historical_data": generate_sample_historical_data(days=3, addiction_type="nicotine")[:12],  # Last 12 hours
        "current_triggers": generate_current_triggers("normal"),
        "addiction_type": "nicotine",
        "days_in_recovery": 120
    }
    
    examples = {
        "high_stress_alcohol_user": high_stress_example,
        "normal_nicotine_user": normal_example
    }
    
    for example_name, example_data in examples.items():
        print(f"\n{example_name.upper()}:")
        # Show condensed version for readability
        condensed = {
            "user_id": example_data["user_id"],
            "historical_data_points": len(example_data["historical_data"]),
            "current_triggers": {
                "stress_level": example_data["current_triggers"]["stress_level"],
                "mood_score": example_data["current_triggers"]["mood_score"],
                "sleep_quality": example_data["current_triggers"]["sleep_quality"],
                "location_risk": example_data["current_triggers"]["location_risk"],
                "social_context": example_data["current_triggers"]["social_context"]
            },
            "addiction_type": example_data["addiction_type"],
            "days_in_recovery": example_data["days_in_recovery"]
        }
        print(json.dumps(condensed, indent=2))

def test_edge_cases():
    """Test edge cases and error handling"""
    print("\n🧪 Testing Edge Cases...")
    
    # Test with minimal data
    print("\n1. Testing with minimal historical data...")
    minimal_data = {
        "user_id": "user_minimal",
        "historical_data": generate_sample_historical_data(days=1, addiction_type="drugs")[:3],  # Only 3 data points
        "current_triggers": generate_current_triggers("normal"),
        "addiction_type": "drugs",
        "days_in_recovery": 5
    }
    
    try:
        response = requests.post(f"{BASE_URL}/forecast", json=minimal_data)
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Minimal data handled successfully")
            print(f"   Data Sufficiency: {result['data_sufficiency']}")
            print(f"   Model Confidence: {result['model_confidence']:.2f}")
        else:
            print(f"   ❌ Minimal data test failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Minimal data test error: {str(e)}")
    
    # Test with extreme trigger values
    print("\n2. Testing with extreme trigger values...")
    extreme_triggers = generate_current_triggers("normal")
    extreme_triggers.update({
        "stress_level": 10.0,
        "mood_score": 1.0,
        "sleep_quality": 1.0,
        "location_risk": True,
        "social_trigger": True,
        "work_stress": True,
        "fatigue": True,
        "hunger": True,
        "pain": True,
        "social_context": "risky",
        "hours_since_checkin": 24.0,
        "days_since_therapy": 30,
        "medication_taken": False
    })
    
    extreme_data = {
        "user_id": "user_extreme",
        "historical_data": generate_sample_historical_data(days=7, addiction_type="alcohol"),
        "current_triggers": extreme_triggers,
        "addiction_type": "alcohol",
        "days_in_recovery": 1
    }
    
    try:
        response = requests.post(f"{BASE_URL}/forecast", json=extreme_data)
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Extreme triggers handled successfully")
            max_intensity = max([f['predicted_intensity'] for f in result['forecasts']])
            print(f"   Maximum predicted intensity: {max_intensity:.1f}/10")
            high_risk_count = sum(1 for f in result['forecasts'] if f['risk_level'] == 'High')
            print(f"   High-risk hours in next 24h: {high_risk_count}")
        else:
            print(f"   ❌ Extreme triggers test failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Extreme triggers test error: {str(e)}")

def main():
    """Main test function"""
    print("🚀 Starting Craving Intensity Forecasting API Tests")
    print("="*60)
    
    try:
        # Basic health and functionality tests
        test_health_check()
        test_patterns_endpoint()
        
        # Core functionality tests
        print(f"\n{'='*60}")
        print("CORE FUNCTIONALITY TESTS")
        print(f"{'='*60}")
        
        # Test different scenarios
        test_craving_forecast("normal", "alcohol")
        test_craving_forecast("high_stress", "drugs")
        test_craving_forecast("supportive", "nicotine")
        
        # Edge case testing
        print(f"\n{'='*60}")
        print("EDGE CASE TESTS")
        print(f"{'='*60}")
        test_edge_cases()
        
        # Sample requests for documentation
        generate_sample_requests()
        
        print(f"\n{'='*60}")
        print("✅ All tests completed!")
        print(f"{'='*60}")
        print("\n💡 To start the API server, run:")
        print("   uvicorn main:app --host 0.0.0.0 --port 8001 --reload")
        print("\n📚 API Documentation available at:")
        print("   http://localhost:8001/docs")
        print("\n🔬 To run comprehensive tests:")
        print("   python test_craving_client.py")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server!")
        print("🔧 Make sure the API is running on http://localhost:8001")
        print("   Start server with: uvicorn main:app --host 0.0.0.0 --port 8001 --reload")
    except Exception as e:
        print(f"❌ Test suite failed with error: {str(e)}")

if __name__ == "__main__":
    main()
    