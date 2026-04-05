# 🚨 Crisis Detection & Automatic Escalation Service

A real-time crisis detection system that monitors user communications for mental health emergencies and automatically escalates to appropriate resources. This standalone service provides immediate safety responses for addiction recovery platforms.

## 🌟 Features

- **🧠 AI-Powered Detection** - Google Gemini + keyword analysis for comprehensive crisis detection
- **⚡ Real-Time Monitoring** - Analyzes messages from all services via webhooks
- **🚨 5-Level Crisis Classification** - From baseline (1) to critical emergency (5)
- **📱 Automatic Escalation** - SMS, email, and emergency service alerts
- **🎯 Professional Integration** - Healthcare provider and emergency contact coordination
- **🛡️ Safety Protocols** - Evidence-based crisis response following clinical guidelines
- **📊 Basic Incident Tracking** - Simple logging without document generation

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- Google Gemini API key
- Optional: SMS/Email service integrations

### 1. Install Dependencies

```bash
pip install fastapi uvicorn google-genai requests pydantic
```

### 2. Set Environment Variables

```bash
# Required: Google Gemini API Key
export GEMINI_API_KEY="your_gemini_api_key_here"

# Optional: Alert service integrations
export SMS_SERVICE_API="http://your-sms-service"
export EMAIL_SERVICE_API="http://your-email-service"
export PORT="8004"
```

### 3. Start the Service

```bash
uvicorn main:app --host 0.0.0.0 --port 8004 --reload
```

Service available at: `http://localhost:8004`

### 4. Setup User Crisis Profile

```bash
curl -X POST "http://localhost:8004/users/demo_user/crisis-profile" \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "demo_user",
       "emergency_contacts": [
         {
           "name": "John Doe",
           "relationship": "family",
           "phone": "555-0123",
           "priority": 1
         }
       ],
       "healthcare_provider": {
         "name": "Dr. Smith",
         "relationship": "therapist",
         "email": "dr.smith@clinic.com"
       }
     }'
```

### 5. Test Crisis Detection

```bash
# Test critical crisis detection
curl -X POST "http://localhost:8004/test-crisis-detection" \
     -H "Content-Type: application/json" \
     -d '{
       "test_message": "I want to end it all",
       "user_id": "demo_user"
     }'

# Health check
curl "http://localhost:8004/health"
```

## 📚 API Endpoints

### Core Crisis Detection

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze-crisis` | **Analyze message for crisis and generate response** |
| `POST` | `/webhook/user-message` | Receive messages from other services |
| `POST` | `/webhook/stress-report` | Handle high stress/craving alerts |
| `POST` | `/manual-crisis-report` | Manual crisis reports from family/healthcare |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/users/{user_id}/crisis-profile` | Setup emergency contacts and preferences |
| `GET` | `/users/{user_id}/risk-status` | Get current risk assessment |
| `GET` | `/users/{user_id}/crisis-history` | Get basic incident history |

### Resources & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/crisis-resources/{crisis_level}` | Get crisis resources for specific level |
| `GET` | `/alerts/active` | Monitor active crisis alerts |
| `POST` | `/test-crisis-detection` | Test detection with sample messages |
| `GET` | `/health` | Service health and integration status |

## 🚨 Crisis Levels & Responses

### Level 5: CRITICAL (Immediate Danger)
- **Triggers**: Suicidal plan with method, immediate self-harm intent
- **Response**: Emergency services (911), all emergency contacts, immediate intervention
- **Time**: Immediate (0-5 minutes)

### Level 4: HIGH RISK (Urgent)
- **Triggers**: Suicidal thoughts, severe depression, overdose risk
- **Response**: Crisis hotlines (988), primary contacts, urgent professional assessment
- **Time**: Within 1 hour

### Level 3: MODERATE (Concerning)
- **Triggers**: Persistent negative thoughts, isolation, relapse patterns
- **Response**: Professional referral, increased monitoring, safety planning
- **Time**: Within 24 hours

### Level 2: LOW RISK (Watch)
- **Triggers**: Stress escalation, behavioral changes
- **Response**: Supportive resources, follow-up scheduling
- **Time**: Within 48 hours

### Level 1: BASELINE (Normal)
- **Triggers**: Typical recovery challenges
- **Response**: Regular monitoring, no escalation

## 🔗 Integration Examples

### Chatbot Service Integration

```python
import requests

# Send message to crisis detection
async def check_for_crisis(user_id: str, message: str):
    response = requests.post("http://localhost:8004/webhook/user-message", json={
        "user_id": user_id,
        "message": message,
        "source": "chatbot"
    })
    
    crisis_info = response.json()
    
    if crisis_info["crisis_detected"] and crisis_info["crisis_level"] >= 4:
        # High crisis - use provided support message
        return crisis_info["user_support_message"]
    
    return None  # No crisis, continue normal conversation
```

### Craving API Integration

```python
# Report high stress to crisis detection
async def report_high_stress(user_id: str, stress_level: float):
    if stress_level >= 8.0:
        response = requests.post("http://localhost:8004/webhook/stress-report", json={
            "user_id": user_id,
            "stress_level": stress_level,
            "source": "craving_api"
        })
        
        return response.json()["crisis_detected"]
    return False
```

## 💾 Input/Output Schemas

### Crisis Analysis Response

```json
{
  "crisis_analysis": {
    "crisis_level": 4,
    "crisis_types": ["suicidal_ideation"],
    "confidence_score": 0.89,
    "urgency": "urgent"
  },
  "immediate_actions": [
    "Contact National Suicide Prevention Lifeline: 988",
    "Arrange for immediate professional assessment",
    "Ensure person is not alone"
  ],
  "alert_messages": {
    "emergency_contact": "URGENT: user may be in crisis...",
    "user_support": "I'm concerned about you right now. Help is available..."
  },
  "resources": [
    {"name": "National Suicide Prevention Lifeline", "contact": "988"},
    {"name": "Crisis Text Line", "contact": "Text HOME to 741741"}
  ],
  "escalation_triggered": true
}
```

### User Crisis Profile

```json
{
  "user_id": "string",
  "emergency_contacts": [
    {
      "name": "string",
      "relationship": "family/friend/sponsor/therapist",
      "phone": "string",
      "email": "string", 
      "priority": 1
    }
  ],
  "healthcare_provider": {
    "name": "string",
    "relationship": "therapist/doctor",
    "email": "string"
  },
  "risk_factors": ["isolation", "anniversaries"],
  "protective_factors": ["family support", "therapy"],
  "preferred_intervention": "professional/family/peer"
}
```

## 🧪 Testing Examples

### Critical Crisis Detection

```bash
curl -X POST "http://localhost:8004/analyze-crisis" \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "test_user",
       "message": "I cant take this anymore. I have pills and Im going to end it tonight.",
       "source": "test"
     }'
```

**Expected Response**: Crisis Level 5, immediate escalation, emergency services alert

### Moderate Risk Detection

```bash
curl -X POST "http://localhost:8004/webhook/user-message" \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "test_user",
       "message": "Everything feels hopeless. I keep thinking about relapsing.",
       "source": "chatbot"
     }'
```

**Expected Response**: Crisis Level 3, professional referral, increased monitoring

### High Stress Report

```bash
curl -X POST "http://localhost:8004/webhook/stress-report" \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "test_user",
       "stress_level": 9.5,
       "source": "craving_api"
     }'
```

**Expected Response**: Crisis detected, appropriate intervention recommended

## 🛡️ Safety Features

### Detection Accuracy
- **Hybrid Analysis**: AI + keyword patterns for comprehensive coverage
- **Confidence Scoring**: Ensures appropriate response levels
- **Context Awareness**: Considers user history and recovery stage
- **False Positive Protection**: Multiple validation layers

### Professional Standards
- **Evidence-Based Levels**: Following clinical crisis intervention guidelines
- **Appropriate Resources**: 911 for emergencies, 988 for suicide prevention
- **Healthcare Integration**: Coordinates with existing care providers
- **Legal Compliance**: Duty to warn protocols where applicable

### Privacy Protection
- **Minimal Storage**: Only basic incident tracking, no message content
- **Configurable Alerts**: Based on user consent preferences
- **Emergency Override**: Life-threatening situations bypass normal privacy
- **Secure Communications**: Encrypted alert delivery where available

## 📊 Crisis Resources

### Emergency Resources
- **Emergency Services**: 911 (immediate danger)
- **National Suicide Prevention Lifeline**: 988 (24/7)
- **Crisis Text Line**: Text HOME to 741741 (24/7)
- **SAMHSA National Helpline**: 1-800-662-4357 (substance abuse)

### Professional Resources
- **National Alliance on Mental Illness**: 1-800-950-6264
- **Substance Abuse Treatment Locator**: https://findtreatment.samhsa.gov
- **Mental Health America**: Local chapter resources
- **Crisis Intervention Teams**: Local emergency mental health services

## 🔧 Configuration

### Alert Service Setup

```bash
# SMS Service Integration (optional)
export SMS_SERVICE_API="https://api.twilio.com/..."

# Email Service Integration (optional) 
export EMAIL_SERVICE_API="https://api.sendgrid.com/..."

# Emergency Services API (optional)
export EMERGENCY_SERVICES_API="https://emergency-api..."
```

### Crisis Pattern Customization

Edit `crisis_patterns/crisis_patterns.json` to customize:
- Critical keywords for immediate escalation
- High-risk phrases for urgent response
- Moderate risk indicators for professional referral
- Emotional state indicators

## 📈 Monitoring & Analytics

### Active Alert Monitoring

```bash
# Check active alerts
curl "http://localhost:8004/alerts/active"

# Acknowledge alert
curl -X POST "http://localhost:8004/alerts/{alert_id}/acknowledge" \
     -H "Content-Type: application/json" \
     -d '{"acknowledger": "Dr. Smith"}'
```

### User Risk Assessment

```bash
# Get current risk status
curl "http://localhost:8004/users/{user_id}/risk-status"

# Get crisis history
curl "http://localhost:8004/users/{user_id}/crisis-history?limit=10"
```

## 🚀 Production Deployment

### Environment Setup
```bash
# Production environment variables
export GEMINI_API_KEY="production_key"
export SMS_SERVICE_API="production_sms_endpoint"
export EMAIL_SERVICE_API="production_email_endpoint"
export PORT="8004"

# Start service
uvicorn main:app --host 0.0.0.0 --port 8004 --workers 4
```

### Health Monitoring
- Monitor `/health` endpoint for service status
- Track alert delivery success rates
- Monitor AI detection accuracy and response times
- Set up alerts for service downtime

### Scaling Considerations
- Crisis detection requires immediate response capabilities
- Consider dedicated high-availability deployment
- Ensure redundancy for critical safety functions
- Monitor memory usage for pattern matching operations

## ⚠️ Important Notes

### Legal Considerations
- This service provides technical crisis detection, not professional mental health care
- Ensure compliance with local duty-to-warn and emergency response laws
- Maintain appropriate documentation for legal/clinical requirements
- Consider liability insurance for crisis response services

### Clinical Integration
- Coordinate with licensed mental health professionals
- Ensure crisis protocols align with clinical best practices
- Provide staff training on system capabilities and limitations
- Maintain backup manual crisis response procedures

### User Privacy
- Obtain appropriate consent for crisis monitoring
- Clearly communicate escalation policies to users
- Balance privacy with safety in emergency situations
- Provide opt-out options where legally permissible

---

**🚨 This service is designed to save lives by detecting mental health crises and coordinating immediate help. Deploy with appropriate clinical oversight and legal compliance.**

**📞 For technical support: vivekr.qriocity@gmail.com**