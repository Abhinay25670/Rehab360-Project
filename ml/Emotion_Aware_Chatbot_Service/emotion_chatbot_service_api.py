from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import json
import asyncio
from datetime import datetime, timedelta
import logging
from pathlib import Path
import requests
import re
import aiohttp

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Emotion-Aware Recovery Chatbot",
    description="AI chatbot with emotion detection for addiction recovery support",
    version="2.0.0"
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create data directories - use absolute path relative to this file
BASE_DIR = Path(__file__).parent.parent
CHAT_DATA_DIR = BASE_DIR / "chat_data"
CHAT_DATA_DIR.mkdir(exist_ok=True)

# Configuration - Load from environment variables
CRAVING_API_BASE_URL = os.environ.get("CRAVING_API_URL", "http://localhost:8001")

# OpenRouter Configuration
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")  # Default model

CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end it all", "not worth living", 
    "give up", "can't go on", "hopeless", "worthless"
]

if not OPENROUTER_API_KEY:
    logger.warning("OPENROUTER_API_KEY not found. Set environment variable for OpenRouter integration.")
else:
    logger.info(f"OpenRouter configured with model: {OPENROUTER_MODEL}")

# Pydantic Models
class UserContext(BaseModel):
    user_id: str
    addiction_type: Optional[str] = None
    days_in_recovery: Optional[int] = None
    current_stress_level: Optional[float] = None
    last_craving_intensity: Optional[float] = None
    last_high_risk_time: Optional[datetime] = None
    preferred_support_style: str = Field("balanced", description="supportive/motivational/direct/balanced")
    crisis_contacts: List[str] = Field(default=[], description="Emergency contact information")

class ChatMessage(BaseModel):
    message_id: str
    user_id: str
    content: str
    timestamp: datetime
    is_user: bool = Field(..., description="True if from user, False if from bot")
    detected_emotions: Optional[List[str]] = None
    emotion_scores: Optional[Dict[str, float]] = None
    response_tone: Optional[str] = None
    crisis_level: Optional[str] = None  # none, low, medium, high, critical

class ChatRequest(BaseModel):
    user_id: str
    message: str
    context: Optional[UserContext] = None
    conversation_history: Optional[List[ChatMessage]] = Field(default=[], max_items=20)

class EmotionAnalysis(BaseModel):
    primary_emotion: str
    emotion_scores: Dict[str, float]
    emotional_intensity: float  # 0-1 scale
    crisis_level: str  # none, low, medium, high, critical
    triggers_detected: List[str]
    support_needs: List[str]

class ChatResponse(BaseModel):
    message_id: str
    response: str
    emotion_analysis: EmotionAnalysis
    response_tone: str
    suggested_actions: List[str]
    crisis_intervention: Optional[Dict[str, Any]] = None
    followup_recommended: bool
    conversation_context: Dict[str, Any]

class ConversationSummary(BaseModel):
    user_id: str
    session_id: str
    start_time: datetime
    end_time: Optional[datetime]
    message_count: int
    primary_emotions: List[str]
    crisis_moments: List[datetime]
    key_topics: List[str]
    support_effectiveness: Optional[float]


# OpenRouter API Helper
class OpenRouterClient:
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
        self.base_url = OPENROUTER_BASE_URL
        # Fallback models to try if primary model fails
        # Using openrouter/auto first which auto-selects an available model
        self.fallback_models = [
            "openrouter/auto",  # Auto-select best available model
            model,  # User's configured model
            "openai/gpt-3.5-turbo",  # Cheap and reliable ($0.0005/1k tokens)
            "anthropic/claude-instant-1",  # Fast and cheap
        ]
        
    async def chat_completion(self, messages: List[Dict[str, str]], temperature: float = 0.7, json_mode: bool = False, max_tokens: int = 500) -> str:
        """Make a chat completion request to OpenRouter"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",  # Your app URL
            "X-Title": "Rehab Recovery Chatbot"
        }
        
        # Some models don't support system instructions, so combine system + user into one user message
        processed_messages = []
        system_content = ""
        
        for msg in messages:
            if msg["role"] == "system":
                system_content = msg["content"]
            else:
                if system_content and msg["role"] == "user":
                    # Prepend system instructions to first user message
                    msg = {"role": "user", "content": f"Instructions: {system_content}\n\nUser message: {msg['content']}"}
                    system_content = ""  # Clear after using
                processed_messages.append(msg)
        
        # If no user messages were found, create one from system
        if not processed_messages and system_content:
            processed_messages = [{"role": "user", "content": system_content}]
        
        payload = {
            "model": self.model,
            "messages": processed_messages if processed_messages else messages,
            "temperature": temperature,
            "max_tokens": max_tokens,  # Limit response tokens
        }
        
        # Don't use json_mode as some models don't support it
        # if json_mode:
        #     payload["response_format"] = {"type": "json_object"}
        
        # Try multiple models if rate limited
        last_error = None
        timeout = aiohttp.ClientTimeout(total=120)
        
        for model_to_try in self.fallback_models:
            try:
                payload["model"] = model_to_try
                logger.info(f"Making OpenRouter API call to model: {model_to_try}")
                
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.post(self.base_url, headers=headers, json=payload) as response:
                        if response.status == 200:
                            data = await response.json()
                            content = data["choices"][0]["message"]["content"]
                            logger.info(f"OpenRouter API success with {model_to_try} - received {len(content)} characters")
                            return content
                        elif response.status == 429:
                            error_text = await response.text()
                            logger.warning(f"Model {model_to_try} rate limited, trying next model...")
                            last_error = f"Rate limited: {model_to_try}"
                            await asyncio.sleep(1)  # Brief pause before trying next model
                            continue
                        else:
                            error_text = await response.text()
                            logger.warning(f"Model {model_to_try} error: {response.status}, trying next model...")
                            last_error = f"Error {response.status}: {model_to_try}"
                            continue
                            
            except asyncio.TimeoutError:
                logger.warning(f"Model {model_to_try} timed out, trying next model...")
                last_error = f"Timeout: {model_to_try}"
                continue
            except aiohttp.ClientError as e:
                logger.warning(f"Model {model_to_try} connection error: {e}, trying next model...")
                last_error = f"Connection error: {model_to_try}"
                continue
            except Exception as e:
                logger.warning(f"Model {model_to_try} failed: {e}, trying next model...")
                last_error = str(e)
                continue
        
        # All models failed
        logger.error(f"All OpenRouter models failed. Last error: {last_error}")
        raise Exception(f"All OpenRouter models failed: {last_error}")


# Emotion Detection Engine using OpenRouter
class EmotionDetectionEngine:
    def __init__(self):
        self.client = None
        if OPENROUTER_API_KEY:
            self.client = OpenRouterClient(OPENROUTER_API_KEY, OPENROUTER_MODEL)
        
        # Emotion categories for addiction recovery context
        self.emotion_categories = {
            "crisis": ["despair", "hopelessness", "suicidal", "panic", "severe_anxiety"],
            "high_risk": ["anger", "frustration", "lonely", "bored", "craving", "tempted"],
            "struggling": ["sad", "worried", "stressed", "overwhelmed", "guilty", "ashamed"],
            "neutral": ["calm", "curious", "questioning", "thoughtful", "confused"],
            "positive": ["hopeful", "determined", "grateful", "proud", "confident", "peaceful"],
            "celebrating": ["happy", "excited", "accomplished", "strong", "optimistic"]
        }
        
        # Crisis detection patterns
        self.crisis_patterns = [
            r"\b(kill\s+myself|suicide|end\s+it\s+all|not\s+worth\s+living)\b",
            r"\b(give\s+up|can['']?t\s+go\s+on|hopeless|worthless)\b",
            r"\b(want\s+to\s+die|better\s+off\s+dead|no\s+point)\b"
        ]
    
    async def analyze_emotion(self, text: str, conversation_context: List[ChatMessage] = None) -> EmotionAnalysis:
        """Analyze emotions in text using OpenRouter"""
        
        if not self.client:
            # Fallback to rule-based analysis if OpenRouter not available
            return self._fallback_emotion_analysis(text)
        
        try:
            # Build context for analysis
            context_summary = ""
            if conversation_context:
                recent_messages = conversation_context[-5:]  # Last 5 messages
                context_summary = "\n".join([
                    f"{'User' if msg.is_user else 'Bot'}: {msg.content}" 
                    for msg in recent_messages
                ])
            
            # Construct prompt for emotion analysis
            system_prompt = """You are an expert emotion analyzer specializing in addiction recovery support. 
Analyze messages for emotional content and return ONLY valid JSON with no additional text.
Consider addiction recovery context - look for cravings, relapse risks, crisis indicators, progress celebrations, and triggers."""

            user_prompt = f"""Analyze the emotional content of this message from someone in addiction recovery.

Current message: "{text}"

Recent conversation context:
{context_summary}

Return a JSON object with exactly these fields:
{{
    "primary_emotion": "the main emotion (despair, anger, hope, calm, craving, anxiety, sadness, etc.)",
    "emotion_scores": {{
        "despair": 0.0,
        "anger": 0.0,
        "anxiety": 0.0,
        "sadness": 0.0,
        "hope": 0.0,
        "determination": 0.0,
        "calm": 0.0,
        "craving_urge": 0.0,
        "crisis_risk": 0.0
    }},
    "emotional_intensity": 0.5,
    "crisis_level": "none",
    "triggers_detected": [],
    "support_needs": []
}}

Fill in appropriate values (scores 0-1, crisis_level as "none"/"low"/"medium"/"high"/"critical").
Return ONLY the JSON object, no other text."""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            response_text = await self.client.chat_completion(messages, temperature=0.3, json_mode=True, max_tokens=800)
            
            # Parse response
            try:
                # Try to extract JSON from response
                response_text = response_text.strip()
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.startswith("```"):
                    response_text = response_text[3:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                    
                analysis_data = json.loads(response_text.strip())
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse emotion analysis JSON: {e}")
                logger.error(f"Response was: {response_text}")
                return self._fallback_emotion_analysis(text)
            
            return EmotionAnalysis(
                primary_emotion=analysis_data.get("primary_emotion", "neutral"),
                emotion_scores=analysis_data.get("emotion_scores", {}),
                emotional_intensity=analysis_data.get("emotional_intensity", 0.5),
                crisis_level=analysis_data.get("crisis_level", "none"),
                triggers_detected=analysis_data.get("triggers_detected", []),
                support_needs=analysis_data.get("support_needs", [])
            )
            
        except Exception as e:
            logger.error(f"OpenRouter emotion analysis failed: {e}")
            logger.warning("Using LOCAL FALLBACK for emotion analysis")
            return self._fallback_emotion_analysis(text)
    
    def _fallback_emotion_analysis(self, text: str) -> EmotionAnalysis:
        """Fallback rule-based emotion analysis"""
        text_lower = text.lower()
        
        # Crisis detection
        crisis_level = "none"
        for pattern in self.crisis_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                crisis_level = "critical"
                break
        
        # Simple keyword-based emotion detection
        emotion_scores = {
            "despair": 0.0, "anger": 0.0, "anxiety": 0.0, "sadness": 0.0,
            "hope": 0.0, "determination": 0.0, "calm": 0.0, 
            "craving_urge": 0.0, "crisis_risk": 0.0
        }
        
        # Negative emotions
        if any(word in text_lower for word in ["angry", "mad", "furious", "rage"]):
            emotion_scores["anger"] = 0.8
        if any(word in text_lower for word in ["anxious", "worried", "nervous", "panic"]):
            emotion_scores["anxiety"] = 0.7
        if any(word in text_lower for word in ["sad", "depressed", "down", "blue"]):
            emotion_scores["sadness"] = 0.7
        if any(word in text_lower for word in ["hopeless", "worthless", "despair"]):
            emotion_scores["despair"] = 0.9
        
        # Positive emotions
        if any(word in text_lower for word in ["hope", "hopeful", "optimistic"]):
            emotion_scores["hope"] = 0.8
        if any(word in text_lower for word in ["determined", "strong", "committed"]):
            emotion_scores["determination"] = 0.8
        if any(word in text_lower for word in ["calm", "peaceful", "relaxed"]):
            emotion_scores["calm"] = 0.7
        
        # Craving detection
        if any(word in text_lower for word in ["crave", "craving", "urge", "want to drink", "want to use"]):
            emotion_scores["craving_urge"] = 0.9
        
        # Crisis risk
        if crisis_level == "critical":
            emotion_scores["crisis_risk"] = 1.0
        
        # Determine primary emotion
        primary_emotion = max(emotion_scores, key=emotion_scores.get)
        if emotion_scores[primary_emotion] == 0.0:
            primary_emotion = "neutral"
        
        # Simple trigger detection
        triggers = []
        if any(word in text_lower for word in ["work", "job", "boss"]):
            triggers.append("work_stress")
        if any(word in text_lower for word in ["family", "relationship", "fight"]):
            triggers.append("relationship_conflict")
        if any(word in text_lower for word in ["alone", "lonely", "isolated"]):
            triggers.append("social_isolation")
        
        return EmotionAnalysis(
            primary_emotion=primary_emotion,
            emotion_scores=emotion_scores,
            emotional_intensity=max(emotion_scores.values()),
            crisis_level=crisis_level,
            triggers_detected=triggers,
            support_needs=["emotional_support"] if emotion_scores["sadness"] > 0.5 else ["encouragement"]
        )


# Response Generation Engine using OpenRouter
class ResponseGenerationEngine:
    def __init__(self):
        self.client = None
        if OPENROUTER_API_KEY:
            self.client = OpenRouterClient(OPENROUTER_API_KEY, OPENROUTER_MODEL)
    
    async def generate_response(self, user_message: str, emotion_analysis: EmotionAnalysis, 
                              user_context: Optional[UserContext], 
                              conversation_history: List[ChatMessage]) -> Dict[str, Any]:
        """Generate contextual response using OpenRouter"""
        
        if not self.client:
            return self._fallback_response_generation(user_message, emotion_analysis, user_context)
        
        try:
            # Build comprehensive context
            context_info = self._build_context_info(user_context, conversation_history, emotion_analysis)
            
            # Determine response tone based on emotion analysis
            response_tone = self._determine_response_tone(emotion_analysis)
            
            system_prompt = """You are a compassionate AI counselor specializing in addiction recovery support.
You provide empathetic, non-judgmental support while encouraging professional help when appropriate.
Always validate emotions, reinforce recovery progress, and suggest practical coping strategies.
Use person-first, non-stigmatizing language.
Return ONLY valid JSON with no additional text."""

            user_prompt = f"""User's message: "{user_message}"

Emotional analysis:
- Primary emotion: {emotion_analysis.primary_emotion}
- Crisis level: {emotion_analysis.crisis_level}
- Detected triggers: {', '.join(emotion_analysis.triggers_detected) if emotion_analysis.triggers_detected else 'None'}
- Support needs: {', '.join(emotion_analysis.support_needs) if emotion_analysis.support_needs else 'General support'}

User context:
{context_info}

Response requirements:
- Tone: {response_tone}
- Length: 2-4 sentences (be concise but supportive)
- Include empathy and validation
- Provide practical next steps if appropriate
- If crisis level is high/critical, prioritize safety and professional help

Return a JSON object with exactly these fields:
{{
    "response": "Your supportive response here",
    "suggested_actions": ["action 1", "action 2", "action 3"],
    "followup_recommended": true
}}

Return ONLY the JSON object, no other text."""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            response_text = await self.client.chat_completion(messages, temperature=0.7, json_mode=True, max_tokens=1000)
            
            # Parse response
            try:
                response_text = response_text.strip()
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.startswith("```"):
                    response_text = response_text[3:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                    
                response_data = json.loads(response_text.strip())
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse response JSON: {e}")
                logger.error(f"Response was: {response_text}")
                return self._fallback_response_generation(user_message, emotion_analysis, user_context)
            
            response_data["response_tone"] = response_tone
            
            return response_data
            
        except Exception as e:
            logger.error(f"OpenRouter response generation failed: {e}")
            logger.warning("Using LOCAL FALLBACK for response generation")
            return self._fallback_response_generation(user_message, emotion_analysis, user_context)
    
    def _determine_response_tone(self, emotion_analysis: EmotionAnalysis) -> str:
        """Determine appropriate response tone based on emotion analysis"""
        if emotion_analysis.crisis_level in ["critical", "high"]:
            return "crisis_support"
        elif emotion_analysis.primary_emotion in ["despair", "hopelessness"]:
            return "gentle_supportive"
        elif emotion_analysis.primary_emotion in ["anger", "frustration"]:
            return "validating_calm"
        elif emotion_analysis.primary_emotion in ["hope", "determination"]:
            return "encouraging_motivational"
        elif "craving_urge" in emotion_analysis.emotion_scores and emotion_analysis.emotion_scores["craving_urge"] > 0.7:
            return "urgent_supportive"
        else:
            return "balanced_supportive"
    
    def _build_context_info(self, user_context: Optional[UserContext], 
                           conversation_history: List[ChatMessage],
                           emotion_analysis: EmotionAnalysis) -> str:
        """Build context information for response generation"""
        context_parts = []
        
        if user_context:
            if user_context.addiction_type:
                context_parts.append(f"Addiction type: {user_context.addiction_type}")
            if user_context.days_in_recovery:
                context_parts.append(f"Days in recovery: {user_context.days_in_recovery}")
            if user_context.current_stress_level:
                context_parts.append(f"Current stress level: {user_context.current_stress_level}/10")
        
        if conversation_history:
            recent_topics = []
            for msg in conversation_history[-3:]:
                if msg.is_user and len(msg.content) > 20:
                    recent_topics.append(msg.content[:100] + "...")
            if recent_topics:
                context_parts.append(f"Recent conversation topics: {'; '.join(recent_topics)}")
        
        return "\n".join(context_parts) if context_parts else "No additional context available"
    
    def _fallback_response_generation(self, user_message: str, emotion_analysis: EmotionAnalysis, 
                                    user_context: Optional[UserContext]) -> Dict[str, Any]:
        """Fallback response generation without OpenRouter"""
        
        response_tone = self._determine_response_tone(emotion_analysis)
        
        # Template responses based on emotion and context
        if emotion_analysis.crisis_level in ["critical", "high"]:
            response = ("I'm really concerned about what you're sharing. Your feelings are valid, but I want to make sure you're safe. "
                       "Please consider reaching out to a crisis helpline or trusted person right now. You don't have to go through this alone.")
            suggested_actions = [
                "Contact National Suicide Prevention Lifeline: 988",
                "Reach out to a trusted friend or family member",
                "Go to your nearest emergency room if in immediate danger"
            ]
        elif "craving" in emotion_analysis.primary_emotion or emotion_analysis.emotion_scores.get("craving_urge", 0) > 0.7:
            response = ("I can hear that you're experiencing strong cravings right now. That takes courage to share. "
                       "Remember, cravings are temporary - they will pass. Let's focus on getting through the next few minutes.")
            suggested_actions = [
                "Practice the 5-4-3-2-1 grounding technique",
                "Call your sponsor or support person",
                "Remove yourself from triggering environment if possible"
            ]
        elif emotion_analysis.primary_emotion in ["anger", "frustration"]:
            response = ("It sounds like you're dealing with some really intense frustration right now. "
                       "Those feelings are completely understandable. Let's work on some ways to process this safely.")
            suggested_actions = [
                "Try deep breathing or progressive muscle relaxation",
                "Physical exercise like walking or stretching",
                "Journal about what's triggering these feelings"
            ]
        elif emotion_analysis.primary_emotion in ["hope", "determination"]:
            response = ("I can feel the strength and hope in your message - that's really powerful. "
                       "It's amazing to see your commitment to recovery. Keep building on that positive momentum.")
            suggested_actions = [
                "Celebrate this positive moment",
                "Share your progress with your support network",
                "Plan a healthy reward for yourself"
            ]
        else:
            response = ("Thank you for sharing what's on your mind. I'm here to listen and support you through whatever you're experiencing. "
                       "Your feelings are valid, and you're not alone in this journey.")
            suggested_actions = [
                "Take some deep breaths",
                "Connect with a supportive person",
                "Practice a self-care activity"
            ]
        
        return {
            "response": response,
            "suggested_actions": suggested_actions,
            "followup_recommended": emotion_analysis.emotional_intensity > 0.6,
            "response_tone": response_tone
        }


# Crisis Intervention System
class CrisisInterventionSystem:
    def __init__(self):
        self.crisis_resources = {
            "suicide_prevention": {
                "name": "National Suicide Prevention Lifeline",
                "phone": "988",
                "text": "Text HOME to 741741",
                "chat": "suicidepreventionlifeline.org/chat"
            },
            "substance_abuse": {
                "name": "SAMHSA National Helpline",
                "phone": "1-800-662-4357",
                "website": "samhsa.gov"
            },
            "crisis_text": {
                "name": "Crisis Text Line",
                "text": "Text HOME to 741741"
            }
        }
    
    def assess_crisis_intervention_need(self, emotion_analysis: EmotionAnalysis, 
                                     user_context: Optional[UserContext]) -> Optional[Dict[str, Any]]:
        """Assess if crisis intervention is needed and return appropriate resources"""
        
        if emotion_analysis.crisis_level in ["critical", "high"]:
            intervention = {
                "level": emotion_analysis.crisis_level,
                "immediate_action_required": True,
                "resources": [],
                "safety_plan_needed": True,
                "professional_help_urgency": "immediate" if emotion_analysis.crisis_level == "critical" else "within_24_hours"
            }
            
            # Add appropriate resources
            if emotion_analysis.emotion_scores.get("crisis_risk", 0) > 0.8:
                intervention["resources"].append(self.crisis_resources["suicide_prevention"])
                intervention["resources"].append(self.crisis_resources["crisis_text"])
            
            if any(trigger in ["substance_craving", "relapse_risk"] for trigger in emotion_analysis.triggers_detected):
                intervention["resources"].append(self.crisis_resources["substance_abuse"])
            
            # Add user-specific crisis contacts if available
            if user_context and user_context.crisis_contacts:
                intervention["personal_contacts"] = user_context.crisis_contacts
            
            return intervention
        
        elif emotion_analysis.crisis_level == "medium":
            return {
                "level": "medium",
                "immediate_action_required": False,
                "preventive_measures": [
                    "Schedule check-in within 2-4 hours",
                    "Connect with support person",
                    "Consider contacting counselor"
                ],
                "monitor_for_escalation": True
            }
        
        return None


# Data Management
class ChatDataManager:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
    
    def save_conversation(self, user_id: str, session_id: str, messages: List[ChatMessage]):
        """Save conversation to JSON file"""
        user_dir = self.data_dir / user_id
        user_dir.mkdir(exist_ok=True)
        
        conversation_file = user_dir / f"conversation_{session_id}.json"
        
        conversation_data = {
            "user_id": user_id,
            "session_id": session_id,
            "messages": [msg.dict() for msg in messages],
            "last_updated": datetime.now().isoformat()
        }
        
        with open(conversation_file, "w") as f:
            json.dump(conversation_data, f, indent=2, default=str)
    
    def load_recent_conversations(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Load recent conversations for context"""
        user_dir = self.data_dir / user_id
        if not user_dir.exists():
            return []
        
        conversation_files = list(user_dir.glob("conversation_*.json"))
        conversation_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        
        conversations = []
        for file_path in conversation_files[:limit]:
            try:
                with open(file_path, "r") as f:
                    conversations.append(json.load(f))
            except Exception as e:
                logger.error(f"Error loading conversation {file_path}: {e}")
        
        return conversations
    
    def get_user_conversation_summary(self, user_id: str, days: int = 7) -> Dict[str, Any]:
        """Get conversation summary for user insights"""
        conversations = self.load_recent_conversations(user_id, limit=20)
        
        if not conversations:
            return {"message": "No conversation history found"}
        
        # Analyze conversations from last N days
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_conversations = []
        
        for conv in conversations:
            try:
                conv_date = datetime.fromisoformat(conv["last_updated"].replace("Z", "+00:00"))
                if conv_date > cutoff_date:
                    recent_conversations.append(conv)
            except:
                continue
        
        if not recent_conversations:
            return {"message": f"No conversations found in last {days} days"}
        
        # Calculate summary statistics
        total_messages = sum(len(conv["messages"]) for conv in recent_conversations)
        user_messages = []
        crisis_moments = []
        emotions_detected = []
        
        for conv in recent_conversations:
            for msg in conv["messages"]:
                if msg["is_user"]:
                    user_messages.append(msg)
                    if msg.get("detected_emotions"):
                        emotions_detected.extend(msg["detected_emotions"])
                    if msg.get("crisis_level") in ["high", "critical"]:
                        crisis_moments.append(msg["timestamp"])
        
        return {
            "analysis_period_days": days,
            "total_conversations": len(recent_conversations),
            "total_messages": total_messages,
            "user_messages": len(user_messages),
            "crisis_moments": len(crisis_moments),
            "most_common_emotions": list(set(emotions_detected)),
            "engagement_level": "high" if len(user_messages) > 20 else "medium" if len(user_messages) > 5 else "low"
        }


# Initialize components
emotion_engine = EmotionDetectionEngine()
response_engine = ResponseGenerationEngine()
crisis_system = CrisisInterventionSystem()
data_manager = ChatDataManager(CHAT_DATA_DIR)


# Helper function to fetch user context from craving API
async def fetch_user_context_from_craving_api(user_id: str) -> Optional[UserContext]:
    """Fetch user context from the craving forecasting API"""
    try:
        # Get user profile
        profile_response = requests.get(f"{CRAVING_API_BASE_URL}/users/{user_id}/profile", timeout=5)
        if profile_response.status_code != 200:
            return None
        
        profile_data = profile_response.json()
        
        # Get recent statistics
        stats_response = requests.get(f"{CRAVING_API_BASE_URL}/users/{user_id}/statistics", timeout=5)
        stats_data = stats_response.json() if stats_response.status_code == 200 else {}
        
        return UserContext(
            user_id=user_id,
            addiction_type=profile_data.get("addiction_type"),
            days_in_recovery=profile_data.get("days_in_recovery"),
            current_stress_level=stats_data.get("average_stress_level"),
            last_craving_intensity=stats_data.get("average_craving_intensity"),
            preferred_support_style=profile_data.get("preferred_support_style", "balanced")
        )
    
    except Exception as e:
        logger.error(f"Failed to fetch user context from craving API: {e}")
        return None


# API Endpoints
@app.get("/")
async def root():
    return {
        "message": "Emotion-Aware Recovery Chatbot Service",
        "version": "2.0.0",
        "ai_provider": "OpenRouter",
        "model": OPENROUTER_MODEL,
        "features": [
            "Emotion detection using OpenRouter AI",
            "Context-aware response generation",
            "Crisis intervention system",
            "Integration with craving forecasting API",
            "Conversation history tracking"
        ],
        "endpoints": {
            "chat": "/chat",
            "health": "/health",
            "user_summary": "/users/{user_id}/summary",
            "crisis_resources": "/crisis-resources"
        }
    }


@app.post("/chat", response_model=ChatResponse)
async def chat_with_bot(request: ChatRequest, background_tasks: BackgroundTasks):
    """Main chat endpoint with emotion detection and adaptive responses"""
    try:
        # Generate unique message ID
        message_id = f"{request.user_id}_{int(datetime.now().timestamp())}"
        
        # Get user context (from request or fetch from craving API)
        user_context = request.context
        if not user_context:
            user_context = await fetch_user_context_from_craving_api(request.user_id)
        
        # Analyze emotions in user message
        emotion_analysis = await emotion_engine.analyze_emotion(
            request.message, 
            request.conversation_history
        )
        
        # Generate response based on emotion analysis and context
        response_data = await response_engine.generate_response(
            request.message,
            emotion_analysis,
            user_context,
            request.conversation_history
        )
        
        # Check for crisis intervention needs
        crisis_intervention = crisis_system.assess_crisis_intervention_need(
            emotion_analysis, 
            user_context
        )
        
        # Create user message record
        user_message = ChatMessage(
            message_id=f"{message_id}_user",
            user_id=request.user_id,
            content=request.message,
            timestamp=datetime.now(),
            is_user=True,
            detected_emotions=[emotion_analysis.primary_emotion],
            emotion_scores=emotion_analysis.emotion_scores,
            crisis_level=emotion_analysis.crisis_level
        )
        
        # Create bot response record
        bot_message = ChatMessage(
            message_id=f"{message_id}_bot",
            user_id=request.user_id,
            content=response_data["response"],
            timestamp=datetime.now(),
            is_user=False,
            response_tone=response_data["response_tone"]
        )
        
        # Update conversation history
        updated_history = request.conversation_history + [user_message, bot_message]
        
        # Save conversation in background
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H')}"  # Hourly sessions
        background_tasks.add_task(
            data_manager.save_conversation,
            request.user_id,
            session_id,
            updated_history
        )
        
        # Build conversation context
        conversation_context = {
            "session_id": session_id,
            "message_count": len(updated_history),
            "user_context": user_context.dict() if user_context else None,
            "recent_emotions": [msg.detected_emotions for msg in updated_history[-5:] if msg.detected_emotions]
        }
        
        return ChatResponse(
            message_id=message_id,
            response=response_data["response"],
            emotion_analysis=emotion_analysis,
            response_tone=response_data["response_tone"],
            suggested_actions=response_data["suggested_actions"],
            crisis_intervention=crisis_intervention,
            followup_recommended=response_data["followup_recommended"],
            conversation_context=conversation_context
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")


@app.get("/users/{user_id}/summary")
async def get_user_conversation_summary(user_id: str, days: int = 7):
    """Get conversation summary and insights for user"""
    try:
        summary = data_manager.get_user_conversation_summary(user_id, days)
        return {
            "user_id": user_id,
            "summary": summary,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")


@app.get("/users/{user_id}/conversations")
async def get_user_conversations(user_id: str, limit: int = 5):
    """Get recent conversations for user"""
    try:
        conversations = data_manager.load_recent_conversations(user_id, limit)
        return {
            "user_id": user_id,
            "conversations": conversations,
            "count": len(conversations)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading conversations: {str(e)}")


@app.post("/users/{user_id}/context")
async def update_user_context(user_id: str, context: UserContext):
    """Update user context for better chat responses"""
    try:
        # Save user context
        user_dir = CHAT_DATA_DIR / user_id
        user_dir.mkdir(exist_ok=True)
        
        with open(user_dir / "context.json", "w") as f:
            json.dump(context.dict(), f, indent=2, default=str)
        
        return {"message": "User context updated successfully", "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating context: {str(e)}")


@app.get("/users/{user_id}/context")
async def get_user_context(user_id: str):
    """Get stored user context"""
    try:
        # Try to load local context first
        context_file = CHAT_DATA_DIR / user_id / "context.json"
        if context_file.exists():
            with open(context_file, "r") as f:
                context_data = json.load(f)
                return UserContext(**context_data)
        
        # Fallback to craving API
        context = await fetch_user_context_from_craving_api(user_id)
        if context:
            return context
        
        raise HTTPException(status_code=404, detail="User context not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading context: {str(e)}")


@app.get("/crisis-resources")
async def get_crisis_resources():
    """Get available crisis intervention resources"""
    return {
        "crisis_resources": crisis_system.crisis_resources,
        "emergency_note": "If you're in immediate danger, call 911 or go to your nearest emergency room",
        "usage_note": "These resources are available 24/7 for crisis support"
    }


@app.post("/analyze-emotion")
async def analyze_emotion_only(text: str, context: Optional[List[ChatMessage]] = None):
    """Standalone emotion analysis endpoint"""
    try:
        emotion_analysis = await emotion_engine.analyze_emotion(text, context or [])
        return {
            "text": text,
            "emotion_analysis": emotion_analysis,
            "analyzed_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing emotion: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    openrouter_status = "connected" if OPENROUTER_API_KEY and emotion_engine.client else "not_configured"
    craving_api_status = "unknown"
    
    # Test craving API connection
    try:
        response = requests.get(f"{CRAVING_API_BASE_URL}/health", timeout=5)
        craving_api_status = "connected" if response.status_code == 200 else "error"
    except:
        craving_api_status = "unreachable"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Emotion-Aware Recovery Chatbot",
        "version": "2.0.0",
        "ai_provider": "OpenRouter",
        "model": OPENROUTER_MODEL,
        "integrations": {
            "openrouter": openrouter_status,
            "craving_api": craving_api_status
        },
        "features_available": {
            "emotion_detection": openrouter_status == "connected",
            "advanced_responses": openrouter_status == "connected",
            "crisis_intervention": True,
            "conversation_history": True,
            "user_context_integration": craving_api_status == "connected"
        }
    }


@app.get("/statistics")
async def get_service_statistics():
    """Get overall service usage statistics"""
    try:
        total_users = len(list(CHAT_DATA_DIR.glob("*")))
        total_conversations = len(list(CHAT_DATA_DIR.glob("*/conversation_*.json")))
        
        # Analyze recent activity (last 24 hours)
        recent_activity = 0
        cutoff_time = datetime.now() - timedelta(hours=24)
        
        for user_dir in CHAT_DATA_DIR.glob("*"):
            if user_dir.is_dir():
                for conv_file in user_dir.glob("conversation_*.json"):
                    if conv_file.stat().st_mtime > cutoff_time.timestamp():
                        recent_activity += 1
        
        return {
            "total_users": total_users,
            "total_conversations": total_conversations,
            "recent_activity_24h": recent_activity,
            "service_uptime": "active",
            "ai_provider": "OpenRouter",
            "model": OPENROUTER_MODEL,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating statistics: {str(e)}")


# Webhook endpoint for integration with craving API
@app.post("/webhook/craving-update")
async def handle_craving_update(user_id: str, craving_data: Dict[str, Any]):
    """Webhook to receive craving updates from the main API"""
    try:
        # Update user context with latest craving data
        context_file = CHAT_DATA_DIR / user_id / "context.json"
        
        if context_file.exists():
            with open(context_file, "r") as f:
                context_data = json.load(f)
        else:
            context_data = {"user_id": user_id}
        
        # Update with new craving information
        context_data.update({
            "last_craving_intensity": craving_data.get("craving_intensity"),
            "current_stress_level": craving_data.get("stress_level"),
            "last_update": datetime.now().isoformat()
        })
        
        # Save updated context
        user_dir = CHAT_DATA_DIR / user_id
        user_dir.mkdir(exist_ok=True)
        
        with open(context_file, "w") as f:
            json.dump(context_data, f, indent=2, default=str)
        
        # If high craving intensity, could trigger proactive chat
        if craving_data.get("craving_intensity", 0) > 7:
            logger.info(f"High craving intensity detected for user {user_id}: {craving_data.get('craving_intensity')}")
            # Could implement proactive outreach here
        
        return {"message": "Craving data updated successfully", "user_id": user_id}
    
    except Exception as e:
        logger.error(f"Error handling craving update: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating craving data: {str(e)}")


# Background task for proactive check-ins
@app.post("/admin/trigger-proactive-checkin")
async def trigger_proactive_checkin(user_id: str, reason: str = "scheduled_checkin"):
    """Admin endpoint to trigger proactive check-in for user"""
    try:
        # Get user context
        user_context = await fetch_user_context_from_craving_api(user_id)
        
        # Generate proactive message based on reason and context
        if reason == "high_craving_detected":
            proactive_message = ("Hi! I noticed your recent check-in showed some increased craving intensity. "
                               "Just wanted to check in and see how you're doing right now. "
                               "Would you like to talk about what's going on?")
        elif reason == "missed_checkin":
            proactive_message = ("Hey there! I haven't heard from you in a while and wanted to check in. "
                               "How are you feeling today? Remember, I'm here if you need support.")
        else:
            proactive_message = ("Hi! Just checking in to see how your recovery journey is going. "
                               "How are you feeling today?")
        
        # Create proactive chat message
        message_id = f"proactive_{user_id}_{int(datetime.now().timestamp())}"
        
        proactive_chat = ChatMessage(
            message_id=message_id,
            user_id=user_id,
            content=proactive_message,
            timestamp=datetime.now(),
            is_user=False,
            response_tone="caring_proactive"
        )
        
        # Save proactive message
        session_id = f"proactive_session_{datetime.now().strftime('%Y%m%d_%H')}"
        data_manager.save_conversation(user_id, session_id, [proactive_chat])
        
        return {
            "message": "Proactive check-in triggered",
            "user_id": user_id,
            "reason": reason,
            "proactive_message": proactive_message,
            "message_id": message_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error triggering proactive check-in: {str(e)}")
