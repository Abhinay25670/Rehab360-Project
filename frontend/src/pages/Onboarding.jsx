import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  FaShieldAlt, 
  FaUserFriends, 
  FaEnvelope, 
  FaPhone, 
  FaArrowRight, 
  FaArrowLeft,
  FaCheck,
  FaBell,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaHeartbeat,
  FaMoon,
  FaSun,
  FaLeaf,
  FaFire,
  FaBolt,
  FaUserMd,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';

import { API_BASE_URL } from '../config/api';
import BrandLogo from '../components/BrandLogo';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  const [formData, setFormData] = useState({
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    relationship: 'Other',
    doctorName: '',
    doctorEmail: '',
    doctorPhone: '',
    notificationPreferences: {
      highRiskAlerts: true,
      sosAlerts: true,
      weeklyReports: true
    },
    recoveryProfile: {
      addiction_type: 'Alcohol',
      days_in_recovery: 0,
      typical_bedtime: '22:30',
      typical_wake_time: '07:00',
      current_stress_level: 5,
      current_craving_intensity: 3,
      preferred_support_style: 'balanced'
    }
  });
  const [showDoctorFields, setShowDoctorFields] = useState(false);
  const { t } = useTranslation();

  const addictionTypes = ['Alcohol', 'Nicotine', 'Opioids', 'Cannabis', 'Gambling', 'Other'];

  // Calculate sleep quality based on bed time and wake up time
  const calculateSleepQuality = (bedtime, wakeTime) => {
    // Parse times
    const [bedHour, bedMin] = bedtime.split(':').map(Number);
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    
    // Calculate sleep duration in hours
    let bedMinutes = bedHour * 60 + bedMin;
    let wakeMinutes = wakeHour * 60 + wakeMin;
    
    // Handle overnight sleep (e.g., 22:00 to 07:00)
    if (wakeMinutes < bedMinutes) {
      wakeMinutes += 24 * 60; // Add 24 hours
    }
    
    const sleepMinutes = wakeMinutes - bedMinutes;
    const sleepHours = sleepMinutes / 60;
    
    // Calculate sleep quality score (1-10) based on sleep duration
    // Optimal sleep: 7-9 hours = score 8-10
    // Adequate sleep: 6-7 or 9-10 hours = score 6-8
    // Poor sleep: <6 or >10 hours = score 1-5
    let quality;
    
    if (sleepHours >= 7 && sleepHours <= 9) {
      // Optimal range - highest quality
      quality = 8 + ((sleepHours - 7) / 2) * 2; // 8-10
    } else if (sleepHours >= 6 && sleepHours < 7) {
      // Slightly under optimal
      quality = 6 + (sleepHours - 6); // 6-7
    } else if (sleepHours > 9 && sleepHours <= 10) {
      // Slightly over optimal
      quality = 8 - (sleepHours - 9); // 7-8
    } else if (sleepHours >= 5 && sleepHours < 6) {
      // Under sleep
      quality = 4 + (sleepHours - 5); // 4-5
    } else if (sleepHours > 10 && sleepHours <= 11) {
      // Over sleep
      quality = 6 - (sleepHours - 10); // 5-6
    } else if (sleepHours < 5) {
      // Severe under sleep
      quality = Math.max(1, sleepHours); // 1-4
    } else {
      // Severe over sleep (>11 hours)
      quality = Math.max(1, 5 - (sleepHours - 11)); // 1-4
    }
    
    return {
      hours: Math.round(sleepHours * 10) / 10,
      quality: Math.round(Math.min(10, Math.max(1, quality)))
    };
  };

  // Get calculated sleep data
  const sleepData = calculateSleepQuality(
    formData.recoveryProfile.typical_bedtime,
    formData.recoveryProfile.typical_wake_time
  );
  const relationships = [
    'Parent',
    'Spouse',
    'Sibling',
    'Friend',
    'Counselor',
    'Other'
  ];

  // Redirect doctors away from guardian onboarding
  useEffect(() => {
    const checkDoctorAndOnboarding = async () => {
      if (!isLoaded || !user) return;

      const email = user.primaryEmailAddress?.emailAddress;
      if (email) {
        try {
          const docRes = await axios.get(`${API_BASE_URL}/api/doctor/check/${encodeURIComponent(email)}`);
          if (docRes.data.isDoctor) {
            navigate('/doctor-dashboard', { replace: true });
            return;
          }
        } catch { /* not a doctor, continue */ }
      }
      
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/guardian/status/${user.id}`
        );
        
        if (response.data.onboardingCompleted) {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkDoctorAndOnboarding();
  }, [isLoaded, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handlePreferenceChange = (pref) => {
    setFormData(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [pref]: !prev.notificationPreferences[pref]
      }
    }));
  };

  const handleRecoveryChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      recoveryProfile: {
        ...prev.recoveryProfile,
        [field]: value
      }
    }));
    setError('');
  };

  const validateStep = () => {
    if (step === 2) {
      if (!formData.guardianName.trim()) {
        setError(t('onboarding.guardianNameRequired'));
        return false;
      }
      if (!formData.guardianEmail.trim()) {
        setError(t('onboarding.guardianEmailRequired'));
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.guardianEmail)) {
        setError(t('onboarding.validEmail'));
        return false;
      }
      if (formData.doctorEmail && !emailRegex.test(formData.doctorEmail)) {
        setError(t('onboarding.validDoctorEmail'));
        return false;
      }
    }
    if (step === 3) {
      const rp = formData.recoveryProfile;
      if (!rp.addiction_type?.trim()) {
        setError(t('onboarding.selectAddictionType'));
        return false;
      }
      if (rp.days_in_recovery < 0) {
        setError(t('onboarding.negativeDays'));
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/guardian/setup`, {
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress || '',
        userName: user.fullName || user.firstName || 'User',
        guardianName: formData.guardianName,
        guardianEmail: formData.guardianEmail,
        guardianPhone: formData.guardianPhone,
        relationship: formData.relationship,
        notificationPreferences: formData.notificationPreferences,
        doctorName: formData.doctorName || undefined,
        doctorEmail: formData.doctorEmail || undefined,
        doctorPhone: formData.doctorPhone || undefined
      });

      if (response.data.success) {
        // Store onboarding completed in localStorage as backup
        localStorage.setItem(`onboarding_${user.id}`, 'completed');
        // Save recovery profile to pre-configure dashboard
        const userId = user.primaryEmailAddress?.emailAddress || user.id || '';
        const getKey = (dataType) => `rehab_${userId}_${dataType}`;
        const rp = formData.recoveryProfile;
        // Calculate sleep quality from bed/wake times
        const calculatedSleep = calculateSleepQuality(rp.typical_bedtime, rp.typical_wake_time);
        
        const userContext = {
          user_id: userId,
          addiction_type: rp.addiction_type,
          days_in_recovery: rp.days_in_recovery,
          current_stress_level: rp.current_stress_level,
          current_craving_intensity: rp.current_craving_intensity,
          preferred_support_style: rp.preferred_support_style,
          crisis_contacts: []
        };
        const stats = {
          daysSober: rp.days_in_recovery,
          sleepQuality: calculatedSleep.quality,
          avgCravingLevel: rp.current_craving_intensity,
          stressLevel: rp.current_stress_level,
          chatSessions: 0,
          cravingEntries: 0,
          sleepChecks: 0
        };
        const sleepForm = {
          typical_bedtime: rp.typical_bedtime,
          typical_wake_time: rp.typical_wake_time,
          time_to_fall_asleep: '15-30min',
          sleep_quality_rating: calculatedSleep.quality,
          hours_of_actual_sleep: calculatedSleep.hours,
          wake_up_frequency: '1-2 times',
          difficulty_returning_to_sleep: 'somewhat hard',
          early_morning_awakening: false,
          daytime_sleepiness: 5,
          energy_level: 6,
          concentration_issues: 'sometimes',
          mood_affected_by_sleep: 'sometimes',
          sleep_since_recovery: 'better',
          withdrawal_affecting_sleep: false,
          cravings_due_to_poor_sleep: rp.current_craving_intensity >= 5,
          sleep_medications: 'nothing',
          caffeine_daily: '1-2 cups',
          caffeine_timing: 'afternoon',
          exercise_frequency: '3-4x/week',
          screen_time_before_bed: '30-60min',
          stress_level: rp.current_stress_level
        };
        localStorage.setItem(getKey('userContext'), JSON.stringify(userContext));
        localStorage.setItem(getKey('stats'), JSON.stringify(stats));
        localStorage.setItem(getKey('sleepForm'), JSON.stringify(sleepForm));
        navigate('/dashboard');
      } else {
        setError(response.data.message || t('onboarding.failedToSave'));
      }
    } catch (err) {
      console.error('Error saving guardian:', err);
      setError(err.response?.data?.message || t('onboarding.failedToSave'));
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || checkingStatus) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
          <p className="text-sm text-zinc-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-zinc-900 rounded-lg flex items-center justify-center overflow-hidden">
              <BrandLogo variant="onDark" size="md" />
            </div>
            <span className="font-semibold text-lg text-zinc-900">Rehab360</span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-700">{t('onboarding.setupProgress')}</span>
            <span className="text-sm text-zinc-500">{t('onboarding.stepOf', { step, total: 4 })}</span>
          </div>
          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-zinc-900 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="text-2xl text-zinc-700" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 mb-2">
                {t('onboarding.welcome', { name: user?.firstName || 'there' })}
              </h1>
              <p className="text-zinc-600">
                {t('onboarding.welcomeSubtitle')}
              </p>
            </div>

            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4 p-4 bg-zinc-50 rounded-lg">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaExclamationTriangle className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 mb-1">{t('onboarding.highRiskAlerts')}</h3>
                  <p className="text-sm text-zinc-600">
                    {t('onboarding.highRiskAlertsDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-zinc-50 rounded-lg">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaBell className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 mb-1">{t('onboarding.sosButton')}</h3>
                  <p className="text-sm text-zinc-600">
                    {t('onboarding.sosButtonDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-zinc-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaCalendarAlt className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 mb-1">{t('onboarding.weeklyReports')}</h3>
                  <p className="text-sm text-zinc-600">
                    {t('onboarding.weeklyReportsDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-emerald-800">
                {t('onboarding.privacyNotice')}
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
            >
              {t('onboarding.setUpGuardian')} <FaArrowRight />
            </button>
          </div>
        )}

        {/* Step 2: Guardian Information */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUserFriends className="text-2xl text-zinc-700" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 mb-2">
                {t('onboarding.guardianInformation')}
              </h1>
              <p className="text-zinc-600">
                {t('onboarding.guardianInfoSubtitle')}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  {t('onboarding.guardianName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleInputChange}
                  placeholder="e.g., John Smith"
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  {t('onboarding.guardianEmail')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    name="guardianEmail"
                    value={formData.guardianEmail}
                    onChange={handleInputChange}
                    placeholder="guardian@email.com"
                    className="w-full pl-11 pr-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">
                  {t('onboarding.guardianEmailNote')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  {t('onboarding.guardianPhone')} <span className="text-zinc-400">({t('common.optional')})</span>
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="tel"
                    name="guardianPhone"
                    value={formData.guardianPhone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full pl-11 pr-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  {t('common.relationship')}
                </label>
                <select
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent bg-white"
                >
                  {relationships.map(rel => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Treating Doctor Section */}
            <div className="mt-6 border-t border-zinc-200 pt-6">
              <button
                type="button"
                onClick={() => setShowDoctorFields(!showDoctorFields)}
                className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaUserMd className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-zinc-900">{t('onboarding.treatingDoctor')}</p>
                    <p className="text-xs text-zinc-500">{t('onboarding.treatingDoctorNote')}</p>
                  </div>
                </div>
                {showDoctorFields ? <FaChevronUp className="text-zinc-400" /> : <FaChevronDown className="text-zinc-400" />}
              </button>

              {showDoctorFields && (
                <div className="mt-4 space-y-5 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      {t('onboarding.doctorName')} <span className="text-zinc-400">({t('common.optional')})</span>
                    </label>
                    <input
                      type="text"
                      name="doctorName"
                      value={formData.doctorName}
                      onChange={handleInputChange}
                      placeholder="e.g., Dr. Sarah Johnson"
                      className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      {t('onboarding.doctorEmail')} <span className="text-zinc-400">({t('common.optional')})</span>
                    </label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="email"
                        name="doctorEmail"
                        value={formData.doctorEmail}
                        onChange={handleInputChange}
                        placeholder="doctor@clinic.com"
                        className="w-full pl-11 pr-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-500">
                      {t('onboarding.doctorEmailNote')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      {t('onboarding.doctorPhone')} <span className="text-zinc-400">({t('common.optional')})</span>
                    </label>
                    <div className="relative">
                      <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="tel"
                        name="doctorPhone"
                        value={formData.doctorPhone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 987-6543"
                        className="w-full pl-11 pr-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleBack}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 text-zinc-700 py-3 px-6 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
              >
                <FaArrowLeft /> {t('common.back')}
              </button>
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
              >
                {t('common.continue')} <FaArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Recovery Profile */}
        {step === 3 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHeartbeat className="text-2xl text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 mb-2">
                {t('onboarding.recoveryProfile')}
              </h1>
              <p className="text-zinc-600">
                {t('onboarding.recoveryProfileSubtitle')}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  {t('onboarding.addictionType')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.recoveryProfile.addiction_type}
                  onChange={(e) => handleRecoveryChange('addiction_type', e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent bg-white"
                >
                  {addictionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  {t('onboarding.daysInRecovery')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.recoveryProfile.days_in_recovery}
                  onChange={(e) => handleRecoveryChange('days_in_recovery', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 7"
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                />
                <p className="mt-1.5 text-xs text-zinc-500">
                  {t('onboarding.daysInRecoveryNote')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    <FaMoon className="inline mr-1.5 text-zinc-500" /> {t('onboarding.typicalBedtime')}
                  </label>
                  <input
                    type="time"
                    value={formData.recoveryProfile.typical_bedtime}
                    onChange={(e) => handleRecoveryChange('typical_bedtime', e.target.value)}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    <FaSun className="inline mr-1.5 text-zinc-500" /> {t('onboarding.typicalWakeTime')}
                  </label>
                  <input
                    type="time"
                    value={formData.recoveryProfile.typical_wake_time}
                    onChange={(e) => handleRecoveryChange('typical_wake_time', e.target.value)}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Calculated Sleep Quality Display */}
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-700">{t('onboarding.estimatedSleepDuration')}</span>
                  <span className="text-lg font-semibold text-zinc-900">{sleepData.hours} hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700">{t('onboarding.sleepQualityScore')}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-semibold ${
                      sleepData.quality >= 7 ? 'text-emerald-600' : 
                      sleepData.quality >= 5 ? 'text-amber-600' : 'text-red-600'
                    }`}>{sleepData.quality}/10</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      sleepData.quality >= 7 ? 'bg-emerald-100 text-emerald-700' : 
                      sleepData.quality >= 5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sleepData.quality >= 7 ? t('common.good') : sleepData.quality >= 5 ? t('common.fair') : t('common.poor')}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {t('onboarding.sleepOptimalNote')}
                </p>
              </div>

              {/* Stress Level and Craving Intensity - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    <FaBolt className="inline mr-1.5 text-amber-500" /> {t('onboarding.stressLevel')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="e.g., 5"
                    value={formData.recoveryProfile.current_stress_level}
                    onChange={(e) => handleRecoveryChange('current_stress_level', Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  />
                  <p className="mt-1.5 text-xs text-zinc-500">{t('onboarding.stressLowHigh')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    <FaFire className="inline mr-1.5 text-orange-500" /> {t('onboarding.cravingIntensity')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="e.g., 3"
                    value={formData.recoveryProfile.current_craving_intensity}
                    onChange={(e) => handleRecoveryChange('current_craving_intensity', Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  />
                  <p className="mt-1.5 text-xs text-zinc-500">{t('onboarding.cravingNoneIntense')}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  <FaLeaf className="inline mr-1.5 text-zinc-500" /> {t('onboarding.supportStyle')}
                </label>
                <select
                  value={formData.recoveryProfile.preferred_support_style}
                  onChange={(e) => handleRecoveryChange('preferred_support_style', e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent bg-white"
                >
                  <option value="supportive">{t('onboarding.supportiveGentle')}</option>
                  <option value="motivational">{t('onboarding.motivationalUplifting')}</option>
                  <option value="direct">{t('onboarding.directStraightforward')}</option>
                  <option value="balanced">{t('onboarding.balancedStyle')}</option>
                </select>
                <p className="mt-1.5 text-xs text-zinc-500">
                  {t('onboarding.chatbotStyleNote')}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleBack}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 text-zinc-700 py-3 px-6 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
              >
                <FaArrowLeft /> {t('common.back')}
              </button>
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
              >
                {t('common.continue')} <FaArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm & Preferences */}
        {step === 4 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheck className="text-2xl text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 mb-2">
                {t('onboarding.confirmSetup')}
              </h1>
              <p className="text-zinc-600">
                {t('onboarding.confirmSubtitle')}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            {/* Guardian Summary */}
            <div className="bg-zinc-50 rounded-lg p-5 mb-4">
              <h3 className="font-medium text-zinc-900 mb-3">{t('onboarding.guardianDetails')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t('common.name')}:</span>
                  <span className="text-zinc-900 font-medium">{formData.guardianName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t('common.email')}:</span>
                  <span className="text-zinc-900">{formData.guardianEmail}</span>
                </div>
                {formData.guardianPhone && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{t('common.phone')}:</span>
                    <span className="text-zinc-900">{formData.guardianPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t('common.relationship')}:</span>
                  <span className="text-zinc-900">{formData.relationship}</span>
                </div>
              </div>
            </div>

            {/* Doctor Summary (if provided) */}
            {formData.doctorEmail && (
              <div className="bg-blue-50 rounded-lg p-5 mb-4 border border-blue-100">
                <h3 className="font-medium text-zinc-900 mb-3">{t('onboarding.treatingDoctor')}</h3>
                <div className="space-y-2 text-sm">
                  {formData.doctorName && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">{t('common.name')}:</span>
                      <span className="text-zinc-900 font-medium">{formData.doctorName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{t('common.email')}:</span>
                    <span className="text-zinc-900">{formData.doctorEmail}</span>
                  </div>
                  {formData.doctorPhone && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">{t('common.phone')}:</span>
                      <span className="text-zinc-900">{formData.doctorPhone}</span>
                    </div>
                  )}
                  <p className="text-xs text-blue-600 mt-2">
                    {t('onboarding.doctorInviteNote')}
                  </p>
                </div>
              </div>
            )}

            {/* Recovery Profile Summary */}
            <div className="bg-emerald-50 rounded-lg p-5 mb-6 border border-emerald-100">
              <h3 className="font-medium text-zinc-900 mb-3">{t('onboarding.recoveryProfileSummary')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t('onboarding.addictionTypeLabel')}</span>
                  <span className="text-zinc-900 font-medium">{formData.recoveryProfile.addiction_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t('onboarding.daysInRecoveryLabel')}</span>
                  <span className="text-zinc-900">{formData.recoveryProfile.days_in_recovery}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t('onboarding.sleepScheduleLabel')}</span>
                  <span className="text-zinc-900">{formData.recoveryProfile.typical_bedtime} – {formData.recoveryProfile.typical_wake_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t('onboarding.sleepQualityLabel')}</span>
                  <span className={`font-medium ${
                    sleepData.quality >= 7 ? 'text-emerald-600' : 
                    sleepData.quality >= 5 ? 'text-amber-600' : 'text-red-600'
                  }`}>{sleepData.quality}/10 ({sleepData.hours}h)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t('onboarding.stressLevelLabel')}</span>
                  <span className={`font-medium ${
                    formData.recoveryProfile.current_stress_level >= 7 ? 'text-red-600' : 
                    formData.recoveryProfile.current_stress_level >= 4 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>{formData.recoveryProfile.current_stress_level}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t('onboarding.cravingIntensityLabel')}</span>
                  <span className={`font-medium ${
                    formData.recoveryProfile.current_craving_intensity >= 7 ? 'text-red-600' : 
                    formData.recoveryProfile.current_craving_intensity >= 4 ? 'text-orange-600' : 'text-emerald-600'
                  }`}>{formData.recoveryProfile.current_craving_intensity}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t('onboarding.supportStyleLabel')}</span>
                  <span className="text-zinc-900 capitalize">{formData.recoveryProfile.preferred_support_style}</span>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="mb-8">
              <h3 className="font-medium text-zinc-900 mb-4">{t('onboarding.notificationPreferences')}</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <FaExclamationTriangle className="text-red-500" />
                    <div>
                      <p className="font-medium text-zinc-900">{t('onboarding.highRiskAlertsPref')}</p>
                      <p className="text-xs text-zinc-500">{t('onboarding.highRiskAlertsPrefDesc')}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificationPreferences.highRiskAlerts}
                    onChange={() => handlePreferenceChange('highRiskAlerts')}
                    className="w-5 h-5 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <FaBell className="text-amber-500" />
                    <div>
                      <p className="font-medium text-zinc-900">{t('onboarding.sosAlertsPref')}</p>
                      <p className="text-xs text-zinc-500">{t('onboarding.sosAlertsPrefDesc')}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificationPreferences.sosAlerts}
                    onChange={() => handlePreferenceChange('sosAlerts')}
                    className="w-5 h-5 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <FaCalendarAlt className="text-blue-500" />
                    <div>
                      <p className="font-medium text-zinc-900">{t('onboarding.weeklyReportsPref')}</p>
                      <p className="text-xs text-zinc-500">{t('onboarding.weeklyReportsPrefDesc')}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificationPreferences.weeklyReports}
                    onChange={() => handlePreferenceChange('weeklyReports')}
                    className="w-5 h-5 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-500"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 text-zinc-700 py-3 px-6 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                <FaArrowLeft /> {t('common.back')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  <>
                    {t('onboarding.completeSetup')} <FaCheck />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Onboarding;
