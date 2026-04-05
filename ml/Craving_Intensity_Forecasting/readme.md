# 🔮 Craving Intensity Forecasting API

A machine learning-powered FastAPI service for predicting addiction craving intensity based on triggers and time patterns. This API provides real-time 24-hour craving forecasts, trigger sensitivity analysis, and personalized intervention recommendations for addiction recovery applications.

## 🌟 Features

- **🎯 24-Hour Craving Forecasting** - Predict craving intensity for the next 24 hours with confidence intervals
- **📊 ARIMA/SARIMAX Time Series Analysis** - Advanced statistical models with automatic parameter selection
- **🔄 Trigger Sensitivity Analysis** - Identify which factors most influence individual cravings
- **⏰ Time Pattern Recognition** - Discover personal high-risk hours and daily patterns
- **💡 Smart Intervention Recommendations** - Personalized, time-based intervention suggestions
- **⚡ Real-time Processing** - Instant predictions with sub-second response times
- **📱 Addiction-Specific Models** - Tailored patterns for alcohol, drugs, nicotine, and gaming addictions
- **🔒 Comprehensive Validation** - Robust input validation and error handling

## 🚀 Quick Start Instructions

### Prerequisites

- Python 3.8 or higher
- pip package manager

### 1. Clone the Repository

```bash
git clone <<repo-url>
cd craving-intensity-forecasting-api
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Start the API Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

The API will be available at: `http://localhost:8001`

### 4. Test the API

Run the test client to verify everything works:

```bash
python test_craving_client.py
```

### 5. Access API Documentation

- **Interactive Docs**: http://localhost:8001/docs
- **Alternative Docs**: http://localhost:8001/redoc

## 📚 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/forecast` | Generate 24-hour craving intensity forecast |
| `GET` | `/health` | Health check and service status |
| `GET` | `/patterns` | Default craving patterns by addiction type |

### Quick Test with cURL

```bash
# Health check
curl -X GET "http://localhost:8001/health"

# Generate forecast
curl -X POST "http://localhost:8001/forecast" \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "test_user_001",
       "historical_data": [
         {
           "timestamp": "2025-06-20T08:00:00",
           "craving_intensity": 3.0,
           "stress_level": 4.0,
           "mood_score": 7.0,
           "sleep_quality": 4.0,
           "location_risk": false,
           "social_trigger": false,
           "work_stress": false
         },
         {
           "timestamp": "2025-06-20T18:00:00",
           "craving_intensity": 8.0,
           "stress_level": 8.5,
           "mood_score": 3.0,
           "sleep_quality": 4.0,
           "location_risk": true,
           "social_trigger": true,
           "work_stress": false
         }
       ],
       "current_triggers": {
         "current_time": "2025-06-24T15:30:00",
         "stress_level": 6.0,
         "mood_score": 5.0,
         "sleep_quality": 3.5,
         "location_risk": false,
         "social_trigger": false,
         "work_stress": true,
         "fatigue": false,
         "hunger": false,
         "pain": false,
         "social_context": "alone",
         "hours_since_checkin": 2.0,
         "days_since_therapy": 3,
         "medication_taken": true
       },
       "addiction_type": "alcohol",
       "days_in_recovery": 45
     }'
```

## 💾 Input/Output Schemas

### Input Schema - CravingForecastRequest

#### Historical Data (Array of entries with different timestamps)

```json
{
  "timestamp": "2025-06-20T08:00:00",
  "craving_intensity": "float (0-10)",
  "stress_level": "float (1-10)",
  "mood_score": "float (1-10)",
  "sleep_quality": "float (1-5) [optional]",
  "location_risk": "boolean [optional]",
  "social_trigger": "boolean [optional]",
  "work_stress": "boolean [optional]"
}
```

#### Current Triggers (Single current state)

```json
{
  "current_time": "datetime (ISO format)",
  "stress_level": "float (1-10)",
  "mood_score": "float (1-10)",
  "sleep_quality": "float (1-5)",
  "location_risk": "boolean",
  "social_trigger": "boolean",
  "work_stress": "boolean",
  "fatigue": "boolean",
  "hunger": "boolean",
  "pain": "boolean",
  "social_context": "string (alone/supportive/risky)",
  "hours_since_checkin": "float (≥0)",
  "days_since_therapy": "integer (≥0)",
  "medication_taken": "boolean"
}
```

#### Complete Request Structure

```json
{
  "user_id": "string",
  "historical_data": "[array of HistoricalCravingData]",
  "current_triggers": "{CurrentTriggers object}",
  "addiction_type": "string (alcohol/drugs/nicotine/gaming)",
  "days_in_recovery": "integer (≥0)"
}
```

### Output Schema - CravingForecastResponse

```json
{
  "user_id": "string",
  "forecast_timestamp": "string (ISO datetime)",
  "forecasts": [
    {
      "hour_offset": "integer (0-23)",
      "predicted_intensity": "float (0-10)",
      "confidence_lower": "float (0-10)",
      "confidence_upper": "float (0-10)",
      "risk_level": "string (Low/Medium/High)"
    }
  ],
  "peak_risk_hours": "[array of integers 0-23]",
  "trigger_sensitivity": [
    {
      "trigger_name": "string",
      "correlation": "float (-1 to 1)",
      "sensitivity_level": "string (Low/Medium/High)",
      "impact_score": "float (0-100)",
      "recommendation": "string"
    }
  ],
  "time_patterns": [
    {
      "hour": "integer (0-23)",
      "average_intensity": "float (0-10)",
      "risk_level": "string (Low/Medium/High)"
    }
  ],
  "intervention_recommendations": [
    {
      "time_offset": "integer",
      "intervention_type": "string",
      "description": "string",
      "priority": "string (Low/Medium/High)",
      "trigger_based": "boolean"
    }
  ],
  "model_confidence": "float (0-1)",
  "data_sufficiency": "string (Low/Medium/High)",
  "next_high_risk_period": "string (HH:MM) [optional]"
}
```

## 🎯 Risk Categories

### Craving Intensity Levels

| Level | Score Range | Description | Forecast Color | Action Required |
|-------|-------------|-------------|----------------|-----------------|
| **Low** | 0-4 | Minimal craving, good control | 🟢 Green | Continue routine |
| **Medium** | 4.1-7 | Moderate craving, increased attention needed | 🟡 Yellow | Monitor closely |
| **High** | 7.1-10 | Strong craving, immediate intervention needed | 🔴 Red | Urgent action |

### Confidence Levels

| Level | Data Points | Description | Model Reliability |
|-------|-------------|-------------|-------------------|
| **Low** | < 72 | Limited data, basic patterns | 45% confidence |
| **Medium** | 72-168 | Moderate data, emerging patterns | 65% confidence |
| **High** | 168+ | Rich data, reliable patterns | 85% confidence |

### Time-Based Risk Assessment

- **Peak Risk Hours**: Times of day when user typically experiences highest cravings
- **Intervention Windows**: Optimal times for preventive measures
- **Recovery Stage Adjustments**: Early recovery (< 30 days) has higher baseline risk

## 🔬 Risk Factors

### Primary Triggers (Based on Clinical Research)

#### **Stress Level Impact**
- **High Sensitivity** (0.6-0.8): Stress directly correlates with craving intensity
- **Mechanism**: Cortisol elevation increases addiction vulnerability
- **Intervention**: Stress management techniques, breathing exercises

#### **Mood Score Influence** 
- **Inverse Correlation** (-0.5 to -0.7): Lower mood = higher cravings
- **Mechanism**: Emotional regulation difficulties trigger substance seeking
- **Intervention**: Mood therapy, positive activity scheduling

#### **Sleep Quality Effects**
- **Moderate Impact** (0.3-0.5): Poor sleep increases next-day cravings
- **Mechanism**: Sleep deprivation affects impulse control
- **Intervention**: Sleep hygiene, consistent sleep schedule

#### **Environmental Triggers**
- **Location Risk**: High-risk environments increase craving by 1.5 points
- **Social Context**: Risky social situations add 1.5 points, supportive contexts reduce by 0.8
- **Work Stress**: Professional pressure adds 1.0 point baseline

### Addiction-Specific Patterns

#### **Alcohol Addiction**
- **Peak Hours**: 17:00-21:00 (Evening social hours)
- **Stress Sensitivity**: 0.7 (High)
- **Social Impact**: 0.5 (Moderate)

#### **Drug Addiction**
- **Peak Hours**: 14:00-16:00, 22:00-23:00 (Afternoon & late night)
- **Stress Sensitivity**: 0.8 (Very High)
- **Social Impact**: 0.6 (High)

#### **Nicotine Addiction**
- **Peak Hours**: 08:00, 12:00, 16:00, 20:00 (After meals & breaks)
- **Stress Sensitivity**: 0.6 (Moderate)
- **Social Impact**: 0.4 (Lower)

#### **Gaming Addiction**
- **Peak Hours**: 15:00-21:00 (Afternoon to evening)
- **Stress Sensitivity**: 0.5 (Moderate)
- **Social Impact**: 0.3 (Lower)

## 🧪 Testing Examples

### Example 1: High-Risk Alcohol User

```json
{
  "user_id": "high_risk_alcohol_001",
  "historical_data": [
    {
      "timestamp": "2025-06-20T08:00:00",
      "craving_intensity": 2.0,
      "stress_level": 3.0,
      "mood_score": 7.0,
      "sleep_quality": 4.0,
      "location_risk": false,
      "social_trigger": false,
      "work_stress": false
    },
    {
      "timestamp": "2025-06-20T18:00:00",
      "craving_intensity": 8.5,
      "stress_level": 9.0,
      "mood_score": 2.0,
      "sleep_quality": 4.0,
      "location_risk": true,
      "social_trigger": true,
      "work_stress": false
    },
    {
      "timestamp": "2025-06-21T19:00:00",
      "craving_intensity": 7.0,
      "stress_level": 7.5,
      "mood_score": 4.0,
      "sleep_quality": 3.0,
      "location_risk": true,
      "social_trigger": false,
      "work_stress": true
    }
  ],
  "current_triggers": {
    "current_time": "2025-06-24T17:30:00",
    "stress_level": 8.0,
    "mood_score": 3.0,
    "sleep_quality": 2.0,
    "location_risk": true,
    "social_trigger": true,
    "work_stress": true,
    "fatigue": true,
    "hunger": false,
    "pain": false,
    "social_context": "risky",
    "hours_since_checkin": 8.0,
    "days_since_therapy": 10,
    "medication_taken": false
  },
  "addiction_type": "alcohol",
  "days_in_recovery": 15
}
```

**Expected Output**: High-risk predictions (8-9/10) for evening hours, urgent intervention recommendations.

### Example 2: Stable Recovery Nicotine User

```json
{
  "user_id": "stable_nicotine_002",
  "historical_data": [
    {
      "timestamp": "2025-06-22T08:00:00",
      "craving_intensity": 4.0,
      "stress_level": 3.0,
      "mood_score": 7.0,
      "sleep_quality": 4.0
    },
    {
      "timestamp": "2025-06-22T12:00:00",
      "craving_intensity": 6.0,
      "stress_level": 4.0,
      "mood_score": 6.0,
      "sleep_quality": 4.0
    },
    {
      "timestamp": "2025-06-22T20:00:00",
      "craving_intensity": 5.0,
      "stress_level": 5.0,
      "mood_score": 6.0,
      "sleep_quality": 4.0
    }
  ],
  "current_triggers": {
    "current_time": "2025-06-24T10:00:00",
    "stress_level": 4.0,
    "mood_score": 7.0,
    "sleep_quality": 4.0,
    "location_risk": false,
    "social_trigger": false,
    "work_stress": false,
    "fatigue": false,
    "hunger": false,
    "pain": false,
    "social_context": "supportive",
    "hours_since_checkin": 1.0,
    "days_since_therapy": 2,
    "medication_taken": true
  },
  "addiction_type": "nicotine",
  "days_in_recovery": 120
}
```

**Expected Output**: Low-medium risk predictions (3-6/10), routine maintenance recommendations.

### Example 3: New User with Minimal Data

```json
{
  "user_id": "new_user_003",
  "historical_data": [
    {
      "timestamp": "2025-06-24T08:00:00",
      "craving_intensity": 5.0,
      "stress_level": 6.0,
      "mood_score": 5.0,
      "sleep_quality": 3.0
    }
  ],
  "current_triggers": {
    "current_time": "2025-06-24T15:00:00",
    "stress_level": 7.0,
    "mood_score": 4.0,
    "sleep_quality": 3.0,
    "location_risk": false,
    "social_trigger": false,
    "work_stress": true,
    "fatigue": true,
    "hunger": false,
    "pain": false,
    "social_context": "alone",
    "hours_since_checkin": 3.0,
    "days_since_therapy": 1,
    "medication_taken": true
  },
  "addiction_type": "drugs",
  "days_in_recovery": 5
}
```

**Expected Output**: Default pattern-based predictions, low confidence, recommendations to build data history.
### Key Components

#### **CravingForecastEngine**
- **ARIMA/SARIMAX Models**: Automatic time series forecasting
- **Trigger Analysis**: Correlation and sensitivity calculations
- **Pattern Recognition**: Hourly and daily pattern identification
- **Intervention Logic**: Time and trigger-based recommendations

#### **Default Patterns**
Research-based default craving patterns for cold-start scenarios:
- Hourly intensity patterns by addiction type
- Trigger sensitivity coefficients
- Social impact factors

## 🆘 Support & Troubleshooting

### Common Issues

**Q: API returns 422 Unprocessable Entity**
A: Check that all required fields are included and within valid ranges. Ensure timestamps are in ISO format.

**Q: ARIMA model fails with "not enough data"**
A: The API automatically falls back to default patterns. Collect more historical data (24+ entries) for ARIMA forecasting.

**Q: Predictions seem inaccurate**
A: 
- Ensure historical data spans multiple days and includes various scenarios
- Check that current_triggers accurately reflect user's current state
- Verify addiction_type matches the user's primary addiction

**Q: High memory usage**
A: Consider implementing data pagination for users with extensive historical data (1000+ entries).

### Getting Help

- 📧 **Email**: vivekr.qriocity@gmail.com
- 💻 **GitHub**: [https://github.com/vivekraina7](https://github.com/vivekraina7)
- 📖 **Documentation**: [API Documentation](http://localhost:8001/docs)

## 🙏 Acknowledgments

- **Research Foundation**: Based on clinical studies from SAMHSA, NIH, and peer-reviewed addiction research
- **Time Series Methods**: Utilizes proven ARIMA/SARIMAX statistical models
- **Libraries**: Built with FastAPI, pmdarima, statsmodels, pandas, and scikit-learn
- **Clinical Validation**: Patterns derived from evidence-based addiction treatment research

