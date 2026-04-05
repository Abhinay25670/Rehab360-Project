from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import os
import json
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from google import genai
from google.genai import types
from dotenv import load_dotenv
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Sleep Quality Assessment API for Addiction Recovery", version="1.0.0")

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_API_KEY="AIzaSyD7hec1NrQpaJ_9CAdICQY4db_cEXh4ilY"
# print(GEMINI_API_KEY)

# Pydantic Models
class UserProfile(BaseModel):
    user_id: str
    addiction_type: str  # "alcohol", "opioids", "stimulants", "marijuana"
    recovery_stage: str  # "detox", "early_recovery", "long_term"
    days_sober: Optional[int] = 0
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_conditions: Optional[List[str]] = []

class SleepQuestionnaire(BaseModel):
    user_id: str
    assessment_period: str = "last_week"  # "last_week", "last_month"
    
    # Basic Sleep Pattern
    typical_bedtime: str  # "23:30", "midnight"
    typical_wake_time: str  # "07:00", "7:00 AM"
    time_to_fall_asleep: str  # "<15min", "15-30min", "30-60min", ">60min"
    sleep_quality_rating: int  # 1-10 scale
    hours_of_actual_sleep: float  # Actual hours slept
    
    # Sleep Disturbances
    wake_up_frequency: str  # "never", "1-2 times", "3-4 times", "5+ times"
    difficulty_returning_to_sleep: str  # "easy", "somewhat hard", "very hard"
    early_morning_awakening: bool
    
    # Daytime Impact
    daytime_sleepiness: int  # 1-10 scale
    energy_level: int  # 1-10 scale
    concentration_issues: str  # "never", "sometimes", "often", "always"
    mood_affected_by_sleep: str  # "never", "sometimes", "often", "always"
    
    # Addiction Recovery Specific
    sleep_since_recovery: str  # "much better", "better", "same", "worse", "much worse"
    withdrawal_affecting_sleep: bool
    cravings_due_to_poor_sleep: bool
    sleep_medications: str  # "nothing", "prescription", "otc", "alcohol", "other"
    
    # Lifestyle Factors
    caffeine_daily: str  # "none", "1-2 cups", "3-4 cups", "5+ cups"
    caffeine_timing: str  # "morning", "afternoon", "evening", "varies"
    exercise_frequency: str  # "never", "1-2x/week", "3-4x/week", "daily"
    screen_time_before_bed: str  # "<30min", "30-60min", "1-2hrs", "2+hrs"
    stress_level: int  # 1-10 scale
    
    timestamp: Optional[datetime] = None

class SleepAssessmentResponse(BaseModel):
    sleep_metrics: Dict[str, Any]
    quality_assessment: Dict[str, Any]
    addiction_analysis: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    recommendations: Dict[str, Any]
    gemini_guidance: str

# Gemini Client
class GeminiClient:
    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.model = "gemini-2.0-flash"
    
    def analyze_sleep_questionnaire(self, questionnaire_data: Dict, user_profile: Dict) -> str:
        prompt = f"""
        As a sleep specialist working with addiction recovery patients, analyze this sleep questionnaire and provide comprehensive assessment.
        
        User Profile:
        - Addiction Type: {user_profile['addiction_type']}
        - Recovery Stage: {user_profile['recovery_stage']}
        - Days Sober: {user_profile.get('days_sober', 0)}
        - Age: {user_profile.get('age', 'N/A')}
        
        Sleep Questionnaire Responses:
        - Typical bedtime: {questionnaire_data.get('typical_bedtime')}
        - Typical wake time: {questionnaire_data.get('typical_wake_time')}
        - Time to fall asleep: {questionnaire_data.get('time_to_fall_asleep')}
        - Sleep quality rating: {questionnaire_data.get('sleep_quality_rating')}/10
        - Hours of actual sleep: {questionnaire_data.get('hours_of_actual_sleep')}
        - Wake up frequency: {questionnaire_data.get('wake_up_frequency')}
        - Daytime sleepiness: {questionnaire_data.get('daytime_sleepiness')}/10
        - Energy level: {questionnaire_data.get('energy_level')}/10
        - Sleep since recovery: {questionnaire_data.get('sleep_since_recovery')}
        - Withdrawal affecting sleep: {questionnaire_data.get('withdrawal_affecting_sleep')}
        - Cravings due to poor sleep: {questionnaire_data.get('cravings_due_to_poor_sleep')}
        - Caffeine consumption: {questionnaire_data.get('caffeine_daily')}
        - Caffeine timing: {questionnaire_data.get('caffeine_timing')}
        - Exercise frequency: {questionnaire_data.get('exercise_frequency')}
        - Screen time before bed: {questionnaire_data.get('screen_time_before_bed')}
        - Stress level: {questionnaire_data.get('stress_level')}/10
        
        Provide practical, encouraging recommendations covering:
        
        1. SLEEP QUALITY ASSESSMENT:
        - Overall assessment of their sleep quality
        - Main sleep problems identified
        - How typical this is for their recovery stage
        
        2. ADDICTION RECOVERY PERSPECTIVE:
        - How their addiction type typically affects sleep
        - Whether current issues are normal for their recovery timeline
        - Expected improvement timeline
        
        3. IMMEDIATE ACTIONABLE RECOMMENDATIONS:
        - Top 3 changes they can make this week
        - Sleep hygiene improvements specific to their situation
        - Lifestyle adjustments that will help most
        
        4. RECOVERY-SPECIFIC GUIDANCE:
        - How to manage sleep issues without relapsing
        - When sleep problems are concerning vs normal
        - Encouragement about recovery and sleep improvement
        
        Keep tone supportive and realistic. Acknowledge sleep issues are common in recovery and will improve with time and proper strategies.
        """
        
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)],
            ),
        ]
        
        generate_content_config = types.GenerateContentConfig(
            response_mime_type="text/plain",
        )
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=generate_content_config,
            )
            return response.text
        except Exception as e:
            return f"Unable to generate personalized guidance at this time. Error: {str(e)}"

# Sleep Analysis Classes
class SleepQuestionnaireAnalyzer:
    def __init__(self):
        self.addiction_sleep_patterns = {
            "alcohol": {
                "common_issues": ["frequent_awakenings", "early_morning_awakening", "poor_rem_sleep"],
                "withdrawal_timeline": "2-6 months",
                "typical_recovery": "Sleep gradually improves over 3-6 months of sobriety"
            },
            "opioids": {
                "common_issues": ["severe_insomnia", "restless_legs", "muscle_discomfort"],
                "withdrawal_timeline": "1-3 months",
                "typical_recovery": "Initial severe insomnia usually improves within 1-3 months"
            },
            "stimulants": {
                "common_issues": ["difficulty_falling_asleep", "reduced_total_sleep", "hypersomnia_withdrawal"],
                "withdrawal_timeline": "2-4 weeks",
                "typical_recovery": "Sleep patterns typically stabilize within 2-4 weeks"
            },
            "marijuana": {
                "common_issues": ["vivid_dreams", "difficulty_falling_asleep", "night_sweats"],
                "withdrawal_timeline": "1-2 weeks",
                "typical_recovery": "Sleep usually normalizes within 1-2 weeks"
            }
        }
    
    def analyze_questionnaire(self, responses: Dict, user_profile: Dict) -> Dict:
        # Calculate sleep metrics
        sleep_metrics = self._calculate_sleep_metrics(responses)
        
        # Assess sleep quality
        quality_assessment = self._assess_sleep_quality(responses, sleep_metrics)
        
        # Addiction-specific analysis
        addiction_analysis = self._analyze_addiction_impact(responses, user_profile)
        
        # Risk assessment
        risk_assessment = self._assess_relapse_risk(responses, user_profile, quality_assessment)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(responses, user_profile, quality_assessment)
        
        return {
            "sleep_metrics": sleep_metrics,
            "quality_assessment": quality_assessment,
            "addiction_analysis": addiction_analysis,
            "risk_assessment": risk_assessment,
            "recommendations": recommendations
        }
    
    def _calculate_sleep_metrics(self, responses: Dict) -> Dict:
        # Parse times and calculate sleep efficiency
        actual_sleep = responses.get("hours_of_actual_sleep", 7)
        
        # Estimate time in bed (simplified calculation)
        time_in_bed = 8.0  # Default assumption
        sleep_efficiency = (actual_sleep / time_in_bed) * 100 if time_in_bed > 0 else 0
        
        # Convert sleep latency to minutes
        latency_mapping = {
            "<15min": 10, "15-30min": 22, "30-60min": 45, ">60min": 75
        }
        sleep_latency = latency_mapping.get(responses.get("time_to_fall_asleep"), 30)
        
        return {
            "total_sleep_time": actual_sleep,
            "estimated_time_in_bed": time_in_bed,
            "sleep_efficiency": round(sleep_efficiency, 1),
            "sleep_latency_minutes": sleep_latency,
            "sleep_quality_rating": responses.get("sleep_quality_rating", 5)
        }
    
    def _assess_sleep_quality(self, responses: Dict, metrics: Dict) -> Dict:
        quality_rating = responses.get("sleep_quality_rating", 5)
        sleep_efficiency = metrics["sleep_efficiency"]
        latency = responses.get("time_to_fall_asleep", "30-60min")
        
        # Determine overall category
        if quality_rating >= 8 and sleep_efficiency >= 85 and latency in ["<15min", "15-30min"]:
            category = "excellent"
        elif quality_rating >= 6 and sleep_efficiency >= 75 and latency != ">60min":
            category = "good"
        elif quality_rating >= 4 and sleep_efficiency >= 65:
            category = "fair"
        elif quality_rating >= 2:
            category = "poor"
        else:
            category = "very_poor"
        
        # Identify specific issues
        issues = []
        if latency == ">60min":
            issues.append("difficulty_falling_asleep")
        if responses.get("wake_up_frequency") in ["3-4 times", "5+ times"]:
            issues.append("frequent_night_awakenings")
        if responses.get("early_morning_awakening"):
            issues.append("early_morning_awakening")
        if responses.get("daytime_sleepiness", 5) >= 7:
            issues.append("excessive_daytime_sleepiness")
        if sleep_efficiency < 75:
            issues.append("poor_sleep_efficiency")
        
        return {
            "category": category,
            "issues": issues,
            "sleep_efficiency": sleep_efficiency,
            "improvement_potential": "high" if len(issues) > 2 else "moderate"
        }
    
    def _analyze_addiction_impact(self, responses: Dict, user_profile: Dict) -> Dict:
        addiction_type = user_profile.get("addiction_type", "unknown")
        days_sober = user_profile.get("days_sober", 0)
        recovery_stage = user_profile.get("recovery_stage", "unknown")
        
        patterns = self.addiction_sleep_patterns.get(addiction_type, {})
        
        # Determine if sleep issues are typical
        sleep_since_recovery = responses.get("sleep_since_recovery", "same")
        typical_for_stage = sleep_since_recovery in ["worse", "much worse"] and days_sober < 90
        
        return {
            "addiction_type": addiction_type,
            "common_issues": patterns.get("common_issues", []),
            "typical_for_recovery_stage": typical_for_stage,
            "expected_timeline": patterns.get("withdrawal_timeline", "Variable"),
            "recovery_info": patterns.get("typical_recovery", "Sleep typically improves with sustained sobriety"),
            "withdrawal_impact": "significant" if responses.get("withdrawal_affecting_sleep") else "minimal"
        }
    
    def _assess_relapse_risk(self, responses: Dict, user_profile: Dict, quality_assessment: Dict) -> Dict:
        risk_factors = []
        
        # Sleep quality factors
        if quality_assessment["category"] in ["poor", "very_poor"]:
            risk_factors.append("poor_sleep_quality")
        
        if responses.get("cravings_due_to_poor_sleep"):
            risk_factors.append("sleep_related_cravings")
        
        # Early recovery factors
        if user_profile.get("days_sober", 0) < 90:
            risk_factors.append("early_recovery_vulnerability")
        
        # Lifestyle factors
        if responses.get("stress_level", 5) >= 7:
            risk_factors.append("high_stress_level")
        
        if responses.get("caffeine_timing") == "evening":
            risk_factors.append("late_caffeine_use")
        
        # Determine risk level
        if len(risk_factors) >= 3:
            risk_level = "high"
        elif len(risk_factors) >= 2:
            risk_level = "moderate"
        else:
            risk_level = "low"
        
        return {
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "urgency": "immediate" if risk_level == "high" else "monitor",
            "warning_signs": [
                "Thoughts of using substances to help sleep",
                "Sleep getting worse after 60+ days sober",
                "Severe daytime impairment affecting work/relationships"
            ]
        }
    
    def _generate_recommendations(self, responses: Dict, user_profile: Dict, quality_assessment: Dict) -> Dict:
        immediate_actions = []
        lifestyle_changes = []
        recovery_specific = []
        
        # Immediate actions based on responses
        if responses.get("caffeine_timing") in ["evening", "varies"]:
            immediate_actions.append("Stop caffeine after 2 PM to improve sleep quality")
        
        if responses.get("screen_time_before_bed") in ["1-2hrs", "2+hrs"]:
            immediate_actions.append("Reduce screen time before bed to 30 minutes maximum")
        
        if responses.get("exercise_frequency") == "never":
            lifestyle_changes.append("Start with 15-minute daily walks to improve sleep")
        
        if responses.get("stress_level", 5) >= 7:
            lifestyle_changes.append("Practice stress reduction techniques (deep breathing, meditation)")
        
        # Recovery-specific recommendations
        addiction_type = user_profile.get("addiction_type")
        days_sober = user_profile.get("days_sober", 0)
        
        if days_sober < 90:
            recovery_specific.append("Sleep issues are normal in early recovery - be patient with yourself")
        
        if responses.get("sleep_medications") == "alcohol":
            recovery_specific.append("CRITICAL: Avoid using alcohol as sleep aid - this will reset your recovery")
        
        recovery_specific.append(f"For {addiction_type} recovery, sleep typically improves over 2-6 months")
        
        return {
            "immediate_actions": immediate_actions,
            "lifestyle_changes": lifestyle_changes,
            "recovery_specific": recovery_specific,
            "when_to_seek_help": [
                "If sleep doesn't improve after 90 days sober",
                "If having thoughts of relapse due to sleep issues",
                "If daytime functioning is severely impaired"
            ]
        }

# Initialize global instances
gemini_client = GeminiClient()
sleep_analyzer = SleepQuestionnaireAnalyzer()

# API Endpoints
@app.post("/assess-sleep", response_model=SleepAssessmentResponse)
async def assess_sleep_quality(questionnaire: SleepQuestionnaire, user_profile: UserProfile):
    """Main endpoint to assess sleep quality from questionnaire responses"""
    
    try:
        # Convert to dictionaries for processing
        questionnaire_data = questionnaire.dict()
        profile_data = user_profile.dict()
        
        # Analyze questionnaire with custom logic
        analysis_results = sleep_analyzer.analyze_questionnaire(questionnaire_data, profile_data)
        
        # Get personalized guidance from Gemini
        gemini_guidance = gemini_client.analyze_sleep_questionnaire(questionnaire_data, profile_data)
        
        # Prepare response
        return SleepAssessmentResponse(
            sleep_metrics=analysis_results["sleep_metrics"],
            quality_assessment=analysis_results["quality_assessment"],
            addiction_analysis=analysis_results["addiction_analysis"],
            risk_assessment=analysis_results["risk_assessment"],
            recommendations=analysis_results["recommendations"],
            gemini_guidance=gemini_guidance
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sleep assessment failed: {str(e)}")

@app.get("/sleep-questionnaire-template")
async def get_questionnaire_template():
    """Get the sleep questionnaire template with all possible options"""
    
    template = {
        "questionnaire_fields": {
            "typical_bedtime": {
                "type": "string",
                "description": "What time do you usually go to bed?",
                "examples": ["10:30 PM", "11:00 PM", "midnight", "1:00 AM"]
            },
            "typical_wake_time": {
                "type": "string", 
                "description": "What time do you usually wake up?",
                "examples": ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM"]
            },
            "time_to_fall_asleep": {
                "type": "string",
                "description": "How long does it usually take you to fall asleep?",
                "options": ["<15min", "15-30min", "30-60min", ">60min"]
            },
            "sleep_quality_rating": {
                "type": "integer",
                "description": "Rate your overall sleep quality (1=very poor, 10=excellent)",
                "range": "1-10"
            },
            "hours_of_actual_sleep": {
                "type": "float",
                "description": "How many hours do you actually sleep per night?",
                "examples": [5.5, 6.0, 7.0, 8.0, 9.0]
            },
            "wake_up_frequency": {
                "type": "string",
                "description": "How often do you wake up during the night?",
                "options": ["never", "1-2 times", "3-4 times", "5+ times"]
            },
            "caffeine_daily": {
                "type": "string",
                "description": "How much caffeine do you consume daily?",
                "options": ["none", "1-2 cups", "3-4 cups", "5+ cups"]
            },
            "caffeine_timing": {
                "type": "string",
                "description": "When do you have your last caffeine of the day?",
                "options": ["morning", "afternoon", "evening", "varies"]
            }
        },
        "addiction_types": ["alcohol", "opioids", "stimulants", "marijuana"],
        "recovery_stages": ["detox", "early_recovery", "long_term"]
    }
    
    return template

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Sleep Quality Assessment API"}

@app.post("/user-profile")
async def create_user_profile(profile: UserProfile):
    """Create or update user profile"""
    # In a real app, you'd save this to a database
    return {"message": "Profile saved successfully", "user_id": profile.user_id}

# Run the app