# 💬 Personalized Motivational Message Generation Service

An AI-powered service that generates highly personalized motivational messages for addiction recovery using Google Gemini, real user data, and advanced personalization algorithms. This service creates contextual, empathetic messages that adapt to individual recovery journeys, emotional patterns, and milestone achievements.

## 🌟 Features

- **🧠 AI-Enhanced Personalization** - Google Gemini 2.0 creates naturally flowing, personally relevant messages
- **📊 Data-Driven Content** - Uses real craving patterns, intervention success rates, and emotional trends
- **🎯 5 Message Types** - Daily motivation, milestone celebrations, crisis support, progress updates, evening reflections
- **🎨 4 Communication Styles** - Tough love, gentle support, motivational, balanced approach
- **⚡ Real-Time Integration** - Connects with craving forecasting and chatbot APIs for context
- **📈 Learning System** - Tracks message effectiveness and improves recommendations
- **🚨 Crisis-Responsive** - Automatic supportive messages during high-risk periods
- **🏆 Milestone-Aware** - Celebrates recovery achievements automatically
- **📱 Optimal Timing** - Delivers messages at user's preferred times

## 🚀 Quick Start Instructions

### Prerequisites

- Python 3.8 or higher
- Google Gemini API key
- Optional: Running craving forecasting and chatbot APIs for enhanced personalization

### 1. Clone the Repository

```bash
git clone https://github.com/vivekraina7/personalized-motivational-messages
cd personalized-motivational-messages
```

### 2. Install Dependencies

```bash
pip install fastapi uvicorn google-genai requests pydantic
```

### 3. Set Environment Variables

```bash
# Required: Google Gemini API Key
export GEMINI_API_KEY="your_gemini_api_key_here"

# Optional: Integration with other services
export CRAVING_API_URL="http://localhost:8001"
export CHATBOT_API_URL="http://localhost:8002"

# Optional: Service configuration
export PORT="8003"
```

### 4. Start the Message Service

```bash
uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

The service will be available at: `http://localhost:8003`

### 5. Create User Profile & Test

```bash
# Create user profile
curl -X POST "http://localhost:8003/users/demo_user/profile" \
     -H "Content-Type: application/json" \
     -d '{
       "preferred_name": "Alex",
       "addiction_type": "alcohol",
       "days_in_recovery": 47,
       "communication_style": "motivational",
       "personal_goals": ["Stay sober", "Rebuild relationships"],
       "active_hours": [8, 12, 18]
     }'

# Generate motivational message
curl -X POST "http://localhost:8003/generate-message" \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "demo_user",
       "message_type": "daily_morning"
     }'

# Health check
curl "http://localhost:8003/health"
```

### 6. Access API Documentation

- **Interactive Docs**: http://localhost:8003/docs
- **Alternative Docs**: http://localhost:8003/redoc

## 📚 API Endpoints

### Core Message Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/generate-message` | **Generate personalized motivational message** |
| `POST` | `/generate-milestone-message` | Create milestone celebration messages |
| `POST` | `/generate-crisis-support-message` | Generate crisis support messages |
| `POST` | `/generate-daily-messages` | Batch generate daily messages for multiple users |

### User Profile Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/users/{user_id}/profile` | Create or update user profile and preferences |
| `GET` | `/users/{user_id}/profile` | Retrieve user profile information |
| `GET` | `/users/{user_id}/messages` | Get user's recent generated messages |
| `GET` | `/users/{user_id}/stats` | Get message effectiveness statistics |

### Feedback & Learning

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/users/{user_id}/feedback` | Submit message effectiveness feedback |
| `GET` | `/analytics/message-effectiveness` | Get system-wide effectiveness analytics |

### Integration & Automation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/webhook/high-risk-detected` | Webhook for high-risk period detection |
| `POST` | `/webhook/milestone-achieved` | Webhook for milestone achievements |
| `GET` | `/health` | Service health check and integration status |

### Quick Test Examples

```bash
# Generate daily motivation
curl -X POST "http://localhost:8003/generate-message" \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "user_001",
       "message_type": "daily_morning",
       "context": {"high_stress_day": true}
     }'

# Celebrate 30-day milestone
curl -X POST "http://localhost:8003/generate-milestone-message" \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "user_001",
       "milestone_type": "days",
       "milestone_value": 30
     }'

# Get message effectiveness stats
curl "http://localhost:8003/users/user_001/stats"

# Submit feedback
curl -X POST "http://localhost:8003/users/user_001/feedback" \
     -H "Content-Type: application/json" \
     -d '{
       "message_id": "user_001_daily_morning_1719234567",
       "user_id": "user_001",
       "was_helpful": true,
       "user_rating": 9,
       "user_engagement": "saved"
     }'
```

## 💾 Input/Output Schemas

### User Profile Schema

```json
{
  "user_id": "string",
  "preferred_name": "string",
  "addiction_type": "string (alcohol/drugs/nicotine/gaming)",
  "days_in_recovery": "integer (≥0)",
  "communication_style": "string (tough_love/gentle/motivational/balanced/casual)",
  "message_frequency": "string (daily/weekly/on_demand)",
  "preferred_message_length": "string (short/medium/long)",
  "preferred_tone": "string (encouraging/realistic/spiritual/scientific)",
  "timezone": "string",
  "active_hours": "array of integers (0-23)",
  "personal_goals": "array of strings",
  "trigger_themes": "array of strings",
  "success_themes": "array of strings"
}
```

### Message Request Schema

```json
{
  "user_id": "string",
  "message_type": "string (daily/milestone/crisis/progress/custom)",
  "context": {
    "high_stress_day": "boolean [optional]",
    "upcoming_risk_period": "string [optional]",
    "recent_success": "string [optional]",
    "custom_context": "any [optional]"
  },
  "delivery_time": "datetime [optional]",
  "priority": "string (low/normal/high/urgent)"
}
```

### Generated Message Response Schema

```json
{
  "message_id": "string",
  "user_id": "string",
  "content": "string",
  "message_type": "string",
  "personalization_score": "float (0-1)",
  "ai_enhanced": "boolean",
  "delivery_recommendation": {
    "optimal_delivery_time": "datetime",
    "recommended_hours": "array of integers",
    "timezone": "string",
    "immediate_delivery_ok": "boolean"
  },
  "effectiveness_prediction": "float (0-1)",
  "generated_at": "datetime",
  "scheduled_delivery": "datetime [optional]"
}
```

### Message Feedback Schema

```json
{
  "message_id": "string",
  "user_id": "string",
  "was_helpful": "boolean",
  "user_rating": "float (1-10) [optional]",
  "user_engagement": "string (read/shared/saved/ignored)",
  "emotional_response": "string [optional]",
  "notes": "string [optional]"
}
```

### Message Statistics Schema

```json
{
  "user_id": "string",
  "total_messages_sent": "integer",
  "total_messages_read": "integer",
  "average_rating": "float [optional]",
  "most_effective_type": "string [optional]",
  "least_effective_type": "string [optional]",
  "engagement_trend": "string (improving/stable/declining)",
  "preferred_delivery_times": "array of integers"
}
```

## 🎯 Risk Categories

### Message Types & Use Cases

| Type | Purpose | Trigger Conditions | Response Time |
|------|---------|-------------------|---------------|
| **Daily Morning** | Start day with motivation | Scheduled daily | User's preferred morning time |
| **Milestone Celebration** | Celebrate achievements | Days sober milestones | Immediate upon milestone |
| **Crisis Support** | Emergency encouragement | High craving/risk detected | **Immediate** |
| **Progress Updates** | Highlight improvements | Weekly/monthly analysis | User's preferred time |
| **Evening Reflection** | End day positively | Scheduled daily | User's preferred evening time |

### Communication Styles

#### **Tough Love** (Direct & Challenging)
- **Target Audience**: Users who respond to direct challenges
- **Tone**: "You've got this, no excuses. You've overcome worse."
- **Best For**: Motivation during complacency, accountability

#### **Gentle** (Supportive & Nurturing)
- **Target Audience**: Users needing emotional support
- **Tone**: "Take it one moment at a time. You're doing amazing."
- **Best For**: Crisis support, emotional vulnerability

#### **Motivational** (High Energy & Achievement-Focused)
- **Target Audience**: Goal-oriented users who like challenges
- **Tone**: "CHAMPION! You're conquering this journey!"
- **Best For**: Milestone celebrations, momentum building

#### **Balanced** (Realistic & Encouraging)
- **Target Audience**: Users who prefer measured, realistic support
- **Tone**: "Real progress takes time. You're on the right path."
- **Best For**: Daily motivation, steady progress acknowledgment

#### **Casual** (Friendly & Conversational)
- **Target Audience**: Users who prefer informal communication
- **Tone**: "Hey there! Another day, another victory."
- **Best For**: Regular check-ins, maintaining engagement

### Personalization Levels

| Level | Score | Description | Content Features |
|-------|-------|-------------|------------------|
| **Basic** | 0.0-0.3 | Template-only, minimal personalization | Name, days sober, generic encouragement |
| **Moderate** | 0.3-0.6 | Some user data integration | Recent progress, preferred interventions |
| **High** | 0.6-0.8 | Rich user data + AI enhancement | Specific achievements, emotional context |
| **Maximum** | 0.8-1.0 | Full AI personalization with deep context | Detailed history, predictive insights |

## 🔬 Risk Factors

### Message Generation Strategy

#### **Template-Based Foundation**
- **Structured Content**: Ensures consistent quality and appropriate tone
- **Fallback System**: Works even when AI or external data unavailable  
- **Customizable**: Easy to modify templates for different audiences
- **Scalable**: Can generate thousands of messages quickly

#### **AI Enhancement Layer**
- **Natural Language**: Gemini makes templates feel personally written
- **Context Integration**: Incorporates real user data naturally
- **Tone Adaptation**: Matches user's preferred communication style
- **Emotional Intelligence**: Responds appropriately to user's emotional state

#### **Real Data Integration**
- **Craving Patterns**: References actual user craving intensity and trends
- **Intervention Success**: Mentions techniques that work for this specific user
- **Emotional Context**: Incorporates recent emotional patterns from chatbot
- **Progress Metrics**: Celebrates real, measurable improvements

### Effectiveness Factors

#### **Message Timing**
- **Optimal Hours**: Delivers during user's active and receptive times
- **Crisis Responsiveness**: Immediate delivery during high-risk periods
- **Milestone Synchronization**: Celebrates achievements at the right moment
- **Contextual Awareness**: Considers user's daily routine and schedule

#### **Content Personalization**
- **User Preferences**: Matches communication style and tone preferences
- **Recovery Stage**: Appropriate content for early, middle, or long-term recovery
- **Success Recognition**: Acknowledges user's specific achievements and strengths
- **Challenge Acknowledgment**: Validates current struggles and provides relevant support

#### **Learning Loop**
- **Feedback Integration**: Improves based on user ratings and engagement
- **Pattern Recognition**: Identifies what works best for each individual
- **Adaptive Algorithms**: Adjusts approach based on effectiveness data
- **Continuous Improvement**: Gets better over time with more data

### Crisis Response Protocols

#### **High-Risk Detection**
```python
# Automatic crisis support triggers:
if craving_intensity > 8.0:
    generate_crisis_support_message(user_id, {
        "urgency": "high",
        "specific_interventions": user.most_effective_techniques,
        "immediate_support_resources": user.crisis_contacts
    })
```

#### **Crisis Message Features**
- **Immediate Delivery**: Bypasses scheduling for urgent situations
- **Specific Interventions**: References user's proven effective techniques
- **Success Reminders**: Highlights past victories over similar challenges
- **Action Steps**: Provides clear, immediate actions to take
- **Support Resources**: Includes personal emergency contacts and crisis lines

## 🧪 Testing Examples

### Example 1: New User Daily Motivation

```json
{
  "user_id": "new_user_001",
  "message_type": "daily_morning",
  "user_profile": {
    "preferred_name": "Sarah",
    "addiction_type": "nicotine",
    "days_in_recovery": 5,
    "communication_style": "gentle",
    "personal_goals": ["Quit smoking", "Improve health"]
  }
}
```

**Expected Response**:
```json
{
  "content": "Good morning, Sarah! 🌅 Today marks 5 days of your healing journey from nicotine. You're in the challenging early stage, but every day you choose health over smoking is a victory worth celebrating. Your goal to improve your health is becoming reality with each smoke-free breath. Take it one moment at a time. Focus on how much better you're breathing already. 🌸",
  "personalization_score": 0.4,
  "ai_enhanced": true,
  "effectiveness_prediction": 0.7
}
```

### Example 2: Milestone Celebration (30 Days)

```json
{
  "user_id": "milestone_user_002",
  "message_type": "milestone_celebration",
  "milestone_context": {
    "milestone_type": "days",
    "milestone_value": 30
  }
}
```

**Expected Response**:
```json
{
  "content": "🎉 THIRTY DAYS! 🎉\n\nMike, you've just hit one of the biggest milestones in recovery! 30 days of sobriety represents more than just time - it's 30 days of brain healing, 30 days of choosing yourself, 30 days of building the life you deserve.\n\nLooking at your journey:\n✅ Used breathing exercises successfully 18 times\n✅ Stress levels decreased by 35%\n✅ Overcame 8 high-risk moments\n✅ Built momentum every single week\n\nYou're not the same person who started this journey 30 days ago. You're stronger, wiser, and more resilient. Here's to the next 30! 🌟",
  "personalization_score": 0.9,
  "ai_enhanced": true,
  "effectiveness_prediction": 0.92
}
```

### Example 3: Crisis Support (High Craving)

```json
{
  "user_id": "crisis_user_003",
  "message_type": "crisis_support",
  "crisis_context": {
    "risk_level": "high",
    "predicted_intensity": 8.5,
    "current_stress": 9.0,
    "effective_interventions": ["social_support", "environment_change"]
  }
}
```

**Expected Response**:
```json
{
  "content": "Hey Jamie, I know things feel overwhelming right now with that stress level hitting 9/10. The cravings feel intense, but remember - you've overcome 15 challenging moments just like this one. Your social support calls have worked 90% of the time, and changing your environment has been your superpower.\n\nRight now: Call your sponsor or trusted person. If you're in a triggering location, leave immediately. You've got 67 days of proof that you're stronger than any craving. This feeling is temporary. You are permanent. 💙",
  "personalization_score": 0.85,
  "ai_enhanced": true,
  "effectiveness_prediction": 0.88,
  "delivery_recommendation": {
    "immediate_delivery_ok": true
  }
}
```

### Example 4: Progress Celebration

```json
{
  "user_id": "progress_user_004",
  "message_type": "progress_celebration",
  "progress_context": {
    "stress_improvement": 25,
    "successful_interventions": 12,
    "craving_reduction": 40
  }
}
```

**Expected Response**:
```json
{
  "content": "Progress alert, Alex! 📈 Your stress levels have improved by 25% over the past month, and you've successfully used your coping techniques 12 times. Most impressive? Your average craving intensity has dropped by 40% - that's real, measurable healing happening in your brain.\n\nThis isn't luck - this is the result of your daily commitment to recovery. Your mindfulness practice and exercise routine are clearly paying off. You're building something incredible, one day at a time. Keep building that momentum! ✨",
  "personalization_score": 0.8,
  "ai_enhanced": true,
  "effectiveness_prediction": 0.82
}
```

## 🔗 Integration with Recovery Ecosystem

### Craving Forecasting API Integration

#### **Automatic Data Fetching**
```python
# Service automatically pulls user context:
user_stats = fetch_craving_api_data(user_id)
# Gets: stress trends, intervention success, craving patterns, risk predictions

# Uses data in message generation:
"Your stress levels have improved by {stress_improvement}% this month"
"Your breathing exercises work {success_rate}% of the time"
"Tonight around 7pm might be challenging, but you're prepared"
```

#### **High-Risk Webhooks**
```bash
# Your craving API can trigger supportive messages:
curl -X POST "http://localhost:8003/webhook/high-risk-detected" \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "user_001",
       "risk_level": "high",
       "predicted_intensity": 8.2,
       "time_until_risk": "2 hours",
       "suggested_interventions": ["breathing_exercises", "social_support"]
     }'
```

### Chatbot API Integration

#### **Emotional Context**
```python
# Pulls recent emotional patterns:
chat_data = fetch_chatbot_data(user_id)
# Gets: recent emotions, conversation themes, support needs

# Incorporates in messages:
"I noticed you've been feeling more hopeful lately - that's beautiful growth"
"Your recent conversations show real determination"
```

#### **Learning from Conversations**
- **Support Preferences**: What type of help user responds to best
- **Emotional Triggers**: What topics cause stress or anxiety
- **Success Themes**: What motivates and inspires this user
- **Communication Style**: How formal/casual user prefers

### Automated Workflow Example

```python
# Complete automated support workflow:

1. Craving API detects high risk period
   ↓
2. Triggers webhook to message service
   ↓
3. Message service generates personalized support
   ↓
4. Delivers via user's preferred channel
   ↓
5. Tracks user engagement and effectiveness
   ↓
6. Learns and improves future messages
```

## 🛠️ Customization & Configuration

### Adding New Message Templates

```python
# Add to MessageTemplateEngine._initialize_default_templates()
self.templates["custom_type"] = {
    "motivational": [
        "Custom motivational template with {personalized_content}",
        "Another variation for {name} with {days_sober} days strong!"
    ],
    "gentle": [
        "Gentle version: {name}, you're doing amazing with {encouragement}",
        "Soft support: Take it easy, {name}. {gentle_reminder}"
    ]
}
```

### Custom Communication Styles

```python
# Add new style to style_mapping in get_template():
style_mapping = {
    "tough_love": "motivational",
    "gentle": "gentle",
    "motivational": "motivational", 
    "balanced": "balanced",
    "casual": "balanced",
    "custom_style": "custom_template_category"  # Add here
}
```

### Personalization Variables

```python
# Add custom personalization in generate_personalized_content():
content["custom_metric"] = f"Your custom metric has improved by {improvement}%"
content["achievement_highlight"] = f"You've achieved {specific_goal}!"
content["future_motivation"] = f"You're {progress_percent}% closer to {main_goal}"
```

### AI Enhancement Prompts

```python
# Customize AI enhancement in _build_ai_context():
context_parts.append(f"User's therapy focus: {user_profile.therapy_themes}")
context_parts.append(f"Recent life events: {personalization_data.life_events}")
context_parts.append(f"Family support level: {user_profile.family_support}")
```

## 📊 Data Storage & Analytics

### Local Data Structure

```
message_data/
├── user_001/
│   ├── profile.json                    # User preferences and settings
│   ├── generated_messages.json        # Last 100 generated messages
│   └── message_feedback.json          # User feedback and ratings
├── user_002/
│   └── ...
└── message_templates/
    └── message_templates.json          # Customizable message templates
```

### Sample Data Files

#### profile.json
```json
{
  "user_id": "user_001",
  "preferred_name": "Alex",
  "addiction_type": "alcohol",
  "days_in_recovery": 67,
  "communication_style": "motivational",
  "message_frequency": "daily",
  "preferred_message_length": "medium",
  "active_hours": [8, 12, 18],
  "personal_goals": ["Stay sober", "Rebuild relationships", "Get promotion"],
  "success_themes": ["family", "career", "health"]
}
```

#### generated_messages.json
```json
[
  {
    "message_id": "user_001_daily_morning_1719234567",
    "user_id": "user_001",
    "content": "GOOD MORNING, CHAMPION! Alex, you've conquered 67 days...",
    "message_type": "daily_morning",
    "personalization_score": 0.85,
    "ai_enhanced": true,
    "effectiveness_prediction": 0.88,
    "generated_at": "2025-06-24T08:00:00"
  }
]
```

#### message_feedback.json
```json
[
  {
    "message_id": "user_001_daily_morning_1719234567",
    "user_id": "user_001",
    "was_helpful": true,
    "user_rating": 9,
    "user_engagement": "shared",
    "emotional_response": "motivated",
    "notes": "Really helped me start the day strong"
  }
]
```

### Analytics Dashboard Data

```bash
# Get system-wide effectiveness analytics
curl "http://localhost:8003/analytics/message-effectiveness?days=30"
```

**Response includes**:
- **Message type effectiveness**: Which types work best overall
- **Communication style success**: Most effective styles by user type
- **Engagement trends**: User interaction patterns over time
- **Personalization impact**: How personalization affects effectiveness
- **AI enhancement value**: Difference between template vs AI-enhanced messages

## 🎨 Advanced Usage Patterns

### Scheduled Message Campaigns

```python
# Generate daily messages for all users
response = requests.post("http://localhost:8003/generate-daily-messages", 
                        json={"user_ids": ["user_001", "user_002", "user_003"]})

# Schedule milestone celebrations
for user in users_approaching_milestones:
    requests.post("http://localhost:8003/generate-milestone-message",
                  json={
                      "user_id": user.id,
                      "milestone_type": "days", 
                      "milestone_value": user.upcoming_milestone
                  })
```

### Real-Time Crisis Support

```python
# Monitor for crisis situations
def handle_crisis_detection(user_id, crisis_level):
    if crisis_level >= 8:
        # Generate immediate support message
        response = requests.post(
            f"http://localhost:8003/generate-crisis-support-message",
            json={
                "user_id": user_id,
                "crisis_context": {
                    "urgency": "critical",
                    "immediate_interventions": get_user_effective_techniques(user_id)
                }
            }
        )
        
        # Send via all available channels
        message = response.json()
        send_push_notification(user_id, message["content"])
        send_sms(user_id, message["content"])
        log_crisis_intervention(user_id, message["message_id"])
```

### A/B Testing Framework

```python
# Test different communication styles
def ab_test_communication_styles(user_list):
    results = {"motivational": [], "gentle": [], "balanced": []}
    
    for user_id in user_list:
        # Randomly assign style
        test_style = random.choice(["motivational", "gentle", "balanced"])
        
        # Generate message with test style
        message = generate_custom_message(user_id, style_override=test_style)
        
        # Track for analysis
        results[test_style].append({
            "user_id": user_id,
            "message_id": message["message_id"],
            "predicted_effectiveness": message["effectiveness_prediction"]
        })
    
    return results
```

### Custom Integration Example

```python
class MotivationalMessageManager:
    def __init__(self, base_url="http://localhost:8003"):
        self.base_url = base_url
    
    def setup_user(self, user_data):
        """Initialize user with preferences"""
        response = requests.post(f"{self.base_url}/users/{user_data['user_id']}/profile",
                               json=user_data)
        return response.json()
    
    def get_daily_motivation(self, user_id, context=None):
        """Get personalized daily message"""
        request_data = {
            "user_id": user_id,
            "message_type": "daily_morning",
            "context": context or {}
        }
        response = requests.post(f"{self.base_url}/generate-message", json=request_data)
        return response.json()
    
    def celebrate_milestone(self, user_id, milestone_days):
        """Generate milestone celebration"""
        response = requests.post(f"{self.base_url}/generate-milestone-message",
                               json={
                                   "user_id": user_id,
                                   "milestone_type": "days",
                                   "milestone_value": milestone_days
                               })
        return response.json()
    
    def provide_crisis_support(self, user_id, crisis_context):
        """Generate crisis support message"""
        response = requests.post(f"{self.base_url}/generate-crisis-support-message",
                               json={
                                   "user_id": user_id,
                                   "crisis_context": crisis_context
                               })
        return response.json()

# Usage example
manager = MotivationalMessageManager()

# Setup new user
manager.setup_user({
    "user_id": "alex_123",
    "preferred_name": "Alex",
    "addiction_type": "alcohol",
    "days_in_recovery": 45,
    "communication_style": "balanced",
    "personal_goals": ["Stay sober", "Rebuild trust with family"]
})

# Get daily motivation
daily_msg = manager.get_daily_motivation("alex_123", {"stress_level": "medium"})
print(f"Daily message: {daily_msg['content']}")

# Celebrate milestone
milestone_msg = manager.celebrate_milestone("alex_123", 45)
print(f"Milestone: {milestone_msg['content']}")
```

## 📈 Performance & Monitoring

### API Performance Metrics

- **Response Time**: < 3 seconds for AI-enhanced message generation
- **Throughput**: 200+ messages per minute
- **Memory Usage**: ~300MB base footprint
- **Storage**: ~100MB per 1000 users with full message history
- **Gemini API Usage**: 1-2 API calls per generated message

### Health Monitoring

```bash
# Comprehensive health check
curl "http://localhost:8003/health"
```

**Monitors**:
- Google Gemini API connectivity and quota
- Craving forecasting API integration status
- Chatbot API integration status
- Message generation success rate
- User engagement metrics

### Performance Optimization

```python
# Cache frequently used data
@lru_cache(maxsize=100)
def get_user_personalization_data(user_id: str):
    # Cache personalization data for 1 hour
    return fetch_and_process_user_data(user_id)

# Batch API calls for efficiency
async def batch_generate_messages(user_ids: List[str]):
    # Generate multiple messages efficiently
    tasks = [generate_message_async(user_id) for user_id in user_ids]
    return await asyncio.gather(*tasks)

# Intelligent AI usage
def should_use_ai_enhancement(user_profile, message_type):
    # Only use AI for high-value scenarios
    return (user_profile.engagement_level == "high" or 
            message_type in ["crisis_support", "milestone_celebration"])
```

## 🙏 Acknowledgments

- **Google Gemini AI**: Advanced natural language generation and personalization
- **Recovery Science**: Based on evidence-based motivational interviewing and cognitive behavioral therapy
- **Addiction Research**: Informed by SAMHSA guidelines and peer-reviewed recovery literature
- **User Experience Design**: Focused on accessibility, engagement, and therapeutic value

## 📞 Contact & Support

- 📧 **Email**: vivekr.qriocity@gmail.com
- 💻 **GitHub**: [https://github.com/vivekraina7](https://github.com/vivekraina7)

---

**💬 Ready to provide personalized, AI-powered motivational support for recovery? Start with the Quick Start guide above!**

**⭐ If this motivational message service enhances your recovery platform, please consider giving it a star!**