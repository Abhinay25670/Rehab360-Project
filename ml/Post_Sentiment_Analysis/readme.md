# 📊 Recovery Sentiment Analysis API

A FastAPI service that analyzes sentiment in user posts and journal entries with specialized insights for addiction recovery contexts. Uses hybrid approach combining VADER, TextBlob, and recovery-specific keyword analysis.

## 🌟 Features

- **🧠 Hybrid Sentiment Analysis** - VADER + TextBlob for comprehensive emotion detection
- **🎯 Recovery-Specific Keywords** - Specialized vocabulary for addiction recovery contexts
- **📈 Emotional Intensity Scoring** - Measures strength of emotional expression (0-1 scale)
- **🎭 Emotion Classification** - Identifies dominant emotions (joy, hope, despair, etc.)
- **⚠️ Risk Assessment** - Detects warning signs and high-risk language patterns
- **📋 Recovery Stage Detection** - Identifies recovery phase based on language patterns
- **💡 Actionable Insights** - Generates recovery-specific observations and recommendations

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- pip package manager

### 1. Install Dependencies

```bash
pip install fastapi uvicorn textblob nltk pydantic
```

### 2. Start the API

```bash
uvicorn main:app --host 0.0.0.0 --port 8005 --reload
```

API will be available at: `http://localhost:8005`

### 3. Test the API

```bash
# Health check
curl http://localhost:8005/health

# Analyze sentiment
curl -X POST "http://localhost:8005/analyze-sentiment" \
     -H "Content-Type: application/json" \
     -d '{
       "text": "90 days clean today! Feeling grateful for my family support.",
       "user_id": "user123"
     }'

# Get test examples
curl http://localhost:8005/test-examples
```

Visit `http://localhost:8005/docs` for interactive API documentation.

## 📚 API Endpoints

### Core Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze-sentiment` | **Analyze individual text for sentiment and recovery insights** |
| `POST` | `/batch-analyze` | Analyze multiple texts at once |
| `GET` | `/test-examples` | Get sample inputs for testing |
| `GET` | `/health` | Service health check |

### Main Endpoint Usage

**POST** `/analyze-sentiment`

**Request Body:**
```json
{
  "text": "Day 5 without alcohol. I'm struggling but trying to stay strong.",
  "user_id": "user123",
  "timestamp": "2025-01-15T10:30:00"
}
```

**Response:**
```json
{
  "overall_sentiment": 0.2156,
  "emotional_intensity": 0.6,
  "recovery_progress": 0.7,
  "dominant_emotion": "mixed_positive",
  "recovery_indicators": {
    "positive": ["strong"],
    "negative": ["struggling"],
    "neutral": ["day 5"],
    "milestones": ["5 days"],
    "warning_signs": []
  },
  "mood_category": "challenging_but_hopeful",
  "recovery_stage": "early_recovery",
  "detailed_scores": {
    "vader": {"neg": 0.2, "neu": 0.5, "pos": 0.3, "compound": 0.2156},
    "textblob": {"polarity": 0.1, "subjectivity": 0.6},
    "recovery_keyword_score": 0.7
  },
  "insights": [
    "Shows awareness of struggle while maintaining commitment",
    "Milestone achievement mentioned: 5 days"
  ],
  "alerts": [],
  "recommended_actions": []
}
```

## 🎯 Example Analysis Results

### 1. Milestone Celebration

**Input:**
```json
{
  "text": "90 days clean today! I never thought I'd make it this far. Feeling grateful for my family's support and excited about the future."
}
```

**Output:**
```json
{
  "overall_sentiment": 0.8854,
  "emotional_intensity": 0.8,
  "recovery_progress": 0.95,
  "dominant_emotion": "joy",
  "mood_category": "celebration_gratitude",
  "recovery_stage": "stable_recovery",
  "insights": [
    "Milestone achievement mentioned: 90 days",
    "Support system engagement: family",
    "Strong recovery commitment language detected"
  ]
}
```

### 2. Crisis Warning Signs

**Input:**
```json
{
  "text": "Everything feels pointless right now. I keep thinking about using again. Maybe I'm just not strong enough for this."
}
```

**Output:**
```json
{
  "overall_sentiment": -0.7269,
  "emotional_intensity": 0.9,
  "recovery_progress": 0.1,
  "dominant_emotion": "despair",
  "mood_category": "high_risk_despair",
  "recovery_stage": "crisis_period",
  "alerts": [
    "HIGH RISK: Warning signs detected",
    "URGENT: Substance use mentioned"
  ],
  "recommended_actions": [
    "Immediate support contact recommended",
    "Crisis intervention may be needed"
  ]
}
```

### 3. Routine Maintenance

**Input:**
```json
{
  "text": "Had therapy today. We talked about triggers and coping strategies. Did some grocery shopping."
}
```

**Output:**
```json
{
  "overall_sentiment": 0.0516,
  "emotional_intensity": 0.3,
  "recovery_progress": 0.6,
  "dominant_emotion": "neutral_stable",
  "mood_category": "routine_maintenance",
  "recovery_stage": "maintenance_phase",
  "insights": [
    "Support system engagement: therapy",
    "Engaging in therapeutic activities"
  ]
}
```

## 🎭 Emotion Categories

### Dominant Emotions
- **joy** - High positive sentiment with strong recovery indicators
- **hope** - Positive sentiment with forward-looking language
- **gratitude_amazement** - High gratitude with surprise at progress
- **neutral_stable** - Balanced emotional state
- **sadness** - Negative sentiment without crisis indicators
- **despair** - Very negative sentiment with warning signs

### Mood Categories
- **celebration_gratitude** - Major milestone or achievement
- **stable_positive** - Consistent positive recovery language
- **routine_maintenance** - Normal daily recovery activities
- **challenging_but_hopeful** - Difficulties with maintained commitment
- **concerning_period** - Some negative indicators present
- **high_risk_despair** - Multiple warning signs detected

### Recovery Stages
- **long_term_recovery** - Years of sobriety mentioned
- **stable_recovery** - Months of progress indicated
- **early_recovery** - Weeks or days mentioned
- **growth_phase** - High recovery progress scores
- **maintenance_phase** - Stable ongoing recovery
- **crisis_period** - High-risk language detected

## 🛠️ Integration Examples

### Python Client

```python
import requests

def analyze_journal_entry(text, user_id=None):
    response = requests.post("http://localhost:8005/analyze-sentiment", json={
        "text": text,
        "user_id": user_id
    })
    
    if response.status_code == 200:
        result = response.json()
        
        print(f"Sentiment: {result['overall_sentiment']}")
        print(f"Emotion: {result['dominant_emotion']}")
        print(f"Recovery Progress: {result['recovery_progress']}")
        
        if result['alerts']:
            print("⚠️ ALERTS:", result['alerts'])
        
        return result
    else:
        print("Analysis failed:", response.text)

# Example usage
analyze_journal_entry("30 days sober today! Feeling proud of my progress.")
```

### JavaScript/Node.js Client

```javascript
async function analyzeSentiment(text, userId = null) {
    try {
        const response = await fetch('http://localhost:8005/analyze-sentiment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                user_id: userId
            })
        });
        
        const result = await response.json();
        
        console.log('Sentiment:', result.overall_sentiment);
        console.log('Emotion:', result.dominant_emotion);
        console.log('Recovery Progress:', result.recovery_progress);
        
        if (result.alerts.length > 0) {
            console.log('⚠️ ALERTS:', result.alerts);
        }
        
        return result;
    } catch (error) {
        console.error('Analysis failed:', error);
    }
}

// Example usage
analyzeSentiment("Struggling with cravings today but going to a meeting.");
```

### Batch Analysis

```python
import requests

texts_to_analyze = [
    {"text": "Day 1 of recovery. Feeling nervous but determined.", "user_id": "user1"},
    {"text": "6 months clean! Life is getting so much better.", "user_id": "user2"},
    {"text": "Having a tough day. Everything feels overwhelming.", "user_id": "user3"}
]

response = requests.post("http://localhost:8005/batch-analyze", json=texts_to_analyze)
results = response.json()

for i, result in enumerate(results['results']):
    print(f"Text {i+1}: {result['analysis']['dominant_emotion']}")
```

## 🔧 Configuration

### Recovery Keywords

The API uses predefined recovery-specific vocabularies:

**Positive Recovery Keywords:**
- `sober`, `clean`, `recovery`, `grateful`, `hope`, `strong`, `progress`
- `support`, `therapy`, `healing`, `growth`, `commitment`, `sponsor`
- `meeting`, `step`, `serenity`, `peace`, `proud`, `achievement`

**Negative Recovery Keywords:**
- `relapse`, `craving`, `using`, `drinking`, `addiction`, `triggered`
- `struggling`, `hopeless`, `alone`, `pointless`, `failure`, `weak`

**Milestone Detection:**
- Automatically detects: "X days", "X weeks", "X months", "X years"

### Risk Assessment

**High Risk Indicators:**
- Mentions of substance use ("using", "drinking")
- Suicidal language ("pointless", "give up")
- Isolation terms ("alone", "nobody cares")
- Relapse thoughts ("thinking about using")

## 📊 Response Schema

### SentimentResponse

| Field | Type | Description |
|-------|------|-------------|
| `overall_sentiment` | float | VADER compound score (-1 to 1) |
| `emotional_intensity` | float | Absolute polarity (0 to 1) |
| `recovery_progress` | float | Recovery keyword score (0 to 1) |
| `dominant_emotion` | string | Primary emotion category |
| `recovery_indicators` | object | Categorized recovery keywords found |
| `mood_category` | string | Overall mood classification |
| `recovery_stage` | string | Inferred recovery phase |
| `detailed_scores` | object | Raw scores from all analyzers |
| `insights` | array | Generated observations |
| `alerts` | array | Risk warnings (if any) |
| `recommended_actions` | array | Suggested interventions (if needed) |

## 🧪 Testing

### Manual Testing

```bash
# Test positive recovery sentiment
curl -X POST "http://localhost:8005/analyze-sentiment" \
     -H "Content-Type: application/json" \
     -d '{"text": "One year sober today! Thank you to everyone who believed in me."}'

# Test crisis detection
curl -X POST "http://localhost:8005/analyze-sentiment" \
     -H "Content-Type: application/json" \
     -d '{"text": "I cant take this anymore. Thinking about using again."}'

# Test neutral maintenance
curl -X POST "http://localhost:8005/analyze-sentiment" \
     -H "Content-Type: application/json" \
     -d '{"text": "Went to my AA meeting today. Discussed step 4 with my sponsor."}'
```

### Expected Behaviors

**Positive Recovery Text:**
- `overall_sentiment` > 0.3
- `recovery_progress` > 0.7
- `dominant_emotion` in ["joy", "hope", "gratitude_amazement"]
- No alerts or recommended actions

**Crisis Text:**
- `overall_sentiment` < -0.5
- `recovery_progress` < 0.3
- `alerts` contains risk warnings
- `recommended_actions` suggests immediate intervention

**Neutral Maintenance:**
- `overall_sentiment` between -0.2 and 0.2
- `recovery_progress` around 0.5-0.7
- `mood_category` = "routine_maintenance"

## 🚀 Production Deployment

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY main.py .

EXPOSE 8005

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8005"]
```

### Environment Variables

```bash
# Optional configuration
export API_PORT=8005
export API_HOST=0.0.0.0
export LOG_LEVEL=info
```

### Health Monitoring

Monitor the `/health` endpoint for:
- VADER analyzer functionality
- TextBlob operations
- Recovery keyword loading
- Overall service status

## ⚠️ Important Notes

### Limitations

- **Not a replacement for professional mental health assessment**
- **Text-based analysis only** - cannot detect tone, context, or sarcasm perfectly
- **English language optimized** - may not work well with other languages
- **Recovery-focused** - best suited for addiction recovery contexts

### Privacy Considerations

- **No data storage** - API analyzes text and returns results without saving
- **Stateless design** - each request is independent
- **User ID optional** - can be omitted for anonymous analysis

### Clinical Integration

- Use insights to **supplement**, not replace, professional assessment
- High-risk alerts should trigger appropriate clinical protocols
- Consider cultural and individual context when interpreting results

---

**🧠 This API provides automated emotional intelligence for recovery support platforms, helping identify mood patterns and potential crisis situations in real-time.**

**📞 For technical support: vivekr.qriocity@gmail.com**