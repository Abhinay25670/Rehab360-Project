from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
import json
import os
from pathlib import Path
warnings.filterwarnings('ignore')

# Time series libraries
try:
    import pmdarima as pm
    from statsmodels.tsa.seasonal import seasonal_decompose
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    from scipy.signal import find_peaks
except ImportError:
    print("Installing required packages...")
    import subprocess
    import sys
    
    packages = ["pmdarima", "statsmodels", "scipy"]
    for package in packages:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
    
    import pmdarima as pm
    from statsmodels.tsa.seasonal import seasonal_decompose
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    from scipy.signal import find_peaks

import uvicorn

# Initialize FastAPI app
app = FastAPI(
    title="Enhanced Craving Forecasting & Intervention Timing API",
    description="AI-powered craving prediction with optimal intervention timing recommendations",
    version="2.0.0"
)

# Create data directory structure
DATA_DIR = Path("user_data")
DATA_DIR.mkdir(exist_ok=True)

# Pydantic models for request/response
class HistoricalCravingData(BaseModel):
    timestamp: datetime = Field(..., description="When the craving was recorded")
    craving_intensity: float = Field(..., ge=0, le=10, description="Craving intensity (0-10)")
    stress_level: float = Field(..., ge=1, le=10, description="Stress level (1-10)")
    mood_score: float = Field(..., ge=1, le=10, description="Mood score (1-10)")
    sleep_quality: Optional[float] = Field(None, ge=1, le=5, description="Sleep quality (1-5)")
    location_risk: Optional[bool] = Field(None, description="High-risk location")
    social_trigger: Optional[bool] = Field(None, description="Social trigger present")
    work_stress: Optional[bool] = Field(None, description="Work-related stress")

class CurrentTriggers(BaseModel):
    current_time: datetime = Field(..., description="Current timestamp")
    stress_level: float = Field(..., ge=1, le=10, description="Current stress level")
    mood_score: float = Field(..., ge=1, le=10, description="Current mood score")
    sleep_quality: float = Field(..., ge=1, le=5, description="Last night's sleep quality")
    location_risk: bool = Field(False, description="Currently in high-risk location")
    social_trigger: bool = Field(False, description="Social trigger present")
    work_stress: bool = Field(False, description="Work-related stress")
    fatigue: bool = Field(False, description="Physical fatigue")
    hunger: bool = Field(False, description="Hunger present")
    pain: bool = Field(False, description="Physical pain")
    social_context: str = Field("alone", description="alone/supportive/risky")
    hours_since_checkin: float = Field(0, ge=0, description="Hours since last app check-in")
    days_since_therapy: int = Field(0, ge=0, description="Days since last therapy session")
    medication_taken: bool = Field(True, description="Medication taken today")

class UserProfile(BaseModel):
    user_id: str
    addiction_type: str = Field(..., description="Type of addiction")
    days_in_recovery: int = Field(..., ge=0, description="Days in recovery")
    timezone: str = Field("UTC", description="User timezone")
    preferred_interventions: List[str] = Field(default=[], description="User's preferred intervention types")
    intervention_duration_pref: int = Field(10, ge=5, le=60, description="Preferred intervention duration in minutes")
    
class InterventionLog(BaseModel):
    intervention_id: str
    timestamp: datetime
    intervention_type: str
    duration_minutes: int
    was_used: bool = Field(..., description="Did user actually do the intervention")
    effectiveness_rating: Optional[float] = Field(None, ge=1, le=10, description="User's effectiveness rating")
    craving_before: float = Field(..., ge=0, le=10, description="Craving intensity before intervention")
    craving_after: Optional[float] = Field(None, ge=0, le=10, description="Craving intensity after intervention")
    notes: Optional[str] = Field(None, description="User notes about intervention")

class OptimalTiming(BaseModel):
    recommended_time: datetime
    time_offset_hours: float
    intervention_type: str
    intervention_name: str
    duration_minutes: int
    timing_reason: str
    predicted_craving_before: float
    predicted_craving_after: float
    success_probability: float
    priority_level: str  # Low, Medium, High, Critical
    context_requirements: List[str]  # ["alone", "at_home", "not_working"]

class InterventionRecommendation(BaseModel):
    intervention_id: str
    intervention_type: str
    intervention_name: str
    description: str
    optimal_timings: List[OptimalTiming]
    expected_effectiveness: float
    historical_success_rate: Optional[float]
    contraindications: List[str]
    required_resources: List[str]

class CravingLogRequest(BaseModel):
    user_id: str
    craving_data: HistoricalCravingData

class InterventionLogRequest(BaseModel):
    user_id: str
    intervention_log: InterventionLog

class OptimalTimingRequest(BaseModel):
    user_id: str
    current_triggers: CurrentTriggers
    forecast_hours: int = Field(24, ge=6, le=72, description="Hours to forecast ahead")
    max_interventions: int = Field(8, ge=1, le=20, description="Maximum interventions to recommend")

class OptimalTimingResponse(BaseModel):
    user_id: str
    generated_at: datetime
    forecast_period_hours: int
    recommendations: List[InterventionRecommendation]
    critical_periods: List[Dict[str, Any]]
    learning_insights: Dict[str, Any]
    next_check_in_recommended: datetime

# Enhanced Response Models (keeping existing ones)
class TriggerSensitivity(BaseModel):
    trigger_name: str
    correlation: float
    sensitivity_level: str
    impact_score: float
    recommendation: str

class TimePattern(BaseModel):
    hour: int
    average_intensity: float
    risk_level: str

class CravingForecast(BaseModel):
    hour_offset: int
    predicted_intensity: float
    confidence_lower: float
    confidence_upper: float
    risk_level: str

class InterventionRecommendationBasic(BaseModel):
    time_offset: int
    intervention_type: str
    description: str
    priority: str
    trigger_based: bool

class CravingForecastRequest(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    historical_data: List[HistoricalCravingData] = Field(..., min_items=1, description="Historical craving data")
    current_triggers: CurrentTriggers = Field(..., description="Current trigger state")
    addiction_type: str = Field(..., description="Type of addiction")
    days_in_recovery: int = Field(..., ge=0, description="Days in recovery")

class CravingForecastResponse(BaseModel):
    user_id: str
    forecast_timestamp: str
    forecasts: List[CravingForecast]
    peak_risk_hours: List[int]
    trigger_sensitivity: List[TriggerSensitivity]
    time_patterns: List[TimePattern]
    intervention_recommendations: List[InterventionRecommendationBasic]
    model_confidence: float
    data_sufficiency: str
    next_high_risk_period: Optional[str]

# Data Storage Manager
class UserDataManager:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
    
    def get_user_dir(self, user_id: str) -> Path:
        user_dir = self.data_dir / user_id
        user_dir.mkdir(exist_ok=True)
        return user_dir
    
    def save_user_profile(self, profile: UserProfile):
        user_dir = self.get_user_dir(profile.user_id)
        with open(user_dir / "profile.json", "w") as f:
            json.dump(profile.dict(), f, indent=2, default=str)
    
    def load_user_profile(self, user_id: str) -> Optional[UserProfile]:
        try:
            user_dir = self.get_user_dir(user_id)
            with open(user_dir / "profile.json", "r") as f:
                data = json.load(f)
                return UserProfile(**data)
        except FileNotFoundError:
            return None
    
    def save_craving_data(self, user_id: str, craving_data: HistoricalCravingData):
        user_dir = self.get_user_dir(user_id)
        historical_file = user_dir / "historical_data.json"
        
        # Load existing data
        historical_data = []
        if historical_file.exists():
            with open(historical_file, "r") as f:
                historical_data = json.load(f)
        
        # Add new data
        new_entry = craving_data.dict()
        new_entry['timestamp'] = craving_data.timestamp.isoformat()
        historical_data.append(new_entry)
        
        # Sort by timestamp
        historical_data.sort(key=lambda x: x['timestamp'])
        
        # Keep only last 500 entries to manage file size
        if len(historical_data) > 500:
            historical_data = historical_data[-500:]
        
        # Save updated data
        with open(historical_file, "w") as f:
            json.dump(historical_data, f, indent=2)
    
    def load_historical_data(self, user_id: str) -> List[HistoricalCravingData]:
        try:
            user_dir = self.get_user_dir(user_id)
            with open(user_dir / "historical_data.json", "r") as f:
                data = json.load(f)
                return [HistoricalCravingData(**item) for item in data]
        except FileNotFoundError:
            return []
    
    def save_intervention_log(self, user_id: str, intervention_log: InterventionLog):
        user_dir = self.get_user_dir(user_id)
        interventions_file = user_dir / "interventions.json"
        
        # Load existing interventions
        interventions = []
        if interventions_file.exists():
            with open(interventions_file, "r") as f:
                interventions = json.load(f)
        
        # Add new intervention
        new_intervention = intervention_log.dict()
        new_intervention['timestamp'] = intervention_log.timestamp.isoformat()
        interventions.append(new_intervention)
        
        # Sort by timestamp
        interventions.sort(key=lambda x: x['timestamp'])
        
        # Save updated data
        with open(interventions_file, "w") as f:
            json.dump(interventions, f, indent=2)
    
    def load_intervention_history(self, user_id: str) -> List[InterventionLog]:
        try:
            user_dir = self.get_user_dir(user_id)
            with open(user_dir / "interventions.json", "r") as f:
                data = json.load(f)
                return [InterventionLog(**item) for item in data]
        except FileNotFoundError:
            return []

# Optimal Intervention Timing Engine
class OptimalInterventionEngine:
    def __init__(self):
        # Define intervention types with their characteristics
        self.intervention_types = {
            "mindfulness": {
                "name": "Mindfulness Meditation",
                "duration_options": [5, 10, 15, 20],
                "effectiveness_window": 60,  # minutes before peak risk
                "success_rate_base": 0.75,
                "context_requirements": ["quiet_space"],
                "contraindications": ["severe_anxiety"],
                "description": "Guided mindfulness meditation to reduce stress and craving intensity"
            },
            "physical_activity": {
                "name": "Physical Exercise",
                "duration_options": [10, 15, 30, 45],
                "effectiveness_window": 90,
                "success_rate_base": 0.80,
                "context_requirements": ["physical_ability", "appropriate_space"],
                "contraindications": ["physical_pain", "injury"],
                "description": "Physical exercise to release endorphins and reduce craving"
            },
            "social_support": {
                "name": "Contact Support Person",
                "duration_options": [5, 10, 15, 30],
                "effectiveness_window": 45,
                "success_rate_base": 0.85,
                "context_requirements": ["support_person_available"],
                "contraindications": ["social_anxiety_severe"],
                "description": "Call or message a trusted support person or counselor"
            },
            "environment_change": {
                "name": "Change Environment",
                "duration_options": [1, 2, 5, 10],
                "effectiveness_window": 30,
                "success_rate_base": 0.70,
                "context_requirements": ["mobility"],
                "contraindications": ["transportation_issues"],
                "description": "Leave current location and move to a safer environment"
            },
            "breathing_exercise": {
                "name": "Deep Breathing Exercise",
                "duration_options": [3, 5, 10, 15],
                "effectiveness_window": 30,
                "success_rate_base": 0.65,
                "context_requirements": [],
                "contraindications": [],
                "description": "Structured breathing exercises to reduce immediate stress and anxiety"
            },
            "distraction_activity": {
                "name": "Engaging Distraction",
                "duration_options": [15, 30, 45, 60],
                "effectiveness_window": 120,
                "success_rate_base": 0.60,
                "context_requirements": ["activity_available"],
                "contraindications": [],
                "description": "Engage in a hobby, game, or creative activity to redirect focus"
            },
            "medication_reminder": {
                "name": "Medication Check",
                "duration_options": [2, 5],
                "effectiveness_window": 15,
                "success_rate_base": 0.90,
                "context_requirements": ["medication_available"],
                "contraindications": [],
                "description": "Take prescribed medication or supplements as directed"
            }
        }
    
    def calculate_intervention_success_rate(self, intervention_type: str, user_history: List[InterventionLog],
                                          current_context: CurrentTriggers) -> float:
        """Calculate expected success rate based on user's historical data"""
        base_rate = self.intervention_types[intervention_type]["success_rate_base"]
        
        # Filter user history for this intervention type
        relevant_history = [log for log in user_history if log.intervention_type == intervention_type]
        
        if not relevant_history:
            return base_rate
        
        # Calculate historical success rate
        used_interventions = [log for log in relevant_history if log.was_used]
        if not used_interventions:
            return base_rate * 0.7  # Reduce if user doesn't typically use this intervention
        
        successful_interventions = [
            log for log in used_interventions 
            if log.craving_after is not None and log.craving_after < log.craving_before
        ]
        
        if len(used_interventions) > 0:
            historical_rate = len(successful_interventions) / len(used_interventions)
            # Weighted average: 70% historical, 30% base rate
            return 0.7 * historical_rate + 0.3 * base_rate
        
        return base_rate
    
    def identify_optimal_timing_windows(self, forecasts: List[CravingForecast], 
                                      current_time: datetime) -> List[Dict[str, Any]]:
        """Identify optimal timing windows for interventions"""
        prevention_windows = []
        
        for i, forecast in enumerate(forecasts):
            if forecast.predicted_intensity > 6:  # High risk period
                # Calculate intervention window (30-90 minutes before)
                risk_time = current_time + timedelta(hours=forecast.hour_offset)
                
                # Different intervention timings based on risk level
                if forecast.predicted_intensity > 8:  # Critical
                    prevention_times = [30, 60, 90]  # Multiple interventions
                elif forecast.predicted_intensity > 7:  # High
                    prevention_times = [45, 75]
                else:  # Medium-high
                    prevention_times = [60]
                
                for minutes_before in prevention_times:
                    intervention_time = risk_time - timedelta(minutes=minutes_before)
                    
                    if intervention_time > current_time:  # Only future times
                        prevention_windows.append({
                            "intervention_time": intervention_time,
                            "risk_time": risk_time,
                            "predicted_intensity": forecast.predicted_intensity,
                            "prevention_minutes": minutes_before,
                            "urgency": "critical" if forecast.predicted_intensity > 8 else 
                                     "high" if forecast.predicted_intensity > 7 else "medium"
                        })
        
        return sorted(prevention_windows, key=lambda x: x["intervention_time"])
    
    def generate_optimal_recommendations(self, user_id: str, current_triggers: CurrentTriggers,
                                       forecasts: List[CravingForecast], user_history: List[InterventionLog],
                                       user_profile: Optional[UserProfile], 
                                       max_interventions: int = 8) -> List[InterventionRecommendation]:
        """Generate optimal intervention timing recommendations"""
        current_time = current_triggers.current_time
        recommendations = []
        
        # Get optimal timing windows
        prevention_windows = self.identify_optimal_timing_windows(forecasts, current_time)
        
        # Get user preferences
        preferred_interventions = user_profile.preferred_interventions if user_profile else []
        intervention_duration_pref = user_profile.intervention_duration_pref if user_profile else 10
        
        # Generate recommendations for each intervention type
        for intervention_type, config in self.intervention_types.items():
            # Skip if user has strong preference and this isn't in it
            if preferred_interventions and intervention_type not in preferred_interventions:
                continue
            
            # Calculate success rate for this user
            success_rate = self.calculate_intervention_success_rate(
                intervention_type, user_history, current_triggers
            )
            
            # Find suitable timing windows for this intervention
            suitable_timings = []
            
            for window in prevention_windows[:max_interventions]:
                # Check if timing is appropriate for this intervention
                effectiveness_window = config["effectiveness_window"]
                prevention_minutes = window["prevention_minutes"]
                
                if prevention_minutes <= effectiveness_window:
                    # Choose appropriate duration
                    duration_options = config["duration_options"]
                    chosen_duration = min(duration_options, 
                                        key=lambda x: abs(x - intervention_duration_pref))
                    
                    # Calculate expected effectiveness
                    base_effectiveness = success_rate
                    
                    # Adjust based on timing and context
                    timing_factor = 1.0
                    if prevention_minutes < 30:
                        timing_factor = 1.2  # Better if closer to risk time
                    elif prevention_minutes > 90:
                        timing_factor = 0.8  # Less effective if too early
                    
                    # Context adjustments
                    context_factor = 1.0
                    if current_triggers.stress_level > 7 and intervention_type == "mindfulness":
                        context_factor = 1.3
                    if current_triggers.social_context == "risky" and intervention_type == "environment_change":
                        context_factor = 1.5
                    if not current_triggers.medication_taken and intervention_type == "medication_reminder":
                        context_factor = 2.0
                    
                    expected_effectiveness = min(0.95, base_effectiveness * timing_factor * context_factor)
                    
                    # Estimate craving reduction
                    predicted_reduction = expected_effectiveness * 3.0  # Up to 3 point reduction
                    predicted_after = max(0, window["predicted_intensity"] - predicted_reduction)
                    
                    optimal_timing = OptimalTiming(
                        recommended_time=window["intervention_time"],
                        time_offset_hours=(window["intervention_time"] - current_time).total_seconds() / 3600,
                        intervention_type=intervention_type,
                        intervention_name=config["name"],
                        duration_minutes=chosen_duration,
                        timing_reason=f"Prevent {window['urgency']} risk period at {window['risk_time'].strftime('%H:%M')}",
                        predicted_craving_before=window["predicted_intensity"],
                        predicted_craving_after=predicted_after,
                        success_probability=expected_effectiveness,
                        priority_level=window["urgency"],
                        context_requirements=config["context_requirements"]
                    )
                    
                    suitable_timings.append(optimal_timing)
            
            if suitable_timings:
                # Calculate historical success rate
                historical_logs = [log for log in user_history if log.intervention_type == intervention_type]
                historical_success = None
                if historical_logs:
                    used_logs = [log for log in historical_logs if log.was_used]
                    if used_logs:
                        successful = [log for log in used_logs 
                                    if log.craving_after is not None and log.craving_after < log.craving_before]
                        historical_success = len(successful) / len(used_logs)
                
                recommendation = InterventionRecommendation(
                    intervention_id=f"{user_id}_{intervention_type}_{int(current_time.timestamp())}",
                    intervention_type=intervention_type,
                    intervention_name=config["name"],
                    description=config["description"],
                    optimal_timings=suitable_timings[:3],  # Top 3 timings
                    expected_effectiveness=success_rate,
                    historical_success_rate=historical_success,
                    contraindications=config["contraindications"],
                    required_resources=config["context_requirements"]
                )
                
                recommendations.append(recommendation)
        
        # Sort by overall effectiveness and urgency
        recommendations.sort(key=lambda x: (
            max([t.success_probability for t in x.optimal_timings]),
            len([t for t in x.optimal_timings if t.priority_level == "critical"])
        ), reverse=True)
        
        return recommendations[:max_interventions]

# Initialize components
data_manager = UserDataManager(DATA_DIR)

# Enhanced Craving Forecasting Engine (keeping existing functionality)
class CravingForecastEngine:
    def __init__(self):
        # Default patterns by addiction type
        self.default_patterns = {
            'alcohol': {
                'hourly': [2, 1, 1, 1, 2, 3, 4, 5, 4, 3, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2],
                'stress_sensitivity': 0.7,
                'mood_sensitivity': -0.6,
                'social_impact': 0.5
            },
            'drugs': {
                'hourly': [3, 2, 2, 2, 3, 4, 5, 6, 5, 4, 4, 5, 6, 7, 8, 7, 6, 5, 4, 4, 5, 4, 3, 3],
                'stress_sensitivity': 0.8,
                'mood_sensitivity': -0.7,
                'social_impact': 0.6
            },
            'nicotine': {
                'hourly': [4, 3, 3, 3, 4, 5, 6, 7, 8, 7, 6, 7, 8, 8, 7, 6, 5, 4, 4, 5, 6, 5, 4, 4],
                'stress_sensitivity': 0.6,
                'mood_sensitivity': -0.5,
                'social_impact': 0.4
            },
            'gaming': {
                'hourly': [2, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 8, 7, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2],
                'stress_sensitivity': 0.5,
                'mood_sensitivity': -0.6,
                'social_impact': 0.3
            }
        }
    
    def prepare_time_series_data(self, historical_data: List[HistoricalCravingData]) -> pd.DataFrame:
        """Convert historical data to time series DataFrame"""
        data_records = []
        for record in historical_data:
            data_records.append({
                'timestamp': record.timestamp,
                'craving_intensity': record.craving_intensity,
                'stress_level': record.stress_level,
                'mood_score': record.mood_score,
                'sleep_quality': record.sleep_quality or 3.0,
                'location_risk': int(record.location_risk or False),
                'social_trigger': int(record.social_trigger or False),
                'work_stress': int(record.work_stress or False),
                'hour': record.timestamp.hour,
                'day_of_week': record.timestamp.weekday(),
                'days_since_start': (record.timestamp - historical_data[0].timestamp).days
            })
        
        df = pd.DataFrame(data_records)
        df = df.set_index('timestamp').sort_index()
        
        # Resample to hourly if needed and fill missing values
        df_hourly = df.resample('1H').mean()
        df_hourly['craving_intensity'] = df_hourly['craving_intensity'].interpolate(method='linear')
        
        return df_hourly.dropna()
    
    def calculate_trigger_sensitivity(self, df: pd.DataFrame) -> List[TriggerSensitivity]:
        """Calculate how sensitive user is to different triggers"""
        sensitivities = []
        
        trigger_factors = {
            'stress_level': 'Stress Level',
            'mood_score': 'Mood Score',
            'sleep_quality': 'Sleep Quality',
            'location_risk': 'High-Risk Location',
            'social_trigger': 'Social Triggers',
            'work_stress': 'Work Stress'
        }
        
        for factor, name in trigger_factors.items():
            if factor in df.columns:
                if factor == 'mood_score':
                    # Negative correlation for mood (lower mood = higher craving)
                    corr = -df['craving_intensity'].corr(df[factor])
                else:
                    corr = df['craving_intensity'].corr(df[factor])
                
                if pd.isna(corr):
                    corr = 0.0
                
                # Determine sensitivity level
                abs_corr = abs(corr)
                if abs_corr > 0.6:
                    sensitivity = "High"
                    recommendation = f"Monitor {name.lower()} closely and use targeted interventions"
                elif abs_corr > 0.3:
                    sensitivity = "Medium"
                    recommendation = f"Consider {name.lower()} as a contributing factor"
                else:
                    sensitivity = "Low"
                    recommendation = f"{name} shows minimal impact on cravings"
                
                sensitivities.append(TriggerSensitivity(
                    trigger_name=name,
                    correlation=corr,
                    sensitivity_level=sensitivity,
                    impact_score=abs_corr * 100,
                    recommendation=recommendation
                ))
        
        return sorted(sensitivities, key=lambda x: x.impact_score, reverse=True)
    
    def identify_time_patterns(self, df: pd.DataFrame) -> List[TimePattern]:
        """Identify hourly patterns in craving intensity"""
        if 'hour' not in df.columns:
            df['hour'] = df.index.hour
        
        hourly_avg = df.groupby('hour')['craving_intensity'].mean()
        
        patterns = []
        for hour in range(24):
            avg_intensity = hourly_avg.get(hour, 3.0)  # Default to moderate
            
            if avg_intensity > 7:
                risk_level = "High"
            elif avg_intensity > 5:
                risk_level = "Medium"
            else:
                risk_level = "Low"
            
            patterns.append(TimePattern(
                hour=hour,
                average_intensity=float(avg_intensity),
                risk_level=risk_level
            ))
        
        return patterns
    
    def generate_forecast(self, df: pd.DataFrame, current_triggers: CurrentTriggers, 
                         addiction_type: str, days_in_recovery: int) -> List[CravingForecast]:
        """Generate 24-hour craving intensity forecast"""
        forecasts = []
        
        try:
            # Use ARIMA for time series forecasting if enough data
            if len(df) >= 24:  # At least 24 hours of data
                # Automatic ARIMA model selection
                model = pm.auto_arima(
                    df['craving_intensity'].values,
                    seasonal=True,
                    stepwise=True,
                    suppress_warnings=True,
                    max_order=5,
                    error_action='ignore'
                )
                
                # Generate base forecast
                forecast_values, conf_int = model.predict(n_periods=24, return_conf_int=True)
                
            else:
                # Use default pattern for new users
                default_pattern = self.default_patterns.get(addiction_type, 
                                                          self.default_patterns['alcohol'])
                current_hour = current_triggers.current_time.hour
                
                # Create 24-hour forecast starting from current hour
                forecast_values = []
                for i in range(24):
                    hour_idx = (current_hour + i) % 24
                    base_intensity = default_pattern['hourly'][hour_idx]
                    forecast_values.append(base_intensity)
                
                forecast_values = np.array(forecast_values)
                # Simple confidence intervals for default pattern
                conf_int = np.column_stack([forecast_values - 1, forecast_values + 1])
            
            # Apply trigger adjustments
            trigger_adjustments = self.calculate_trigger_adjustments(
                current_triggers, addiction_type, days_in_recovery
            )
            
            # Generate forecast objects
            for i in range(24):
                adjusted_intensity = forecast_values[i] + trigger_adjustments
                
                # Ensure bounds
                adjusted_intensity = max(0, min(10, adjusted_intensity))
                
                if i < len(conf_int):
                    conf_lower = max(0, conf_int[i][0] + trigger_adjustments)
                    conf_upper = min(10, conf_int[i][1] + trigger_adjustments)
                else:
                    conf_lower = max(0, adjusted_intensity - 1)
                    conf_upper = min(10, adjusted_intensity + 1)
                
                risk_level = "High" if adjusted_intensity > 7 else "Medium" if adjusted_intensity > 4 else "Low"
                
                forecasts.append(CravingForecast(
                    hour_offset=i,
                    predicted_intensity=float(adjusted_intensity),
                    confidence_lower=float(conf_lower),
                    confidence_upper=float(conf_upper),
                    risk_level=risk_level
                ))
        
        except Exception as e:
            # Fallback to simple pattern-based forecast
            print(f"ARIMA forecast failed: {e}, using fallback method")
            forecasts = self.generate_fallback_forecast(current_triggers, addiction_type)
        
        return forecasts
    
    def calculate_trigger_adjustments(self, triggers: CurrentTriggers, 
                                    addiction_type: str, days_in_recovery: int) -> float:
        """Calculate how current triggers adjust the forecast"""
        adjustment = 0.0
        
        # Get addiction-specific sensitivities
        sensitivities = self.default_patterns.get(addiction_type, 
                                                 self.default_patterns['alcohol'])
        
        # Stress impact
        if triggers.stress_level > 6:
            adjustment += (triggers.stress_level - 6) * sensitivities['stress_sensitivity']
        
        # Mood impact (lower mood = higher craving)
        if triggers.mood_score < 5:
            adjustment += (5 - triggers.mood_score) * sensitivities['mood_sensitivity'] * -1
        
        # Sleep quality impact
        if triggers.sleep_quality < 3:
            adjustment += (3 - triggers.sleep_quality) * 0.5
        
        # Environmental triggers
        if triggers.location_risk:
            adjustment += 1.5
        
        if triggers.social_trigger:
            adjustment += sensitivities['social_impact']
        
        if triggers.work_stress:
            adjustment += 1.0
        
        # Physical state
        if triggers.fatigue:
            adjustment += 0.8
        
        if triggers.hunger:
            adjustment += 0.5
        
        if triggers.pain:
            adjustment += 0.7
        
        # Social context
        if triggers.social_context == "risky":
            adjustment += 1.5
        elif triggers.social_context == "supportive":
            adjustment -= 0.8
        
        # Engagement factors
        if triggers.hours_since_checkin > 12:
            adjustment += 0.5
        
        if triggers.days_since_therapy > 7:
            adjustment += 0.3
        
        if not triggers.medication_taken:
            adjustment += 1.0
        
        # Recovery stage adjustment (early recovery = higher baseline risk)
        if days_in_recovery < 30:
            adjustment += 0.5
        elif days_in_recovery < 90:
            adjustment += 0.2
        
        return adjustment
    
    def generate_fallback_forecast(self, triggers: CurrentTriggers, 
                                 addiction_type: str) -> List[CravingForecast]:
        """Fallback forecast using default patterns"""
        forecasts = []
        default_pattern = self.default_patterns.get(addiction_type, 
                                                   self.default_patterns['alcohol'])
        current_hour = triggers.current_time.hour
        
        base_adjustment = self.calculate_trigger_adjustments(triggers, addiction_type, 30)
        
        for i in range(24):
            hour_idx = (current_hour + i) % 24
            base_intensity = default_pattern['hourly'][hour_idx] + base_adjustment
            base_intensity = max(0, min(10, base_intensity))
            
            risk_level = "High" if base_intensity > 7 else "Medium" if base_intensity > 4 else "Low"
            
            forecasts.append(CravingForecast(
                hour_offset=i,
                predicted_intensity=float(base_intensity),
                confidence_lower=float(max(0, base_intensity - 1.5)),
                confidence_upper=float(min(10, base_intensity + 1.5)),
                risk_level=risk_level
            ))
        
        return forecasts
    
    def identify_peak_risk_hours(self, forecasts: List[CravingForecast], 
                               current_time: datetime) -> List[int]:
        """Identify hours of day with highest craving risk"""
        high_risk_hours = []
        
        for forecast in forecasts:
            if forecast.predicted_intensity > 7:
                hour = (current_time.hour + forecast.hour_offset) % 24
                high_risk_hours.append(hour)
        
        return list(set(high_risk_hours))  # Remove duplicates
    
    def generate_interventions(self, forecasts: List[CravingForecast], 
                             trigger_sensitivity: List[TriggerSensitivity],
                             current_triggers: CurrentTriggers) -> List[InterventionRecommendationBasic]:
        """Generate intervention recommendations based on forecast"""
        interventions = []
        
        for i, forecast in enumerate(forecasts[:12]):  # Next 12 hours
            if forecast.predicted_intensity > 6:
                
                # Determine intervention type based on time and triggers
                hour = (current_triggers.current_time.hour + i) % 24
                
                if 6 <= hour <= 9:  # Morning
                    interventions.append(InterventionRecommendationBasic(
                        time_offset=i,
                        intervention_type="Morning Routine",
                        description="Start day with meditation, healthy breakfast, and positive affirmations",
                        priority="Medium",
                        trigger_based=False
                    ))
                elif 12 <= hour <= 14:  # Lunch time
                    interventions.append(InterventionRecommendationBasic(
                        time_offset=i,
                        intervention_type="Midday Check-in",
                        description="Take a mindful break, practice deep breathing, or call support person",
                        priority="High" if forecast.predicted_intensity > 8 else "Medium",
                        trigger_based=False
                    ))
                elif 17 <= hour <= 20:  # Evening
                    interventions.append(InterventionRecommendationBasic(
                        time_offset=i,
                        intervention_type="Evening Support",
                        description="Attend support group, exercise, or engage in hobby",
                        priority="High",
                        trigger_based=False
                    ))
                elif 21 <= hour <= 23:  # Night
                    interventions.append(InterventionRecommendationBasic(
                        time_offset=i,
                        intervention_type="Sleep Preparation",
                        description="Wind down routine, avoid triggers, prepare for restful sleep",
                        priority="Medium",
                        trigger_based=False
                    ))
                
                # Trigger-specific interventions
                if current_triggers.stress_level > 7:
                    interventions.append(InterventionRecommendationBasic(
                        time_offset=i,
                        intervention_type="Stress Management",
                        description="Practice progressive muscle relaxation or guided imagery",
                        priority="High",
                        trigger_based=True
                    ))
                
                if current_triggers.social_context == "risky":
                    interventions.append(InterventionRecommendationBasic(
                        time_offset=i,
                        intervention_type="Environment Change",
                        description="Leave current environment and contact support person",
                        priority="High",
                        trigger_based=True
                    ))
        
        return interventions[:6]  # Limit to top 6 interventions

# Initialize engines
forecast_engine = CravingForecastEngine()
intervention_engine = OptimalInterventionEngine()

# API Endpoints
@app.get("/")
async def root():
    return {
        "message": "Enhanced Craving Forecasting & Intervention Timing API",
        "version": "2.0.0",
        "new_features": [
            "User data persistence with JSON storage",
            "Optimal intervention timing recommendations", 
            "Intervention effectiveness tracking",
            "Personalized learning from user behavior"
        ],
        "endpoints": {
            "legacy_forecast": "/forecast",
            "user_profile": "/users/{user_id}/profile",
            "log_craving": "/users/{user_id}/log-craving",
            "optimal_timing": "/users/{user_id}/optimal-timing",
            "log_intervention": "/users/{user_id}/log-intervention",
            "health": "/health",
            "patterns": "/patterns"
        }
    }

# User Management Endpoints
@app.post("/users/{user_id}/profile")
async def create_or_update_user_profile(user_id: str, profile_data: Dict[str, Any]):
    """Create or update user profile"""
    try:
        profile = UserProfile(user_id=user_id, **profile_data)
        data_manager.save_user_profile(profile)
        return {"message": "Profile updated successfully", "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating profile: {str(e)}")

@app.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str):
    """Get user profile"""
    profile = data_manager.load_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile

@app.post("/users/{user_id}/log-craving")
async def log_craving_data(user_id: str, request: CravingLogRequest):
    """Log new craving data for user"""
    try:
        # Save the craving data
        data_manager.save_craving_data(user_id, request.craving_data)
        
        # Update or create basic profile if doesn't exist
        profile = data_manager.load_user_profile(user_id)
        if not profile:
            # Create basic profile
            basic_profile = UserProfile(
                user_id=user_id,
                addiction_type="alcohol",  # Default, should be updated
                days_in_recovery=0
            )
            data_manager.save_user_profile(basic_profile)
        
        return {
            "message": "Craving data logged successfully",
            "user_id": user_id,
            "timestamp": request.craving_data.timestamp.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging craving data: {str(e)}")

@app.post("/users/{user_id}/log-intervention")
async def log_intervention_outcome(user_id: str, request: InterventionLogRequest):
    """Log intervention outcome for learning"""
    try:
        data_manager.save_intervention_log(user_id, request.intervention_log)
        return {
            "message": "Intervention outcome logged successfully",
            "user_id": user_id,
            "intervention_id": request.intervention_log.intervention_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging intervention: {str(e)}")

# Enhanced Forecasting Endpoints
@app.post("/users/{user_id}/optimal-timing", response_model=OptimalTimingResponse)
async def get_optimal_intervention_timing(user_id: str, request: OptimalTimingRequest):
    """Get optimal intervention timing recommendations using stored user data"""
    try:
        # Load user data
        profile = data_manager.load_user_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        historical_data = data_manager.load_historical_data(user_id)
        if not historical_data:
            raise HTTPException(status_code=400, detail="No historical craving data found")
        
        intervention_history = data_manager.load_intervention_history(user_id)
        
        # Generate craving forecast
        df = forecast_engine.prepare_time_series_data(historical_data)
        forecasts = forecast_engine.generate_forecast(
            df, request.current_triggers, profile.addiction_type, profile.days_in_recovery
        )
        
        # Generate optimal intervention timing
        recommendations = intervention_engine.generate_optimal_recommendations(
            user_id, request.current_triggers, forecasts, intervention_history, 
            profile, request.max_interventions
        )
        
        # Identify critical periods
        critical_periods = []
        for forecast in forecasts:
            if forecast.predicted_intensity > 8:
                critical_time = request.current_triggers.current_time + timedelta(hours=forecast.hour_offset)
                critical_periods.append({
                    "time": critical_time.isoformat(),
                    "intensity": forecast.predicted_intensity,
                    "risk_level": forecast.risk_level,
                    "hours_from_now": forecast.hour_offset
                })
        
        # Generate learning insights
        learning_insights = {
            "total_interventions_logged": len(intervention_history),
            "most_effective_intervention": None,
            "least_used_intervention": None,
            "average_effectiveness": 0.0,
            "data_quality": "High" if len(historical_data) > 100 else "Medium" if len(historical_data) > 30 else "Low"
        }
        
        if intervention_history:
            # Calculate most effective intervention
            intervention_effectiveness = {}
            for log in intervention_history:
                if log.was_used and log.craving_after is not None:
                    if log.intervention_type not in intervention_effectiveness:
                        intervention_effectiveness[log.intervention_type] = []
                    reduction = log.craving_before - log.craving_after
                    intervention_effectiveness[log.intervention_type].append(reduction)
            
            if intervention_effectiveness:
                avg_effectiveness = {k: np.mean(v) for k, v in intervention_effectiveness.items()}
                learning_insights["most_effective_intervention"] = max(avg_effectiveness, key=avg_effectiveness.get)
                learning_insights["average_effectiveness"] = np.mean(list(avg_effectiveness.values()))
        
        # Next check-in recommendation
        next_check_in = request.current_triggers.current_time + timedelta(hours=4)
        if critical_periods:
            # Recommend check-in 1 hour before first critical period
            first_critical = min(critical_periods, key=lambda x: x["hours_from_now"])
            recommended_checkin_hours = max(1, first_critical["hours_from_now"] - 1)
            next_check_in = request.current_triggers.current_time + timedelta(hours=recommended_checkin_hours)
        
        return OptimalTimingResponse(
            user_id=user_id,
            generated_at=datetime.now(),
            forecast_period_hours=request.forecast_hours,
            recommendations=recommendations,
            critical_periods=critical_periods,
            learning_insights=learning_insights,
            next_check_in_recommended=next_check_in
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating optimal timing: {str(e)}")

# Legacy endpoint (maintains backward compatibility)
@app.post("/forecast", response_model=CravingForecastResponse)
async def forecast_craving_intensity(request: CravingForecastRequest):
    """
    Legacy endpoint: Generate 24-hour craving intensity forecast based on historical data and current triggers
    """
    try:
        # Auto-save user data if provided
        if request.user_id:
            # Save/update profile
            profile = UserProfile(
                user_id=request.user_id,
                addiction_type=request.addiction_type,
                days_in_recovery=request.days_in_recovery
            )
            data_manager.save_user_profile(profile)
            
            # Save historical data
            for craving_data in request.historical_data:
                data_manager.save_craving_data(request.user_id, craving_data)
        
        # Prepare time series data
        df = forecast_engine.prepare_time_series_data(request.historical_data)
        
        # Calculate trigger sensitivity
        trigger_sensitivity = forecast_engine.calculate_trigger_sensitivity(df)
        
        # Identify time patterns
        time_patterns = forecast_engine.identify_time_patterns(df)
        
        # Generate forecast
        forecasts = forecast_engine.generate_forecast(
            df, request.current_triggers, request.addiction_type, request.days_in_recovery
        )
        
        # Identify peak risk hours
        peak_risk_hours = forecast_engine.identify_peak_risk_hours(
            forecasts, request.current_triggers.current_time
        )
        
        # Generate intervention recommendations
        interventions = forecast_engine.generate_interventions(
            forecasts, trigger_sensitivity, request.current_triggers
        )
        
        # Calculate model confidence based on data sufficiency
        data_points = len(request.historical_data)
        if data_points >= 168:  # 1 week of hourly data
            data_sufficiency = "High"
            model_confidence = 0.85
        elif data_points >= 72:  # 3 days
            data_sufficiency = "Medium"
            model_confidence = 0.65
        else:
            data_sufficiency = "Low"
            model_confidence = 0.45
        
        # Find next high-risk period
        next_high_risk = None
        for forecast in forecasts:
            if forecast.predicted_intensity > 7:
                next_time = request.current_triggers.current_time + timedelta(hours=forecast.hour_offset)
                next_high_risk = next_time.strftime("%H:%M")
                break
        
        return CravingForecastResponse(
            user_id=request.user_id,
            forecast_timestamp=datetime.now().isoformat(),
            forecasts=forecasts,
            peak_risk_hours=peak_risk_hours,
            trigger_sensitivity=trigger_sensitivity,
            time_patterns=time_patterns,
            intervention_recommendations=interventions,
            model_confidence=model_confidence,
            data_sufficiency=data_sufficiency,
            next_high_risk_period=next_high_risk
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Enhanced Craving Forecasting & Intervention Timing API",
        "version": "2.0.0",
        "features": ["forecasting", "optimal_timing", "data_persistence", "learning"]
    }

@app.get("/patterns")
async def get_default_patterns():
    """Get default craving patterns by addiction type"""
    return {
        "default_patterns": forecast_engine.default_patterns,
        "intervention_types": intervention_engine.intervention_types,
        "description": "Default patterns and intervention configurations",
        "note": "Patterns are personalized as user data accumulates"
    }

@app.get("/users/{user_id}/statistics")
async def get_user_statistics(user_id: str):
    """Get user statistics and insights"""
    try:
        profile = data_manager.load_user_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="User not found")
        
        historical_data = data_manager.load_historical_data(user_id)
        intervention_history = data_manager.load_intervention_history(user_id)
        
        # Calculate statistics
        stats = {
            "profile": profile.dict(),
            "total_craving_logs": len(historical_data),
            "total_interventions": len(intervention_history),
            "data_collection_period_days": 0,
            "average_craving_intensity": 0.0,
            "most_common_high_risk_hour": None,
            "intervention_success_rate": 0.0
        }
        
        if historical_data:
            # Data period
            first_log = min(historical_data, key=lambda x: x.timestamp)
            last_log = max(historical_data, key=lambda x: x.timestamp)
            stats["data_collection_period_days"] = (last_log.timestamp - first_log.timestamp).days
            
            # Average intensity
            stats["average_craving_intensity"] = np.mean([log.craving_intensity for log in historical_data])
            
            # Most common high risk hour
            high_risk_logs = [log for log in historical_data if log.craving_intensity > 7]
            if high_risk_logs:
                hours = [log.timestamp.hour for log in high_risk_logs]
                stats["most_common_high_risk_hour"] = max(set(hours), key=hours.count)
        
        if intervention_history:
            used_interventions = [log for log in intervention_history if log.was_used]
            if used_interventions:
                successful = [log for log in used_interventions 
                            if log.craving_after is not None and log.craving_after < log.craving_before]
                stats["intervention_success_rate"] = len(successful) / len(used_interventions)
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting statistics: {str(e)}")