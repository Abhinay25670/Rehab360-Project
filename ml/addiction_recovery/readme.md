# 🍎 Addiction Recovery Nutrition Tracker API

A comprehensive FastAPI-based nutrition tracking system specifically designed for addiction recovery, featuring AI-powered food parsing and personalized recommendations using Google Gemini and USDA nutritional data.

## 🚀 Quick Start Instructions

### Prerequisites
- Python 3.8+
- Google Gemini API Key
- USDA FoodData Central API Key (optional, has demo key)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/vivekraina7/nutrition-tracker-api
cd nutrition-tracker-api
```

2. **Install dependencies:**
```bash
pip install fastapi uvicorn requests pandas numpy google-genai pydantic
```

3. **Set up environment variables:**
```bash
# Create .env file
export GEMINI_API_KEY="your_gemini_api_key_here"
export USDA_API_KEY="your_usda_api_key_here"  # Optional, defaults to DEMO_KEY
```

4. **Get API Keys:**
   - **Gemini API**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **USDA API**: Visit [api.data.gov](https://api.data.gov/signup/) (free)

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
| `POST` | `/analyze-nutrition` | Main nutrition analysis endpoint |
| `POST` | `/user-profile` | Create/update user profile |
| `GET` | `/health` | Health check endpoint |

### Primary Endpoint Details

#### `POST /analyze-nutrition`
Analyzes food intake and provides addiction-specific nutritional recommendations.

**Request Body:**
- `food_input`: Food intake text and metadata
- `user_profile`: User's addiction and demographic information

**Response:**
- Complete nutritional analysis
- Addiction-specific insights
- Personalized recommendations
- Recovery nutrition score

## 💾 Input/Output Schemas

### User Profile Schema
```json
{
  "user_id": "string",
  "addiction_type": "alcohol|opioids|stimulants|marijuana",
  "recovery_stage": "detox|early_recovery|long_term",
  "age": "integer (18-100)",
  "gender": "male|female|other",
  "weight": "float (kg)",
  "height": "float (cm)",
  "activity_level": "sedentary|moderate|active",
  "days_sober": "integer (optional)",
  "medical_conditions": ["string array (optional)"],
  "food_allergies": ["string array (optional)"],
  "budget_level": "low|moderate|high (optional)",
  "cooking_skill": "beginner|intermediate|advanced (optional)"
}
```

### Food Input Schema
```json
{
  "user_id": "string",
  "food_text": "string (natural language food description)",
  "meal_type": "breakfast|lunch|dinner|snack|general (optional)",
  "timestamp": "datetime (optional, defaults to now)"
}
```

### Complete Response Schema
```json
{
  "nutrition_analysis": {
    "daily_totals": {
      "calories": "float",
      "protein": "float (grams)",
      "carbohydrates": "float (grams)",
      "fiber": "float (grams)",
      "thiamine": "float (mg)",
      "folate": "float (mcg)",
      "magnesium": "float (mg)",
      "zinc": "float (mg)",
      "vitamin_c": "float (mg)",
      "calcium": "float (mg)",
      "iron": "float (mg)",
      "fat": "float (grams)"
    },
    "recovery_needs": {
      "// Same structure as daily_totals": "with addiction-specific requirements"
    },
    "deficiencies": {
      "nutrient_name": {
        "current": "float",
        "needed": "float", 
        "deficit": "float",
        "percentage_met": "float",
        "severity": "critical|moderate"
      }
    },
    "parsed_foods": [
      {
        "name": "string",
        "quantity": "float",
        "unit": "string",
        "cooking_method": "string"
      }
    ],
    "emotional_context": "string (AI-detected eating patterns)"
  },
  "addiction_specific_insights": {
    "addiction_type": "string",
    "recovery_stage": "string", 
    "key_deficiencies": ["array of critical nutrients"],
    "eating_pattern": "regular|irregular|rushed|mindful",
    "priority_nutrients": ["nutrients specific to addiction type"]
  },
  "recommendations": {
    "personalized_guidance": "string (AI-generated advice)",
    "immediate_actions": ["array of actionable steps"],
    "meal_timing_advice": "string (addiction-specific timing)"
  },
  "recovery_score": "float (0-100, percentage of nutritional needs met)"
}
```

## 🎯 Risk Categories

### Recovery Nutrition Score Ranges

| Score Range | Risk Level | Description | Action Required |
|-------------|------------|-------------|-----------------|
| **90-100** | 🟢 **Excellent** | Meeting >90% of recovery nutritional needs | Maintain current diet |
| **70-89** | 🟡 **Good** | Meeting 70-89% of nutritional requirements | Minor adjustments needed |
| **50-69** | 🟠 **Moderate Risk** | Significant nutritional gaps affecting recovery | Dietary intervention recommended |
| **30-49** | 🔴 **High Risk** | Severe deficiencies hindering recovery progress | Immediate nutritional support needed |
| **0-29** | 🚨 **Critical Risk** | Dangerous nutritional status threatening recovery | Emergency intervention required |

### Deficiency Severity Levels

| Severity | Threshold | Impact on Recovery |
|----------|-----------|-------------------|
| **Critical** | <50% of requirement | May trigger relapse, severe symptoms |
| **Moderate** | 50-79% of requirement | Slowed recovery, mood issues |
| **Mild** | 80-99% of requirement | Minor impact, preventive action needed |

## 🔬 Risk Factors

### Scientific Basis for Nutritional Requirements

#### Alcohol Addiction Recovery
- **Thiamine (3x normal)**: Prevents Wernicke-Korsakoff syndrome
- **Folate (2x normal)**: DNA repair and red blood cell formation
- **Magnesium (2.5x normal)**: Reduces anxiety, muscle cramps, sleep issues
- **Zinc (2x normal)**: Immune function and wound healing
- **Vitamin C (1.5x normal)**: Antioxidant support and immune function

#### Opioid Addiction Recovery  
- **Fiber (2x normal)**: Restores digestive function disrupted by opioids
- **Protein (1.4x normal)**: Muscle recovery and neurotransmitter production
- **Vitamin C (1.8x normal)**: Immune system support
- **Iron (1.5x normal)**: Often deficient, affects energy levels
- **Calcium (1.3x normal)**: Bone health and muscle function

#### Stimulant Addiction Recovery
- **Protein (1.5x normal)**: Muscle recovery from stimulant-induced catabolism
- **Calcium (2x normal)**: Dental and bone health restoration
- **Magnesium (1.8x normal)**: Nerve function and anxiety reduction
- **B-vitamins (1.6x normal)**: Energy metabolism restoration

#### Marijuana Addiction Recovery
- **Protein (1.2x normal)**: Muscle maintenance and appetite regulation
- **Fiber (1.3x normal)**: Digestive health normalization
- **Vitamin C (1.4x normal)**: Antioxidant support
- **Zinc (1.3x normal)**: Immune function and mood regulation

## 🧪 Testing Examples

### Example 1: Simple Food Input (Alcohol Recovery)
```bash
curl -X POST "http://localhost:8000/analyze-nutrition" \
-H "Content-Type: application/json" \
-d '{
  "food_input": {
    "user_id": "test_user_1",
    "food_text": "2 eggs, 1 slice whole wheat toast, 1 cup orange juice",
    "meal_type": "breakfast"
  },
  "user_profile": {
    "user_id": "test_user_1",
    "addiction_type": "alcohol",
    "recovery_stage": "early_recovery",
    "age": 32,
    "gender": "male",
    "weight": 75.0,
    "height": 175.0,
    "activity_level": "moderate",
    "days_sober": 45
  }
}'
```

### Example 2: Complex Emotional Eating (Stimulant Recovery)
```bash
curl -X POST "http://localhost:8000/analyze-nutrition" \
-H "Content-Type: application/json" \
-d '{
  "food_input": {
    "user_id": "test_user_2", 
    "food_text": "Had a really stressful day at work. Ended up stress eating around 3pm - probably ate half a bag of chips and some leftover pizza from the fridge. Skipped breakfast again because I felt nauseous. Been drinking way too much coffee today, lost count after 5 cups.",
    "meal_type": "general"
  },
  "user_profile": {
    "user_id": "test_user_2",
    "addiction_type": "stimulants", 
    "recovery_stage": "early_recovery",
    "age": 28,
    "gender": "female",
    "weight": 65.0,
    "height": 165.0,
    "activity_level": "sedentary",
    "days_sober": 30,
    "budget_level": "low",
    "cooking_skill": "beginner"
  }
}'
```

### Example 3: Opioid Recovery - Regular Meal
```bash
curl -X POST "http://localhost:8000/analyze-nutrition" \
-H "Content-Type: application/json" \
-d '{
  "food_input": {
    "user_id": "test_user_3",
    "food_text": "Lunch: grilled chicken salad with mixed greens, cherry tomatoes, 1 tablespoon olive oil dressing. 1 slice whole grain bread. Water to drink.",
    "meal_type": "lunch"
  },
  "user_profile": {
    "user_id": "test_user_3",
    "addiction_type": "opioids",
    "recovery_stage": "long_term", 
    "age": 35,
    "gender": "male",
    "weight": 80.0,
    "height": 180.0,
    "activity_level": "active",
    "days_sober": 365,
    "medical_conditions": ["constipation"],
    "cooking_skill": "intermediate"
  }
}'
```

### Example 4: Health Check
```bash
curl -X GET "http://localhost:8000/health"
```

### Expected Response Structure
```json
{
  "nutrition_analysis": {
    "daily_totals": {
      "calories": 245.6,
      "protein": 18.2,
      "thiamine": 0.15,
      "// ... other nutrients": 0
    },
    "deficiencies": {
      "thiamine": {
        "current": 0.15,
        "needed": 3.6,
        "deficit": 3.45,
        "percentage_met": 4.2,
        "severity": "critical"
      }
    }
  },
  "addiction_specific_insights": {
    "addiction_type": "alcohol",
    "key_deficiencies": ["thiamine", "folate", "magnesium"],
    "eating_pattern": "irregular"
  },
  "recommendations": {
    "personalized_guidance": "Your thiamine levels are critically low...",
    "immediate_actions": ["Add fortified cereal to next meal"],
    "meal_timing_advice": "Eat every 3-4 hours to maintain stable blood sugar"
  },
  "recovery_score": 25.8
}
```

## 🛠️ Development

### Project Structure
```
nutrition-tracker-api/
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
USDA_API_KEY="your_usda_api_key"  # Defaults to DEMO_KEY
API_HOST="0.0.0.0"                # Defaults to 0.0.0.0
API_PORT="8000"                   # Defaults to 8000
```

### Rate Limits
- **Gemini API**: 15 requests/minute (free tier)
- **USDA API**: 1000 requests/hour (free tier)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Made with ❤️ for addiction recovery support**