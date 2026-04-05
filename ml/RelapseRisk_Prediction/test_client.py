# test_client.py - Test script for Relapse Risk Prediction API

import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000"

def test_single_prediction():
    """Test single user prediction"""
    print("🧪 Testing Single User Prediction...")
    
    # Sample user data - High risk user
    high_risk_user = {
        "user_id": "user_123",
        "age": 28,
        "gender": "Male",
        "addiction_type": "Alcohol",
        "days_sober": 15,
        "previous_relapses": 3,
        "checkin_frequency": 0.2,  # Low engagement
        "avg_mood_score": 3.5,     # Poor mood
        "avg_sleep_hours": 4.5,    # Poor sleep
        "avg_stress_level": 8.5,   # High stress
        "social_support_score": 2.5,  # Low support
        "therapy_sessions_per_week": 1,
        "task_completion_rate": 0.3,  # Low completion
        "mood_trend": -3.0,        # Declining mood
        "sleep_quality": 2.0,      # Poor sleep quality
        "craving_intensity": 7.5   # High cravings
    }
    
    response = requests.post(f"{BASE_URL}/predict", json=high_risk_user)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ High Risk User Results:")
        print(f"   Risk Score: {result['risk_score']}%")
        print(f"   Risk Category: {result['risk_category']}")
        print(f"   Confidence: {result['confidence_level']:.2f}")
        print(f"   Contributing Factors: {len(result['contributing_factors'])}")
        print(f"   Recommendations: {len(result['intervention_recommendations'])}")
        print("\n📋 Top Recommendations:")
        for i, rec in enumerate(result['intervention_recommendations'][:3]):
            print(f"   {i+1}. {rec}")
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
    
    print("\n" + "="*50 + "\n")
    
    # Sample user data - Low risk user
    low_risk_user = {
        "user_id": "user_456",
        "age": 35,
        "gender": "Female", 
        "addiction_type": "Nicotine",
        "days_sober": 180,
        "previous_relapses": 0,
        "checkin_frequency": 0.85,  # High engagement
        "avg_mood_score": 7.5,      # Good mood
        "avg_sleep_hours": 8.0,     # Good sleep
        "avg_stress_level": 3.0,    # Low stress
        "social_support_score": 8.5,  # High support
        "therapy_sessions_per_week": 2,
        "task_completion_rate": 0.9,   # High completion
        "mood_trend": 1.5,          # Improving mood
        "sleep_quality": 4.5,       # Good sleep quality
        "craving_intensity": 2.0    # Low cravings
    }
    
    response = requests.post(f"{BASE_URL}/predict", json=low_risk_user)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Low Risk User Results:")
        print(f"   Risk Score: {result['risk_score']}%")
        print(f"   Risk Category: {result['risk_category']}")
        print(f"   Confidence: {result['confidence_level']:.2f}")
        print(f"   Contributing Factors: {len(result['contributing_factors'])}")
        print(f"   Next Assessment: {result['next_assessment_date']}")
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")

def test_bulk_prediction():
    """Test bulk prediction for multiple users"""
    print("\n🧪 Testing Bulk Prediction...")
    
    users = [
        {
            "user_id": "bulk_user_1",
            "age": 25,
            "gender": "Male",
            "addiction_type": "Drugs",
            "days_sober": 45,
            "previous_relapses": 1,
            "checkin_frequency": 0.6,
            "avg_mood_score": 6.0,
            "avg_sleep_hours": 7.0,
            "avg_stress_level": 5.0,
            "social_support_score": 6.0,
            "therapy_sessions_per_week": 1,
            "task_completion_rate": 0.7
        },
        {
            "user_id": "bulk_user_2", 
            "age": 42,
            "gender": "Female",
            "addiction_type": "Alcohol",
            "days_sober": 200,
            "previous_relapses": 2,
            "checkin_frequency": 0.9,
            "avg_mood_score": 8.0,
            "avg_sleep_hours": 8.5,
            "avg_stress_level": 2.5,
            "social_support_score": 9.0,
            "therapy_sessions_per_week": 2,
            "task_completion_rate": 0.95
        }
    ]
    
    response = requests.post(f"{BASE_URL}/predict/bulk", json=users)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Bulk Prediction Results for {result['total_users']} users:")
        for prediction in result['predictions']:
            print(f"   User {prediction['user_id']}: {prediction['risk_score']}% ({prediction['risk_category']} Risk)")
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")

def test_health_check():
    """Test health check endpoint"""
    print("\n🧪 Testing Health Check...")
    
    response = requests.get(f"{BASE_URL}/health")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Service Status: {result['status']}")
        print(f"   Timestamp: {result['timestamp']}")
    else:
        print(f"❌ Health check failed: {response.status_code}")

def test_risk_factors():
    """Test risk factors endpoint"""
    print("\n🧪 Testing Risk Factors Info...")
    
    response = requests.get(f"{BASE_URL}/risk-factors")
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Risk Factors Information:")
        print(f"   Behavioral Patterns: {len(result['risk_factors']['behavioral_patterns'])}")
        print(f"   Historical Factors: {len(result['risk_factors']['historical_factors'])}")
        print(f"   Risk Categories: {list(result['risk_categories'].keys())}")
    else:
        print(f"❌ Error: {response.status_code}")

def generate_sample_requests():
    """Generate sample request JSONs for testing"""
    print("\n📝 Sample Request Examples:")
    
    sample_requests = {
        "high_risk_example": {
            "user_id": "user_high_risk",
            "age": 30,
            "gender": "Male",
            "addiction_type": "Alcohol",
            "days_sober": 10,
            "previous_relapses": 4,
            "checkin_frequency": 0.1,
            "avg_mood_score": 2.5,
            "avg_sleep_hours": 3.5,
            "avg_stress_level": 9.0,
            "social_support_score": 1.5,
            "therapy_sessions_per_week": 0,
            "task_completion_rate": 0.1,
            "craving_intensity": 9.0
        },
        "medium_risk_example": {
            "user_id": "user_medium_risk",
            "age": 28,
            "gender": "Female",
            "addiction_type": "Drugs",
            "days_sober": 60,
            "previous_relapses": 1,
            "checkin_frequency": 0.5,
            "avg_mood_score": 5.5,
            "avg_sleep_hours": 6.5,
            "avg_stress_level": 6.0,
            "social_support_score": 5.0,
            "therapy_sessions_per_week": 1,
            "task_completion_rate": 0.6
        },
        "low_risk_example": {
            "user_id": "user_low_risk",
            "age": 35,
            "gender": "Other",
            "addiction_type": "Nicotine",
            "days_sober": 365,
            "previous_relapses": 0,
            "checkin_frequency": 0.9,
            "avg_mood_score": 8.5,
            "avg_sleep_hours": 8.0,
            "avg_stress_level": 2.0,
            "social_support_score": 9.0,
            "therapy_sessions_per_week": 2,
            "task_completion_rate": 0.95
        }
    }
    
    for risk_level, example in sample_requests.items():
        print(f"\n{risk_level.upper()}:")
        print(json.dumps(example, indent=2))

if __name__ == "__main__":
    print("🚀 Starting Relapse Risk Prediction API Tests\n")
    print("="*50)
    
    try:
        # Test all endpoints
        test_health_check()
        test_risk_factors()
        test_single_prediction()
        test_bulk_prediction()
        generate_sample_requests()
        
        print("\n" + "="*50)
        print("✅ All tests completed!")
        print("\n💡 To start the API server, run:")
        print("   uvicorn main:app --reload")
        print("\n📚 API Documentation available at:")
        print("   http://localhost:8000/docs")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server!")
        print("🔧 Make sure the API is running on http://localhost:8000")
        print("   Start server with: uvicorn main:app --reload")
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
