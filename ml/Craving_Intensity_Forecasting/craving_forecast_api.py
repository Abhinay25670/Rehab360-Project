from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
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
    title="Craving Intensity Forecasting API",
    description="AI-powered craving prediction based on triggers and time patterns",
    version="1.0.0"
)

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

class CravingForecastRequest(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    historical_data: List[HistoricalCravingData] = Field(..., min_items=1, description="Historical craving data")
    current_triggers: CurrentTriggers = Field(..., description="Current trigger state")
    addiction_type: str = Field(..., description="Type of addiction")
    days_in_recovery: int = Field(..., ge=0, description="Days in recovery")

class TriggerSensitivity(BaseModel):
    trigger_name: str
    correlation: float
    sensitivity_level: str  # Low, Medium, High
    impact_score: float
    recommendation: str

class TimePattern(BaseModel):
    hour: int
    average_intensity: float
    risk_level: str

class CravingForecast(BaseModel):
    hour_offset: int  # Hours from now
    predicted_intensity: float
    confidence_lower: float
    confidence_upper: float
    risk_level: str

class InterventionRecommendation(BaseModel):
    time_offset: int  # Hours from now
    intervention_type: str
    description: str
    priority: str
    trigger_based: bool

class CravingForecastResponse(BaseModel):
    user_id: str
    forecast_timestamp: str
    forecasts: List[CravingForecast]  # Next 24 hours
    peak_risk_hours: List[int]  # Hours of day (0-23) with highest risk
    trigger_sensitivity: List[TriggerSensitivity]
    time_patterns: List[TimePattern]
    intervention_recommendations: List[InterventionRecommendation]
    model_confidence: float
    data_sufficiency: str  # "Low", "Medium", "High"
    next_high_risk_period: Optional[str]

# Craving forecasting engine
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
                             current_triggers: CurrentTriggers) -> List[InterventionRecommendation]:
        """Generate intervention recommendations based on forecast"""
        interventions = []
        
        for i, forecast in enumerate(forecasts[:12]):  # Next 12 hours
            if forecast.predicted_intensity > 6:
                
                # Determine intervention type based on time and triggers
                hour = (current_triggers.current_time.hour + i) % 24
                
                if 6 <= hour <= 9:  # Morning
                    interventions.append(InterventionRecommendation(
                        time_offset=i,
                        intervention_type="Morning Routine",
                        description="Start day with meditation, healthy breakfast, and positive affirmations",
                        priority="Medium",
                        trigger_based=False
                    ))
                elif 12 <= hour <= 14:  # Lunch time
                    interventions.append(InterventionRecommendation(
                        time_offset=i,
                        intervention_type="Midday Check-in",
                        description="Take a mindful break, practice deep breathing, or call support person",
                        priority="High" if forecast.predicted_intensity > 8 else "Medium",
                        trigger_based=False
                    ))
                elif 17 <= hour <= 20:  # Evening
                    interventions.append(InterventionRecommendation(
                        time_offset=i,
                        intervention_type="Evening Support",
                        description="Attend support group, exercise, or engage in hobby",
                        priority="High",
                        trigger_based=False
                    ))
                elif 21 <= hour <= 23:  # Night
                    interventions.append(InterventionRecommendation(
                        time_offset=i,
                        intervention_type="Sleep Preparation",
                        description="Wind down routine, avoid triggers, prepare for restful sleep",
                        priority="Medium",
                        trigger_based=False
                    ))
                
                # Trigger-specific interventions
                if current_triggers.stress_level > 7:
                    interventions.append(InterventionRecommendation(
                        time_offset=i,
                        intervention_type="Stress Management",
                        description="Practice progressive muscle relaxation or guided imagery",
                        priority="High",
                        trigger_based=True
                    ))
                
                if current_triggers.social_context == "risky":
                    interventions.append(InterventionRecommendation(
                        time_offset=i,
                        intervention_type="Environment Change",
                        description="Leave current environment and contact support person",
                        priority="High",
                        trigger_based=True
                    ))
        
        return interventions[:6]  # Limit to top 6 interventions

# Initialize forecast engine
forecast_engine = CravingForecastEngine()

# API Endpoints
@app.get("/")
async def root():
    return {
        "message": "Craving Intensity Forecasting API",
        "version": "1.0.0",
        "endpoints": {
            "forecast": "/forecast",
            "health": "/health",
            "patterns": "/patterns"
        }
    }

@app.post("/forecast", response_model=CravingForecastResponse)
async def forecast_craving_intensity(request: CravingForecastRequest):
    """
    Generate 24-hour craving intensity forecast based on historical data and current triggers
    """
    try:
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
        "service": "Craving Intensity Forecasting API"
    }

@app.get("/patterns")
async def get_default_patterns():
    """Get default craving patterns by addiction type"""
    return {
        "default_patterns": forecast_engine.default_patterns,
        "description": "Default hourly craving intensity patterns by addiction type",
        "note": "Patterns are based on clinical research and adjusted per individual as data accumulates"
    }