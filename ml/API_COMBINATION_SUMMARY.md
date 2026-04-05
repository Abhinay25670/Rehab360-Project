# Combined API Generation Summary

## Generated Files:
1. `main_combined_api.py` - The combined FastAPI application
2. `remove_main_blocks.py` - Script to clean up individual API files

## Found APIs (10):
- **activity_recommendation**: `/activity_recommendation` (from `activity_recommendation\recommendation_system_api.py`)
- **addiction_recovery**: `/addiction_recovery` (from `addiction_recovery\nutrition_tracker_api.py`)
- **Craving_Intensity_Forecasting**: `/craving_intensity_forecasting` (from `Craving_Intensity_Forecasting\craving_forecast_api.py`)
- **crisis_detection**: `/crisis_detection` (from `crisis_detection\crisis_detection_service_api.py`)
- **Emotion_Aware_Chatbot_Service**: `/emotion_aware_chatbot_service` (from `Emotion_Aware_Chatbot_Service\emotion_chatbot_service_api.py`)
- **Enhanced_Craving_API**: `/enhanced_craving_api` (from `Enhanced_Craving_API\enhanced_craving_api.py`)
- **Personalized_Motivational_Message_Service**: `/personalized_motivational_message_service` (from `Personalized_Motivational_Message_Service\motivational_message_service_api.py`)
- **Post_Sentiment_Analysis**: `/post_sentiment_analysis` (from `Post_Sentiment_Analysis\sentiment_analysis_api.py`)
- **RelapseRisk_Prediction**: `/relapserisk_prediction` (from `RelapseRisk_Prediction\relapse_risk_api.py`)
- **Sleep_Quality_Assessment**: `/sleep_quality_assessment` (from `Sleep_Quality_Assessment\sleep_assessment_api.py`)

## Next Steps:

1. **Clean up individual API files:**
   ```bash
   python remove_main_blocks.py
   ```

2. **Install dependencies** (make sure all required packages are installed):
   ```bash
   pip install fastapi uvicorn
   # Install other dependencies from individual requirement files
   ```

3. **Run the combined API:**
   ```bash
   python main_combined_api.py
   ```

4. **Access your APIs:**
   - Main documentation: http://localhost:8000/docs
   - Service discovery: http://localhost:8000/services
   - Individual APIs: http://localhost:8000/<service-name>/docs

## Service URLs:
- activity_recommendation: http://localhost:8000/activity_recommendation/docs
- addiction_recovery: http://localhost:8000/addiction_recovery/docs
- Craving_Intensity_Forecasting: http://localhost:8000/craving_intensity_forecasting/docs
- crisis_detection: http://localhost:8000/crisis_detection/docs
- Emotion_Aware_Chatbot_Service: http://localhost:8000/emotion_aware_chatbot_service/docs
- Enhanced_Craving_API: http://localhost:8000/enhanced_craving_api/docs
- Personalized_Motivational_Message_Service: http://localhost:8000/personalized_motivational_message_service/docs
- Post_Sentiment_Analysis: http://localhost:8000/post_sentiment_analysis/docs
- RelapseRisk_Prediction: http://localhost:8000/relapserisk_prediction/docs
- Sleep_Quality_Assessment: http://localhost:8000/sleep_quality_assessment/docs
