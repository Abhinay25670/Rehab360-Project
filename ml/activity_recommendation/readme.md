# 🎯 Personalized Activity Recommendation API

A FastAPI service that provides evidence-based activity suggestions based on mood, time of day, energy level, and personal preferences. Uses behavioral activation therapy principles and circadian rhythm awareness for optimal mental health support.

## 🌟 Features

- **🧠 Mood-Based Recommendations** - Activities tailored to 8 different mood states
- **⏰ Time-Aware Suggestions** - Considers circadian rhythms and daily energy patterns  
- **⚡ Energy Level Matching** - Matches activity intensity to current energy capacity
- **📍 Location-Aware** - Suggests activities based on where you are
- **🎯 Personalized Scoring** - Intelligent ranking based on multiple factors
- **🏥 Evidence-Based** - Activities from behavioral activation therapy research
- **📊 Detailed Instructions** - Step-by-step guidance for each activity
- **💡 Recovery-Focused** - Designed specifically for mental health and addiction recovery

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- pip package manager

### 1. Install Dependencies

```bash
pip install fastapi uvicorn pydantic
```

### 2. Start the API

```bash
uvicorn main:app --host 0.0.0.0 --port 8006 --reload
```

API will be available at: `http://localhost:8006`

### 3. Test the API

```bash
# Quick health check
curl http://localhost:8006/health

# Get activity recommendation
curl -X POST "http://localhost:8006/recommend-activity" \
     -H "Content-Type: application/json" \
     -d '{
       "mood": "depressed",
       "current_time": "09:30",
       "energy_level": "low",
       "duration_available": 20
     }'

# Quick suggestion
curl -X POST "http://localhost:8006/quick-suggestion?mood=anxious&energy=low"

# Get supported moods
curl http://localhost:8006/supported-moods
```

Visit `http://localhost:8006/docs` for interactive API documentation.

## 📚 API Endpoints

### Core Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/recommend-activity` | **Get personalized activity recommendations** |
| `POST` | `/quick-suggestion` | Get one immediate activity suggestion |
| `GET` | `/supported-moods` | List all supported mood types |
| `GET` | `/all-activities` | Browse all available activities |
| `GET` | `/health` | Service health check |

### Main Endpoint Usage

**POST** `/recommend-activity`

**Request Body:**
```json
{
  "mood": "depressed",
  "current_time": "14:30",
  "energy_level": "low",
  "location": "home",
  "preferences": ["indoor", "solo", "creative"],
  "duration_available": 30,
  "user_id": "user123"
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "activity_id": "journaling",
      "score": 0.89,
      "match_reasons": [
        "Perfect match for depressed mood",
        "Good timing for afternoon",
        "Energy level matches your capacity"
      ],
      "details": {
        "title": "Reflective Journaling",
        "description": "Write about thoughts, feelings, and experiences",
        "duration_min": 10,
        "duration_max": 30,
        "energy_required": "very_low",
        "location": "anywhere",
        "materials": ["notebook", "pen", "quiet_space"],
        "instructions": "Write freely about how you're feeling, what you're grateful for, or what's on your mind. No judgment, just expression.",
        "benefits": ["emotional_processing", "self_reflection", "stress_relief", "clarity"],
        "recovery_value": "very_high",
        "difficulty": "easy"
      }
    }
  ],
  "total_found": 5,
  "mood_context": {
    "current_mood": "depressed",
    "mood_guidance": {
      "preferred_energy": ["very_low", "low"],
      "preferred_tags": ["solo", "gentle", "therapeutic", "self_care"],
      "approach": "Start small and build momentum"
    },
    "energy_level": "low"
  },
  "time_context": {
    "time_period": "afternoon",
    "current_time": "14:30",
    "optimal_for": "Afternoon activities"
  },
  "personalization_notes": [
    "For depressed mood: Start small and build momentum",
    "Afternoon is perfect for productive or creative activities",
    "With lower energy, focus on gentle activities that don't overwhelm"
  ]
}
```

## 🎭 Supported Mood Types

### Core Moods
- **depressed** - Low mood, sadness, lack of motivation
- **anxious** - Worry, nervousness, restlessness  
- **energetic** - High energy, motivation, readiness for action
- **neutral** - Balanced, calm, neither high nor low
- **overwhelmed** - Stressed, too much to handle, scattered
- **lonely** - Isolated, disconnected, needing social connection
- **angry** - Frustrated, irritated, needing healthy expression
- **grateful** - Appreciative, positive, wanting to share joy

### Energy Levels
- **very_low** - Minimal energy, basic activities only
- **low** - Some energy, gentle activities preferred
- **medium** - Moderate energy, most activities accessible
- **high** - Good energy, ready for engaging activities
- **very_high** - Peak energy, ready for intensive activities

### Location Types
- **home** - Indoor activities at residence
- **outdoor** - Fresh air and nature activities
- **gym** - Fitness and exercise facilities
- **social_space** - Cafés, restaurants, community spaces
- **work** - Workplace-appropriate activities
- **anywhere** - Activities that can be done in any location

## 🎯 Example Use Cases

### 1. Morning Depression Support

**Request:**
```json
{
  "mood": "depressed",
  "current_time": "08:00",
  "energy_level": "very_low",
  "location": "home",
  "duration_available": 15
}
```

**Top Recommendation:**
```json
{
  "activity": "Gentle Morning Routine",
  "score": 0.92,
  "details": {
    "title": "Reflective Journaling",
    "duration": "10-15 minutes",
    "instructions": "Write about how you're feeling and one thing you're grateful for",
    "benefits": ["emotional_processing", "self_reflection", "mood_awareness"],
    "why_perfect": "Low energy requirement, can be done from bed, proven mood benefits"
  }
}
```

### 2. Anxiety Management During Work

**Request:**
```json
{
  "mood": "anxious",
  "current_time": "14:00", 
  "energy_level": "medium",
  "location": "work",
  "duration_available": 10
}
```

**Top Recommendation:**
```json
{
  "activity": "Quick Calm",
  "score": 0.95,
  "details": {
    "title": "Deep Breathing Exercise",
    "duration": "5-10 minutes",
    "instructions": "4-4-6 breathing pattern: inhale 4, hold 4, exhale 6",
    "benefits": ["anxiety_reduction", "stress_relief", "focus", "calm"],
    "why_perfect": "Quick, discrete, highly effective for workplace anxiety"
  }
}
```

### 3. High Energy Positive Outlet

**Request:**
```json
{
  "mood": "energetic",
  "current_time": "16:00",
  "energy_level": "high", 
  "location": "home",
  "duration_available": 45
}
```

**Top Recommendation:**
```json
{
  "activity": "Energy Channel",
  "score": 0.88,
  "details": {
    "title": "Creative Art Session",
    "duration": "30-45 minutes",
    "instructions": "Express your energy through drawing, painting, or crafts",
    "benefits": ["self_expression", "focus", "accomplishment", "creativity"],
    "why_perfect": "Channels high energy into positive creation"
  }
}
```

### 4. Evening Loneliness Support

**Request:**
```json
{
  "mood": "lonely",
  "current_time": "19:30",
  "energy_level": "medium",
  "location": "home",
  "duration_available": 60
}
```

**Top Recommendation:**
```json
{
  "activity": "Social Connection",
  "score": 0.94,
  "details": {
    "title": "Connect with a Friend",
    "duration": "30-60 minutes",
    "instructions": "Call, text, or video chat with someone you care about",
    "benefits": ["social_connection", "support", "perspective", "belonging"],
    "why_perfect": "Directly addresses loneliness with meaningful connection"
  }
}
```

## 🧠 Activity Categories

### Self-Care & Wellness
- **Journaling** - Emotional processing and self-reflection
- **Meditation** - Mindfulness and stress reduction
- **Breathing Exercises** - Quick anxiety relief
- **Warm Bath** - Physical and emotional comfort
- **Gentle Walk** - Movement and fresh air

### Physical & Movement
- **Yoga** - Mindful movement and flexibility
- **Workout** - Endorphin release and energy outlet
- **Dancing** - Joyful movement and expression
- **Stretching** - Physical relief and body awareness

### Social & Connection
- **Call Friend** - Direct social support
- **Coffee Date** - In-person connection
- **Community Activity** - Group belonging
- **Help Someone** - Purpose and connection

### Creative & Expressive
- **Art Creation** - Self-expression and flow
- **Music** - Emotional regulation and inspiration
- **Writing** - Creative outlet and processing
- **Crafts** - Hands-on creation and accomplishment

### Productive & Organizing
- **Organize Space** - Control and clarity
- **Cooking** - Nourishment and accomplishment
- **Planning** - Structure and direction
- **Learning** - Growth and engagement

### Nature & Outdoor
- **Nature Walk** - Fresh air and perspective
- **Gardening** - Grounding and growth
- **Outdoor Sitting** - Peace and reflection
- **Photography** - Mindful observation

## 🔧 Integration Examples

### Python Client

```python
import requests

def get_activity_recommendation(mood, time=None, energy="medium"):
    response = requests.post("http://localhost:8006/recommend-activity", json={
        "mood": mood,
        "current_time": time,
        "energy_level": energy,
        "duration_available": 30
    })
    
    if response.status_code == 200:
        result = response.json()
        
        if result["recommendations"]:
            top_activity = result["recommendations"][0]
            
            print(f"🎯 Recommended Activity: {top_activity['details']['title']}")
            print(f"📝 Description: {top_activity['details']['description']}")
            print(f"⏱️ Duration: {top_activity['details']['duration_min']}-{top_activity['details']['duration_max']} minutes")
            print(f"💡 Instructions: {top_activity['details']['instructions']}")
            print(f"🌟 Benefits: {', '.join(top_activity['details']['benefits'])}")
            print(f"✅ Why recommended: {', '.join(top_activity['match_reasons'])}")
            
            return top_activity
        else:
            print("No activities found for your current state")
    else:
        print("Failed to get recommendation:", response.text)

# Example usage
get_activity_recommendation("depressed", "09:00", "low")
```

### JavaScript/React Integration

```javascript
async function getActivitySuggestion(mood, currentTime, energyLevel) {
    try {
        const response = await fetch('http://localhost:8006/recommend-activity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mood: mood,
                current_time: currentTime,
                energy_level: energyLevel,
                duration_available: 30
            })
        });
        
        const data = await response.json();
        
        if (data.recommendations && data.recommendations.length > 0) {
            const activity = data.recommendations[0];
            
            return {
                title: activity.details.title,
                description: activity.details.description,
                instructions: activity.details.instructions,
                duration: `${activity.details.duration_min}-${activity.details.duration_max} min`,
                benefits: activity.details.benefits,
                score: activity.score,
                reasons: activity.match_reasons
            };
        }
        
        return null;
    } catch (error) {
        console.error('Failed to get activity recommendation:', error);
        return null;
    }
}

// Example usage in React component
function ActivitySuggestion({ userMood, userEnergy }) {
    const [activity, setActivity] = useState(null);
    
    useEffect(() => {
        const currentTime = new Date().toTimeString().slice(0, 5);
        getActivitySuggestion(userMood, currentTime, userEnergy)
            .then(setActivity);
    }, [userMood, userEnergy]);
    
    if (!activity) return <div>Loading suggestion...</div>;
    
    return (
        <div className="activity-card">
            <h3>{activity.title}</h3>
            <p>{activity.description}</p>
            <div className="instructions">
                <strong>How to do it:</strong>
                <p>{activity.instructions}</p>
            </div>
            <div className="benefits">
                <strong>Benefits:</strong> {activity.benefits.join(', ')}
            </div>
            <div className="duration">
                <strong>Duration:</strong> {activity.duration}
            </div>
        </div>
    );
}
```

### Quick Command Line Tool

```bash
#!/bin/bash
# save as 'activity-suggest'

mood=${1:-"neutral"}
energy=${2:-"medium"}
time=$(date +"%H:%M")

curl -s -X POST "http://localhost:8006/recommend-activity" \
     -H "Content-Type: application/json" \
     -d "{\"mood\":\"$mood\", \"current_time\":\"$time\", \"energy_level\":\"$energy\"}" \
     | jq -r '.recommendations[0] | "🎯 " + .details.title + "\n📝 " + .details.description + "\n💡 " + .details.instructions'

# Usage:
# ./activity-suggest depressed low
# ./activity-suggest anxious medium
```

## 📊 Scoring Algorithm

The recommendation system uses a weighted scoring algorithm:

### Scoring Factors (Total: 100%)

1. **Mood Match (40%)** - How well the activity addresses the current mood
2. **Time Appropriateness (20%)** - Circadian rhythm and energy pattern alignment  
3. **Energy Level Match (15%)** - Activity intensity vs. available energy
4. **Location Feasibility (10%)** - Can be done in current location
5. **Preference Alignment (10%)** - Matches user's stated preferences
6. **Duration Fit (5%)** - Activity fits available time slot

### Example Scoring

For a **depressed** user at **9 AM** with **low energy** wanting **indoor** activities:

```python
Activity: "Reflective Journaling"
- Mood Match: +0.40 (perfect for depression)
- Time Match: +0.20 (good morning activity)  
- Energy Match: +0.15 (very low energy required)
- Location: +0.10 (can be done anywhere/indoors)
- Preferences: +0.08 (matches "indoor", "solo")
- Duration: +0.05 (10-30 min fits most schedules)
Total Score: 0.98 (98% match)
```

## 🎯 Evidence-Based Activities

All activities are based on:

### Behavioral Activation Therapy Research
- **Pleasant Activity Scheduling** - Increases positive reinforcement
- **Mastery Activities** - Builds sense of accomplishment  
- **Social Activities** - Combats isolation and builds support
- **Value-Based Activities** - Aligns with personal meaning

### Circadian Rhythm Science
- **Morning Activities** - Gentle activation, routine building
- **Midday Activities** - Social engagement, moderate energy tasks
- **Afternoon Activities** - Peak performance, creative work
- **Evening Activities** - Wind-down, reflection, relaxation

### Mental Health Best Practices
- **Graded Exposure** - Start small, build gradually
- **Mindfulness Integration** - Present-moment awareness
- **Self-Compassion** - Non-judgmental approach
- **Holistic Wellness** - Physical, emotional, social, spiritual

## ⚠️ Important Notes

### Clinical Context
- **Supplement, don't replace** professional mental health care
- **Crisis situations** require immediate professional intervention
- **Medication interactions** should be discussed with healthcare providers
- **Individual differences** mean activities may need personalization

### Usage Guidelines
- **Start small** - Begin with shorter, easier activities
- **Be flexible** - Adapt suggestions to your specific situation  
- **Track patterns** - Notice which activities help most
- **Seek variety** - Try different types of activities
- **Listen to your body** - Respect energy and capacity limits

### Privacy & Data
- **No data storage** - API doesn't save user information
- **Stateless design** - Each request is independent
- **Optional user_id** - For tracking if desired by client application
- **Local deployment** - Can be run privately without external dependencies

## 🚀 Production Deployment

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY main.py .

EXPOSE 8006

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8006"]
```

### Environment Configuration

```bash
# Optional environment variables
export API_PORT=8006
export API_HOST=0.0.0.0
export LOG_LEVEL=info
export MAX_RECOMMENDATIONS=10
```

### Health Monitoring

Monitor the `/health` endpoint for:
- Service availability
- Activity database integrity  
- Recommendation engine functionality
- Response time performance

### Scaling Considerations

- **Stateless design** enables horizontal scaling
- **In-memory database** provides fast response times
- **No external dependencies** simplifies deployment
- **Resource efficient** - minimal CPU and memory usage

## 🔮 Future Enhancements

### Potential Additions
- **User preference learning** - Adapt to individual patterns
- **Integration with mood tracking** - Connect with sentiment analysis
- **Seasonal adjustments** - Activities adapted for weather/seasons
- **Cultural customization** - Activities relevant to different cultures
- **Accessibility options** - Activities for different physical abilities
- **Group activities** - Suggestions for multiple people

### Integration Opportunities
- **Wearable devices** - Heart rate and activity data
- **Calendar apps** - Time-aware scheduling
- **Weather APIs** - Outdoor activity feasibility
- **Location services** - Nearby activity opportunities
- **Social platforms** - Friend availability for social activities

---

**🎯 This API provides intelligent, personalized activity recommendations that adapt to your mood, energy, and circumstances, helping you take positive action for your mental health and recovery journey.**

**📞 For technical support or feature requests: Contact your development team**