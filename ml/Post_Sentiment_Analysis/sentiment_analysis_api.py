from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from textblob import TextBlob
from nltk.sentiment import SentimentIntensityAnalyzer
import nltk
import re
from typing import List, Dict, Any
from datetime import datetime

# Download required NLTK data
try:
    nltk.data.find('vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')

# Initialize FastAPI app
app = FastAPI(
    title="Recovery Sentiment Analysis API",
    description="Analyze sentiment in user posts and journal entries with recovery-specific insights",
    version="1.0.0"
)

# Initialize sentiment analyzers
vader_analyzer = SentimentIntensityAnalyzer()

# Recovery-specific keywords
RECOVERY_KEYWORDS = {
    "positive": [
        "sober", "clean", "recovery", "grateful", "hope", "strong", "progress", 
        "support", "therapy", "healing", "growth", "commitment", "sponsor", 
        "meeting", "step", "serenity", "peace", "proud", "achievement", 
        "milestone", "better", "improving", "helping", "motivated", "determined"
    ],
    "negative": [
        "relapse", "craving", "using", "drinking", "high", "addiction", "withdraw", 
        "triggered", "tempted", "struggling", "hopeless", "alone", "pointless", 
        "failure", "weak", "give up", "can't do this", "worthless", "shame", "guilt"
    ],
    "neutral": [
        "meeting", "therapy", "counselor", "program", "group", "session", 
        "treatment", "clinic", "doctor", "medication", "routine"
    ]
}

# Emotion mapping
EMOTION_MAP = {
    "very_positive": "joy",
    "positive": "hope", 
    "slightly_positive": "optimism",
    "neutral": "calm",
    "slightly_negative": "concern",
    "negative": "sadness",
    "very_negative": "despair"
}

# Request/Response models
class TextInput(BaseModel):
    text: str
    user_id: str = None
    timestamp: str = None

class SentimentResponse(BaseModel):
    overall_sentiment: float
    emotional_intensity: float
    recovery_progress: float
    dominant_emotion: str
    recovery_indicators: Dict[str, List[str]]
    mood_category: str
    recovery_stage: str
    detailed_scores: Dict[str, Any]
    insights: List[str]
    alerts: List[str] = []
    recommended_actions: List[str] = []

# Helper functions
def calculate_recovery_keywords(text: str) -> float:
    """Calculate recovery-specific keyword score"""
    text_lower = text.lower()
    
    positive_count = sum(1 for word in RECOVERY_KEYWORDS["positive"] if word in text_lower)
    negative_count = sum(1 for word in RECOVERY_KEYWORDS["negative"] if word in text_lower)
    neutral_count = sum(1 for word in RECOVERY_KEYWORDS["neutral"] if word in text_lower)
    
    total_recovery_words = positive_count + negative_count + neutral_count
    
    if total_recovery_words == 0:
        return 0.5  # Neutral if no recovery words found
    
    # Calculate weighted score
    positive_weight = positive_count * 1.0
    negative_weight = negative_count * -1.0
    neutral_weight = neutral_count * 0.5
    
    raw_score = (positive_weight + negative_weight + neutral_weight) / total_recovery_words
    
    # Normalize to 0-1 scale
    normalized_score = (raw_score + 1) / 2
    return max(0, min(1, normalized_score))

def extract_recovery_indicators(text: str) -> Dict[str, List[str]]:
    """Extract recovery-related keywords from text"""
    text_lower = text.lower()
    
    indicators = {
        "positive": [],
        "negative": [],
        "neutral": [],
        "milestones": [],
        "warning_signs": []
    }
    
    # Find positive indicators
    for word in RECOVERY_KEYWORDS["positive"]:
        if word in text_lower:
            indicators["positive"].append(word)
    
    # Find negative indicators
    for word in RECOVERY_KEYWORDS["negative"]:
        if word in text_lower:
            indicators["negative"].append(word)
    
    # Find neutral indicators
    for word in RECOVERY_KEYWORDS["neutral"]:
        if word in text_lower:
            indicators["neutral"].append(word)
    
    # Find milestones (days, weeks, months, years)
    milestone_patterns = [
        r'\b(\d+)\s*days?\b',
        r'\b(\d+)\s*weeks?\b', 
        r'\b(\d+)\s*months?\b',
        r'\b(\d+)\s*years?\b'
    ]
    
    for pattern in milestone_patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            indicators["milestones"].append(f"{match} {pattern.split('?')[0].split('s*')[1]}")
    
    # Find warning signs
    warning_phrases = [
        "thinking about using", "want to use", "feels pointless", 
        "completely alone", "give up", "can't do this"
    ]
    
    for phrase in warning_phrases:
        if phrase in text_lower:
            indicators["warning_signs"].append(phrase)
    
    return indicators

def classify_emotion(vader_scores: Dict, recovery_score: float) -> str:
    """Classify dominant emotion based on scores"""
    compound = vader_scores['compound']
    
    # Adjust based on recovery context
    if recovery_score > 0.8 and compound > 0.5:
        return "gratitude_amazement"
    elif recovery_score < 0.2 and compound < -0.5:
        return "despair"
    elif compound >= 0.5:
        return "joy"
    elif compound >= 0.1:
        return "hope"
    elif compound >= -0.1:
        return "neutral_stable"
    elif compound >= -0.5:
        return "sadness"
    else:
        return "despair"

def categorize_mood(emotion: str, recovery_score: float) -> str:
    """Categorize overall mood"""
    if recovery_score > 0.8:
        if "joy" in emotion or "gratitude" in emotion:
            return "celebration_gratitude"
        else:
            return "stable_positive"
    elif recovery_score > 0.6:
        return "routine_maintenance"
    elif recovery_score > 0.4:
        return "challenging_but_hopeful"
    elif recovery_score > 0.2:
        return "concerning_period"
    else:
        return "high_risk_despair"

def determine_recovery_stage(recovery_score: float, indicators: Dict) -> str:
    """Determine recovery stage based on language"""
    if indicators["milestones"]:
        milestone_text = " ".join(indicators["milestones"])
        if "year" in milestone_text:
            return "long_term_recovery"
        elif "month" in milestone_text:
            return "stable_recovery"
        elif "week" in milestone_text:
            return "early_recovery"
        else:
            return "initial_recovery"
    
    if recovery_score > 0.8:
        return "growth_phase"
    elif recovery_score > 0.6:
        return "maintenance_phase"
    elif recovery_score > 0.4:
        return "adjustment_phase"
    elif recovery_score > 0.2:
        return "challenging_phase"
    else:
        return "crisis_period"

def generate_insights(text: str, emotion: str, recovery_score: float, indicators: Dict) -> List[str]:
    """Generate recovery-specific insights"""
    insights = []
    
    # Milestone insights
    if indicators["milestones"]:
        insights.append(f"Milestone achievement mentioned: {', '.join(indicators['milestones'])}")
    
    # Support system insights
    support_words = ["sponsor", "meeting", "therapy", "family", "friend", "group"]
    mentioned_support = [word for word in support_words if word in text.lower()]
    if mentioned_support:
        insights.append(f"Support system engagement: {', '.join(mentioned_support)}")
    
    # Emotional insights
    if recovery_score > 0.7:
        insights.append("Strong recovery commitment language detected")
    elif recovery_score < 0.3:
        insights.append("Language indicates significant recovery challenges")
    
    # Growth insights
    growth_words = ["change", "different", "better", "growth", "learn"]
    if any(word in text.lower() for word in growth_words):
        insights.append("Personal growth and change recognition present")
    
    # Gratitude insights
    if "grateful" in text.lower() or "thank" in text.lower():
        insights.append("Gratitude expression indicates positive coping")
    
    return insights

def assess_risk_and_actions(text: str, vader_scores: Dict, indicators: Dict) -> tuple:
    """Assess risk level and recommend actions"""
    alerts = []
    actions = []
    
    # High risk indicators
    if indicators["warning_signs"]:
        alerts.append("HIGH RISK: Warning signs detected")
        actions.append("Immediate support contact recommended")
    
    if "using" in text.lower() or "relapse" in text.lower():
        alerts.append("URGENT: Substance use mentioned")
        actions.append("Crisis intervention may be needed")
    
    if vader_scores['compound'] < -0.6:
        alerts.append("Severe negative sentiment detected")
        actions.append("Check-in with sponsor/therapist")
    
    # Isolation indicators
    isolation_words = ["alone", "nobody", "isolated", "by myself"]
    if any(word in text.lower() for word in isolation_words):
        alerts.append("Isolation language detected")
        actions.append("Encourage social connection")
    
    return alerts, actions

@app.get("/")
async def root():
    return {
        "message": "Recovery Sentiment Analysis API",
        "version": "1.0.0",
        "description": "Analyze sentiment in recovery-related text with specialized insights",
        "endpoints": {
            "analyze": "/analyze-sentiment",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.post("/analyze-sentiment", response_model=SentimentResponse)
async def analyze_sentiment(input_data: TextInput):
    """
    Analyze sentiment of recovery-related text
    
    Returns comprehensive sentiment analysis including:
    - Overall sentiment score
    - Recovery-specific insights  
    - Emotional categorization
    - Risk assessment
    """
    try:
        text = input_data.text.strip()
        
        if not text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # VADER sentiment analysis
        vader_scores = vader_analyzer.polarity_scores(text)
        
        # TextBlob sentiment analysis
        blob = TextBlob(text)
        textblob_polarity = blob.sentiment.polarity
        textblob_subjectivity = blob.sentiment.subjectivity
        
        # Recovery-specific analysis
        recovery_score = calculate_recovery_keywords(text)
        recovery_indicators = extract_recovery_indicators(text)
        
        # Emotion and mood classification
        dominant_emotion = classify_emotion(vader_scores, recovery_score)
        mood_category = categorize_mood(dominant_emotion, recovery_score)
        recovery_stage = determine_recovery_stage(recovery_score, recovery_indicators)
        
        # Generate insights
        insights = generate_insights(text, dominant_emotion, recovery_score, recovery_indicators)
        
        # Risk assessment
        alerts, recommended_actions = assess_risk_and_actions(text, vader_scores, recovery_indicators)
        
        # Prepare response
        response = SentimentResponse(
            overall_sentiment=round(vader_scores['compound'], 4),
            emotional_intensity=round(abs(textblob_polarity), 2),
            recovery_progress=round(recovery_score, 2),
            dominant_emotion=dominant_emotion,
            recovery_indicators=recovery_indicators,
            mood_category=mood_category,
            recovery_stage=recovery_stage,
            detailed_scores={
                "vader": {
                    "negative": round(vader_scores['neg'], 3),
                    "neutral": round(vader_scores['neu'], 3),
                    "positive": round(vader_scores['pos'], 3),
                    "compound": round(vader_scores['compound'], 4)
                },
                "textblob": {
                    "polarity": round(textblob_polarity, 3),
                    "subjectivity": round(textblob_subjectivity, 3)
                },
                "recovery_keyword_score": round(recovery_score, 3)
            },
            insights=insights,
            alerts=alerts,
            recommended_actions=recommended_actions
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/batch-analyze")
async def batch_analyze_sentiment(texts: List[TextInput]):
    """
    Analyze multiple texts at once
    """
    try:
        results = []
        
        for text_input in texts:
            result = await analyze_sentiment(text_input)
            results.append({
                "input_text": text_input.text[:50] + "..." if len(text_input.text) > 50 else text_input.text,
                "user_id": text_input.user_id,
                "analysis": result
            })
        
        return {
            "total_analyzed": len(results),
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")

@app.get("/test-examples")
async def get_test_examples():
    """
    Get example inputs for testing the API
    """
    examples = [
        {
            "description": "Early recovery struggle",
            "text": "Day 5 without alcohol. I'm struggling with cravings but trying to stay strong."
        },
        {
            "description": "Milestone celebration", 
            "text": "90 days clean today! Feeling grateful for my family's support."
        },
        {
            "description": "High risk warning",
            "text": "Everything feels pointless. I keep thinking about using again."
        },
        {
            "description": "Routine maintenance",
            "text": "Had therapy today. We talked about triggers and coping strategies."
        },
        {
            "description": "Progress recognition",
            "text": "Six months ago I was drinking every day. Today I helped a friend move and felt genuinely happy."
        }
    ]
    
    return {
        "message": "Test these examples with the /analyze-sentiment endpoint",
        "examples": examples
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    try:
        # Test VADER analyzer
        test_vader = vader_analyzer.polarity_scores("test")
        
        # Test TextBlob
        test_blob = TextBlob("test").sentiment
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "service": "Recovery Sentiment Analysis API",
            "version": "1.0.0",
            "components": {
                "vader_analyzer": "operational" if test_vader else "error",
                "textblob": "operational" if test_blob else "error",
                "recovery_keywords": len(RECOVERY_KEYWORDS["positive"]) + len(RECOVERY_KEYWORDS["negative"])
            },
            "features": {
                "sentiment_analysis": True,
                "emotion_detection": True,
                "recovery_insights": True,
                "risk_assessment": True,
                "batch_processing": True
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")