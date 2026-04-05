# 😴 Sleep Quality Assessment API for Addiction Recovery

A comprehensive FastAPI-based sleep quality assessment system specifically designed for addiction recovery, featuring AI-powered personalized recommendations using Google Gemini and evidence-based sleep analysis.

## 🚀 Quick Start Instructions

### Prerequisites
- Python 3.8+
- Google Gemini API Key

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/vivekraina7/sleep-assessment-api
cd sleep-assessment-api
```

2. **Install dependencies:**
```bash
pip install fastapi uvicorn pydantic pandas numpy google-genai
```

3. **Set up environment variables:**
```bash
# Create .env file
export GEMINI_API_KEY="your_gemini_api_key_here"
```

4. **Get Gemini API Key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a free API key

5. **Run the application:**
```bash
python main.py
# OR
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

6. **Access the API:**
   - API Base URL: `http://localhost:8000`
   - Interactive Docs: `http://localhost:8000/docs`
   - JSON Schema: `http://localhost:8000/redoc`

## 📚 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/assess-sleep` | Main sleep quality assessment endpoint |
| `GET` | `/sleep-questionnaire-template` | Get questionnaire template with options |
| `POST` | `/user-profile` | Create/update user profile |
| `GET` | `/health` | Health check endpoint |

### Primary Endpoint Details

#### `POST /assess-sleep`
Analyzes sleep questionnaire responses and provides addiction-specific recommendations.

**Request Body:**
- `questionnaire`: Sleep questionnaire responses
- `user_profile`: User's addiction and demographic information

**Response:**
- Complete sleep quality analysis
- Addiction-specific insights
- Personalized AI-generated recommendations
- Risk assessment for relapse

## 💾 Input/Output Schemas

### User Profile Schema
```json
{
  "user_id": "string",
  "addiction_type": "alcohol|opioids|stimulants|marijuana",
  "recovery_stage": "detox|early_recovery|long_term",
  "days_sober": "integer (optional)",
  "age": "integer (optional)",
  "gender": "string (optional)",
  "medical_conditions": ["string array (optional)"]
}
```

### Sleep Questionnaire Schema
```json
{
  "user_id": "string",
  "assessment_period": "last_week|last_month",
  
  "typical_bedtime": "string (e.g., '11:30 PM', 'midnight')",
  "typical_wake_time": "string (e.g., '7:00 AM')",
  "time_to_fall_asleep": "<15min|15-30min|30-60min|>60min",
  "sleep_quality_rating": "integer (1-10)",
  "hours_of_actual_sleep": "float",
  
  "wake_up_frequency": "never|1-2 times|3-4 times|5+ times",
  "difficulty_returning_to_sleep": "easy|somewhat hard|very hard",
  "early_morning_awakening": "boolean",
  
  "daytime_sleepiness": "integer (1-10)",
  "energy_level": "integer (1-10)",
  "concentration_issues": "never|sometimes|often|always",
  "mood_affected_by_sleep": "never|sometimes|often|always",
  
  "sleep_since_recovery": "much better|better|same|worse|much worse",
  "withdrawal_affecting_sleep": "boolean",
  "cravings_due_to_poor_sleep": "boolean",
  "sleep_medications": "nothing|prescription|otc|alcohol|other",
  
  "caffeine_daily": "none|1-2 cups|3-4 cups|5+ cups",
  "caffeine_timing": "morning|afternoon|evening|varies",
  "exercise_frequency": "never|1-2x/week|3-4x/week|daily",
  "screen_time_before_bed": "<30min|30-60min|1-2hrs|2+hrs",
  "stress_level": "integer (1-10)"
}
```

### Complete Response Schema
```json
{
  "sleep_metrics": {
    "total_sleep_time": "float (hours)",
    "estimated_time_in_bed": "float (hours)",
    "sleep_efficiency": "float (percentage)",
    "sleep_latency_minutes": "integer",
    "sleep_quality_rating": "integer (1-10)"
  },
  "quality_assessment": {
    "category": "excellent|good|fair|poor|very_poor",
    "issues": ["array of identified sleep problems"],
    "sleep_efficiency": "float",
    "improvement_potential": "high|moderate|low"
  },
  "addiction_analysis": {
    "addiction_type": "string",
    "common_issues": ["typical sleep issues for this addiction"],
    "typical_for_recovery_stage": "boolean",
    "expected_timeline": "string",
    "recovery_info": "string",
    "withdrawal_impact": "significant|minimal"
  },
  "risk_assessment": {
    "risk_level": "low|moderate|high",
    "risk_factors": ["array of risk factors"],
    "urgency": "monitor|immediate",
    "warning_signs": ["array of signs to watch for"]
  },
  "recommendations": {
    "immediate_actions": ["actionable steps for this week"],
    "lifestyle_changes": ["longer-term improvements"],
    "recovery_specific": ["addiction recovery considerations"],
    "when_to_seek_help": ["indicators for professional help"]
  },
  "gemini_guidance": "string (AI-generated personalized advice)"
}
```

## 🎯 Risk Categories

### Sleep Quality Categories

| Category | Description | Characteristics | Action Required |
|----------|-------------|-----------------|-----------------|
| **Excellent** | 🟢 Optimal sleep quality | Rating 8-10, efficiency >85%, latency <15min | Maintain current habits |
| **Good** | 🟡 Above average sleep | Rating 6-7, efficiency >75%, latency <30min | Minor improvements |
| **Fair** | 🟠 Below average sleep | Rating 4-5, efficiency >65%, some issues | Active intervention needed |
| **Poor** | 🔴 Significant problems | Rating 2-3, efficiency <65%, multiple issues | Immediate attention required |
| **Very Poor** | 🚨 Severe sleep disruption | Rating 1, very low efficiency, major dysfunction | Urgent professional help |

### Relapse Risk Assessment

| Risk Level | Characteristics | Intervention |
|------------|-----------------|--------------|
| **Low** | Good sleep quality, stable recovery | Continue monitoring |
| **Moderate** | Some sleep issues, manageable symptoms | Implement sleep hygiene strategies |
| **High** | Poor sleep + early recovery + high stress | Immediate support and intervention |

## 🔬 Risk Factors

### Scientific Basis for Sleep-Addiction Relationship

#### Sleep Disturbances in Recovery
- **Alcohol Recovery**: 61-91% experience insomnia during treatment
- **Opioid Recovery**: Severe insomnia common, improves over 1-3 months  
- **Stimulant Recovery**: Sleep patterns stabilize within 2-4 weeks
- **Marijuana Recovery**: REM rebound and vivid dreams for 1-2 weeks

#### Relapse Risk Factors
- **Poor Sleep Quality**: Increases craving intensity and frequency
- **Early Recovery**: Higher vulnerability during first 90 days
- **Sleep Medication Misuse**: Risk of transferring addiction
- **Persistent Insomnia**: Associated with 2x higher relapse risk

#### Recovery Timeline Expectations
- **Alcohol**: 2-6 months for sleep normalization
- **Opioids**: 1-3 months for significant improvement
- **Stimulants**: 2-4 weeks for stabilization
- **Marijuana**: 1-2 weeks for normalization

## 🧪 Testing Examples

### Example 1: Alcohol Recovery - Poor Sleep
```bash
curl -X POST "http://localhost:8000/assess-sleep" \
-H "Content-Type: application/json" \
-d '{
  "questionnaire": {
    "user_id": "test_user_1",
    "assessment_period": "last_week",
    "typical_bedtime": "midnight",
    "typical_wake_time": "6:30 AM",
    "time_to_fall_asleep": "30-60min",
    "sleep_quality_rating": 3,
    "hours_of_actual_sleep": 5.0,
    "wake_up_frequency": "3-4 times",
    "difficulty_returning_to_sleep": "very hard",
    "early_morning_awakening": true,
    "daytime_sleepiness": 8,
    "energy_level": 2,
    "concentration_issues": "often",
    "mood_affected_by_sleep": "often",
    "sleep_since_recovery": "worse",
    "withdrawal_affecting_sleep": true,
    "cravings_due_to_poor_sleep": true,
    "sleep_medications": "nothing",
    "caffeine_daily": "3-4 cups",
    "caffeine_timing": "evening",
    "exercise_frequency": "never",
    "screen_time_before_bed": "2+hrs",
    "stress_level": 9
  },
  "user_profile": {
    "user_id": "test_user_1",
    "addiction_type": "alcohol",
    "recovery_stage": "early_recovery",
    "days_sober": 28,
    "age": 32,
    "gender": "male"
  }
}'
```

### Example 2: Stimulant Recovery - Improving Sleep
```bash
curl -X POST "http://localhost:8000/assess-sleep" \
-H "Content-Type: application/json" \
-d '{
  "questionnaire": {
    "user_id": "test_user_2",
    "assessment_period": "last_week",
    "typical_bedtime": "11:00 PM",
    "typical_wake_time": "7:00 AM",
    "time_to_fall_asleep": "15-30min",
    "sleep_quality_rating": 6,
    "hours_of_actual_sleep": 7.0,
    "wake_up_frequency": "1-2 times",
    "difficulty_returning_to_sleep": "somewhat hard",
    "early_morning_awakening": false,
    "daytime_sleepiness": 4,
    "energy_level": 6,
    "concentration_issues": "sometimes",
    "mood_affected_by_sleep": "sometimes",
    "sleep_since_recovery": "better",
    "withdrawal_affecting_sleep": false,
    "cravings_due_to_poor_sleep": false,
    "sleep_medications": "nothing",
    "caffeine_daily": "1-2 cups",
    "caffeine_timing": "morning",
    "exercise_frequency": "3-4x/week",
    "screen_time_before_bed": "30-60min",
    "stress_level": 5
  },
  "user_profile": {
    "user_id": "test_user_2",
    "addiction_type": "stimulants",
    "recovery_stage": "early_recovery",
    "days_sober": 45,
    "age": 28,
    "gender": "female"
  }
}'
```

### Example 3: Opioid Recovery - Seeking Help
```bash
curl -X POST "http://localhost:8000/assess-sleep" \
-H "Content-Type: application/json" \
-d '{
  "questionnaire": {
    "user_id": "test_user_3",
    "assessment_period": "last_week",
    "typical_bedtime": "10:30 PM",
    "typical_wake_time": "6:00 AM",
    "time_to_fall_asleep": ">60min",
    "sleep_quality_rating": 2,
    "hours_of_actual_sleep": 4.5,
    "wake_up_frequency": "5+ times",
    "difficulty_returning_to_sleep": "very hard",
    "early_morning_awakening": true,
    "daytime_sleepiness": 9,
    "energy_level": 1,
    "concentration_issues": "always",
    "mood_affected_by_sleep": "always",
    "sleep_since_recovery": "much worse",
    "withdrawal_affecting_sleep": true,
    "cravings_due_to_poor_sleep": true,
    "sleep_medications": "prescription",
    "caffeine_daily": "5+ cups",
    "caffeine_timing": "varies",
    "exercise_frequency": "never",
    "screen_time_before_bed": "1-2hrs",
    "stress_level": 10
  },
  "user_profile": {
    "user_id": "test_user_3",
    "addiction_type": "opioids",
    "recovery_stage": "detox",
    "days_sober": 14,
    "age": 35,
    "gender": "male",
    "medical_conditions": ["chronic_pain"]
  }
}'
```

### Example 4: Get Questionnaire Template
```bash
curl -X GET "http://localhost:8000/sleep-questionnaire-template"
```

### Example 5: Health Check
```bash
curl -X GET "http://localhost:8000/health"
```

### Expected Response Structure
```json
{
  "sleep_metrics": {
    "total_sleep_time": 5.0,
    "estimated_time_in_bed": 8.0,
    "sleep_efficiency": 62.5,
    "sleep_latency_minutes": 45,
    "sleep_quality_rating": 3
  },
  "quality_assessment": {
    "category": "poor",
    "issues": [
      "difficulty_falling_asleep",
      "frequent_night_awakenings", 
      "early_morning_awakening",
      "excessive_daytime_sleepiness",
      "poor_sleep_efficiency"
    ],
    "sleep_efficiency": 62.5,
    "improvement_potential": "high"
  },
  "addiction_analysis": {
    "addiction_type": "alcohol",
    "common_issues": ["frequent_awakenings", "early_morning_awakening", "poor_rem_sleep"],
    "typical_for_recovery_stage": true,
    "expected_timeline": "2-6 months",
    "recovery_info": "Sleep gradually improves over 3-6 months of sobriety",
    "withdrawal_impact": "significant"
  },
  "risk_assessment": {
    "risk_level": "high",
    "risk_factors": [
      "poor_sleep_quality",
      "sleep_related_cravings", 
      "early_recovery_vulnerability",
      "high_stress_level",
      "late_caffeine_use"
    ],
    "urgency": "immediate",
    "warning_signs": [
      "Thoughts of using substances to help sleep",
      "Sleep getting worse after 60+ days sober"
    ]
  },
  "recommendations": {
    "immediate_actions": [
      "Stop caffeine after 2 PM to improve sleep quality",
      "Reduce screen time before bed to 30 minutes maximum"
    ],
    "lifestyle_changes": [
      "Start with 15-minute daily walks to improve sleep",
      "Practice stress reduction techniques"
    ],
    "recovery_specific": [
      "Sleep issues are normal in early recovery - be patient with yourself",
      "For alcohol recovery, sleep typically improves over 2-6 months"
    ],
    "when_to_seek_help": [
      "If sleep doesn't improve after 90 days sober",
      "If having thoughts of relapse due to sleep issues"
    ]
  },
  "gemini_guidance": "At 28 days sober from alcohol, experiencing sleep difficulties is completely normal and expected. Your brain is readjusting to functioning without alcohol..."
}
```

## 🛠️ Development

### Project Structure
```
sleep-assessment-api/
├── main.py              # FastAPI application
├── requirements.txt     # Dependencies
├── .env                # Environment variables
├── README.md           # This file
└── tests/              # Test files
```

### Running Tests
```bash
# Install test dependencies
pip install pytest httpx

# Run tests
pytest tests/
```

## 📞 Support & Contact

- **Developer**: Vivek Raina
- **Email**: [vivekr.qriocity@gmail.com](mailto:vivekr.qriocity@gmail.com)
- **GitHub**: [https://github.com/vivekraina7](https://github.com/vivekraina7)
- **Issues**: Please report bugs and feature requests via GitHub Issues

## 🔧 Configuration

### Environment Variables
```bash
# Required
GEMINI_API_KEY="your_gemini_api_key"

# Optional
API_HOST="0.0.0.0"                # Defaults to 0.0.0.0
API_PORT="8000"                   # Defaults to 8000
```

### Rate Limits
- **Gemini API**: 15 requests/minute (free tier)

## 📈 Sleep Quality Scoring

### Sleep Efficiency Calculation
```
Sleep Efficiency = (Actual Sleep Time / Time in Bed) × 100
```

### Quality Categories Criteria
- **Excellent**: Rating 8-10 + Efficiency >85% + Latency <15min
- **Good**: Rating 6-7 + Efficiency >75% + Latency <30min  
- **Fair**: Rating 4-5 + Efficiency >65%
- **Poor**: Rating 2-3 + Efficiency <65%
- **Very Poor**: Rating 1 + Very low efficiency

## 🔍 Addiction-Specific Insights

### Alcohol Recovery Sleep Patterns
- **Common Issues**: Fragmented sleep, early awakening, reduced REM
- **Timeline**: 2-6 months for normalization
- **Key Interventions**: Avoid alcohol as sleep aid, manage anxiety

### Opioid Recovery Sleep Patterns  
- **Common Issues**: Severe insomnia, restless legs, muscle discomfort
- **Timeline**: 1-3 months for improvement
- **Key Interventions**: Address pain management, avoid sedatives

### Stimulant Recovery Sleep Patterns
- **Common Issues**: Initial hypersomnia, then difficulty falling asleep
- **Timeline**: 2-4 weeks for stabilization
- **Key Interventions**: Regulate sleep schedule, manage depression

### Marijuana Recovery Sleep Patterns
- **Common Issues**: Vivid dreams, difficulty falling asleep, night sweats
- **Timeline**: 1-2 weeks for improvement
- **Key Interventions**: Expect temporary sleep disruption, use relaxation techniques

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⚠️ Disclaimer

This API is designed for educational and supportive purposes in addiction recovery. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for sleep disorders and addiction recovery.

---

**Made with ❤️ for addiction recovery support**