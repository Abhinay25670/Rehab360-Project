"""
Auto-generated Combined FastAPI Application
Generated from folder structure scan
"""

import os
from pathlib import Path

# Load environment variables from .env file
from dotenv import load_dotenv

# Load .env from the ml directory
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

# Also load from subdirectory .env files
for subdir in Path(__file__).parent.iterdir():
    if subdir.is_dir():
        sub_env = subdir / '.env'
        if sub_env.exists():
            load_dotenv(sub_env)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import individual FastAPI applications
# Note: Make sure to remove the 'if __name__ == "__main__"' blocks from these files
try:
    from activity_recommendation.recommendation_system_api import app as activity_recommendation_app
    from addiction_recovery.nutrition_tracker_api import app as addiction_recovery_app
    # from Craving_Intensity_Forecasting.craving_forecast_api import app as craving_intensity_forecasting_app
    from crisis_detection.crisis_detection_service_api import app as crisis_detection_app
    from Emotion_Aware_Chatbot_Service.emotion_chatbot_service_api import app as emotion_aware_chatbot_service_app
    from Enhanced_Craving_API.enhanced_craving_api import app as enhanced_craving_api_app
    from Personalized_Motivational_Message_Service.motivational_message_service_api import app as personalized_motivational_message_service_app
    from Post_Sentiment_Analysis.sentiment_analysis_api import app as post_sentiment_analysis_app
    from RelapseRisk_Prediction.relapse_risk_api import app as relapserisk_prediction_app
    from Sleep_Quality_Assessment.sleep_assessment_api import app as sleep_quality_assessment_app
except ImportError as e:
    print(f"Import Error: {e}")
    print("Make sure all required dependencies are installed and paths are correct")
    print("Also ensure you've removed the 'if __name__ == \"__main__\"' blocks from individual API files")
    raise

# Create main application
main_app = FastAPI(
    title="Combined Rehab Project API",
    description="Comprehensive Rehab Project API combining all microservices",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
main_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure as needed for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all sub-applications
main_app.mount("/activity_recommendation", activity_recommendation_app)
main_app.mount("/addiction_recovery", addiction_recovery_app)
# main_app.mount("/craving_intensity_forecasting", craving_intensity_forecasting_app)
main_app.mount("/crisis_detection", crisis_detection_app)
main_app.mount("/emotion_aware_chatbot_service", emotion_aware_chatbot_service_app)
main_app.mount("/enhanced_craving_api", enhanced_craving_api_app)
main_app.mount("/personalized_motivational_message_service", personalized_motivational_message_service_app)
main_app.mount("/post_sentiment_analysis", post_sentiment_analysis_app)
main_app.mount("/relapserisk_prediction", relapserisk_prediction_app)
main_app.mount("/sleep_quality_assessment", sleep_quality_assessment_app)

# Root endpoint with API overview
@main_app.get("/")
async def root():
    return {
        "message": "Rehab Project - Combined API Gateway",
        "version": "1.0.0",
        "description": "Comprehensive Rehab Project API combining all microservices",
        "total_services": 10,
        "available_services": {
        "activity_recommendation": {
            "base_path": "/activity_recommendation",
            "description": "Activity Recommendation",
            "docs": "/activity_recommendation/docs",
            "source_file": "activity_recommendation/recommendation_system_api.py"
        },
        "addiction_recovery": {
            "base_path": "/addiction_recovery",
            "description": "Addiction Recovery",
            "docs": "/addiction_recovery/docs",
            "source_file": "addiction_recovery/nutrition_tracker_api.py"
        },
        "craving_intensity_forecasting": {
            "base_path": "/craving_intensity_forecasting",
            "description": "Craving Intensity Forecasting",
            "docs": "/craving_intensity_forecasting/docs",
            "source_file": "Craving_Intensity_Forecasting/craving_forecast_api.py"
        },
        "crisis_detection": {
            "base_path": "/crisis_detection",
            "description": "Crisis Detection",
            "docs": "/crisis_detection/docs",
            "source_file": "crisis_detection/crisis_detection_service_api.py"
        },
        "emotion_aware_chatbot_service": {
            "base_path": "/emotion_aware_chatbot_service",
            "description": "Emotion Aware Chatbot Service",
            "docs": "/emotion_aware_chatbot_service/docs",
            "source_file": "Emotion_Aware_Chatbot_Service/emotion_chatbot_service_api.py"
        },
        "enhanced_craving_api": {
            "base_path": "/enhanced_craving_api",
            "description": "Enhanced Craving Api",
            "docs": "/enhanced_craving_api/docs",
            "source_file": "Enhanced_Craving_API/enhanced_craving_api.py"
        },
        "personalized_motivational_message_service": {
            "base_path": "/personalized_motivational_message_service",
            "description": "Personalized Motivational Message Service",
            "docs": "/personalized_motivational_message_service/docs",
            "source_file": "Personalized_Motivational_Message_Service/motivational_message_service_api.py"
        },
        "post_sentiment_analysis": {
            "base_path": "/post_sentiment_analysis",
            "description": "Post Sentiment Analysis",
            "docs": "/post_sentiment_analysis/docs",
            "source_file": "Post_Sentiment_Analysis/sentiment_analysis_api.py"
        },
        "relapserisk_prediction": {
            "base_path": "/relapserisk_prediction",
            "description": "Relapserisk Prediction",
            "docs": "/relapserisk_prediction/docs",
            "source_file": "RelapseRisk_Prediction/relapse_risk_api.py"
        },
        "sleep_quality_assessment": {
            "base_path": "/sleep_quality_assessment",
            "description": "Sleep Quality Assessment",
            "docs": "/sleep_quality_assessment/docs",
            "source_file": "Sleep_Quality_Assessment/sleep_assessment_api.py"
        },
    },
        "documentation": {
            "main_docs": "/docs",
            "redoc": "/redoc"
        },
        "usage": {
            "individual_service_docs": "Visit /<service-name>/docs for specific API documentation",
            "example": "/fraud-detection/docs"
        }
    }

# Combined health check endpoint
@main_app.get("/health")
async def combined_health_check():
    service_names = ["activity_recommendation", "addiction_recovery", "craving_intensity_forecasting", "crisis_detection", "emotion_aware_chatbot_service", "enhanced_craving_api", "personalized_motivational_message_service", "post_sentiment_analysis", "relapserisk_prediction", "sleep_quality_assessment"]
    services_status = {}
    for service_name in service_names:
        services_status[service_name] = {
            "status": "mounted",
            "path": f"/{service_name}",
            "docs": f"/{service_name}/docs"
        }
    
    return {
        "status": "healthy",
        "timestamp": "2025-06-26",
        "services": services_status,
        "total_services": len(services_status)
    }

# Service discovery endpoint
@main_app.get("/services")
async def list_services():
    return {
        "services": {
        "activity_recommendation": {
            "base_path": "/activity_recommendation",
            "description": "Activity Recommendation",
            "docs": "/activity_recommendation/docs",
            "source_file": "activity_recommendation/recommendation_system_api.py"
        },
        "addiction_recovery": {
            "base_path": "/addiction_recovery",
            "description": "Addiction Recovery",
            "docs": "/addiction_recovery/docs",
            "source_file": "addiction_recovery/nutrition_tracker_api.py"
        },
        "craving_intensity_forecasting": {
            "base_path": "/craving_intensity_forecasting",
            "description": "Craving Intensity Forecasting",
            "docs": "/craving_intensity_forecasting/docs",
            "source_file": "Craving_Intensity_Forecasting/craving_forecast_api.py"
        },
        "crisis_detection": {
            "base_path": "/crisis_detection",
            "description": "Crisis Detection",
            "docs": "/crisis_detection/docs",
            "source_file": "crisis_detection/crisis_detection_service_api.py"
        },
        "emotion_aware_chatbot_service": {
            "base_path": "/emotion_aware_chatbot_service",
            "description": "Emotion Aware Chatbot Service",
            "docs": "/emotion_aware_chatbot_service/docs",
            "source_file": "Emotion_Aware_Chatbot_Service/emotion_chatbot_service_api.py"
        },
        "enhanced_craving_api": {
            "base_path": "/enhanced_craving_api",
            "description": "Enhanced Craving Api",
            "docs": "/enhanced_craving_api/docs",
            "source_file": "Enhanced_Craving_API/enhanced_craving_api.py"
        },
        "personalized_motivational_message_service": {
            "base_path": "/personalized_motivational_message_service",
            "description": "Personalized Motivational Message Service",
            "docs": "/personalized_motivational_message_service/docs",
            "source_file": "Personalized_Motivational_Message_Service/motivational_message_service_api.py"
        },
        "post_sentiment_analysis": {
            "base_path": "/post_sentiment_analysis",
            "description": "Post Sentiment Analysis",
            "docs": "/post_sentiment_analysis/docs",
            "source_file": "Post_Sentiment_Analysis/sentiment_analysis_api.py"
        },
        "relapserisk_prediction": {
            "base_path": "/relapserisk_prediction",
            "description": "Relapserisk Prediction",
            "docs": "/relapserisk_prediction/docs",
            "source_file": "RelapseRisk_Prediction/relapse_risk_api.py"
        },
        "sleep_quality_assessment": {
            "base_path": "/sleep_quality_assessment",
            "description": "Sleep Quality Assessment",
            "docs": "/sleep_quality_assessment/docs",
            "source_file": "Sleep_Quality_Assessment/sleep_assessment_api.py"
        },
    },
        "total_count": 10
    }

# Quick access endpoint for service URLs
@main_app.get("/urls")
async def get_service_urls():
    base_url = "http://localhost:8000"  # Change this to your actual domain
    service_names = ["activity_recommendation", "addiction_recovery", "craving_intensity_forecasting", "crisis_detection", "emotion_aware_chatbot_service", "enhanced_craving_api", "personalized_motivational_message_service", "post_sentiment_analysis", "relapserisk_prediction", "sleep_quality_assessment"]
    urls = {}
    for service_name in service_names:
        urls[service_name] = {
            "base": f"{base_url}/{service_name}",
            "docs": f"{base_url}/{service_name}/docs",
            "health": f"{base_url}/{service_name}/health"  # if available
        }
    return urls

if __name__ == "__main__":
    import uvicorn
    print("Starting Combined Rehab Project API...")
    print(f"Found and mounted 10 services:")
    service_names = ["activity_recommendation", "addiction_recovery", "craving_intensity_forecasting", "crisis_detection", "emotion_aware_chatbot_service", "enhanced_craving_api", "personalized_motivational_message_service", "post_sentiment_analysis", "relapserisk_prediction", "sleep_quality_assessment"]
    for service in service_names:
        print(f"  - {service}: /{service}")
    print("\nAccess the API at: http://localhost:8000")
    print("Main documentation: http://localhost:8000/docs")
    print("\nServer is starting... (Press Ctrl+C to stop)")
    uvicorn.run(main_app, host="0.0.0.0", port=8000, reload=False)
