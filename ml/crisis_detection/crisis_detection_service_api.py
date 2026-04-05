from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import os
import json
import asyncio
from datetime import datetime, timedelta
import logging
from pathlib import Path
import requests
import re
import hashlib
from collections import defaultdict
from enum import Enum

# Google Gemini imports
from google import genai
from google.genai import types

# Initialize FastAPI app
app = FastAPI(
    title="Crisis Detection & Automatic Escalation Service",
    description="Real-time crisis detection and automatic escalation for addiction recovery",
    version="1.0.0"
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create data directories
CRISIS_DATA_DIR = Path("crisis_data")
CRISIS_DATA_DIR.mkdir(exist_ok=True)

PATTERNS_DIR = Path("crisis_patterns")
PATTERNS_DIR.mkdir(exist_ok=True)

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
EMERGENCY_SERVICES_API = os.environ.get("EMERGENCY_SERVICES_API")
SMS_SERVICE_API = os.environ.get("SMS_SERVICE_API")
EMAIL_SERVICE_API = os.environ.get("EMAIL_SERVICE_API")

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found. AI crisis detection will be limited.")

# Crisis Level Enum
class CrisisLevel(int, Enum):
    BASELINE = 1      # Normal recovery challenges
    LOW_RISK = 2      # Concerning but manageable
    MODERATE = 3      # Requires professional attention
    HIGH_RISK = 4     # Urgent intervention needed
    CRITICAL = 5      # Immediate danger - emergency response

# Crisis Type Enum
class CrisisType(str, Enum):
    SUICIDAL_IDEATION = "suicidal_ideation"
    SELF_HARM = "self_harm"
    OVERDOSE_RISK = "overdose_risk"
    SEVERE_DEPRESSION = "severe_depression"
    PSYCHOTIC_EPISODE = "psychotic_episode"
    SUBSTANCE_ABUSE = "substance_abuse"
    PANIC_ATTACK = "panic_attack"
    ISOLATION = "isolation"
    HOPELESSNESS = "hopelessness"
    RELAPSE_RISK = "relapse_risk"

# Pydantic Models
class UserMessage(BaseModel):
    user_id: str
    message: str
    source: str = Field(..., description="chatbot/craving_api/message_service/manual")
    timestamp: datetime = Field(default_factory=datetime.now)
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    user_metadata: Optional[Dict[str, Any]] = Field(None, description="User profile info")

class StressReport(BaseModel):
    user_id: str
    stress_level: float = Field(..., ge=0, le=10, description="Stress level 0-10")
    craving_intensity: Optional[float] = Field(None, ge=0, le=10)
    source: str = "stress_monitor"
    timestamp: datetime = Field(default_factory=datetime.now)
    additional_context: Optional[Dict[str, Any]] = None

class ManualCrisisReport(BaseModel):
    user_id: str
    reporter_id: Optional[str] = Field(None, description="Who is reporting the crisis")
    crisis_description: str
    perceived_risk_level: int = Field(..., ge=1, le=5)
    immediate_concern: bool = Field(False, description="Requires immediate attention")
    contact_info: Optional[str] = Field(None, description="How to reach the person")
    location: Optional[str] = Field(None, description="Where the person is")

class EmergencyContact(BaseModel):
    name: str
    relationship: str = Field(..., description="family/friend/sponsor/therapist/doctor")
    phone: Optional[str] = None
    email: Optional[str] = None
    priority: int = Field(1, ge=1, le=5, description="Contact priority 1=highest")
    available_hours: Optional[str] = Field("24/7", description="When they can be contacted")

class UserCrisisProfile(BaseModel):
    user_id: str
    emergency_contacts: List[EmergencyContact] = Field(default=[])
    healthcare_provider: Optional[EmergencyContact] = None
    crisis_history: List[str] = Field(default=[], description="Previous crisis types")
    risk_factors: List[str] = Field(default=[], description="Known risk factors")
    protective_factors: List[str] = Field(default=[], description="Things that help")
    preferred_intervention: str = Field("professional", description="professional/family/peer")
    location: Optional[str] = Field(None, description="Current location/timezone")
    special_instructions: Optional[str] = Field(None, description="Special considerations")

class CrisisAnalysis(BaseModel):
    message_id: str
    user_id: str
    crisis_level: CrisisLevel
    crisis_types: List[CrisisType]
    confidence_score: float = Field(..., ge=0, le=1, description="Confidence in assessment")
    key_indicators: List[str] = Field(..., description="What triggered the detection")
    emotional_state: str = Field(..., description="Detected emotional state")
    urgency: str = Field(..., description="immediate/urgent/concerning/monitor")
    analyzed_at: datetime = Field(default_factory=datetime.now)

class CrisisResponse(BaseModel):
    crisis_analysis: CrisisAnalysis
    immediate_actions: List[str]
    alert_messages: Dict[str, str] = Field(..., description="Messages for different recipients")
    resources: List[Dict[str, str]] = Field(..., description="Crisis resources")
    escalation_triggered: bool
    follow_up_required: bool
    estimated_response_time: str = Field(..., description="How quickly to respond")

class AlertStatus(BaseModel):
    alert_id: str
    user_id: str
    crisis_level: CrisisLevel
    sent_to: List[str] = Field(..., description="Who was alerted")
    delivery_status: Dict[str, str] = Field(..., description="Delivery confirmation")
    timestamp: datetime = Field(default_factory=datetime.now)
    acknowledged_by: List[str] = Field(default=[], description="Who acknowledged the alert")

# Crisis Detection Patterns
class CrisisPatternMatcher:
    def __init__(self):
        self.patterns = self._load_crisis_patterns()
        self._initialize_default_patterns()
    
    def _load_crisis_patterns(self) -> Dict[str, Any]:
        """Load crisis detection patterns from JSON"""
        patterns_file = PATTERNS_DIR / "crisis_patterns.json"
        
        if patterns_file.exists():
            with open(patterns_file, "r") as f:
                return json.load(f)
        else:
            return {}
    
    def _initialize_default_patterns(self):
        """Initialize default crisis detection patterns"""
        if not self.patterns:
            self.patterns = {
                "critical_keywords": {
                    "suicidal": ["kill myself", "end it all", "suicide", "not worth living", "better off dead", "take my life", "end my life"],
                    "self_harm": ["cut myself", "hurt myself", "self harm", "cutting", "burning myself", "punish myself"],
                    "immediate_danger": ["tonight", "right now", "pills ready", "gun", "bridge", "overdose on purpose"],
                    "method_indicators": ["pills", "rope", "knife", "bridge", "gun", "poison", "hanging"]
                },
                "high_risk_phrases": {
                    "hopelessness": ["no point", "nothing matters", "can't go on", "no hope", "no way out", "pointless"],
                    "isolation": ["nobody cares", "all alone", "no one understands", "isolated", "abandoned"],
                    "overwhelming": ["can't take it", "too much", "can't handle", "overwhelming", "breaking point"],
                    "finality": ["goodbye", "last time", "final", "end", "done with everything"]
                },
                "moderate_risk_indicators": {
                    "depression": ["depressed", "sad all the time", "empty", "numb", "worthless", "failure"],
                    "anxiety": ["panic", "can't breathe", "anxiety attack", "terrified", "scared"],
                    "substance": ["relapsed", "used again", "drinking", "high", "overdid it", "too much"],
                    "stress": ["stressed out", "pressure", "can't cope", "breaking down"]
                },
                "emotional_indicators": {
                    "anger": ["angry", "rage", "furious", "hate", "destroy"],
                    "despair": ["hopeless", "despair", "lost", "broken", "shattered"],
                    "fear": ["afraid", "scared", "terrified", "panic", "frightened"]
                }
            }
            self._save_patterns()
    
    def _save_patterns(self):
        """Save patterns to file"""
        patterns_file = PATTERNS_DIR / "crisis_patterns.json"
        with open(patterns_file, "w") as f:
            json.dump(self.patterns, f, indent=2)
    
    def analyze_text_patterns(self, text: str) -> Dict[str, Any]:
        """Analyze text for crisis patterns"""
        text_lower = text.lower()
        results = {
            "crisis_indicators": [],
            "risk_level": 1,
            "detected_types": [],
            "keywords_found": [],
            "emotional_state": "neutral"
        }
        
        # Check critical keywords (Level 5)
        for category, keywords in self.patterns["critical_keywords"].items():
            found_keywords = [kw for kw in keywords if kw in text_lower]
            if found_keywords:
                results["crisis_indicators"].append(f"critical_{category}")
                results["keywords_found"].extend(found_keywords)
                results["risk_level"] = max(results["risk_level"], 5)
                
                # Map to crisis types
                if category == "suicidal":
                    results["detected_types"].append(CrisisType.SUICIDAL_IDEATION)
                elif category == "self_harm":
                    results["detected_types"].append(CrisisType.SELF_HARM)
        
        # Check high risk phrases (Level 4)
        for category, phrases in self.patterns["high_risk_phrases"].items():
            found_phrases = [phrase for phrase in phrases if phrase in text_lower]
            if found_phrases:
                results["crisis_indicators"].append(f"high_risk_{category}")
                results["keywords_found"].extend(found_phrases)
                if results["risk_level"] < 5:
                    results["risk_level"] = max(results["risk_level"], 4)
        
        # Check moderate risk (Level 3)
        for category, indicators in self.patterns["moderate_risk_indicators"].items():
            found_indicators = [ind for ind in indicators if ind in text_lower]
            if found_indicators:
                results["crisis_indicators"].append(f"moderate_{category}")
                results["keywords_found"].extend(found_indicators)
                if results["risk_level"] < 4:
                    results["risk_level"] = max(results["risk_level"], 3)
                
                # Map to crisis types
                if category == "depression":
                    results["detected_types"].append(CrisisType.SEVERE_DEPRESSION)
                elif category == "substance":
                    results["detected_types"].append(CrisisType.SUBSTANCE_ABUSE)
        
        # Determine emotional state
        for emotion, keywords in self.patterns["emotional_indicators"].items():
            if any(kw in text_lower for kw in keywords):
                results["emotional_state"] = emotion
                break
        
        return results

# AI-Enhanced Crisis Detection
class AICrisisDetector:
    def __init__(self):
        self.client = None
        if GEMINI_API_KEY:
            self.client = genai.Client(api_key=GEMINI_API_KEY)
    
    async def analyze_crisis_with_ai(self, message: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Use AI to analyze message for crisis indicators"""
        
        if not self.client:
            logger.warning("Gemini client not available, using pattern-only analysis")
            return {"ai_analysis": False}
        
        try:
            # Build context for AI analysis
            context_str = ""
            if context:
                context_str = f"\nContext: {json.dumps(context)}"
            
            prompt = f"""
            Analyze this message for crisis indicators in addiction recovery context:
            
            Message: "{message}"{context_str}
            
            Assess for:
            1. Suicidal ideation (thoughts, plans, means)
            2. Self-harm indicators
            3. Overdose/substance abuse crisis
            4. Severe depression or hopelessness
            5. Immediate danger signs
            6. Overall emotional state
            
            Respond in JSON format:
            {{
                "crisis_detected": boolean,
                "crisis_level": 1-5 (1=normal, 5=critical),
                "crisis_types": ["suicidal_ideation", "self_harm", etc.],
                "confidence": 0.0-1.0,
                "emotional_state": "description",
                "immediate_risk": boolean,
                "key_concerns": ["concern1", "concern2"],
                "reasoning": "brief explanation"
            }}
            """
            
            contents = [
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=prompt)]
                )
            ]
            
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,  # Low temperature for consistency
                max_output_tokens=500
            )
            
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model="gemini-2.0-flash",
                contents=contents,
                config=config
            )
            
            # Parse AI response
            try:
                ai_result = json.loads(response.text)
                ai_result["ai_analysis"] = True
                return ai_result
            except json.JSONDecodeError:
                logger.error("Failed to parse AI response as JSON")
                return {"ai_analysis": False}
                
        except Exception as e:
            logger.error(f"AI crisis analysis failed: {e}")
            return {"ai_analysis": False}

# Crisis Detection Engine (Main orchestrator)
class CrisisDetectionEngine:
    def __init__(self):
        self.pattern_matcher = CrisisPatternMatcher()
        self.ai_detector = AICrisisDetector()
        self.user_profiles = {}
        self.active_crises = {}
    
    async def analyze_message(self, user_message: UserMessage) -> CrisisAnalysis:
        """Comprehensive crisis analysis of user message"""
        
        # Step 1: Pattern-based analysis (fast)
        pattern_results = self.pattern_matcher.analyze_text_patterns(user_message.message)
        
        # Step 2: AI-enhanced analysis (if available)
        ai_results = await self.ai_detector.analyze_crisis_with_ai(
            user_message.message, 
            user_message.context
        )
        
        # Step 3: Combine results and determine final assessment
        final_analysis = self._combine_analysis_results(
            pattern_results, 
            ai_results, 
            user_message
        )
        
        # Step 4: Create crisis analysis object
        message_id = self._generate_message_id(user_message)
        
        crisis_analysis = CrisisAnalysis(
            message_id=message_id,
            user_id=user_message.user_id,
            crisis_level=CrisisLevel(final_analysis["crisis_level"]),
            crisis_types=final_analysis["crisis_types"],
            confidence_score=final_analysis["confidence"],
            key_indicators=final_analysis["key_indicators"],
            emotional_state=final_analysis["emotional_state"],
            urgency=final_analysis["urgency"]
        )
        
        return crisis_analysis
    
    def _combine_analysis_results(self, pattern_results: Dict, ai_results: Dict, user_message: UserMessage) -> Dict:
        """Combine pattern and AI analysis results"""
        
        # Start with pattern analysis
        combined = {
            "crisis_level": pattern_results["risk_level"],
            "crisis_types": pattern_results["detected_types"],
            "key_indicators": pattern_results["crisis_indicators"],
            "emotional_state": pattern_results["emotional_state"],
            "confidence": 0.7  # Base confidence for pattern matching
        }
        
        # Enhance with AI analysis if available
        if ai_results.get("ai_analysis"):
            # AI takes precedence for crisis level if higher
            if ai_results.get("crisis_level", 1) > combined["crisis_level"]:
                combined["crisis_level"] = ai_results["crisis_level"]
            
            # Combine crisis types
            ai_types = ai_results.get("crisis_types", [])
            for crisis_type in ai_types:
                if crisis_type not in combined["crisis_types"]:
                    combined["crisis_types"].append(crisis_type)
            
            # Use AI confidence if available
            combined["confidence"] = ai_results.get("confidence", combined["confidence"])
            
            # Add AI reasoning to indicators
            if ai_results.get("key_concerns"):
                combined["key_indicators"].extend(ai_results["key_concerns"])
            
            # Use AI emotional state if more specific
            if ai_results.get("emotional_state") and ai_results["emotional_state"] != "neutral":
                combined["emotional_state"] = ai_results["emotional_state"]
        
        # Determine urgency
        if combined["crisis_level"] >= 5:
            combined["urgency"] = "immediate"
        elif combined["crisis_level"] >= 4:
            combined["urgency"] = "urgent"
        elif combined["crisis_level"] >= 3:
            combined["urgency"] = "concerning"
        else:
            combined["urgency"] = "monitor"
        
        # Ensure crisis_types are CrisisType enums
        valid_crisis_types = []
        for ct in combined["crisis_types"]:
            if isinstance(ct, str):
                try:
                    valid_crisis_types.append(CrisisType(ct))
                except ValueError:
                    # Skip invalid crisis types
                    pass
            else:
                valid_crisis_types.append(ct)
        
        combined["crisis_types"] = valid_crisis_types
        
        return combined
    
    def _generate_message_id(self, user_message: UserMessage) -> str:
        """Generate unique message ID"""
        content = f"{user_message.user_id}_{user_message.message}_{user_message.timestamp}"
        return hashlib.md5(content.encode()).hexdigest()[:16]

# Crisis Response Engine
class CrisisResponseEngine:
    def __init__(self):
        self.resource_database = self._initialize_crisis_resources()
    
    def _initialize_crisis_resources(self) -> Dict[str, List[Dict]]:
        """Initialize crisis resource database"""
        return {
            "critical": [
                {"name": "Emergency Services", "contact": "911", "available": "24/7", "type": "emergency"},
                {"name": "National Suicide Prevention Lifeline", "contact": "988", "available": "24/7", "type": "crisis_line"},
                {"name": "Crisis Text Line", "contact": "Text HOME to 741741", "available": "24/7", "type": "text_support"}
            ],
            "high_risk": [
                {"name": "National Suicide Prevention Lifeline", "contact": "988", "available": "24/7", "type": "crisis_line"},
                {"name": "Crisis Text Line", "contact": "Text HOME to 741741", "available": "24/7", "type": "text_support"},
                {"name": "SAMHSA National Helpline", "contact": "1-800-662-4357", "available": "24/7", "type": "substance_abuse"}
            ],
            "moderate": [
                {"name": "SAMHSA National Helpline", "contact": "1-800-662-4357", "available": "24/7", "type": "substance_abuse"},
                {"name": "National Alliance on Mental Illness", "contact": "1-800-950-6264", "available": "Mon-Fri 10am-8pm ET", "type": "mental_health"},
                {"name": "Crisis Text Line", "contact": "Text HOME to 741741", "available": "24/7", "type": "text_support"}
            ],
            "low_risk": [
                {"name": "National Alliance on Mental Illness", "contact": "1-800-950-6264", "available": "Mon-Fri 10am-8pm ET", "type": "mental_health"},
                {"name": "Substance Abuse Treatment Locator", "contact": "https://findtreatment.samhsa.gov", "available": "24/7", "type": "online_resource"}
            ]
        }
    
    def generate_crisis_response(self, crisis_analysis: CrisisAnalysis, user_profile: Optional[UserCrisisProfile] = None) -> CrisisResponse:
        """Generate comprehensive crisis response"""
        
        # Determine immediate actions
        immediate_actions = self._get_immediate_actions(crisis_analysis, user_profile)
        
        # Generate alert messages for different recipients
        alert_messages = self._generate_alert_messages(crisis_analysis, user_profile)
        
        # Get appropriate resources
        resources = self._get_crisis_resources(crisis_analysis)
        
        # Determine if escalation should be triggered
        escalation_triggered = crisis_analysis.crisis_level >= CrisisLevel.HIGH_RISK
        
        # Determine follow-up requirements
        follow_up_required = crisis_analysis.crisis_level >= CrisisLevel.MODERATE
        
        # Estimate response time requirements
        response_time = self._get_response_time_requirement(crisis_analysis.crisis_level)
        
        return CrisisResponse(
            crisis_analysis=crisis_analysis,
            immediate_actions=immediate_actions,
            alert_messages=alert_messages,
            resources=resources,
            escalation_triggered=escalation_triggered,
            follow_up_required=follow_up_required,
            estimated_response_time=response_time
        )
    
    def _get_immediate_actions(self, crisis_analysis: CrisisAnalysis, user_profile: Optional[UserCrisisProfile]) -> List[str]:
        """Determine immediate actions based on crisis level"""
        actions = []
        
        if crisis_analysis.crisis_level == CrisisLevel.CRITICAL:
            actions.extend([
                "Call emergency services (911) immediately",
                "Do not leave the person alone",
                "Remove any potential means of self-harm",
                "Stay on the line with emergency services"
            ])
            
            if user_profile and user_profile.emergency_contacts:
                primary_contact = min(user_profile.emergency_contacts, key=lambda x: x.priority)
                actions.append(f"Contact {primary_contact.name} immediately at {primary_contact.phone}")
        
        elif crisis_analysis.crisis_level == CrisisLevel.HIGH_RISK:
            actions.extend([
                "Contact National Suicide Prevention Lifeline: 988",
                "Arrange for immediate professional assessment",
                "Ensure person is not alone",
                "Contact emergency contacts within 1 hour"
            ])
            
            if user_profile and user_profile.healthcare_provider:
                actions.append(f"Alert healthcare provider: {user_profile.healthcare_provider.name}")
        
        elif crisis_analysis.crisis_level == CrisisLevel.MODERATE:
            actions.extend([
                "Schedule professional assessment within 24 hours",
                "Increase monitoring and check-ins",
                "Provide crisis resources and support options",
                "Consider safety planning"
            ])
        
        elif crisis_analysis.crisis_level == CrisisLevel.LOW_RISK:
            actions.extend([
                "Offer additional support resources",
                "Schedule follow-up within 48 hours",
                "Monitor for escalation",
                "Provide coping strategies"
            ])
        
        return actions
    
    def _generate_alert_messages(self, crisis_analysis: CrisisAnalysis, user_profile: Optional[UserCrisisProfile]) -> Dict[str, str]:
        """Generate alert messages for different recipients"""
        messages = {}
        
        # Emergency contact message
        if crisis_analysis.crisis_level >= CrisisLevel.HIGH_RISK:
            messages["emergency_contact"] = f"""
URGENT CRISIS ALERT: {crisis_analysis.user_id} may be in immediate danger.

Crisis Level: {crisis_analysis.crisis_level.value}/5
Detected Issues: {', '.join([ct.value for ct in crisis_analysis.crisis_types])}
Time: {crisis_analysis.analyzed_at.strftime('%Y-%m-%d %H:%M')}

IMMEDIATE ACTION REQUIRED:
- Check on them immediately or call 911
- Do not leave them alone
- Contact crisis support: 988

This is an automated alert from the Crisis Detection System.
""".strip()
        
        # Healthcare provider message
        if crisis_analysis.crisis_level >= CrisisLevel.MODERATE:
            messages["healthcare_provider"] = f"""
Crisis Alert - Patient Assessment Needed

Patient ID: {crisis_analysis.user_id}
Crisis Level: {crisis_analysis.crisis_level.value}/5
Detected Concerns: {', '.join([ct.value for ct in crisis_analysis.crisis_types])}
Confidence: {crisis_analysis.confidence_score:.2f}
Timestamp: {crisis_analysis.analyzed_at.strftime('%Y-%m-%d %H:%M')}

Key Indicators: {', '.join(crisis_analysis.key_indicators)}
Emotional State: {crisis_analysis.emotional_state}

Professional assessment {'urgently' if crisis_analysis.urgency == 'immediate' else 'soon'} recommended.

Crisis Detection System
""".strip()
        
        # User support message
        messages["user_support"] = f"""
I'm concerned about you right now and want you to know that help is available.

You're not alone in this. Crisis support is available 24/7:
• Call 988 for immediate support
• Text HOME to 741741 for crisis text support
• Call 911 if you're in immediate danger

Your feelings are valid, but they don't have to be permanent. Please reach out for help.

You matter. Your life has value.
""".strip()
        
        # System alert message
        messages["system_alert"] = f"""
Crisis Detection Alert

User: {crisis_analysis.user_id}
Level: {crisis_analysis.crisis_level.value}/5 ({crisis_analysis.urgency})
Types: {', '.join([ct.value for ct in crisis_analysis.crisis_types])}
Confidence: {crisis_analysis.confidence_score:.2f}
Time: {crisis_analysis.analyzed_at.isoformat()}

Escalation: {'YES' if crisis_analysis.crisis_level >= CrisisLevel.HIGH_RISK else 'NO'}
""".strip()
        
        return messages
    
    def _get_crisis_resources(self, crisis_analysis: CrisisAnalysis) -> List[Dict[str, str]]:
        """Get appropriate crisis resources based on crisis level"""
        
        if crisis_analysis.crisis_level == CrisisLevel.CRITICAL:
            return self.resource_database["critical"]
        elif crisis_analysis.crisis_level == CrisisLevel.HIGH_RISK:
            return self.resource_database["high_risk"]
        elif crisis_analysis.crisis_level == CrisisLevel.MODERATE:
            return self.resource_database["moderate"]
        else:
            return self.resource_database["low_risk"]
    
    def _get_response_time_requirement(self, crisis_level: CrisisLevel) -> str:
        """Get response time requirement based on crisis level"""
        
        time_requirements = {
            CrisisLevel.CRITICAL: "Immediate (0-5 minutes)",
            CrisisLevel.HIGH_RISK: "Urgent (within 1 hour)",
            CrisisLevel.MODERATE: "Within 24 hours",
            CrisisLevel.LOW_RISK: "Within 48 hours",
            CrisisLevel.BASELINE: "Regular monitoring"
        }
        
        return time_requirements.get(crisis_level, "As needed")

# Data Management
class CrisisDataManager:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
    
    def save_user_crisis_profile(self, profile: UserCrisisProfile):
        """Save user crisis profile"""
        user_dir = self.data_dir / profile.user_id
        user_dir.mkdir(exist_ok=True)
        
        with open(user_dir / "crisis_profile.json", "w") as f:
            json.dump(profile.dict(), f, indent=2, default=str)
    
    def load_user_crisis_profile(self, user_id: str) -> Optional[UserCrisisProfile]:
        """Load user crisis profile"""
        try:
            user_dir = self.data_dir / user_id
            with open(user_dir / "crisis_profile.json", "r") as f:
                data = json.load(f)
                return UserCrisisProfile(**data)
        except FileNotFoundError:
            return None
    
    def log_crisis_incident(self, crisis_response: CrisisResponse):
        """Log crisis incident (basic tracking only)"""
        user_dir = self.data_dir / crisis_response.crisis_analysis.user_id
        user_dir.mkdir(exist_ok=True)
        
        incidents_file = user_dir / "crisis_incidents.json"
        
        # Load existing incidents
        incidents = []
        if incidents_file.exists():
            with open(incidents_file, "r") as f:
                incidents = json.load(f)
        
        # Add new incident (basic info only)
        incident_record = {
            "incident_id": crisis_response.crisis_analysis.message_id,
            "crisis_level": crisis_response.crisis_analysis.crisis_level.value,
            "crisis_types": [ct.value for ct in crisis_response.crisis_analysis.crisis_types],
            "confidence": crisis_response.crisis_analysis.confidence_score,
            "urgency": crisis_response.crisis_analysis.urgency,
            "escalation_triggered": crisis_response.escalation_triggered,
            "timestamp": crisis_response.crisis_analysis.analyzed_at.isoformat(),
            "key_indicators": crisis_response.crisis_analysis.key_indicators[:3]  # Limited info
        }
        
        incidents.append(incident_record)
        
        # Keep only last 50 incidents
        if len(incidents) > 50:
            incidents = incidents[-50:]
        
        # Save updated incidents
        with open(incidents_file, "w") as f:
            json.dump(incidents, f, indent=2)
    
    def get_user_crisis_history(self, user_id: str) -> List[Dict]:
        """Get basic crisis history for user"""
        try:
            user_dir = self.data_dir / user_id
            incidents_file = user_dir / "crisis_incidents.json"
            
            if incidents_file.exists():
                with open(incidents_file, "r") as f:
                    return json.load(f)
            else:
                return []
        except Exception as e:
            logger.error(f"Error loading crisis history: {e}")
            return []

# Alert Management System
class AlertManager:
    def __init__(self):
        self.active_alerts = {}
        self.delivery_status = defaultdict(dict)
    
    async def send_crisis_alerts(self, crisis_response: CrisisResponse, user_profile: Optional[UserCrisisProfile] = None) -> AlertStatus:
        """Send crisis alerts to appropriate parties"""
        
        alert_id = f"alert_{crisis_response.crisis_analysis.user_id}_{int(datetime.now().timestamp())}"
        sent_to = []
        delivery_status = {}
        
        # Determine who to alert based on crisis level
        if crisis_response.crisis_analysis.crisis_level >= CrisisLevel.CRITICAL:
            # Critical: Alert everyone immediately
            if user_profile and user_profile.emergency_contacts:
                for contact in user_profile.emergency_contacts:
                    if contact.phone:
                        status = await self._send_sms_alert(contact.phone, crisis_response.alert_messages["emergency_contact"])
                        delivery_status[f"sms_{contact.name}"] = status
                        sent_to.append(f"Emergency Contact: {contact.name}")
            
            # Alert healthcare provider
            if user_profile and user_profile.healthcare_provider and user_profile.healthcare_provider.email:
                status = await self._send_email_alert(
                    user_profile.healthcare_provider.email, 
                    "CRITICAL Crisis Alert - Immediate Action Required",
                    crisis_response.alert_messages["healthcare_provider"]
                )
                delivery_status["healthcare_email"] = status
                sent_to.append("Healthcare Provider")
        
        elif crisis_response.crisis_analysis.crisis_level >= CrisisLevel.HIGH_RISK:
            # High Risk: Alert primary contacts and healthcare
            if user_profile and user_profile.emergency_contacts:
                primary_contacts = [c for c in user_profile.emergency_contacts if c.priority <= 2]
                for contact in primary_contacts:
                    if contact.phone:
                        status = await self._send_sms_alert(contact.phone, crisis_response.alert_messages["emergency_contact"])
                        delivery_status[f"sms_{contact.name}"] = status
                        sent_to.append(f"Emergency Contact: {contact.name}")
            
            if user_profile and user_profile.healthcare_provider:
                if user_profile.healthcare_provider.email:
                    status = await self._send_email_alert(
                        user_profile.healthcare_provider.email,
                        "High Risk Crisis Alert - Urgent Assessment Needed", 
                        crisis_response.alert_messages["healthcare_provider"]
                    )
                    delivery_status["healthcare_email"] = status
                    sent_to.append("Healthcare Provider")
        
        elif crisis_response.crisis_analysis.crisis_level >= CrisisLevel.MODERATE:
            # Moderate: Alert healthcare provider via email
            if user_profile and user_profile.healthcare_provider and user_profile.healthcare_provider.email:
                status = await self._send_email_alert(
                    user_profile.healthcare_provider.email,
                    "Crisis Alert - Professional Assessment Recommended",
                    crisis_response.alert_messages["healthcare_provider"]
                )
                delivery_status["healthcare_email"] = status
                sent_to.append("Healthcare Provider")
        
        # Create alert status record
        alert_status = AlertStatus(
            alert_id=alert_id,
            user_id=crisis_response.crisis_analysis.user_id,
            crisis_level=crisis_response.crisis_analysis.crisis_level,
            sent_to=sent_to,
            delivery_status=delivery_status
        )
        
        # Store active alert
        self.active_alerts[alert_id] = alert_status
        
        return alert_status
    
    async def _send_sms_alert(self, phone: str, message: str) -> str:
        """Send SMS alert (mock implementation)"""
        try:
            # In production, integrate with SMS service like Twilio
            if SMS_SERVICE_API:
                response = requests.post(f"{SMS_SERVICE_API}/send", json={
                    "to": phone,
                    "message": message,
                    "priority": "urgent"
                }, timeout=10)
                
                if response.status_code == 200:
                    return "delivered"
                else:
                    return "failed"
            else:
                # Mock success for development
                logger.info(f"SMS Alert (MOCK): {phone[:3]}***{phone[-4:]} - {message[:50]}...")
                return "delivered"
                
        except Exception as e:
            logger.error(f"SMS send failed: {e}")
            return "failed"
    
    async def _send_email_alert(self, email: str, subject: str, message: str) -> str:
        """Send email alert (mock implementation)"""
        try:
            # In production, integrate with email service
            if EMAIL_SERVICE_API:
                response = requests.post(f"{EMAIL_SERVICE_API}/send", json={
                    "to": email,
                    "subject": subject,
                    "body": message,
                    "priority": "urgent"
                }, timeout=10)
                
                if response.status_code == 200:
                    return "delivered"
                else:
                    return "failed"
            else:
                # Mock success for development
                logger.info(f"Email Alert (MOCK): {email[:3]}***{email[-10:]} - {subject}")
                return "delivered"
                
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            return "failed"

# Initialize components
crisis_engine = CrisisDetectionEngine()
response_engine = CrisisResponseEngine()
alert_manager = AlertManager()
data_manager = CrisisDataManager(CRISIS_DATA_DIR)

# API Endpoints
@app.get("/")
async def root():
    return {
        "message": "Crisis Detection & Automatic Escalation Service",
        "version": "1.0.0",
        "features": [
            "Real-time crisis detection",
            "AI-powered message analysis", 
            "Automatic escalation protocols",
            "Multi-channel alert system",
            "Emergency contact coordination",
            "Crisis resource provision",
            "Professional integration"
        ],
        "endpoints": {
            "analyze_crisis": "/analyze-crisis",
            "webhook_user_message": "/webhook/user-message",
            "webhook_stress_report": "/webhook/stress-report", 
            "manual_crisis_report": "/manual-crisis-report",
            "user_crisis_profile": "/users/{user_id}/crisis-profile",
            "user_risk_status": "/users/{user_id}/risk-status",
            "crisis_resources": "/crisis-resources/{crisis_level}",
            "health": "/health"
        }
    }

@app.post("/analyze-crisis", response_model=CrisisResponse)
async def analyze_crisis_message(user_message: UserMessage, background_tasks: BackgroundTasks):
    """Analyze a message for crisis indicators and generate response"""
    try:
        # Step 1: Analyze the message for crisis indicators
        crisis_analysis = await crisis_engine.analyze_message(user_message)
        
        # Step 2: Load user crisis profile
        user_profile = data_manager.load_user_crisis_profile(user_message.user_id)
        
        # Step 3: Generate crisis response
        crisis_response = response_engine.generate_crisis_response(crisis_analysis, user_profile)
        
        # Step 4: If escalation needed, send alerts in background
        if crisis_response.escalation_triggered:
            background_tasks.add_task(alert_manager.send_crisis_alerts, crisis_response, user_profile)
        
        # Step 5: Log incident in background
        background_tasks.add_task(data_manager.log_crisis_incident, crisis_response)
        
        return crisis_response
        
    except Exception as e:
        logger.error(f"Error in crisis analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Crisis analysis failed: {str(e)}")

@app.post("/webhook/user-message")
async def webhook_user_message(user_message: UserMessage, background_tasks: BackgroundTasks):
    """Webhook endpoint for receiving user messages from other services"""
    try:
        # Analyze message for crisis
        crisis_response = await analyze_crisis_message(user_message, background_tasks)
        
        # Return summary for the calling service
        return {
            "message_processed": True,
            "user_id": user_message.user_id,
            "crisis_detected": crisis_response.crisis_analysis.crisis_level > CrisisLevel.BASELINE,
            "crisis_level": crisis_response.crisis_analysis.crisis_level.value,
            "urgency": crisis_response.crisis_analysis.urgency,
            "escalation_triggered": crisis_response.escalation_triggered,
            "immediate_actions": crisis_response.immediate_actions[:3],  # First 3 actions
            "user_support_message": crisis_response.alert_messages.get("user_support", "")
        }
        
    except Exception as e:
        logger.error(f"Webhook processing failed: {e}")
        return {
            "message_processed": False,
            "error": str(e),
            "user_id": user_message.user_id
        }

@app.post("/webhook/stress-report")
async def webhook_stress_report(stress_report: StressReport, background_tasks: BackgroundTasks):
    """Webhook for receiving high stress/craving reports"""
    try:
        # Convert stress report to user message for analysis
        if stress_report.stress_level >= 8.0:
            message_content = f"High stress level detected: {stress_report.stress_level}/10"
            if stress_report.craving_intensity:
                message_content += f", craving intensity: {stress_report.craving_intensity}/10"
            
            user_message = UserMessage(
                user_id=stress_report.user_id,
                message=message_content,
                source=stress_report.source,
                timestamp=stress_report.timestamp,
                context={
                    "stress_level": stress_report.stress_level,
                    "craving_intensity": stress_report.craving_intensity,
                    "automated_report": True
                }
            )
            
            # Analyze for crisis
            crisis_response = await analyze_crisis_message(user_message, background_tasks)
            
            return {
                "stress_report_processed": True,
                "crisis_detected": crisis_response.crisis_analysis.crisis_level > CrisisLevel.BASELINE,
                "crisis_level": crisis_response.crisis_analysis.crisis_level.value,
                "recommended_intervention": crisis_response.immediate_actions[0] if crisis_response.immediate_actions else "Monitor and support"
            }
        else:
            return {
                "stress_report_processed": True,
                "crisis_detected": False,
                "message": "Stress level within normal range"
            }
            
    except Exception as e:
        logger.error(f"Stress report processing failed: {e}")
        return {"stress_report_processed": False, "error": str(e)}

@app.post("/manual-crisis-report", response_model=CrisisResponse)
async def manual_crisis_report(crisis_report: ManualCrisisReport, background_tasks: BackgroundTasks):
    """Manual crisis report from family, friends, or healthcare providers"""
    try:
        # Convert manual report to user message
        user_message = UserMessage(
            user_id=crisis_report.user_id,
            message=crisis_report.crisis_description,
            source="manual_report",
            context={
                "reporter_id": crisis_report.reporter_id,
                "perceived_risk": crisis_report.perceived_risk_level,
                "immediate_concern": crisis_report.immediate_concern,
                "reporter_contact": crisis_report.contact_info,
                "location": crisis_report.location,
                "manual_report": True
            }
        )
        
        # Analyze crisis (manual reports get elevated treatment)
        crisis_analysis = await crisis_engine.analyze_message(user_message)
        
        # Elevate crisis level if manual report indicates high concern
        if crisis_report.immediate_concern or crisis_report.perceived_risk_level >= 4:
            if crisis_analysis.crisis_level < CrisisLevel.HIGH_RISK:
                crisis_analysis.crisis_level = CrisisLevel.HIGH_RISK
                crisis_analysis.urgency = "urgent"
                crisis_analysis.key_indicators.append("manual_escalation")
        
        # Generate response
        user_profile = data_manager.load_user_crisis_profile(crisis_report.user_id)
        crisis_response = response_engine.generate_crisis_response(crisis_analysis, user_profile)
        
        # Always trigger alerts for manual reports
        crisis_response.escalation_triggered = True
        
        # Send alerts and log
        background_tasks.add_task(alert_manager.send_crisis_alerts, crisis_response, user_profile)
        background_tasks.add_task(data_manager.log_crisis_incident, crisis_response)
        
        return crisis_response
        
    except Exception as e:
        logger.error(f"Manual crisis report failed: {e}")
        raise HTTPException(status_code=500, detail=f"Manual crisis report processing failed: {str(e)}")

@app.post("/users/{user_id}/crisis-profile")
async def create_or_update_crisis_profile(user_id: str, profile_data: Dict[str, Any]):
    """Create or update user crisis profile"""
    try:
        profile_data["user_id"] = user_id
        profile = UserCrisisProfile(**profile_data)
        data_manager.save_user_crisis_profile(profile)
        return {"message": "Crisis profile saved successfully", "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error saving crisis profile: {str(e)}")

@app.get("/users/{user_id}/crisis-profile")
async def get_user_crisis_profile(user_id: str):
    """Get user crisis profile"""
    profile = data_manager.load_user_crisis_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User crisis profile not found")
    return profile

@app.get("/users/{user_id}/risk-status")
async def get_user_risk_status(user_id: str):
    """Get current risk status for user"""
    try:
        # Get recent crisis history
        crisis_history = data_manager.get_user_crisis_history(user_id)
        
        # Calculate current risk assessment
        if not crisis_history:
            current_risk = CrisisLevel.BASELINE
            last_incident = None
        else:
            # Get most recent incident
            recent_incidents = sorted(crisis_history, key=lambda x: x["timestamp"], reverse=True)[:5]
            
            # Calculate risk based on recent patterns
            avg_recent_level = sum(incident["crisis_level"] for incident in recent_incidents) / len(recent_incidents)
            current_risk = CrisisLevel(round(avg_recent_level))
            last_incident = recent_incidents[0] if recent_incidents else None
        
        # Risk factors
        profile = data_manager.load_user_crisis_profile(user_id)
        risk_factors = profile.risk_factors if profile else []
        protective_factors = profile.protective_factors if profile else []
        
        return {
            "user_id": user_id,
            "current_risk_level": current_risk.value,
            "risk_status": current_risk.name.lower(),
            "last_incident": last_incident,
            "total_incidents": len(crisis_history),
            "risk_factors": risk_factors,
            "protective_factors": protective_factors,
            "monitoring_active": current_risk >= CrisisLevel.MODERATE,
            "assessment_date": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting risk status: {str(e)}")

@app.get("/crisis-resources/{crisis_level}")
async def get_crisis_resources(crisis_level: int):
    """Get appropriate crisis resources for given level"""
    try:
        if crisis_level not in [1, 2, 3, 4, 5]:
            raise HTTPException(status_code=400, detail="Crisis level must be 1-5")
        
        crisis_enum = CrisisLevel(crisis_level)
        
        # Mock analysis to get resources
        from types import SimpleNamespace
        mock_analysis = SimpleNamespace()
        mock_analysis.crisis_level = crisis_enum
        
        resources = response_engine._get_crisis_resources(mock_analysis)
        response_time = response_engine._get_response_time_requirement(crisis_enum)
        
        return {
            "crisis_level": crisis_level,
            "urgency": "immediate" if crisis_level >= 5 else "urgent" if crisis_level >= 4 else "concerning" if crisis_level >= 3 else "monitor",
            "response_time_requirement": response_time,
            "available_resources": resources,
            "emergency_services": crisis_level >= 5,
            "professional_assessment_needed": crisis_level >= 3
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid crisis level")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting resources: {str(e)}")

@app.get("/users/{user_id}/crisis-history")
async def get_user_crisis_history(user_id: str, limit: int = 10):
    """Get user's crisis incident history"""
    try:
        history = data_manager.get_user_crisis_history(user_id)
        
        # Sort by timestamp and limit
        sorted_history = sorted(history, key=lambda x: x["timestamp"], reverse=True)
        limited_history = sorted_history[:limit]
        
        # Calculate summary statistics
        total_incidents = len(history)
        if history:
            avg_crisis_level = sum(incident["crisis_level"] for incident in history) / len(history)
            most_recent = sorted_history[0]["timestamp"] if sorted_history else None
            most_common_type = max(set([ct for incident in history for ct in incident["crisis_types"]]), 
                                 key=lambda x: sum(x in incident["crisis_types"] for incident in history)) if history else None
        else:
            avg_crisis_level = 0
            most_recent = None
            most_common_type = None
        
        return {
            "user_id": user_id,
            "total_incidents": total_incidents,
            "average_crisis_level": round(avg_crisis_level, 2) if avg_crisis_level else 0,
            "most_recent_incident": most_recent,
            "most_common_crisis_type": most_common_type,
            "recent_incidents": limited_history,
            "monitoring_recommended": avg_crisis_level >= 2.5
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting crisis history: {str(e)}")

# Alert management endpoints
@app.get("/alerts/active")
async def get_active_alerts():
    """Get currently active crisis alerts"""
    try:
        # Get alerts from last 24 hours that haven't been resolved
        cutoff_time = datetime.now() - timedelta(hours=24)
        
        active_alerts = []
        for alert_id, alert in alert_manager.active_alerts.items():
            if alert.timestamp >= cutoff_time:
                active_alerts.append({
                    "alert_id": alert_id,
                    "user_id": alert.user_id,
                    "crisis_level": alert.crisis_level.value,
                    "sent_to": alert.sent_to,
                    "timestamp": alert.timestamp.isoformat(),
                    "acknowledged": len(alert.acknowledged_by) > 0
                })
        
        return {
            "active_alerts": active_alerts,
            "total_active": len(active_alerts),
            "critical_alerts": len([a for a in active_alerts if a["crisis_level"] >= 5]),
            "unacknowledged": len([a for a in active_alerts if not a["acknowledged"]])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting active alerts: {str(e)}")

@app.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, acknowledger: str):
    """Acknowledge an active alert"""
    try:
        if alert_id not in alert_manager.active_alerts:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        alert = alert_manager.active_alerts[alert_id]
        if acknowledger not in alert.acknowledged_by:
            alert.acknowledged_by.append(acknowledger)
        
        return {
            "alert_id": alert_id,
            "acknowledged_by": acknowledger,
            "timestamp": datetime.now().isoformat(),
            "total_acknowledgments": len(alert.acknowledged_by)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error acknowledging alert: {str(e)}")

# Testing and monitoring endpoints
@app.post("/test-crisis-detection")
async def test_crisis_detection(test_message: str, user_id: str = "test_user"):
    """Test crisis detection with a sample message"""
    try:
        user_message = UserMessage(
            user_id=user_id,
            message=test_message,
            source="test",
            context={"test_mode": True}
        )
        
        # Analyze without triggering alerts
        crisis_analysis = await crisis_engine.analyze_message(user_message)
        crisis_response = response_engine.generate_crisis_response(crisis_analysis)
        
        return {
            "test_message": test_message,
            "crisis_detected": crisis_analysis.crisis_level > CrisisLevel.BASELINE,
            "crisis_level": crisis_analysis.crisis_level.value,
            "crisis_types": [ct.value for ct in crisis_analysis.crisis_types],
            "confidence": crisis_analysis.confidence_score,
            "key_indicators": crisis_analysis.key_indicators,
            "emotional_state": crisis_analysis.emotional_state,
            "urgency": crisis_analysis.urgency,
            "would_escalate": crisis_response.escalation_triggered,
            "immediate_actions": crisis_response.immediate_actions,
            "resources": crisis_response.resources[:2]  # First 2 resources
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    
    # Check AI integration
    ai_status = "connected" if GEMINI_API_KEY and crisis_engine.ai_detector.client else "not_configured"
    
    # Check alert services
    sms_status = "configured" if SMS_SERVICE_API else "not_configured"
    email_status = "configured" if EMAIL_SERVICE_API else "not_configured"
    
    # Count active monitoring
    active_users = len(list(CRISIS_DATA_DIR.glob("*")))
    active_alerts = len([a for a in alert_manager.active_alerts.values() 
                        if a.timestamp >= datetime.now() - timedelta(hours=24)])
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Crisis Detection & Automatic Escalation Service",
        "version": "1.0.0",
        "integrations": {
            "google_gemini": ai_status,
            "sms_service": sms_status,
            "email_service": email_status,
            "emergency_services": "configured" if EMERGENCY_SERVICES_API else "not_configured"
        },
        "features_available": {
            "ai_crisis_detection": ai_status == "connected",
            "pattern_detection": True,
            "automatic_escalation": True,
            "multi_channel_alerts": sms_status == "configured" or email_status == "configured",
            "crisis_resource_provision": True,
            "incident_logging": True
        },
        "current_status": {
            "users_with_profiles": active_users,
            "active_alerts_24h": active_alerts,
            "crisis_levels_monitored": [1, 2, 3, 4, 5],
            "alert_channels": ["sms", "email", "emergency_services"]
        },
        "crisis_resources_available": {
            "emergency_services": "911",
            "suicide_prevention": "988", 
            "crisis_text": "741741",
            "substance_abuse": "1-800-662-4357"
        }
    }