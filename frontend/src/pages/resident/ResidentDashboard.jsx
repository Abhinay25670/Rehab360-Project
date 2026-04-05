import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaUser, 
  FaRobot,
  FaChartLine,
  FaHeartbeat,
  FaComments,
  FaMoon,
  FaRegSmile,
  FaBrain,
  FaChartBar,
  FaExclamationTriangle,
  FaLightbulb,
  FaClock,
  FaSignOutAlt,
  FaHome,
  FaStar,
  FaFire,
  FaPaperPlane,
  FaTrophy,
  FaCalendarCheck,
  FaArrowRight,
  FaBars,
  FaTimes,
  FaPlus,
  FaCheck,
  FaBell,
  FaSearch,
  FaCog,
  FaSun,
  FaLeaf,
  FaAppleAlt,
  FaCarrot,
  FaTint,
  FaUtensils,
  FaShoppingCart,
  FaClipboardList,
  FaUsers,
  FaPills,
  FaCapsules,
  FaInfoCircle,
  FaTrash,
  FaEdit,
  FaPlayCircle,
  FaPauseCircle,
  FaHospital,
  FaMapMarkerAlt,
  FaExternalLinkAlt,
  FaPhone,
  FaAmbulance,
  FaUserMd,
  FaEnvelope,
  FaVideo,
  FaCalendarAlt
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useNavigate } from "react-router-dom";
import { useUser, useClerk, UserButton } from '@clerk/clerk-react';
import SOSButton from '../../components/SOSButton';
import MeetingFinder from '../../components/MeetingFinder';
import RecoveryHeatmap from '../../components/RecoveryHeatmap';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguage } from '../../i18n';
import { API_BASE_URL, ML_API_URL } from '../../config/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const GuardianDashboard = () => {
  const { t, i18n } = useTranslation();
  // Clerk hooks for authentication (Guardian is logged in)
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerk();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState(null); // Patient info managed by guardian
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [sleepData, setSleepData] = useState(null);
  const [cravingForecast, setCravingForecast] = useState(null);
  const [historicalCravingData, setHistoricalCravingData] = useState([]);
  const [isNewUser, setIsNewUser] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('rehab_darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [userStats, setUserStats] = useState({
    daysSober: 0, sleepQuality: 0, avgCravingLevel: 0,
    stressLevel: 0, chatSessions: 0, cravingEntries: 0, sleepChecks: 0
  });

  const [userContext, setUserContext] = useState({
    user_id: '', addiction_type: '', days_in_recovery: 0,
    current_stress_level: 0, preferred_support_style: 'balanced', crisis_contacts: []
  });

  const [sleepForm, setSleepForm] = useState({
    typical_bedtime: '22:30', typical_wake_time: '07:00', time_to_fall_asleep: '15-30min',
    sleep_quality_rating: 7, hours_of_actual_sleep: 7.5, wake_up_frequency: '1-2 times',
    difficulty_returning_to_sleep: 'somewhat hard', early_morning_awakening: false,
    daytime_sleepiness: 5, energy_level: 6, concentration_issues: 'sometimes',
    mood_affected_by_sleep: 'sometimes', sleep_since_recovery: 'better',
    withdrawal_affecting_sleep: false, cravings_due_to_poor_sleep: false,
    sleep_medications: 'nothing', caffeine_daily: '1-2 cups', caffeine_timing: 'afternoon',
    exercise_frequency: '3-4x/week', screen_time_before_bed: '30-60min', stress_level: 6
  });

  const [currentTriggers, setCurrentTriggers] = useState({
    current_time: new Date().toISOString(), stress_level: 5, mood_score: 6, sleep_quality: 3,
    location_risk: false, social_trigger: false, work_stress: false, fatigue: false,
    hunger: false, pain: false, social_context: "alone", hours_since_checkin: 2,
    days_since_therapy: 1, medication_taken: true
  });

  // Guardian alert tracking
  const [lastHighRiskAlertTime, setLastHighRiskAlertTime] = useState(() => {
    const saved = localStorage.getItem('rehab_lastHighRiskAlert');
    return saved ? parseInt(saved) : 0;
  });
  const [currentMetrics, setCurrentMetrics] = useState({
    riskScore: 0,
    stressLevel: 0,
    cravingLevel: 0
  });

  // Patient info (the person in recovery being monitored by guardian)
  const [patientInfo, setPatientInfo] = useState({
    patientName: '',
    patientAge: '',
    addictionType: '',
    severity: '',
    treatingDoctor: ''
  });

  // Guardian contact info (the logged-in user monitoring the patient)
  const [guardianInfo, setGuardianInfo] = useState({
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    relationship: '',
    doctorName: '',
    doctorEmail: '',
    doctorPhone: ''
  });

  const [cravingEntry, setCravingEntry] = useState({
    timestamp: new Date().toISOString(), craving_intensity: 5, stress_level: 5,
    mood_score: 6, sleep_quality: 3, location_risk: false, social_trigger: false, work_stress: false
  });

  // Nutrition Feature States
  const [nutritionTab, setNutritionTab] = useState('overview'); // overview, mealplan, grocery, tracker, progress
  const [mealPlan, setMealPlan] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [foodLog, setFoodLog] = useState([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [nutritionStreak, setNutritionStreak] = useState(0);
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
  const [nutritionPreferences, setNutritionPreferences] = useState({
    dietaryRestrictions: [],
    allergies: [],
    mealsPerDay: 3
  });
  const [customGroceryItem, setCustomGroceryItem] = useState('');
  const [energyLevel, setEnergyLevel] = useState(5);

  // Medication Reminder States
  const [medicationData, setMedicationData] = useState(null);
  const [recommendedMedications, setRecommendedMedications] = useState([]);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [newMedication, setNewMedication] = useState({
    medicineName: '',
    dosageMg: '',
    dosageUnit: 'mg',
    frequencyPerDay: 1,
    reminderTimes: [],
    instructions: '',
    isRecommended: false
  });
  const [medicationSchedule, setMedicationSchedule] = useState({
    duration: '1_month',
    smsEnabled: true,
    emailEnabled: true
  });

  // Upcoming Appointments State
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  // Hospitals & Emergency States
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const POPULAR_CITIES = [
    { label: 'Mumbai', key: 'Mumbai' },
    { label: 'Delhi', key: 'Delhi' },
    { label: 'Bengaluru', key: 'Bengaluru' },
    { label: 'Chennai', key: 'Chennai' },
    { label: 'Hyderabad', key: 'Hyderabad' },
    { label: 'Kolkata', key: 'Kolkata' },
    { label: 'Pune', key: 'Pune' },
    { label: 'Ahmedabad', key: 'Ahmedabad' },
    { label: 'Others', key: 'Others' }
  ];

  // Nutrition Research Data - Based on scientific research for addiction recovery
  const nutritionBySubstance = {
    alcohol: {
      name: 'Alcohol',
      deficiencies: ['B vitamins (especially B1/Thiamine)', 'Zinc', 'Magnesium', 'Folate', 'Vitamin D'],
      keyNutrients: [
        { name: 'Thiamine (B1)', reason: 'Alcohol depletes thiamine, critical for brain function', foods: ['Whole grains', 'Pork', 'Legumes', 'Nuts'] },
        { name: 'Magnesium', reason: 'Reduces anxiety and supports sleep', foods: ['Leafy greens', 'Dark chocolate', 'Avocado', 'Nuts'] },
        { name: 'Zinc', reason: 'Supports immune system damaged by alcohol', foods: ['Oysters', 'Beef', 'Pumpkin seeds', 'Chickpeas'] },
        { name: 'Omega-3s', reason: 'Reduces inflammation and supports brain repair', foods: ['Salmon', 'Sardines', 'Walnuts', 'Flaxseeds'] }
      ],
      recommendedFoods: ['Leafy greens', 'Whole grains', 'Lean proteins', 'Fermented foods', 'Eggs', 'Nuts and seeds', 'Colorful vegetables'],
      avoidFoods: ['Sugar and sweets', 'Caffeine (excess)', 'Processed foods', 'Refined carbs', 'Energy drinks'],
      gutHealth: ['Probiotics (yogurt, kefir, sauerkraut)', 'L-glutamine rich foods', 'Bone broth', 'Prebiotic fiber'],
      hydration: 'Critical - aim for 10+ glasses daily to help liver recovery',
      mealTiming: 'Eat regular meals to stabilize blood sugar and reduce cravings',
      icon: '🍷'
    },
    opioids: {
      name: 'Opioids',
      deficiencies: ['Vitamin D', 'Fiber', 'Iron', 'Calcium', 'B vitamins'],
      keyNutrients: [
        { name: 'Fiber', reason: 'Combats constipation common with opioid use', foods: ['Beans', 'Oats', 'Berries', 'Broccoli'] },
        { name: 'Protein', reason: 'Supports neurotransmitter production', foods: ['Chicken', 'Fish', 'Eggs', 'Greek yogurt'] },
        { name: 'Vitamin D', reason: 'Often deficient, supports mood and bone health', foods: ['Fatty fish', 'Egg yolks', 'Fortified foods', 'Mushrooms'] },
        { name: 'Iron', reason: 'Supports energy and cognitive function', foods: ['Red meat', 'Spinach', 'Lentils', 'Quinoa'] }
      ],
      recommendedFoods: ['High-fiber foods', 'Lean proteins', 'Water-rich fruits', 'Whole grains', 'Legumes', 'Probiotic foods'],
      avoidFoods: ['Processed foods', 'Excessive sugar', 'Fried foods', 'Low-fiber refined foods'],
      gutHealth: ['High-fiber vegetables', 'Probiotic supplements', 'Prebiotic foods (garlic, onions)', 'Fermented foods'],
      hydration: 'Essential - dehydration worsens constipation, aim for 8-10 glasses',
      mealTiming: 'Small, frequent meals to support digestion and energy',
      icon: '💊'
    },
    stimulants: {
      name: 'Stimulants (Cocaine/Meth/Amphetamines)',
      deficiencies: ['Tyrosine', 'Omega-3 fatty acids', 'B vitamins', 'Vitamin C', 'Antioxidants'],
      keyNutrients: [
        { name: 'Tyrosine', reason: 'Precursor to dopamine, helps restore depleted levels', foods: ['Chicken', 'Turkey', 'Eggs', 'Cheese', 'Soybeans'] },
        { name: 'Omega-3s', reason: 'Supports brain cell repair and reduces inflammation', foods: ['Salmon', 'Mackerel', 'Chia seeds', 'Walnuts'] },
        { name: 'Complex Carbs', reason: 'Provides steady energy and supports serotonin', foods: ['Oats', 'Sweet potatoes', 'Brown rice', 'Quinoa'] },
        { name: 'Antioxidants', reason: 'Combat oxidative stress from stimulant use', foods: ['Berries', 'Dark leafy greens', 'Dark chocolate', 'Green tea'] }
      ],
      recommendedFoods: ['Protein-rich foods', 'Complex carbohydrates', 'Berries', 'Fatty fish', 'Eggs', 'Nuts', 'Dark chocolate'],
      avoidFoods: ['Caffeine', 'Energy drinks', 'Sugar', 'Processed foods', 'Alcohol'],
      gutHealth: ['Anti-inflammatory foods', 'Turmeric', 'Ginger', 'Fermented vegetables', 'Bone broth'],
      hydration: 'Very important - stimulants cause dehydration, aim for 10+ glasses',
      mealTiming: 'Regular meals crucial as stimulants suppress appetite',
      icon: '⚡'
    },
    cannabis: {
      name: 'Cannabis/Marijuana',
      deficiencies: ['Omega-3 fatty acids', 'Antioxidants', 'B vitamins', 'Zinc'],
      keyNutrients: [
        { name: 'Omega-3s', reason: 'Supports endocannabinoid system balance', foods: ['Fatty fish', 'Hemp seeds', 'Flaxseeds', 'Walnuts'] },
        { name: 'Antioxidants', reason: 'Supports lung and brain health', foods: ['Berries', 'Leafy greens', 'Green tea', 'Tomatoes'] },
        { name: 'Protein', reason: 'Supports neurotransmitter balance', foods: ['Lean meats', 'Legumes', 'Tofu', 'Greek yogurt'] },
        { name: 'Complex Carbs', reason: 'Stabilizes blood sugar, reduces munchies cravings', foods: ['Whole grains', 'Sweet potatoes', 'Beans', 'Vegetables'] }
      ],
      recommendedFoods: ['Fatty fish', 'Colorful vegetables', 'Whole grains', 'Lean proteins', 'Green tea', 'Nuts and seeds'],
      avoidFoods: ['Junk food', 'Sugary snacks', 'Processed foods', 'Excessive caffeine'],
      gutHealth: ['Omega-3 rich foods', 'Fiber-rich vegetables', 'Fermented foods', 'Prebiotic foods'],
      hydration: 'Important for clearing system, aim for 8 glasses',
      mealTiming: 'Regular healthy meals to prevent unhealthy snacking urges',
      icon: '🌿'
    },
    nicotine: {
      name: 'Nicotine/Tobacco',
      deficiencies: ['Vitamin C', 'Vitamin E', 'Beta-carotene', 'Folate', 'Calcium'],
      keyNutrients: [
        { name: 'Vitamin C', reason: 'Severely depleted by smoking, supports immune system', foods: ['Citrus fruits', 'Bell peppers', 'Strawberries', 'Broccoli'] },
        { name: 'Magnesium', reason: 'Reduces nicotine cravings and anxiety', foods: ['Dark chocolate', 'Avocados', 'Almonds', 'Spinach'] },
        { name: 'Omega-3s', reason: 'Reduces inflammation from smoking damage', foods: ['Salmon', 'Sardines', 'Flaxseeds', 'Chia seeds'] },
        { name: 'Antioxidants', reason: 'Combat free radical damage from smoking', foods: ['Berries', 'Tomatoes', 'Carrots', 'Green tea'] }
      ],
      recommendedFoods: ['Citrus fruits', 'Leafy greens', 'Carrots', 'Celery', 'Milk products', 'Nuts and seeds', 'Green tea'],
      avoidFoods: ['Coffee (enhances nicotine)', 'Alcohol', 'Sugary foods', 'Red meat', 'Spicy foods'],
      gutHealth: ['Alkaline foods (fruits, vegetables)', 'Probiotic foods', 'High-fiber foods'],
      hydration: 'Helps flush nicotine from system, aim for 8-10 glasses',
      mealTiming: 'Healthy snacks between meals can help manage oral fixation',
      icon: '🚬'
    },
    benzodiazepines: {
      name: 'Benzodiazepines',
      deficiencies: ['GABA support', 'Magnesium', 'B vitamins', 'Vitamin D', 'Zinc'],
      keyNutrients: [
        { name: 'GABA-supporting foods', reason: 'Natural GABA support for anxiety management', foods: ['Fermented foods', 'Green tea', 'Tomatoes', 'Potatoes'] },
        { name: 'Magnesium', reason: 'Natural relaxant, supports GABA function', foods: ['Pumpkin seeds', 'Dark chocolate', 'Spinach', 'Black beans'] },
        { name: 'B vitamins', reason: 'Support nervous system recovery', foods: ['Whole grains', 'Eggs', 'Legumes', 'Leafy greens'] },
        { name: 'L-Theanine', reason: 'Promotes calm without sedation', foods: ['Green tea', 'Black tea', 'Some mushrooms'] }
      ],
      recommendedFoods: ['Fermented foods', 'Whole grains', 'Legumes', 'Green tea', 'Leafy vegetables', 'Nuts', 'Seeds'],
      avoidFoods: ['Caffeine', 'Alcohol', 'Sugar', 'Processed foods', 'Artificial sweeteners'],
      gutHealth: ['GABA-producing probiotics', 'Fermented vegetables', 'Kefir', 'Prebiotic fiber'],
      hydration: 'Adequate hydration supports detox, aim for 8 glasses',
      mealTiming: 'Regular meals to maintain stable energy and mood',
      icon: '💤'
    },
    general: {
      name: 'General Recovery',
      deficiencies: ['Various - depends on substance'],
      keyNutrients: [
        { name: 'Protein', reason: 'Builds neurotransmitters and repairs tissue', foods: ['Lean meats', 'Fish', 'Eggs', 'Legumes'] },
        { name: 'Complex Carbs', reason: 'Steady energy and serotonin support', foods: ['Whole grains', 'Vegetables', 'Legumes'] },
        { name: 'Healthy Fats', reason: 'Brain health and inflammation reduction', foods: ['Olive oil', 'Avocados', 'Nuts', 'Fatty fish'] },
        { name: 'Vitamins & Minerals', reason: 'Overall recovery support', foods: ['Colorful fruits', 'Vegetables', 'Whole foods'] }
      ],
      recommendedFoods: ['Whole foods', 'Lean proteins', 'Fruits and vegetables', 'Whole grains', 'Healthy fats', 'Fermented foods'],
      avoidFoods: ['Processed foods', 'Excessive sugar', 'Excessive caffeine', 'Alcohol', 'Fast food'],
      gutHealth: ['Diverse fiber sources', 'Fermented foods', 'Prebiotic foods', 'Limit processed foods'],
      hydration: 'Essential for all recovery - minimum 8 glasses daily',
      mealTiming: 'Regular, balanced meals 3x daily with healthy snacks',
      icon: '🌱'
    }
  };

  // Recovery-focused meal database
  const recoveryMeals = {
    breakfast: [
      { id: 'b1', name: 'Overnight Oats with Berries', icon: '🥣', prepTime: '5 min', nutrients: ['Fiber', 'Antioxidants', 'Complex Carbs'], ingredients: ['Oats', 'Greek yogurt', 'Mixed berries', 'Honey', 'Chia seeds'], goodFor: ['alcohol', 'stimulants', 'cannabis', 'general'], calories: 350 },
      { id: 'b2', name: 'Spinach & Egg Scramble', icon: '🥚', prepTime: '10 min', nutrients: ['Protein', 'B vitamins', 'Iron'], ingredients: ['Eggs', 'Spinach', 'Tomatoes', 'Whole grain toast', 'Olive oil'], goodFor: ['alcohol', 'opioids', 'stimulants', 'general'], calories: 400 },
      { id: 'b3', name: 'Green Smoothie Bowl', icon: '🥗', prepTime: '5 min', nutrients: ['Vitamins', 'Fiber', 'Antioxidants'], ingredients: ['Spinach', 'Banana', 'Almond milk', 'Chia seeds', 'Granola'], goodFor: ['nicotine', 'cannabis', 'stimulants', 'general'], calories: 320 },
      { id: 'b4', name: 'Avocado Toast with Salmon', icon: '🥑', prepTime: '10 min', nutrients: ['Omega-3s', 'Healthy Fats', 'Protein'], ingredients: ['Whole grain bread', 'Avocado', 'Smoked salmon', 'Lemon', 'Seeds'], goodFor: ['alcohol', 'stimulants', 'benzodiazepines', 'general'], calories: 450 },
      { id: 'b5', name: 'Greek Yogurt Parfait', icon: '🍨', prepTime: '5 min', nutrients: ['Protein', 'Probiotics', 'Calcium'], ingredients: ['Greek yogurt', 'Granola', 'Mixed berries', 'Honey', 'Walnuts'], goodFor: ['alcohol', 'opioids', 'benzodiazepines', 'general'], calories: 380 },
      { id: 'b6', name: 'Whole Grain Pancakes', icon: '🥞', prepTime: '15 min', nutrients: ['Complex Carbs', 'Fiber', 'B vitamins'], ingredients: ['Whole wheat flour', 'Eggs', 'Banana', 'Almond milk', 'Blueberries'], goodFor: ['stimulants', 'cannabis', 'general'], calories: 420 }
    ],
    lunch: [
      { id: 'l1', name: 'Grilled Salmon Salad', icon: '🥗', prepTime: '20 min', nutrients: ['Omega-3s', 'Protein', 'Vitamins'], ingredients: ['Salmon', 'Mixed greens', 'Avocado', 'Cherry tomatoes', 'Olive oil dressing'], goodFor: ['alcohol', 'stimulants', 'cannabis', 'general'], calories: 480 },
      { id: 'l2', name: 'Turkey & Veggie Wrap', icon: '🌯', prepTime: '10 min', nutrients: ['Protein', 'Fiber', 'Tyrosine'], ingredients: ['Whole wheat wrap', 'Turkey breast', 'Hummus', 'Spinach', 'Bell peppers'], goodFor: ['stimulants', 'opioids', 'nicotine', 'general'], calories: 420 },
      { id: 'l3', name: 'Lentil Soup', icon: '🍲', prepTime: '30 min', nutrients: ['Protein', 'Fiber', 'Iron'], ingredients: ['Lentils', 'Carrots', 'Celery', 'Onion', 'Vegetable broth'], goodFor: ['alcohol', 'opioids', 'benzodiazepines', 'general'], calories: 350 },
      { id: 'l4', name: 'Quinoa Buddha Bowl', icon: '🥙', prepTime: '25 min', nutrients: ['Complete Protein', 'Fiber', 'Minerals'], ingredients: ['Quinoa', 'Roasted vegetables', 'Chickpeas', 'Tahini', 'Leafy greens'], goodFor: ['alcohol', 'stimulants', 'cannabis', 'general'], calories: 450 },
      { id: 'l5', name: 'Chicken Stir-Fry', icon: '🍳', prepTime: '20 min', nutrients: ['Protein', 'Vegetables', 'B vitamins'], ingredients: ['Chicken breast', 'Broccoli', 'Bell peppers', 'Brown rice', 'Ginger'], goodFor: ['opioids', 'stimulants', 'cannabis', 'general'], calories: 480 },
      { id: 'l6', name: 'Mediterranean Plate', icon: '🫒', prepTime: '15 min', nutrients: ['Healthy Fats', 'Protein', 'Fiber'], ingredients: ['Falafel', 'Hummus', 'Tabbouleh', 'Pita', 'Olives'], goodFor: ['alcohol', 'benzodiazepines', 'nicotine', 'general'], calories: 520 }
    ],
    dinner: [
      { id: 'd1', name: 'Baked Salmon with Vegetables', icon: '🐟', prepTime: '30 min', nutrients: ['Omega-3s', 'Protein', 'Vitamin D'], ingredients: ['Salmon fillet', 'Asparagus', 'Sweet potato', 'Lemon', 'Herbs'], goodFor: ['alcohol', 'stimulants', 'cannabis', 'general'], calories: 520 },
      { id: 'd2', name: 'Grilled Chicken with Quinoa', icon: '🍗', prepTime: '25 min', nutrients: ['Protein', 'Complex Carbs', 'Tyrosine'], ingredients: ['Chicken breast', 'Quinoa', 'Roasted broccoli', 'Garlic', 'Olive oil'], goodFor: ['stimulants', 'opioids', 'cannabis', 'general'], calories: 480 },
      { id: 'd3', name: 'Beef & Vegetable Stew', icon: '🥘', prepTime: '45 min', nutrients: ['Iron', 'Protein', 'Zinc'], ingredients: ['Lean beef', 'Potatoes', 'Carrots', 'Peas', 'Beef broth'], goodFor: ['alcohol', 'opioids', 'nicotine', 'general'], calories: 450 },
      { id: 'd4', name: 'Veggie Curry with Brown Rice', icon: '🍛', prepTime: '35 min', nutrients: ['Fiber', 'Antioxidants', 'Anti-inflammatory'], ingredients: ['Mixed vegetables', 'Coconut milk', 'Curry spices', 'Brown rice', 'Chickpeas'], goodFor: ['stimulants', 'benzodiazepines', 'cannabis', 'general'], calories: 480 },
      { id: 'd5', name: 'Turkey Meatballs with Zucchini Noodles', icon: '🍝', prepTime: '30 min', nutrients: ['Protein', 'Low Carb', 'Vegetables'], ingredients: ['Ground turkey', 'Zucchini', 'Marinara sauce', 'Parmesan', 'Herbs'], goodFor: ['stimulants', 'cannabis', 'opioids', 'general'], calories: 420 },
      { id: 'd6', name: 'Tofu & Vegetable Stir-Fry', icon: '🥡', prepTime: '25 min', nutrients: ['Plant Protein', 'Isoflavones', 'Vegetables'], ingredients: ['Firm tofu', 'Bok choy', 'Mushrooms', 'Brown rice', 'Sesame oil'], goodFor: ['benzodiazepines', 'cannabis', 'nicotine', 'general'], calories: 400 }
    ],
    snacks: [
      { id: 's1', name: 'Mixed Nuts & Seeds', icon: '🥜', prepTime: '0 min', nutrients: ['Healthy Fats', 'Protein', 'Magnesium'], ingredients: ['Almonds', 'Walnuts', 'Pumpkin seeds', 'Sunflower seeds'], goodFor: ['alcohol', 'nicotine', 'benzodiazepines', 'general'], calories: 180 },
      { id: 's2', name: 'Apple with Almond Butter', icon: '🍎', prepTime: '2 min', nutrients: ['Fiber', 'Healthy Fats', 'Natural Sugar'], ingredients: ['Apple', 'Almond butter'], goodFor: ['stimulants', 'cannabis', 'nicotine', 'general'], calories: 200 },
      { id: 's3', name: 'Greek Yogurt with Honey', icon: '🍯', prepTime: '2 min', nutrients: ['Protein', 'Probiotics', 'Calcium'], ingredients: ['Greek yogurt', 'Honey', 'Cinnamon'], goodFor: ['alcohol', 'opioids', 'benzodiazepines', 'general'], calories: 150 },
      { id: 's4', name: 'Hummus with Veggie Sticks', icon: '🥕', prepTime: '5 min', nutrients: ['Fiber', 'Protein', 'Vitamins'], ingredients: ['Hummus', 'Carrots', 'Celery', 'Bell peppers'], goodFor: ['nicotine', 'cannabis', 'opioids', 'general'], calories: 160 },
      { id: 's5', name: 'Dark Chocolate & Berries', icon: '🍫', prepTime: '2 min', nutrients: ['Antioxidants', 'Magnesium', 'Mood boost'], ingredients: ['Dark chocolate (70%+)', 'Mixed berries'], goodFor: ['alcohol', 'stimulants', 'cannabis', 'general'], calories: 180 },
      { id: 's6', name: 'Cottage Cheese with Fruit', icon: '🧀', prepTime: '3 min', nutrients: ['Protein', 'Calcium', 'Probiotics'], ingredients: ['Cottage cheese', 'Pineapple', 'Peaches'], goodFor: ['opioids', 'nicotine', 'benzodiazepines', 'general'], calories: 170 },
      { id: 's7', name: 'Green Tea & Rice Cakes', icon: '🍵', prepTime: '5 min', nutrients: ['L-Theanine', 'Complex Carbs', 'Calm'], ingredients: ['Green tea', 'Rice cakes', 'Avocado'], goodFor: ['benzodiazepines', 'nicotine', 'stimulants', 'general'], calories: 120 },
      { id: 's8', name: 'Trail Mix', icon: '🥗', prepTime: '0 min', nutrients: ['Energy', 'Healthy Fats', 'Protein'], ingredients: ['Dried fruits', 'Nuts', 'Seeds', 'Dark chocolate chips'], goodFor: ['stimulants', 'cannabis', 'opioids', 'general'], calories: 220 }
    ]
  };

  // Grocery categories for organization
  const groceryCategories = [
    { id: 'proteins', name: 'Proteins', icon: '🥩' },
    { id: 'vegetables', name: 'Vegetables', icon: '🥬' },
    { id: 'fruits', name: 'Fruits', icon: '🍎' },
    { id: 'grains', name: 'Grains & Carbs', icon: '🌾' },
    { id: 'dairy', name: 'Dairy & Alternatives', icon: '🥛' },
    { id: 'pantry', name: 'Pantry Essentials', icon: '🫙' },
    { id: 'other', name: 'Other', icon: '📦' }
  ];

  // Categorize ingredients for grocery list
  const categorizeIngredient = (ingredient) => {
    const lower = ingredient.toLowerCase();
    if (['salmon', 'chicken', 'turkey', 'beef', 'eggs', 'tofu', 'fish', 'pork', 'shrimp'].some(p => lower.includes(p))) return 'proteins';
    if (['spinach', 'broccoli', 'carrot', 'tomato', 'pepper', 'onion', 'garlic', 'celery', 'zucchini', 'asparagus', 'mushroom', 'lettuce', 'greens', 'vegetable', 'bok choy'].some(v => lower.includes(v))) return 'vegetables';
    if (['apple', 'banana', 'berry', 'orange', 'lemon', 'avocado', 'peach', 'pineapple', 'fruit'].some(f => lower.includes(f))) return 'fruits';
    if (['oat', 'rice', 'quinoa', 'bread', 'pasta', 'flour', 'grain', 'wrap', 'pita'].some(g => lower.includes(g))) return 'grains';
    if (['yogurt', 'milk', 'cheese', 'cream', 'kefir', 'butter'].some(d => lower.includes(d))) return 'dairy';
    if (['oil', 'honey', 'spice', 'sauce', 'broth', 'seed', 'nut', 'almond', 'walnut', 'chickpea', 'lentil', 'bean', 'hummus'].some(p => lower.includes(p))) return 'pantry';
    return 'other';
  };

  const navigate = useNavigate();

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('rehab_darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  // No need to check authentication - handled by PrivateRoute

  useEffect(() => {
    if (activeTab === 'profile') {
      const savedContext = loadUserData('userContext', null);
      if (savedContext) setUserContext(savedContext);
      else setUserContext(prev => ({...prev, user_id: getUserId()}));
      
      // Fetch guardian info
      const fetchGuardianInfo = async () => {
        try {
          const userId = user?.id;
          if (!userId) return;
          const response = await axios.get(`${API_BASE_URL}/api/guardian/info/${userId}`);
          if (response.data.success) {
            setGuardianInfo(response.data.data);
          }
        } catch (error) {
          console.log('Guardian info not found or not set up yet');
        }
      };
      fetchGuardianInfo();
    }
  }, [activeTab, user]);

  const updateUserContext = async () => {
    try {
      const userId = getUserId();
      const updatedContext = {...userContext, user_id: userId};
      saveUserData('userContext', updatedContext);
      setUserContext(updatedContext);
      const newStats = {...userStats, daysSober: updatedContext.days_in_recovery || 0};
      setUserStats(newStats);
      saveUserData('stats', newStats);
      
      // Update guardian phone number if it was changed
      if (guardianInfo.guardianPhone !== undefined && user?.id) {
        try {
          await axios.put(`${API_BASE_URL}/api/guardian/update`, {
            userId: user.id,
            guardianPhone: guardianInfo.guardianPhone
          });
        } catch (error) {
          console.error('Failed to update guardian phone:', error);
        }
      }
      
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const updateGuardianInfo = async () => {
    if (!user?.id) {
      toast.error('Please sign in to update guardian info');
      return;
    }

    // Validate email format
    if (guardianInfo.guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianInfo.guardianEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate phone format (should start with +)
    if (guardianInfo.guardianPhone && !guardianInfo.guardianPhone.startsWith('+')) {
      toast.error('Phone number must include country code (e.g., +91)');
      return;
    }

    // Validate doctor email if provided
    if (guardianInfo.doctorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianInfo.doctorEmail)) {
      toast.error('Please enter a valid doctor email address');
      return;
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/api/guardian/update`, {
        userId: user.id,
        guardianName: guardianInfo.guardianName,
        guardianEmail: guardianInfo.guardianEmail,
        guardianPhone: guardianInfo.guardianPhone,
        relationship: guardianInfo.relationship,
        doctorName: guardianInfo.doctorName || '',
        doctorEmail: guardianInfo.doctorEmail || '',
        doctorPhone: guardianInfo.doctorPhone || ''
      });

      if (response.data.success) {
        toast.success(response.data.doctorInviteSent 
          ? 'Guardian info updated! Doctor invitation sent.' 
          : 'Guardian information updated successfully!');
      } else {
        toast.error(response.data.message || 'Failed to update guardian info');
      }
    } catch (error) {
      console.error('Failed to update guardian info:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update guardian information');
      }
    }
  };

  const getUserId = () => {
    // Use Clerk user email or ID
    return user?.primaryEmailAddress?.emailAddress || user?.id || 'demo@rehab.com';
  };

  const getUserStorageKey = (dataType) => `rehab_${getUserId()}_${dataType}`;
  const saveUserData = (dataType, data) => localStorage.setItem(getUserStorageKey(dataType), JSON.stringify(data));
  const loadUserData = (dataType, defaultValue) => {
    const data = localStorage.getItem(getUserStorageKey(dataType));
    return data ? JSON.parse(data) : defaultValue;
  };

  const recordRecoveryActivity = (type) => {
    const today = new Date().toISOString().split('T')[0];
    if (type === 'sleep') {
      const sleepHistory = loadUserData('sleepHistory', []);
      if (!sleepHistory.some(s => s.date === today)) {
        sleepHistory.push({ date: today });
        saveUserData('sleepHistory', sleepHistory);
      }
    }
  };

  const getActivityData = () => {
    const activity = {};
    const cravingData = loadUserData('cravingData', []);
    cravingData.forEach(entry => {
      if (entry.timestamp) {
        const d = new Date(entry.timestamp).toISOString().split('T')[0];
        activity[d] = (activity[d] || 0) + 1;
      }
    });
    const chatHistory = loadUserData('chatHistory', []);
    chatHistory.forEach(msg => {
      if (msg.timestamp) {
        const d = new Date(msg.timestamp).toISOString().split('T')[0];
        activity[d] = (activity[d] || 0) + 1;
      }
    });
    const foodLog = loadUserData('foodLog', []);
    foodLog.forEach(log => {
      if (log.date) activity[log.date] = (activity[log.date] || 0) + 1;
    });
    const sleepHistory = loadUserData('sleepHistory', []);
    sleepHistory.forEach(s => { if (s.date) activity[s.date] = (activity[s.date] || 0) + 1; });
    return activity;
  };

  const checkIfNewUser = () => !loadUserData('cravingData', null) && !loadUserData('stats', null);

  const loadUserSpecificData = (isNew) => {
    if (isNew) {
      setHistoricalCravingData([]);
      setUserStats({ daysSober: 0, sleepQuality: 0, avgCravingLevel: 0, stressLevel: 0, chatSessions: 0, cravingEntries: 0, sleepChecks: 0 });
      setUserContext({ user_id: getUserId(), addiction_type: '', days_in_recovery: 0, current_stress_level: 0, preferred_support_style: 'balanced', crisis_contacts: [] });
      // Reset nutrition data for new users
      setMealPlan([]);
      setGroceryList([]);
      setFoodLog([]);
      setWaterIntake(0);
      setNutritionStreak(0);
    } else {
      setHistoricalCravingData(loadUserData('cravingData', []));
      setUserStats(loadUserData('stats', { daysSober: 0, sleepQuality: 0, avgCravingLevel: 0, stressLevel: 0, chatSessions: 0, cravingEntries: 0, sleepChecks: 0 }));
      const savedContext = loadUserData('userContext', null);
      if (savedContext) setUserContext(savedContext);
      else setUserContext(prev => ({...prev, user_id: getUserId()}));
      const savedSleepForm = loadUserData('sleepForm', null);
      if (savedSleepForm) setSleepForm(prev => ({ ...prev, ...savedSleepForm }));
      
      // Load nutrition data
      setMealPlan(loadUserData('mealPlan', []));
      setGroceryList(loadUserData('groceryList', []));
      setFoodLog(loadUserData('foodLog', []));
      setNutritionStreak(loadUserData('nutritionStreak', 0));
      setNutritionPreferences(loadUserData('nutritionPreferences', { dietaryRestrictions: [], allergies: [], mealsPerDay: 3 }));
      
      // Load today's water intake from food log
      const today = new Date().toISOString().split('T')[0];
      const savedFoodLog = loadUserData('foodLog', []);
      const todayLog = savedFoodLog.find(log => log.date === today);
      if (todayLog?.water) setWaterIntake(todayLog.water);
    }
  };

  // Set patient data from Clerk user
  useEffect(() => {
    if (userLoaded && user) {
      setPatientData({
        name: user.fullName || user.firstName || 'User',
        email: user.primaryEmailAddress?.emailAddress || '',
        imageUrl: user.imageUrl
      });
      const isNew = checkIfNewUser();
      setIsNewUser(isNew);
      loadUserSpecificData(isNew);

      // Fetch upcoming appointments
      const fetchAppointments = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/doctor/meetings/patient/${user.id}`);
          if (res.data.success) {
            const upcoming = (res.data.data || []).filter(m => 
              ['scheduled', 'confirmed'].includes(m.status) && new Date(m.scheduledDate) >= new Date(new Date().setHours(0,0,0,0))
            );
            setUpcomingAppointments(upcoming);
          }
        } catch (err) {
          console.log('No appointments found or endpoint unavailable');
        }
      };
      fetchAppointments();
    }
  }, [userLoaded, user]);

  const analyzeEmotionLocally = (text) => {
    const textLower = text.toLowerCase();
    let primaryEmotion = 'neutral', emotionalIntensity = 0.5;
    const triggers = [], supportNeeds = [];
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'hopeless', 'worthless', 'give up'];
    const isCrisis = crisisKeywords.some(keyword => textLower.includes(keyword));
    
    if (isCrisis) { primaryEmotion = 'crisis'; emotionalIntensity = 1.0; supportNeeds.push('crisis_support', 'professional_help'); }
    else if (['angry', 'mad', 'furious', 'frustrated'].some(w => textLower.includes(w))) { primaryEmotion = 'anger'; emotionalIntensity = 0.8; }
    else if (['anxious', 'worried', 'nervous', 'scared'].some(w => textLower.includes(w))) { primaryEmotion = 'anxiety'; emotionalIntensity = 0.7; }
    else if (['sad', 'depressed', 'down', 'lonely'].some(w => textLower.includes(w))) { primaryEmotion = 'sadness'; emotionalIntensity = 0.7; }
    else if (['crave', 'craving', 'urge', 'tempted'].some(w => textLower.includes(w))) { primaryEmotion = 'craving'; emotionalIntensity = 0.9; }
    else if (['happy', 'good', 'great', 'hopeful', 'proud'].some(w => textLower.includes(w))) { primaryEmotion = 'positive'; emotionalIntensity = 0.6; }
    else if (['stressed', 'overwhelmed'].some(w => textLower.includes(w))) { primaryEmotion = 'stressed'; emotionalIntensity = 0.7; }
    
    return { primary_emotion: primaryEmotion, emotional_intensity: emotionalIntensity, triggers_detected: triggers, support_needs: supportNeeds.length > 0 ? supportNeeds : ['general_support'], crisis_level: isCrisis ? 'high' : 'none' };
  };

  const generateLocalResponse = (message, emotionAnalysis) => {
    const emotion = emotionAnalysis.primary_emotion;
    let response = '', suggestedActions = [];
    
    if (emotionAnalysis.crisis_level === 'high') {
      response = "I'm really concerned about what you're sharing. Please consider reaching out to a crisis helpline (988) or a trusted person right now.";
      suggestedActions = ["Call National Suicide Prevention Lifeline: 988", "Text HOME to 741741", "Reach out to someone you trust"];
    } else if (emotion === 'craving') {
      response = "I hear that you're experiencing cravings. Remember, cravings are temporary - they usually pass within 15-30 minutes.";
      suggestedActions = ["Practice deep breathing", "Call your support person", "Change your environment"];
    } else if (emotion === 'anxiety') {
      response = "I can sense you're feeling anxious. Let's work on grounding yourself in the present moment.";
      suggestedActions = ["Practice box breathing (4-4-4-4)", "Focus on the present", "Take a short walk"];
    } else if (emotion === 'positive') {
      response = "It's wonderful to hear you're feeling positive! These moments are important milestones in your recovery.";
      suggestedActions = ["Journal about this moment", "Share your progress", "Plan a healthy reward"];
    } else {
      response = "Thank you for sharing. I'm here to support you through whatever you're experiencing.";
      suggestedActions = ["Take some deep breaths", "Connect with someone", "Practice self-care"];
    }
    return { response, suggested_actions: suggestedActions, response_tone: emotion === 'positive' ? 'encouraging' : 'supportive' };
  };

  const sendChatMessage = async () => {
    if (!userMessage.trim()) return;
    setLoading(true);
    try {
      const userId = getUserId();
      const userMessageObj = { message_id: `msg_${Date.now()}`, user_id: userId, content: userMessage, timestamp: new Date().toISOString(), is_user: true };
      setChatMessages(prev => [...prev, userMessageObj]);
      
      let botResponse;
      try {
        const response = await axios.post(`${ML_API_URL}/emotion_aware_chatbot_service/chat`, { user_id: userId, message: userMessage, context: userContext }, { timeout: 60000 });
        botResponse = { content: response.data.response, emotion_analysis: response.data.emotion_analysis, suggested_actions: response.data.suggested_actions, response_tone: response.data.response_tone };
      } catch {
        const emotionAnalysis = analyzeEmotionLocally(userMessage);
        const localResponse = generateLocalResponse(userMessage, emotionAnalysis);
        botResponse = { content: localResponse.response, emotion_analysis: emotionAnalysis, suggested_actions: localResponse.suggested_actions, response_tone: localResponse.response_tone };
      }
      
      const botMessage = { message_id: `msg_${Date.now()}_bot`, user_id: userId, content: botResponse.content, timestamp: new Date().toISOString(), is_user: false, emotion_analysis: botResponse.emotion_analysis, suggested_actions: botResponse.suggested_actions, response_tone: botResponse.response_tone };
      setChatMessages(prev => [...prev, botMessage]);
      setUserMessage('');
      saveUserData('chatHistory', [...chatMessages, userMessageObj, botMessage].slice(-50));
      const newStats = { ...userStats, chatSessions: userStats.chatSessions + 1 };
      setUserStats(newStats);
      saveUserData('stats', newStats);
      setIsNewUser(false);
    } catch (err) { toast.error('Failed to send message'); }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'chatbot') {
      const savedChatHistory = loadUserData('chatHistory', []);
      if (savedChatHistory.length > 0) setChatMessages(savedChatHistory);
    }
  }, [activeTab]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatMessages]);

  const generateCravingForecast = () => {
    setLoading(true);
    try {
      if (historicalCravingData.length < 3) { toast.warning('Please add at least 3 craving entries'); setLoading(false); return; }
      const avgIntensity = historicalCravingData.reduce((sum, e) => sum + e.craving_intensity, 0) / historicalCravingData.length;
      const forecasts = [];
      const currentHour = new Date().getHours();
      
      for (let i = 0; i < 24; i++) {
        const hour = (currentHour + i) % 24;
        let predictedIntensity = avgIntensity;
        if (hour >= 18 && hour <= 21) predictedIntensity += 1.5;
        else if (hour >= 22 || hour <= 2) predictedIntensity += 0.8;
        if (currentTriggers.stress_level > 7) predictedIntensity += 1.5;
        if (currentTriggers.location_risk) predictedIntensity += 2.0;
        predictedIntensity = Math.min(10, Math.max(0, predictedIntensity + (Math.random() * 0.5 - 0.25)));
        forecasts.push({ hour_offset: i, predicted_intensity: Math.round(predictedIntensity * 10) / 10, confidence_lower: Math.max(0, predictedIntensity - 1.5), confidence_upper: Math.min(10, predictedIntensity + 1.5), risk_level: predictedIntensity >= 7 ? 'high' : predictedIntensity >= 5 ? 'moderate' : 'low' });
      }
      
      const highRiskHours = forecasts.filter(f => f.risk_level === 'high').map(f => (currentHour + f.hour_offset) % 24);
      setCravingForecast({ forecasts, peak_risk_hours: highRiskHours, overall_risk_score: avgIntensity, intervention_recommendations: ["Practice stress-reduction techniques", "Keep emergency contacts available", "Plan activities during high-risk hours"], model_confidence: 0.75 + (historicalCravingData.length > 10 ? 0.15 : historicalCravingData.length * 0.015) });
      toast.success('Forecast generated!');
    } catch { toast.error('Failed to generate forecast'); }
    setLoading(false);
  };

  const submitSleepAssessment = () => {
    setLoading(true);
    try {
      const bedtimeParts = sleepForm.typical_bedtime.split(':').map(Number);
      const waketimeParts = sleepForm.typical_wake_time.split(':').map(Number);
      let bedtimeMinutes = bedtimeParts[0] * 60 + bedtimeParts[1];
      let waketimeMinutes = waketimeParts[0] * 60 + waketimeParts[1];
      if (waketimeMinutes < bedtimeMinutes) waketimeMinutes += 24 * 60;
      const timeInBed = (waketimeMinutes - bedtimeMinutes) / 60;
      const sleepEfficiency = Math.round((sleepForm.hours_of_actual_sleep / timeInBed) * 100);
      let sleepLatency = sleepForm.time_to_fall_asleep === '<15min' ? 10 : sleepForm.time_to_fall_asleep === '15-30min' ? 22 : sleepForm.time_to_fall_asleep === '30-60min' ? 45 : 75;
      
      let category = 'Good';
      const issues = [];
      if (sleepEfficiency < 85) { category = 'Fair'; issues.push('Low sleep efficiency'); }
      if (sleepForm.hours_of_actual_sleep < 6) { category = 'Poor'; issues.push('Insufficient sleep'); }
      if (sleepLatency > 30) issues.push('Difficulty falling asleep');
      
      let guidance = issues.length === 0 ? 'Great sleep patterns! Keep it up.' : `Areas to improve: ${issues.join(', ')}. Try relaxation techniques before bed.`;
      
      setSleepData({ sleep_metrics: { total_sleep_time: sleepForm.hours_of_actual_sleep, sleep_efficiency: sleepEfficiency, sleep_latency_minutes: sleepLatency, time_in_bed: timeInBed }, quality_assessment: { category, issues, score: sleepForm.sleep_quality_rating }, gemini_guidance: guidance });
      
      const newStats = { ...userStats, sleepQuality: ((userStats.sleepQuality * userStats.sleepChecks) + sleepForm.sleep_quality_rating) / (userStats.sleepChecks + 1), sleepChecks: userStats.sleepChecks + 1 };
      setUserStats(newStats);
      saveUserData('stats', newStats);
      recordRecoveryActivity('sleep');
      setIsNewUser(false);
      toast.success('Sleep assessment completed!');
    } catch { toast.error('Failed to submit assessment'); }
    setLoading(false);
  };

  const addCravingEntry = async () => {
    try {
      const newEntry = { ...cravingEntry, timestamp: new Date().toISOString(), entry_id: `entry_${Date.now()}` };
      const updatedCravingData = [newEntry, ...historicalCravingData];
      setHistoricalCravingData(updatedCravingData);
      saveUserData('cravingData', updatedCravingData);
      const newStats = { ...userStats, cravingEntries: userStats.cravingEntries + 1, avgCravingLevel: updatedCravingData.reduce((sum, e) => sum + e.craving_intensity, 0) / updatedCravingData.length, stressLevel: updatedCravingData.reduce((sum, e) => sum + e.stress_level, 0) / updatedCravingData.length };
      setUserStats(newStats);
      saveUserData('stats', newStats);
      setIsNewUser(false);
      
      // Check if this entry triggers a high-risk alert (intensity >= 8 AND stress >= 8)
      if (cravingEntry.craving_intensity >= 8 && cravingEntry.stress_level >= 8) {
        // Calculate immediate risk score
        const riskScore = Math.round((cravingEntry.craving_intensity * 0.35 + cravingEntry.stress_level * 0.30 + (10 - cravingEntry.sleep_quality) * 0.20 + 5 * 0.15) * 10);
        
        if (riskScore >= 60) {
          console.log('[Craving] High risk detected! Triggering alert. Score:', riskScore);
          const riskData = {
            score: riskScore,
            level: 'high',
            factors: [
              `Craving intensity: ${cravingEntry.craving_intensity}/10`,
              `Stress level: ${cravingEntry.stress_level}/10`,
              cravingEntry.location_risk ? 'Risky location' : null,
              cravingEntry.social_trigger ? 'Social trigger present' : null
            ].filter(Boolean)
          };
          sendHighRiskAlert(riskData);
        }
      }
      
      setCravingEntry({ timestamp: new Date().toISOString(), craving_intensity: 5, stress_level: 5, mood_score: 6, sleep_quality: 3, location_risk: false, social_trigger: false, work_stress: false });
      toast.success('Entry added!');
    } catch { toast.error('Failed to add entry'); }
  };

  const handleSleepFormChange = (field, value) => setSleepForm(prev => ({ ...prev, [field]: value }));

  // Medication Functions
  const fetchMedicationData = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/medications/${user.id}`);
      if (response.data.success && response.data.data) {
        setMedicationData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching medication data:', error);
    }
  };

  const fetchRecommendedMedications = async () => {
    if (!userContext?.addiction_type) return;
    try {
      const addictionType = userContext.addiction_type.charAt(0).toUpperCase() + userContext.addiction_type.slice(1);
      const response = await axios.get(`${API_BASE_URL}/api/medications/guidelines/${addictionType}`);
      if (response.data.success) {
        setRecommendedMedications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching recommended medications:', error);
    }
  };

  const setupMedicationReminders = async () => {
    if (!user) return;
    try {
      const response = await axios.post(`${API_BASE_URL}/api/medications/setup`, {
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress || '',
        userName: patientData?.name || user.firstName || 'User',
        addictionType: userContext?.addiction_type || '',
        ageGroup: '18-40',
        scheduleDuration: medicationSchedule.duration,
        notificationPreferences: {
          smsEnabled: medicationSchedule.smsEnabled,
          emailEnabled: medicationSchedule.emailEnabled,
          pushEnabled: true
        }
      });
      if (response.data.success) {
        setMedicationData(response.data.data);
        toast.success('Medication reminders set up successfully!');
      }
    } catch (error) {
      toast.error('Failed to set up medication reminders');
    }
  };

  const addMedication = async (medication) => {
    if (!user || !medicationData) {
      await setupMedicationReminders();
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/api/medications/add`, {
        userId: user.id,
        ...medication
      });
      if (response.data.success) {
        setMedicationData(response.data.data);
        setShowAddMedication(false);
        setNewMedication({
          medicineName: '',
          dosageMg: '',
          dosageUnit: 'mg',
          frequencyPerDay: 1,
          reminderTimes: [],
          instructions: '',
          isRecommended: false
        });
        toast.success(`${medication.medicineName} added to your medication list!`);
      }
    } catch (error) {
      toast.error('Failed to add medication');
    }
  };

  const removeMedication = async (medicationId) => {
    if (!user) return;
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/medications/remove/${medicationId}?userId=${user.id}`);
      if (response.data.success) {
        setMedicationData(response.data.data);
        toast.success('Medication removed');
      }
    } catch (error) {
      toast.error('Failed to remove medication');
    }
  };

  const toggleMedication = async (medicationId) => {
    if (!user) return;
    try {
      const response = await axios.post(`${API_BASE_URL}/api/medications/toggle/${medicationId}`, {
        userId: user.id
      });
      if (response.data.success) {
        setMedicationData(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to toggle medication');
    }
  };

  const updateMedicationSchedule = async () => {
    if (!user) return;
    try {
      const response = await axios.put(`${API_BASE_URL}/api/medications/schedule`, {
        userId: user.id,
        scheduleDuration: medicationSchedule.duration,
        notificationPreferences: {
          smsEnabled: medicationSchedule.smsEnabled,
          emailEnabled: medicationSchedule.emailEnabled
        }
      });
      if (response.data.success) {
        toast.success('Schedule updated!');
      }
    } catch (error) {
      toast.error('Failed to update schedule');
    }
  };

  const sendTestReminder = async () => {
    if (!user) return;
    try {
      const response = await axios.post(`${API_BASE_URL}/api/medications/send-reminder`, {
        userId: user.id
      });
      if (response.data.success) {
        toast.success(`Reminder sent! Email: ${response.data.details.emailSent ? 'Yes' : 'No'}, SMS: ${response.data.details.smsSent ? 'Yes' : 'No'}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reminder');
    }
  };

  const generateReminderTimes = (frequency) => {
    const defaultTimes = {
      1: [{ time: '09:00', label: 'morning' }],
      2: [{ time: '09:00', label: 'morning' }, { time: '21:00', label: 'night' }],
      3: [{ time: '08:00', label: 'morning' }, { time: '14:00', label: 'afternoon' }, { time: '20:00', label: 'evening' }],
      4: [{ time: '08:00', label: 'morning' }, { time: '12:00', label: 'afternoon' }, { time: '18:00', label: 'evening' }, { time: '22:00', label: 'night' }],
    };
    return defaultTimes[frequency] || defaultTimes[1];
  };

  // Fetch medications when tab is active
  useEffect(() => {
    if (activeTab === 'medications' && user) {
      fetchMedicationData();
      fetchRecommendedMedications();
    }
  }, [activeTab, user]);

  // Hospitals Functions
  const fetchHospitals = async (city) => {
    setHospitalsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/guardian/rehab-centers?city=${city}`);
      if (response.data.success) {
        setHospitals(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setHospitals([]);
    } finally {
      setHospitalsLoading(false);
    }
  };

  const openInMaps = (hospital) => {
    const query = `${hospital.name || ''}, ${hospital.address || ''}`.trim();
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(mapsUrl, '_blank');
  };

  // Fetch hospitals when tab is active or city changes
  useEffect(() => {
    if (activeTab === 'hospitals') {
      fetchHospitals(selectedCity);
    }
  }, [activeTab, selectedCity]);
  const handleCravingEntryChange = (field, value) => setCravingEntry(prev => ({ ...prev, [field]: value }));

  const getCravingChartData = () => {
    const last7Days = historicalCravingData.slice(0, 7).reverse();
    return {
      labels: last7Days.map(entry => new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        { label: 'Craving', data: last7Days.map(entry => entry.craving_intensity), borderColor: darkMode ? '#fafafa' : '#18181b', backgroundColor: darkMode ? 'rgba(250, 250, 250, 0.1)' : 'rgba(24, 24, 27, 0.1)', tension: 0.4, fill: true, borderWidth: 2 },
        { label: 'Stress', data: last7Days.map(entry => entry.stress_level), borderColor: darkMode ? '#a1a1aa' : '#71717a', backgroundColor: darkMode ? 'rgba(161, 161, 170, 0.1)' : 'rgba(113, 113, 122, 0.1)', tension: 0.4, fill: true, borderWidth: 2 }
      ]
    };
  };

  const getForecastChartData = () => {
    if (!cravingForecast) return null;
    return {
      labels: cravingForecast.forecasts.slice(0, 12).map(f => `${(new Date().getHours() + f.hour_offset) % 24}:00`),
      datasets: [{ label: 'Predicted', data: cravingForecast.forecasts.slice(0, 12).map(f => f.predicted_intensity), borderColor: darkMode ? '#fafafa' : '#18181b', backgroundColor: darkMode ? 'rgba(250, 250, 250, 0.1)' : 'rgba(24, 24, 27, 0.1)', fill: true, tension: 0.4, borderWidth: 2 }]
    };
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 20, font: { size: 12 }, color: darkMode ? '#a1a1aa' : '#71717a' } } },
    scales: { y: { min: 0, max: 10, grid: { color: darkMode ? '#27272a' : '#f4f4f5' }, ticks: { font: { size: 11 }, color: darkMode ? '#a1a1aa' : '#71717a' } }, x: { grid: { display: false }, ticks: { font: { size: 11 }, color: darkMode ? '#a1a1aa' : '#71717a' } } }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  };

  // Calculate Relapse Risk Score (0-100)
  const calculateRelapseRisk = () => {
    if (historicalCravingData.length === 0) return null;
    
    // Get latest entry or average of recent entries
    const recentEntries = historicalCravingData.slice(0, 5);
    const avgCraving = recentEntries.reduce((sum, e) => sum + e.craving_intensity, 0) / recentEntries.length;
    const avgStress = recentEntries.reduce((sum, e) => sum + e.stress_level, 0) / recentEntries.length;
    const avgSleepQuality = recentEntries.reduce((sum, e) => sum + (e.sleep_quality || 5), 0) / recentEntries.length;
    
    // Calculate poor sleep factor (invert sleep quality: 10 - quality)
    const poorSleep = 10 - avgSleepQuality;
    
    // Check if current time matches past relapse patterns (evening hours 6-10 PM are higher risk)
    const currentHour = new Date().getHours();
    const isRiskTime = (currentHour >= 18 && currentHour <= 22) || (currentHour >= 0 && currentHour <= 2);
    const timeMatchFactor = isRiskTime ? 8 : 3;
    
    // Formula: Craving×0.35 + Stress×0.30 + Poor Sleep×0.20 + Time Match×0.15
    const riskScore = Math.round(
      (avgCraving * 0.35 + avgStress * 0.30 + poorSleep * 0.20 + timeMatchFactor * 0.15) * 10
    );
    
    // Identify contributing factors
    const factors = [];
    if (avgCraving >= 6) factors.push('High craving levels');
    if (avgStress >= 6) factors.push('Elevated stress');
    if (poorSleep >= 5) factors.push('Poor sleep quality');
    if (isRiskTime) factors.push('Past relapse time window');
    if (recentEntries.some(e => e.work_stress)) factors.push('Work-related stress');
    if (recentEntries.some(e => e.social_trigger)) factors.push('Social triggers present');
    if (recentEntries.some(e => e.location_risk)) factors.push('Risky location exposure');
    
    return {
      score: Math.min(100, Math.max(0, riskScore)),
      level: riskScore >= 60 ? 'high' : riskScore >= 40 ? 'moderate' : 'low',
      factors: factors.length > 0 ? factors : ['No significant risk factors detected'],
      avgCraving,
      avgStress,
      poorSleep,
      timeMatchFactor
    };
  };

  // Auto-alert guardian when risk is high (NO COOLDOWN - sends every time)
  const sendHighRiskAlert = async (riskData) => {
    if (!user) return;

    try {
      console.log('[Alert] Sending high risk alert - Score:', riskData.score);
      const response = await axios.post(`${API_BASE_URL}/api/guardian/alert/risk`, {
        userId: user.id,
        riskScore: riskData.score,
        factors: riskData.factors,
        recommendations: getExerciseRecommendations(riskData.level).slice(0, 3).map(e => e.title)
      });

      if (response.data.success && response.data.sent) {
        // Notify user
        toast.info('Your guardian has been notified via email and SMS about your elevated risk level.', {
          autoClose: 5000,
          icon: '🔔'
        });
      } else if (response.data.message) {
        console.log('[Alert] Response:', response.data.message);
      }
    } catch (error) {
      console.error('Failed to send high risk alert:', error);
    }
  };

  // Update metrics when data changes (NO automatic alerts - alerts only on user action)
  useEffect(() => {
    if (historicalCravingData.length === 0 || !user) return;
    
    const riskData = calculateRelapseRisk();
    if (riskData) {
      // Update current metrics for SOS button display only
      const recentEntries = historicalCravingData.slice(0, 5);
      setCurrentMetrics({
        riskScore: riskData.score,
        stressLevel: Math.round(recentEntries.reduce((sum, e) => sum + e.stress_level, 0) / recentEntries.length),
        cravingLevel: Math.round(recentEntries.reduce((sum, e) => sum + e.craving_intensity, 0) / recentEntries.length)
      });
      // NOTE: Alerts are NOT triggered here on page refresh/data load
      // Alerts are ONLY sent when user explicitly adds a new entry via addCravingEntry()
    }
  }, [historicalCravingData, user]);

  // Exercise recommendations based on risk level
  const getExerciseRecommendations = (riskLevel) => {
    const exercises = [
      { 
        id: 'breathing', 
        title: 'Try a 3-minute breathing exercise', 
        icon: '🌬️',
        message: 'Can you guide me through a 3-minute deep breathing exercise to help manage my cravings right now?',
        forRisk: ['high', 'moderate', 'low']
      },
      { 
        id: 'grounding', 
        title: '5-4-3-2-1 Grounding technique', 
        icon: '🧘',
        message: 'Please guide me through the 5-4-3-2-1 grounding technique step by step to help me stay present.',
        forRisk: ['high', 'moderate']
      },
      { 
        id: 'muscle', 
        title: 'Progressive muscle relaxation', 
        icon: '💪',
        message: 'Can you walk me through a progressive muscle relaxation exercise to release tension and reduce stress?',
        forRisk: ['high', 'moderate']
      },
      { 
        id: 'urge', 
        title: 'Urge surfing meditation', 
        icon: '🌊',
        message: 'Guide me through urge surfing meditation. I want to observe my craving without acting on it.',
        forRisk: ['high']
      },
      { 
        id: 'mindful', 
        title: 'Quick mindfulness check-in', 
        icon: '🎯',
        message: 'Help me do a quick 2-minute mindfulness check-in to become aware of my thoughts and feelings right now.',
        forRisk: ['moderate', 'low']
      },
      { 
        id: 'positive', 
        title: 'Positive affirmations', 
        icon: '✨',
        message: 'Share some powerful positive affirmations for recovery that I can repeat to strengthen my resolve.',
        forRisk: ['low', 'moderate']
      },
      { 
        id: 'distraction', 
        title: 'Healthy distraction activity', 
        icon: '🎮',
        message: 'Suggest some healthy distraction activities I can do right now to redirect my focus away from cravings.',
        forRisk: ['high', 'moderate']
      },
      { 
        id: 'journal', 
        title: 'Guided journaling prompts', 
        icon: '📝',
        message: 'Give me some guided journaling prompts to help me process my emotions and understand my triggers better.',
        forRisk: ['low', 'moderate']
      }
    ];
    
    return exercises.filter(ex => ex.forRisk.includes(riskLevel));
  };

  // Handle exercise click - redirect to chatbot with message
  const handleExerciseClick = (exercise) => {
    setActiveTab('chatbot');
    setUserMessage(exercise.message);
    // Auto-send the message after a short delay
    setTimeout(() => {
      const sendBtn = document.getElementById('chat-send-btn');
      if (sendBtn) sendBtn.click();
    }, 300);
  };

  // Handle quick suggestion click in chatbot
  const handleSuggestionClick = (suggestion) => {
    setUserMessage(suggestion);
    setTimeout(() => {
      const sendBtn = document.getElementById('chat-send-btn');
      if (sendBtn) sendBtn.click();
    }, 100);
  };

  // Get contextual greeting for guardian based on time and patient data
  const getContextualGreeting = () => {
    const hour = new Date().getHours();
    const isRiskTime = (hour >= 18 && hour <= 22) || (hour >= 0 && hour <= 2);
    const risk = calculateRelapseRisk();
    
    if (isRiskTime && historicalCravingData.length > 0) {
      return "Evening hours can be challenging for recovery patients. How is your patient doing right now?";
    } else if (risk && risk.level === 'high') {
      return "Your patient's risk indicators are elevated. I can help you support them through this.";
    } else if (hour < 12) {
      return "Good morning! How is your patient doing today? I'm here to help with any questions.";
    } else if (hour < 18) {
      return "Good afternoon! Need guidance on supporting your patient's recovery?";
    } else {
      return "Good evening! How can I help you support your patient tonight?";
    }
  };

  // Get contextual quick suggestions for guardian
  const getQuickSuggestions = () => {
    const hour = new Date().getHours();
    const risk = calculateRelapseRisk();
    const isRiskTime = (hour >= 18 && hour <= 22) || (hour >= 0 && hour <= 2);
    
    // Guardian-focused suggestions
    const responseSuggestions = [
      { text: "How can I support my patient today?", icon: "💙" },
      { text: "My patient seems stressed", icon: "😰" },
      { text: "My patient is having cravings", icon: "🔥" },
      { text: "Patient can't sleep", icon: "😴" },
      { text: "How to handle relapse signs?", icon: "⚠️" },
      { text: "Tips for caregiver self-care", icon: "💪" }
    ];
    
    // Guide suggestions for guardians
    const guideSuggestions = [
      { text: "How to talk to patient about cravings", icon: "💬" },
      { text: "Signs of relapse to watch for", icon: "👁️" },
      { text: "How to create a supportive environment", icon: "🏠" },
      { text: "Helping patient with sleep issues", icon: "🌙" },
      { text: "Managing patient's stress and anxiety", icon: "🧘" },
      { text: "When to seek professional help", icon: "🏥" },
      { text: "How to handle patient's mood swings", icon: "🎭" },
      { text: "Setting healthy boundaries", icon: "🛡️" }
    ];

    // Nutrition suggestions for patient care
    const nutritionSuggestions = [
      { text: "What foods help with recovery?", icon: "🥗" },
      { text: "Meal ideas for recovering patient", icon: "🍽️" },
      { text: "How does nutrition affect cravings?", icon: "🧠" },
      { text: "Foods to avoid during recovery", icon: "🚫" },
      { text: "Supplements for addiction recovery", icon: "💊" },
      { text: "Hydration tips for patient", icon: "💧" }
    ];
    
    // Contextual suggestions based on patient's risk level
    let contextual = [];
    if (risk && risk.level === 'high') {
      contextual = [
        { text: "My patient is in crisis - what to do?", icon: "🆘" },
        { text: "How to de-escalate a craving episode", icon: "🌊" },
        { text: "Should I contact professional help?", icon: "📞" }
      ];
    } else if (isRiskTime) {
      contextual = [
        { text: "How to help patient through the evening", icon: "🌙" },
        { text: "Night-time support strategies", icon: "😌" }
      ];
    } else if (hour < 12) {
      contextual = [
        { text: "Morning routine for patient", icon: "☀️" },
        { text: "How to start the day positively", icon: "📅" },
        { text: "Healthy breakfast ideas for patient", icon: "🍳" }
      ];
    } else if (hour >= 12 && hour < 14) {
      contextual = [
        { text: "Healthy lunch for patient", icon: "🥗" },
        { text: "Midday check-in tips", icon: "✅" }
      ];
    } else if (hour >= 17 && hour < 20) {
      contextual = [
        { text: "Dinner ideas for patient", icon: "🍲" },
        { text: "Evening routine to prevent cravings", icon: "🏡" }
      ];
    }
    
    return { responseSuggestions, guideSuggestions, nutritionSuggestions, contextual };
  };

  const navItems = [
    { id: 'dashboard', label: t('sidebar.overview'), icon: FaChartLine },
    { id: 'chatbot', label: t('sidebar.aiAssistant'), icon: FaComments },
    { id: 'sleep', label: t('sidebar.patientSleep'), icon: FaMoon },
    { id: 'cravings', label: t('sidebar.patientCravings'), icon: FaHeartbeat },
    { id: 'medications', label: t('sidebar.medications'), icon: FaPills },
    { id: 'nutrition', label: t('sidebar.nutritionPlan'), icon: FaLeaf },
    { id: 'hospitals', label: t('sidebar.hospitals'), icon: FaHospital },
    { id: 'meetings', label: t('sidebar.supportGroups'), icon: FaUsers },
    { id: 'profile', label: t('sidebar.settings'), icon: FaUser }
  ];

  // Theme classes
  const theme = {
    bg: darkMode ? 'bg-zinc-950' : 'bg-white',
    bgSecondary: darkMode ? 'bg-zinc-900' : 'bg-white',
    bgTertiary: darkMode ? 'bg-zinc-800' : 'bg-zinc-50',
    bgHover: darkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50',
    bgActive: darkMode ? 'bg-zinc-800' : 'bg-zinc-100',
    border: darkMode ? 'border-zinc-800' : 'border-zinc-200',
    text: darkMode ? 'text-zinc-100' : 'text-zinc-900',
    textSecondary: darkMode ? 'text-zinc-400' : 'text-zinc-500',
    textMuted: darkMode ? 'text-zinc-500' : 'text-zinc-400',
    card: darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200',
    input: darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400',
    button: darkMode ? 'bg-zinc-100 text-zinc-900 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800',
    buttonSecondary: darkMode ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200',
  };

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-200`}>
      {/* Top Header Bar - Always visible */}
      <header className={`fixed top-0 left-0 right-0 z-50 h-14 ${theme.bgSecondary} border-b ${theme.border} px-4 flex items-center justify-between transition-colors duration-200`}>
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className={`p-2 ${theme.bgHover} rounded-md transition-colors`}>
            {sidebarOpen ? <FaTimes className={theme.textSecondary} /> : <FaBars className={theme.textSecondary} />}
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 ${darkMode ? 'bg-zinc-100' : 'bg-zinc-900'} rounded-lg flex items-center justify-center`}>
              <FaBrain className={darkMode ? 'text-zinc-900' : 'text-white'} />
            </div>
            <span className={`font-semibold ${theme.text} hidden sm:block`}>{t('sidebar.guardianDashboard')}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button 
            onClick={toggleDarkMode} 
            className={`p-2 ${theme.bgHover} rounded-md transition-colors`}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <FaSun className="text-amber-400" /> : <FaMoon className={theme.textSecondary} />}
          </button>
          
          <button onClick={handleLogout} className={`p-2 ${theme.bgHover} rounded-md transition-colors`}>
            <FaSignOutAlt className={theme.textSecondary} />
          </button>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Sidebar */}
        <aside 
          className={`fixed left-0 z-40 h-[calc(100vh-3.5rem)] transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ width: '256px' }}
        >
          <div className={`w-full h-full ${theme.bgSecondary} border-r ${theme.border} flex flex-col overflow-hidden transition-colors duration-200`}>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id 
                      ? `${theme.bgActive} ${theme.text}` 
                      : `${theme.textSecondary} ${theme.bgHover} hover:${theme.text}`
                  }`}
                >
                  <item.icon className="text-base" />
                  {item.label}
                </button>
              ))}

              <div className={`border-t ${theme.border} my-3`}></div>

              <button onClick={() => navigate('/')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${theme.textSecondary} ${theme.bgHover}`}>
                <FaHome className="text-base" />
                {t('dash.home')}
              </button>
              <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10`}>
                <FaSignOutAlt className="text-base" />
                {t('dash.logout')}
              </button>
            </nav>

            <div className={`p-3 border-t ${theme.border}`}>
              <div className="flex items-center gap-3 px-3 py-2">
                {patientData?.imageUrl ? (
                  <img src={patientData.imageUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className={`w-8 h-8 ${theme.bgTertiary} rounded-full flex items-center justify-center`}>
                    <FaUser className={theme.textMuted} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${theme.text} truncate`}>{patientData?.name || 'User'}</p>
                  <p className={`text-xs ${theme.textSecondary} truncate`}>{patientData?.email || ''}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main 
          className="flex-1 min-h-[calc(100vh-3.5rem)] transition-all duration-200"
          style={{ marginLeft: sidebarOpen ? '256px' : '0' }}
        >
          <div className="max-w-6xl mx-auto p-4 lg:p-8">
            <ToastContainer position="top-right" autoClose={3000} theme={darkMode ? 'dark' : 'light'} />

            {/* Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className={`text-2xl font-semibold ${theme.text}`}>{getGreeting()}, {patientData?.name?.split(' ')[0] || 'Guardian'}</h1>
                    <p className={`${theme.textSecondary} text-sm mt-1`}>
                      {userContext.addiction_type ? t('dash.monitoringRecovery', { type: userContext.addiction_type }) : t('dash.monitoringProgress')}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${theme.textSecondary}`}>
                    <FaCalendarCheck />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {isNewUser && historicalCravingData.length === 0 && (
                  <div className={`${theme.bgTertiary} border ${theme.border} rounded-lg p-4`}>
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 ${darkMode ? 'bg-zinc-700' : 'bg-zinc-200'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <FaStar className={theme.textSecondary} />
                      </div>
                      <div>
                        <h3 className={`font-medium ${theme.text}`}>{t('dash.welcomeDashboard')}</h3>
                        <p className={`text-sm ${theme.textSecondary} mt-1`}>{t('dash.startTracking')}</p>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => setActiveTab('cravings')} className={`px-3 py-1.5 ${theme.button} text-sm rounded-md transition-colors`}>{t('dash.logPatientCraving')}</button>
                          <button onClick={() => setActiveTab('profile')} className={`px-3 py-1.5 ${theme.buttonSecondary} border ${theme.border} text-sm rounded-md transition-colors`}>{t('dash.setUpPatientInfo')}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Relapse Risk Score - Only shown when user has data */}
                {historicalCravingData.length > 0 && (() => {
                  const risk = calculateRelapseRisk();
                  if (!risk) return null;
                  
                  const exercises = getExerciseRecommendations(risk.level);
                  const riskColors = {
                    high: { bg: darkMode ? 'bg-red-500/10' : 'bg-red-50', border: 'border-red-500/30', text: 'text-red-500', accent: darkMode ? 'bg-red-500/20' : 'bg-red-100' },
                    moderate: { bg: darkMode ? 'bg-amber-500/10' : 'bg-amber-50', border: 'border-amber-500/30', text: 'text-amber-500', accent: darkMode ? 'bg-amber-500/20' : 'bg-amber-100' },
                    low: { bg: darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50', border: 'border-emerald-500/30', text: 'text-emerald-500', accent: darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100' }
                  };
                  const colors = riskColors[risk.level];
                  
                  return (
                    <div className={`${colors.bg} border ${colors.border} rounded-lg overflow-hidden`}>
                      <div className="p-5">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          {/* Left side - Risk info */}
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className={`w-1 h-16 ${risk.level === 'high' ? 'bg-red-500' : risk.level === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'} rounded-full`}></div>
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <FaExclamationTriangle className={colors.text} />
                                  <span className={`font-semibold ${theme.text}`}>
                                    {risk.level === 'high' ? t('dash.highRiskNow') : risk.level === 'moderate' ? t('dash.moderateRisk') : t('dash.lowRisk')}
                                  </span>
                                  <span className={`px-2 py-0.5 ${colors.accent} ${colors.text} text-sm font-medium rounded`}>
                                    {t('dash.riskScore', { score: risk.score })}
                                  </span>
                                </div>
                                <p className={`text-sm ${theme.textSecondary} mb-2`}>
                                  {risk.level === 'high' 
                                    ? t('dash.highRiskDesc')
                                    : risk.level === 'moderate'
                                    ? t('dash.moderateRiskDesc')
                                    : t('dash.lowRiskDesc')}
                                </p>
                                <div className={`text-xs ${theme.textMuted}`}>
                                  <span className="font-medium">{t('dash.factors')}:</span> {risk.factors.slice(0, 3).join(', ')}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right side - Exercises */}
                          <div className="lg:w-80">
                            <p className={`text-xs font-medium ${theme.textSecondary} mb-2 uppercase tracking-wide`}>{t('dash.recommendedExercises')}</p>
                            <div className="space-y-1.5">
                              {exercises.slice(0, 4).map((exercise) => (
                                <button
                                  key={exercise.id}
                                  onClick={() => handleExerciseClick(exercise)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 ${theme.bgSecondary} border ${theme.border} rounded-lg text-sm ${theme.text} hover:border-zinc-400 transition-all text-left group`}
                                >
                                  <span className="text-lg">{exercise.icon}</span>
                                  <span className="flex-1">{exercise.title}</span>
                                  <FaArrowRight className={`text-xs ${theme.textMuted} group-hover:translate-x-1 transition-transform`} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Risk Score Formula */}
                        <div className={`mt-4 pt-4 border-t ${theme.border}`}>
                          <p className={`text-xs ${theme.textMuted} mb-1`}>
                            <span className="font-medium">{t('dash.relapseRiskScore')}</span>
                          </p>
                          <p className={`text-xs ${theme.textMuted}`}>
                            Craving×0.35 + Stress×0.30 + Poor Sleep×0.20 + Past Time Match×0.15
                          </p>
                          <p className={`text-xs ${theme.textMuted} italic mt-1`}>
                            "The app interrupts the relapse loop at the craving stage, before intention turns into action."
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Patient Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`${theme.card} border rounded-lg p-4 transition-colors`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${theme.textSecondary}`}>{t('dash.patientDaysSober')}</p>
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <FaFire className="text-emerald-500 text-sm" />
                      </div>
                    </div>
                    <p className={`text-2xl font-semibold ${theme.text} mt-2`}>{userContext.days_in_recovery || userStats.daysSober || 0}</p>
                    <p className={`text-xs ${theme.textSecondary} mt-1`}>{userStats.daysSober > 0 ? t('settings.goodProgress') : t('settings.updateInSettings')}</p>
                  </div>

                  <div className={`${theme.card} border rounded-lg p-4 transition-colors`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${theme.textSecondary}`}>{t('dash.patientSleepCard')}</p>
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <FaMoon className="text-blue-500 text-sm" />
                      </div>
                    </div>
                    <p className={`text-2xl font-semibold ${theme.text} mt-2`}>{userStats.sleepQuality > 0 ? userStats.sleepQuality.toFixed(1) : '--'}<span className={`text-sm ${theme.textMuted}`}>/10</span></p>
                    <p className={`text-xs ${theme.textSecondary} mt-1`}>{t('dash.logged', { count: userStats.sleepChecks })}</p>
                  </div>

                  <div className={`${theme.card} border rounded-lg p-4 transition-colors`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${theme.textSecondary}`}>{t('dash.patientAvgCraving')}</p>
                      <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                        <FaHeartbeat className="text-amber-500 text-sm" />
                      </div>
                    </div>
                    <p className={`text-2xl font-semibold ${theme.text} mt-2`}>{historicalCravingData.length > 0 ? (historicalCravingData.reduce((s, e) => s + e.craving_intensity, 0) / historicalCravingData.length).toFixed(1) : '--'}<span className={`text-sm ${theme.textMuted}`}>/10</span></p>
                    <p className={`text-xs ${theme.textSecondary} mt-1`}>{t('dash.entriesLogged', { count: historicalCravingData.length })}</p>
                  </div>

                  <div className={`${theme.card} border rounded-lg p-4 transition-colors`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${theme.textSecondary}`}>{t('dash.aiConsultations')}</p>
                      <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <FaComments className="text-purple-500 text-sm" />
                      </div>
                    </div>
                    <p className={`text-2xl font-semibold ${theme.text} mt-2`}>{userStats.chatSessions}</p>
                    <p className={`text-xs ${theme.textSecondary} mt-1`}>{userStats.chatSessions > 0 ? t('dash.guidanceSessions') : t('dash.askAiHelp')}</p>
                  </div>
                </div>

                {/* Upcoming Appointments */}
                {upcomingAppointments.length > 0 && (
                  <div className={`${theme.card} border rounded-lg p-5 transition-colors`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`font-medium ${theme.text} flex items-center gap-2`}>
                        <FaCalendarAlt className="text-blue-500" /> {t('dash.upcomingAppointments')}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                        {t('dash.scheduled', { count: upcomingAppointments.length })}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {upcomingAppointments.slice(0, 3).map((apt) => (
                        <div key={apt.id} className={`flex items-center justify-between p-4 rounded-lg ${theme.bgTertiary} border ${theme.border}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              apt.meetingType === 'video' ? 'bg-blue-100' : 'bg-emerald-100'
                            }`}>
                              {apt.meetingType === 'video' ? (
                                <FaVideo className="text-blue-600" />
                              ) : (
                                <FaMapMarkerAlt className="text-emerald-600" />
                              )}
                            </div>
                            <div>
                              <p className={`font-medium ${theme.text}`}>Dr. {apt.doctorName}</p>
                              <p className={`text-sm ${theme.textSecondary}`}>
                                {new Date(apt.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                {' '}&middot;{' '}{apt.timeSlot?.startTime} - {apt.timeSlot?.endTime}
                              </p>
                              {apt.reason && <p className={`text-xs ${theme.textMuted} mt-1`}>{apt.reason}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              apt.meetingType === 'video' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {apt.meetingType === 'video' ? t('dash.video') : t('dash.inPerson')}
                            </span>
                            {apt.meetingType === 'video' && apt.meetingLink && (
                              <a
                                href={apt.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                {t('dash.join')}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chart */}
                  <div className={`lg:col-span-2 ${theme.card} border rounded-lg p-5 transition-colors`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`font-medium ${theme.text}`}>{t('dash.trends')}</h3>
                      <button onClick={() => setActiveTab('cravings')} className={`text-sm ${theme.textSecondary} hover:${theme.text} flex items-center gap-1 transition-colors`}>
                        {t('dash.viewAll')} <FaArrowRight className="text-xs" />
                      </button>
                    </div>
                    <div className="h-64">
                      {historicalCravingData.length > 0 ? (
                        <Line data={getCravingChartData()} options={chartOptions} />
                      ) : (
                        <div className={`h-full flex flex-col items-center justify-center ${theme.textMuted}`}>
                          <FaChartBar className="text-3xl mb-2" />
                          <p className="text-sm">{t('dash.noDataYet')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <div className={`${theme.card} border rounded-lg p-5 transition-colors`}>
                      <h3 className={`font-medium ${theme.text} mb-4`}>{t('dash.quickActions')}</h3>
                      <div className="space-y-2">
                        <button onClick={() => setActiveTab('cravings')} className={`w-full flex items-center justify-between p-3 ${theme.bgTertiary} ${theme.bgHover} rounded-lg text-sm ${theme.textSecondary} transition-colors`}>
                          <span className="flex items-center gap-2"><FaPlus className={theme.textMuted} /> {t('dash.logCraving')}</span>
                          <FaArrowRight className={`${theme.textMuted} text-xs`} />
                        </button>
                        <button onClick={() => setActiveTab('sleep')} className={`w-full flex items-center justify-between p-3 ${theme.bgTertiary} ${theme.bgHover} rounded-lg text-sm ${theme.textSecondary} transition-colors`}>
                          <span className="flex items-center gap-2"><FaMoon className={theme.textMuted} /> {t('dash.sleepCheck')}</span>
                          <FaArrowRight className={`${theme.textMuted} text-xs`} />
                        </button>
                        <button onClick={() => setActiveTab('chatbot')} className={`w-full flex items-center justify-between p-3 ${theme.bgTertiary} ${theme.bgHover} rounded-lg text-sm ${theme.textSecondary} transition-colors`}>
                          <span className="flex items-center gap-2"><FaComments className={theme.textMuted} /> {t('dash.talkToAi')}</span>
                          <FaArrowRight className={`${theme.textMuted} text-xs`} />
                        </button>
                      </div>
                    </div>

                    <div className={`${darkMode ? 'bg-zinc-100' : 'bg-zinc-900'} rounded-lg p-5 ${darkMode ? 'text-zinc-900' : 'text-white'}`}>
                      <h3 className="font-medium mb-2 flex items-center gap-2"><FaLightbulb className="text-amber-400" /> {t('dash.dailyQuote')}</h3>
                      <p className={`text-sm ${darkMode ? 'text-zinc-600' : 'text-zinc-300'} leading-relaxed`}>"{t('dash.dailyQuoteText')}"</p>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`${theme.card} border rounded-lg p-5 transition-colors`}>
                    <h4 className={`font-medium ${theme.text} mb-4 flex items-center gap-2`}><FaChartBar className={theme.textMuted} /> {t('dash.activity')}</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1"><span className={theme.textSecondary}>{t('dash.cravingEntries')}</span><span className={`${theme.text} font-medium`}>{historicalCravingData.length}/10</span></div>
                        <div className={`h-2 ${theme.bgTertiary} rounded-full`}><div className={`h-full ${darkMode ? 'bg-zinc-100' : 'bg-zinc-900'} rounded-full transition-all`} style={{width: `${Math.min(historicalCravingData.length * 10, 100)}%`}}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1"><span className={theme.textSecondary}>{t('dash.sleepChecks')}</span><span className={`${theme.text} font-medium`}>{userStats.sleepChecks}/5</span></div>
                        <div className={`h-2 ${theme.bgTertiary} rounded-full`}><div className={`h-full ${darkMode ? 'bg-zinc-100' : 'bg-zinc-900'} rounded-full transition-all`} style={{width: `${Math.min(userStats.sleepChecks * 20, 100)}%`}}></div></div>
                      </div>
                    </div>
                  </div>

                  <div className={`${theme.card} border rounded-lg p-5 transition-colors`}>
                    <h4 className={`font-medium ${theme.text} mb-4 flex items-center gap-2`}><FaExclamationTriangle className="text-amber-500" /> {t('dash.riskPeriods')}</h4>
                    {historicalCravingData.length > 0 ? (
                      <div className="space-y-2">
                        <div className={`flex items-center justify-between p-2 ${darkMode ? 'bg-amber-500/10' : 'bg-amber-50'} rounded-lg text-sm`}><span className={theme.textSecondary}>{t('dash.evenings')}</span><span className="text-amber-500 font-medium">{t('dash.monitor')}</span></div>
                        <div className={`flex items-center justify-between p-2 ${darkMode ? 'bg-amber-500/10' : 'bg-amber-50'} rounded-lg text-sm`}><span className={theme.textSecondary}>{t('dash.weekends')}</span><span className="text-amber-500 font-medium">{t('dash.monitor')}</span></div>
                      </div>
                    ) : (
                      <p className={`text-sm ${theme.textSecondary} text-center py-4`}>{t('dash.addEntriesToIdentify')}</p>
                    )}
                  </div>

                  <div className={`${theme.card} border rounded-lg p-5 transition-colors`}>
                    <h4 className={`font-medium ${theme.text} mb-4 flex items-center gap-2`}><FaRegSmile className={theme.textMuted} /> {t('dash.mood')}</h4>
                    {historicalCravingData.length > 0 ? (
                      <div className="text-center">
                        <p className={`text-3xl font-semibold ${theme.text}`}>{((historicalCravingData.filter(e => e.mood_score >= 6).length / historicalCravingData.length) * 100).toFixed(0)}%</p>
                        <p className={`text-sm ${theme.textSecondary} mt-1`}>{t('dash.positiveEntries')}</p>
                        <div className="flex justify-center gap-1 mt-3">
                          {historicalCravingData.slice(0, 5).map((e, i) => (
                            <span key={i} className="text-xl">{e.mood_score >= 7 ? '😊' : e.mood_score >= 4 ? '😐' : '😔'}</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className={`text-sm ${theme.textSecondary} text-center py-4`}>{t('dash.trackCravingsToSeeMood')}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Chatbot */}
            {activeTab === 'chatbot' && (() => {
              const suggestions = getQuickSuggestions();
              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className={`text-2xl font-semibold ${theme.text}`}>{t('aiChat.heading')}</h1>
                      <p className={`${theme.textSecondary} text-sm mt-1`}>{t('aiChat.subtitle')}</p>
                    </div>
                  </div>

                  <div className={`${theme.card} border rounded-lg overflow-hidden transition-colors`}>
                    {/* Collapsible Quick Actions Panel */}
                    <div className={`border-b ${theme.border}`}>
                      <button
                        onClick={() => setSuggestionsOpen(!suggestionsOpen)}
                        className={`w-full px-4 py-3 flex items-center justify-between ${theme.bgSecondary} hover:opacity-90 transition-colors`}
                      >
                        <div className="flex items-center gap-2">
                          <FaLightbulb className={`text-amber-500`} />
                          <span className={`text-sm font-medium ${theme.text}`}>{t('dash.quickActions')}</span>
                          <span className={`text-xs ${theme.textMuted}`}>• {suggestionsOpen ? t('aiChat.tapToHide') : t('aiChat.tapToShow')}</span>
                        </div>
                        <div className={`transform transition-transform ${suggestionsOpen ? 'rotate-180' : ''}`}>
                          <svg className={`w-4 h-4 ${theme.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {/* Suggestions Content */}
                      <div className={`overflow-hidden transition-all duration-300 ${suggestionsOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className={`p-4 ${theme.bgTertiary} space-y-3`}>
                          {/* Contextual Greeting */}
                          <div className={`${theme.bgSecondary} border ${theme.border} rounded-lg p-3`}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-6 h-6 ${darkMode ? 'bg-zinc-700' : 'bg-zinc-200'} rounded-full flex items-center justify-center`}>
                                <FaRobot className={`text-xs ${theme.textMuted}`} />
                              </div>
                              <span className={`text-xs ${theme.textSecondary}`}>{getContextualGreeting()}</span>
                            </div>
                          </div>
                          
                          {/* Quick questions for guardian */}
                          <div>
                            <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>{t('aiChat.askAboutCare')}</p>
                            <div className="flex flex-wrap gap-2">
                              {suggestions.responseSuggestions.map((s, i) => (
                                <button
                                  key={i}
                                  onClick={() => { handleSuggestionClick(s.text); setSuggestionsOpen(false); }}
                                  className={`px-3 py-1.5 ${theme.bgSecondary} border ${theme.border} rounded-full text-xs ${theme.text} hover:border-zinc-400 transition-colors flex items-center gap-1.5`}
                                >
                                  <span>{s.icon}</span> {s.text}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Guide me */}
                          <div>
                            <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>{t('aiChat.guideMe')}</p>
                            <div className="flex flex-wrap gap-2">
                              {suggestions.guideSuggestions.slice(0, 4).map((s, i) => (
                                <button
                                  key={i}
                                  onClick={() => { handleSuggestionClick(s.text); setSuggestionsOpen(false); }}
                                  className={`px-3 py-1.5 ${darkMode ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'} border rounded-full text-xs hover:opacity-80 transition-colors flex items-center gap-1.5`}
                                >
                                  <span>{s.icon}</span> {s.text}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Nutrition suggestions */}
                          <div>
                            <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>{t('aiChat.nutritionRecovery')}</p>
                            <div className="flex flex-wrap gap-2">
                              {suggestions.nutritionSuggestions.slice(0, 4).map((s, i) => (
                                <button
                                  key={i}
                                  onClick={() => { handleSuggestionClick(s.text); setSuggestionsOpen(false); }}
                                  className={`px-3 py-1.5 ${darkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'} border rounded-full text-xs hover:opacity-80 transition-colors flex items-center gap-1.5`}
                                >
                                  <span>{s.icon}</span> {s.text}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Contextual suggestions */}
                          {suggestions.contextual.length > 0 && (
                            <div>
                              <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>{t('aiChat.rightNow')}</p>
                              <div className="flex flex-wrap gap-2">
                                {suggestions.contextual.map((s, i) => (
                                  <button
                                    key={i}
                                    onClick={() => { handleSuggestionClick(s.text); setSuggestionsOpen(false); }}
                                    className={`px-3 py-1.5 ${darkMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'} border rounded-full text-xs hover:opacity-80 transition-colors flex items-center gap-1.5`}
                                  >
                                    <span>{s.icon}</span> {s.text}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages Area */}
                    <div className={`h-[350px] overflow-y-auto p-4 space-y-4 ${theme.bgTertiary}`} id="chat-messages">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <div className={`w-14 h-14 ${darkMode ? 'bg-zinc-700' : 'bg-zinc-200'} rounded-full flex items-center justify-center mb-3`}>
                            <FaRobot className={`text-xl ${theme.textMuted}`} />
                          </div>
                          <p className={`text-sm ${theme.textSecondary}`}>{t('aiChat.startConversation')}</p>
                          <p className={`text-xs ${theme.textMuted} mt-1`}>{t('aiChat.useQuickActions')}</p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
                          <div key={msg.message_id} className={`flex ${msg.is_user ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${msg.is_user ? (darkMode ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white') : `${theme.bgSecondary} ${theme.text} border ${theme.border}`}`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              {!msg.is_user && msg.suggested_actions?.length > 0 && (
                                <div className={`mt-3 pt-3 border-t ${msg.is_user ? 'border-zinc-700' : theme.border}`}>
                                  <p className={`text-xs ${theme.textMuted} mb-2`}>{t('aiChat.tryThis')}</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {msg.suggested_actions.map((action, i) => (
                                      <button
                                        key={i}
                                        onClick={() => handleSuggestionClick(action)}
                                        className={`px-2.5 py-1 ${theme.bgTertiary} border ${theme.border} rounded-full text-xs ${theme.textSecondary} hover:border-zinc-400 transition-colors`}
                                      >
                                        {action}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Input Area */}
                    <div className={`p-4 border-t ${theme.border} ${theme.bgSecondary}`}>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSuggestionsOpen(!suggestionsOpen)}
                          className={`px-3 py-2.5 ${theme.buttonSecondary} border ${theme.border} rounded-lg transition-colors`}
                          title="Toggle quick actions"
                        >
                          <FaLightbulb className={suggestionsOpen ? 'text-amber-500' : theme.textMuted} />
                        </button>
                        <input
                          type="text"
                          value={userMessage}
                          onChange={(e) => setUserMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !loading && sendChatMessage()}
                          placeholder={t('aiChat.typeMessage')}
                          className={`flex-1 px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 ${theme.input} transition-colors`}
                          disabled={loading}
                        />
                        <button
                          id="chat-send-btn"
                          onClick={sendChatMessage}
                          disabled={loading || !userMessage.trim()}
                          className={`px-4 py-2.5 ${theme.button} rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors`}
                        >
                          {loading ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></div> : <><FaPaperPlane /> {t('aiChat.send')}</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Sleep */}
            {activeTab === 'sleep' && (
              <div className="space-y-6">
                <div>
                  <h1 className={`text-2xl font-semibold ${theme.text}`}>{t('sleep.heading')}</h1>
                  <p className={`${theme.textSecondary} text-sm mt-1`}>{t('sleep.subtitle')}</p>
                </div>

                {sleepData ? (
                  <div className={`${theme.card} border rounded-lg p-6 transition-colors`}>
                    <h2 className={`font-medium ${theme.text} mb-6`}>{t('sleep.assessmentResults')}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className={`${theme.bgTertiary} rounded-lg p-4`}>
                        <h3 className={`text-sm font-medium ${theme.text} mb-3 flex items-center gap-2`}><FaMoon className={theme.textMuted} /> {t('sleep.metrics')}</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className={theme.textSecondary}>{t('sleep.sleepTime')}</span><span className={`${theme.text} font-medium`}>{sleepData.sleep_metrics.total_sleep_time} hrs</span></div>
                          <div className="flex justify-between"><span className={theme.textSecondary}>{t('sleep.efficiency')}</span><span className={`${theme.text} font-medium`}>{sleepData.sleep_metrics.sleep_efficiency}%</span></div>
                          <div className="flex justify-between"><span className={theme.textSecondary}>{t('sleep.latency')}</span><span className={`${theme.text} font-medium`}>{sleepData.sleep_metrics.sleep_latency_minutes} min</span></div>
                        </div>
                      </div>
                      
                      <div className={`${theme.bgTertiary} rounded-lg p-4`}>
                        <h3 className={`text-sm font-medium ${theme.text} mb-3 flex items-center gap-2`}><FaChartBar className={theme.textMuted} /> {t('sleep.quality')}</h3>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm ${theme.textSecondary}`}>{t('sleep.category')}</span>
                          <span className={`text-sm font-medium px-2 py-1 rounded ${sleepData.quality_assessment.category === 'Good' ? 'bg-emerald-500/10 text-emerald-500' : sleepData.quality_assessment.category === 'Fair' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>{sleepData.quality_assessment.category}</span>
                        </div>
                        {sleepData.quality_assessment.issues.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {sleepData.quality_assessment.issues.map((issue, i) => (
                              <span key={i} className={`text-xs ${theme.bgSecondary} ${theme.textSecondary} px-2 py-1 rounded border ${theme.border}`}>{issue}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className={`${darkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4 mb-6`}>
                      <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-900'} mb-2 flex items-center gap-2`}><FaLightbulb className={darkMode ? 'text-blue-400' : 'text-blue-600'} /> {t('sleep.guidance')}</h3>
                      <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>{sleepData.gemini_guidance}</p>
                    </div>
                    
                    <button onClick={() => setSleepData(null)} className={`px-4 py-2 ${theme.button} rounded-lg text-sm font-medium transition-colors`}>{t('sleep.newAssessment')}</button>
                  </div>
                ) : (
                  <div className={`${theme.card} border rounded-lg p-6 transition-colors`}>
                    <h2 className={`font-medium ${theme.text} mb-6`}>{t('sleep.logSleepData')}</h2>
                    <p className={`text-sm ${theme.textSecondary} mb-4`}>{t('sleep.logSleepDesc')}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>{t('sleep.bedtime')}</label>
                        <input type="time" value={sleepForm.typical_bedtime} onChange={(e) => handleSleepFormChange('typical_bedtime', e.target.value)} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 ${theme.input} transition-colors`} />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>{t('sleep.wakeTime')}</label>
                        <input type="time" value={sleepForm.typical_wake_time} onChange={(e) => handleSleepFormChange('typical_wake_time', e.target.value)} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 ${theme.input} transition-colors`} />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>{t('sleep.timeToFallAsleep')}</label>
                        <select value={sleepForm.time_to_fall_asleep} onChange={(e) => handleSleepFormChange('time_to_fall_asleep', e.target.value)} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 ${theme.input} transition-colors`}>
                          <option value="<15min">{t('sleep.lessThan15')}</option>
                          <option value="15-30min">{t('sleep.min15to30')}</option>
                          <option value="30-60min">{t('sleep.min30to60')}</option>
                          <option value=">60min">{t('sleep.moreThan60')}</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>{t('sleep.hoursOfSleep')}</label>
                        <input type="number" min="0" max="12" step="0.5" value={sleepForm.hours_of_actual_sleep} onChange={(e) => handleSleepFormChange('hours_of_actual_sleep', parseFloat(e.target.value))} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 ${theme.input} transition-colors`} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>{t('sleep.sleepQuality', { value: sleepForm.sleep_quality_rating })}</label>
                        <input type="range" min="1" max="10" value={sleepForm.sleep_quality_rating} onChange={(e) => handleSleepFormChange('sleep_quality_rating', parseInt(e.target.value))} className={`w-full h-2 rounded-full appearance-none cursor-pointer ${darkMode ? 'bg-zinc-700 accent-zinc-100' : 'bg-zinc-200 accent-zinc-900'}`} />
                      </div>
                    </div>
                    
                    <button onClick={submitSleepAssessment} disabled={loading} className={`px-4 py-2 ${theme.button} rounded-lg text-sm font-medium disabled:opacity-50 transition-colors`}>{loading ? t('sleep.submitting') : t('sleep.submit')}</button>
                  </div>
                )}
              </div>
            )}

            {/* Cravings */}
            {activeTab === 'cravings' && (
              <div className="space-y-6">
                <div>
                  <h1 className={`text-2xl font-semibold ${theme.text}`}>{t('cravings.heading')}</h1>
                  <p className={`${theme.textSecondary} text-sm mt-1`}>{t('cravings.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={`${theme.card} border rounded-lg p-6 transition-colors`}>
                    <h2 className={`font-medium ${theme.text} mb-6 flex items-center gap-2`}><FaPlus className={theme.textMuted} /> {t('cravings.logCurrentState')}</h2>
                    
                    <div className="space-y-5">
                      <div>
                        <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>{t('cravings.cravingIntensity', { value: cravingEntry.craving_intensity })}</label>
                        <input type="range" min="0" max="10" value={cravingEntry.craving_intensity} onChange={(e) => handleCravingEntryChange('craving_intensity', parseInt(e.target.value))} className={`w-full h-2 rounded-full appearance-none cursor-pointer ${darkMode ? 'bg-zinc-700 accent-zinc-100' : 'bg-zinc-200 accent-zinc-900'}`} />
                        <p className={`text-xs ${theme.textMuted} mt-1`}>{t('cravings.cravingIntensityNote')}</p>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>{t('cravings.stressLevel', { value: cravingEntry.stress_level })}</label>
                        <input type="range" min="0" max="10" value={cravingEntry.stress_level} onChange={(e) => handleCravingEntryChange('stress_level', parseInt(e.target.value))} className={`w-full h-2 rounded-full appearance-none cursor-pointer ${darkMode ? 'bg-zinc-700 accent-zinc-100' : 'bg-zinc-200 accent-zinc-900'}`} />
                        <p className={`text-xs ${theme.textMuted} mt-1`}>{t('cravings.stressLevelNote')}</p>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>{t('cravings.patientMood', { value: cravingEntry.mood_score })}</label>
                        <input type="range" min="0" max="10" value={cravingEntry.mood_score} onChange={(e) => handleCravingEntryChange('mood_score', parseInt(e.target.value))} className={`w-full h-2 rounded-full appearance-none cursor-pointer ${darkMode ? 'bg-zinc-700 accent-zinc-100' : 'bg-zinc-200 accent-zinc-900'}`} />
                        <p className={`text-xs ${theme.textMuted} mt-1`}>{t('cravings.moodNote')}</p>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${theme.textSecondary} mb-3`}>{t('cravings.observedTriggers')}</label>
                        <div className="flex flex-wrap gap-3">
                          <label className={`flex items-center gap-2 cursor-pointer text-sm ${theme.textSecondary}`}>
                            <input type="checkbox" checked={cravingEntry.work_stress} onChange={(e) => handleCravingEntryChange('work_stress', e.target.checked)} className={`w-4 h-4 rounded ${darkMode ? 'accent-zinc-100' : 'accent-zinc-900'}`} />
                            {t('cravings.workStress')}
                          </label>
                          <label className={`flex items-center gap-2 cursor-pointer text-sm ${theme.textSecondary}`}>
                            <input type="checkbox" checked={cravingEntry.social_trigger} onChange={(e) => handleCravingEntryChange('social_trigger', e.target.checked)} className={`w-4 h-4 rounded ${darkMode ? 'accent-zinc-100' : 'accent-zinc-900'}`} />
                            {t('cravings.socialTrigger')}
                          </label>
                          <label className={`flex items-center gap-2 cursor-pointer text-sm ${theme.textSecondary}`}>
                            <input type="checkbox" checked={cravingEntry.location_risk} onChange={(e) => handleCravingEntryChange('location_risk', e.target.checked)} className={`w-4 h-4 rounded ${darkMode ? 'accent-zinc-100' : 'accent-zinc-900'}`} />
                            {t('cravings.riskyLocation')}
                          </label>
                        </div>
                      </div>
                      <button onClick={addCravingEntry} className={`w-full px-4 py-2 ${theme.button} rounded-lg text-sm font-medium transition-colors`}>{t('cravings.logEntry')}</button>
                      <p className={`text-xs ${theme.textMuted} text-center`}>{t('cravings.alertNote')}</p>
                    </div>
                  </div>

                  <div className={`${theme.card} border rounded-lg p-6 transition-colors`}>
                    <h2 className={`font-medium ${theme.text} mb-6 flex items-center gap-2`}><FaClock className={theme.textMuted} /> {t('cravings.recentEntries')}</h2>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {historicalCravingData.slice(0, 5).map((entry, i) => (
                        <div key={i} className={`${theme.bgTertiary} rounded-lg p-3`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs ${theme.textSecondary}`}>{new Date(entry.timestamp).toLocaleString()}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${entry.craving_intensity >= 7 ? 'bg-red-500/10 text-red-500' : entry.craving_intensity >= 4 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{entry.craving_intensity >= 7 ? t('cravings.high') : entry.craving_intensity >= 4 ? t('cravings.moderate') : t('cravings.low')}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div><span className={theme.textSecondary}>{t('cravings.craving')}</span><p className={`${theme.text} font-medium`}>{entry.craving_intensity}/10</p></div>
                            <div><span className={theme.textSecondary}>{t('cravings.stress')}</span><p className={`${theme.text} font-medium`}>{entry.stress_level}/10</p></div>
                            <div><span className={theme.textSecondary}>{t('cravings.moodLabel')}</span><p className={`${theme.text} font-medium`}>{entry.mood_score}/10</p></div>
                          </div>
                        </div>
                      ))}
                      {historicalCravingData.length === 0 && (
                        <div className={`text-center py-8 ${theme.textMuted}`}>
                          <FaHeartbeat className="text-2xl mx-auto mb-2" />
                          <p className="text-sm">{t('cravings.noEntries')}</p>
                          <p className="text-xs mt-1">{t('cravings.startTrackingCravings')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`${theme.card} border rounded-lg p-6 transition-colors`}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`font-medium ${theme.text} flex items-center gap-2`}><FaChartLine className={theme.textMuted} /> {t('cravings.cravingForecast')}</h2>
                    <button onClick={generateCravingForecast} disabled={loading || historicalCravingData.length < 3} className={`px-3 py-1.5 ${theme.button} rounded-lg text-sm font-medium disabled:opacity-50 transition-colors`}>{loading ? t('cravings.generating') : t('cravings.generate')}</button>
                  </div>
                  
                  {cravingForecast ? (
                    <div className="space-y-4">
                      <div className="h-48"><Line data={getForecastChartData()} options={chartOptions} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`${theme.bgTertiary} rounded-lg p-3`}>
                          <h4 className={`text-sm font-medium ${theme.text} mb-1`}>{t('cravings.peakRiskHours')}</h4>
                          <p className={`text-sm ${theme.textSecondary}`}>{cravingForecast.peak_risk_hours.length > 0 ? cravingForecast.peak_risk_hours.map(h => `${h}:00`).join(', ') : t('cravings.nonePredicted')}</p>
                        </div>
                        <div className={`${theme.bgTertiary} rounded-lg p-3`}>
                          <h4 className={`text-sm font-medium ${theme.text} mb-1`}>{t('cravings.confidence')}</h4>
                          <p className={`text-sm ${theme.textSecondary}`}>{(cravingForecast.model_confidence * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-center py-8 ${theme.textMuted}`}>
                      <FaChartLine className="text-2xl mx-auto mb-2" />
                      <p className="text-sm">{t('cravings.generateForecastNote')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meetings */}
            {activeTab === 'meetings' && (
              <div className="space-y-6">
                <MeetingFinder theme={theme} darkMode={darkMode} />
              </div>
            )}

            {/* Hospitals & Emergency */}
            {activeTab === 'hospitals' && (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h1 className={`text-2xl font-semibold ${theme.text}`}>{t('hospitals.heading')}</h1>
                  <p className={`${theme.textSecondary} text-sm mt-1`}>
                    {t('hospitals.subtitle')}
                  </p>
                </div>

                {/* Emergency Numbers Card */}
                <div className={`${theme.card} border rounded-lg p-4 border-red-500/30 ${darkMode ? 'bg-red-500/10' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <FaAmbulance className="text-xl text-red-500" />
                    </div>
                    <div>
                      <h3 className={`font-medium ${theme.text}`}>{t('hospitals.emergencyNumbers')}</h3>
                      <p className={`text-xs ${theme.textSecondary}`}>{t('hospitals.emergencyNumbersDesc')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <a href="tel:112" className="flex items-center gap-2 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                      <FaPhone className="text-sm" />
                      <div>
                        <p className="font-semibold">112</p>
                        <p className="text-xs opacity-80">{t('hospitals.emergency')}</p>
                      </div>
                    </a>
                    <a href="tel:102" className="flex items-center gap-2 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                      <FaAmbulance className="text-sm" />
                      <div>
                        <p className="font-semibold">102</p>
                        <p className="text-xs opacity-80">{t('hospitals.ambulance')}</p>
                      </div>
                    </a>
                    <a href="tel:108" className="flex items-center gap-2 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                      <FaHospital className="text-sm" />
                      <div>
                        <p className="font-semibold">108</p>
                        <p className="text-xs opacity-80">{t('hospitals.medicalHelp')}</p>
                      </div>
                    </a>
                    <a href="tel:1800-599-0019" className="flex items-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      <FaPhone className="text-sm" />
                      <div>
                        <p className="font-semibold text-sm">1800-599-0019</p>
                        <p className="text-xs opacity-80">{t('hospitals.deAddiction')}</p>
                      </div>
                    </a>
                  </div>
                </div>

                {/* City Selection */}
                <div className={`${theme.card} border rounded-lg p-4`}>
                  <h3 className={`font-medium ${theme.text} mb-3`}>{t('hospitals.selectCity')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_CITIES.map((city) => (
                      <button
                        key={city.key}
                        onClick={() => setSelectedCity(city.key)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          selectedCity === city.key
                            ? 'bg-blue-600 text-white'
                            : `${theme.bgTertiary} ${theme.text} hover:bg-blue-500/20`
                        }`}
                      >
                        {city.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hospitals List */}
                <div className={`${theme.card} border rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-medium ${theme.text}`}>
                      {t('hospitals.hospitalsIn', { city: selectedCity })}
                    </h3>
                    <span className={`text-sm ${theme.textSecondary}`}>
                      {t('hospitals.found', { count: hospitals.length })}
                    </span>
                  </div>

                  {hospitalsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : hospitals.length === 0 ? (
                    <div className={`text-center py-12 ${theme.textSecondary}`}>
                      <FaHospital className="text-4xl mx-auto mb-3 opacity-50" />
                      <p>{t('hospitals.noHospitalsFound', { city: selectedCity })}</p>
                      <p className="text-sm mt-1">{t('hospitals.tryDifferentCity')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {hospitals.map((hospital, index) => (
                        <div
                          key={hospital.id || index}
                          onClick={() => openInMaps(hospital)}
                          className={`${theme.bgTertiary} rounded-lg p-4 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all group`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`font-medium ${theme.text} group-hover:text-blue-500 transition-colors`}>
                                {(hospital.name || 'Hospital').split(',')[0]}
                              </h4>
                              <p className={`text-sm ${theme.textSecondary} mt-1 line-clamp-2`}>
                                {hospital.address || hospital.name}
                              </p>
                            </div>
                            <div className="ml-2 p-2 rounded-lg bg-blue-500/20 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                              <FaMapMarkerAlt className="text-sm" />
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-3 text-blue-500 text-sm">
                            <FaExternalLinkAlt className="text-xs" />
                            <span>{t('hospitals.openInGoogleMaps')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tips Card */}
                <div className={`${theme.card} border rounded-lg p-4`}>
                  <h3 className={`font-medium ${theme.text} mb-3`}>{t('hospitals.tipsForEmergency')}</h3>
                  <ul className={`space-y-2 text-sm ${theme.textSecondary}`}>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {t('hospitals.tip1')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {t('hospitals.tip2')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {t('hospitals.tip3')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {t('hospitals.tip4')}
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Medications */}
            {activeTab === 'medications' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className={`text-2xl font-semibold ${theme.text}`}>{t('meds.heading')}</h1>
                    <p className={`${theme.textSecondary} text-sm mt-1`}>{t('meds.subtitle')}</p>
                  </div>
                  <button
                    onClick={() => setShowAddMedication(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaPlus className="text-sm" />
                    {t('meds.addMedication')}
                  </button>
                </div>

                {/* Setup Section - Show if not set up yet */}
                {!medicationData && (
                  <div className={`${theme.card} border rounded-lg p-6`}>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-500/20 rounded-lg">
                        <FaPills className="text-2xl text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-medium ${theme.text}`}>{t('meds.setupReminders')}</h3>
                        <p className={`${theme.textSecondary} text-sm mt-1`}>
                          {t('meds.setupRemindersDesc')}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <label className={`block text-sm ${theme.textSecondary} mb-1`}>{t('meds.scheduleDuration')}</label>
                            <select
                              value={medicationSchedule.duration}
                              onChange={(e) => setMedicationSchedule(prev => ({ ...prev, duration: e.target.value }))}
                              className={`w-full px-3 py-2 rounded-lg border ${theme.input}`}
                            >
                              <option value="1_week">{t('meds.week1')}</option>
                              <option value="2_weeks">{t('meds.weeks2')}</option>
                              <option value="1_month">{t('meds.month1')}</option>
                              <option value="3_months">{t('meds.months3')}</option>
                              <option value="6_months">{t('meds.months6')}</option>
                              <option value="1_year">{t('meds.year1')}</option>
                              <option value="ongoing">{t('meds.ongoing')}</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-4">
                            <label className={`flex items-center gap-2 ${theme.text}`}>
                              <input
                                type="checkbox"
                                checked={medicationSchedule.smsEnabled}
                                onChange={(e) => setMedicationSchedule(prev => ({ ...prev, smsEnabled: e.target.checked }))}
                                className="w-4 h-4"
                              />
                              {t('meds.smsAlerts')}
                            </label>
                            <label className={`flex items-center gap-2 ${theme.text}`}>
                              <input
                                type="checkbox"
                                checked={medicationSchedule.emailEnabled}
                                onChange={(e) => setMedicationSchedule(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                                className="w-4 h-4"
                              />
                              {t('meds.emailAlerts')}
                            </label>
                          </div>
                        </div>
                        <button
                          onClick={setupMedicationReminders}
                          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {t('meds.startTracking')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommended Medications */}
                {recommendedMedications.length > 0 && (
                  <div className={`${theme.card} border rounded-lg p-6`}>
                    <div className="flex items-center gap-2 mb-4">
                      <FaInfoCircle className="text-blue-500" />
                      <h3 className={`text-lg font-medium ${theme.text}`}>
                        {t('meds.recommendedFor', { type: userContext?.addiction_type?.charAt(0).toUpperCase() + userContext?.addiction_type?.slice(1) })}
                      </h3>
                    </div>
                    <p className={`${theme.textSecondary} text-sm mb-4`}>
                      {t('meds.consultProvider')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendedMedications.map((med, index) => (
                        <div key={index} className={`${theme.bgTertiary} rounded-lg p-4`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className={`font-medium ${theme.text}`}>{med.medicineName}</h4>
                              <p className={`text-sm ${theme.textSecondary}`}>{med.dosageRange}</p>
                            </div>
                            <button
                              onClick={() => {
                                setNewMedication({
                                  medicineName: med.medicineName,
                                  dosageMg: med.typicalDoseMgPerDayRange[0],
                                  dosageUnit: 'mg',
                                  frequencyPerDay: 1,
                                  reminderTimes: generateReminderTimes(1),
                                  instructions: med.notes,
                                  isRecommended: true,
                                  guideline: { sourceName: med.sourceName, sourceUrl: med.sourceUrl }
                                });
                                setShowAddMedication(true);
                              }}
                              className="text-blue-500 hover:text-blue-600"
                            >
                              <FaPlus />
                            </button>
                          </div>
                          <p className={`text-xs ${theme.textMuted} mt-2`}>{med.notes?.slice(0, 100)}...</p>
                          {med.sourceUrl && (
                            <a href={med.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline mt-1 block">
                              Source: {med.sourceName}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Patient's Medications List */}
                <div className={`${theme.card} border rounded-lg p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-medium ${theme.text}`}>{t('meds.patientMedications')}</h3>
                    {medicationData && (
                      <button
                        onClick={sendTestReminder}
                        className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                      >
                        <FaBell /> {t('meds.sendTestReminder')}
                      </button>
                    )}
                  </div>
                  
                  {!medicationData?.medications || medicationData.medications.length === 0 ? (
                    <div className={`text-center py-8 ${theme.textSecondary}`}>
                      <FaCapsules className="text-4xl mx-auto mb-3 opacity-50" />
                      <p>{t('meds.noMedsYet')}</p>
                      <p className="text-sm mt-1">{t('meds.addFromRecommendations')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {medicationData.medications.map((med) => (
                        <div key={med._id} className={`${theme.bgTertiary} rounded-lg p-4 flex items-center justify-between ${!med.isActive && 'opacity-60'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${med.isActive ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                              <FaPills className={`text-xl ${med.isActive ? 'text-green-500' : 'text-gray-500'}`} />
                            </div>
                            <div>
                              <h4 className={`font-medium ${theme.text}`}>
                                {med.medicineName}
                                {med.isRecommended && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">{t('meds.recommended')}</span>}
                              </h4>
                              <p className={`text-sm ${theme.textSecondary}`}>
                                {med.dosageMg} {med.dosageUnit} • {med.frequencyPerDay}x daily
                              </p>
                              <p className={`text-xs ${theme.textMuted}`}>
                                {t('meds.reminders', { times: med.reminderTimes?.map(rt => rt.time).join(', ') || t('meds.notSet') })}
                              </p>
                              {med.instructions && (
                                <p className={`text-xs ${theme.textMuted} mt-1`}>{med.instructions.slice(0, 60)}...</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleMedication(med._id)}
                              className={`p-2 rounded-lg ${med.isActive ? 'text-yellow-500 hover:bg-yellow-500/20' : 'text-green-500 hover:bg-green-500/20'}`}
                              title={med.isActive ? t('meds.pause') : t('meds.resume')}
                            >
                              {med.isActive ? <FaPauseCircle /> : <FaPlayCircle />}
                            </button>
                            <button
                              onClick={() => removeMedication(med._id)}
                              className="p-2 rounded-lg text-red-500 hover:bg-red-500/20"
                              title={t('meds.remove')}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Schedule Settings */}
                {medicationData && (
                  <div className={`${theme.card} border rounded-lg p-6`}>
                    <h3 className={`text-lg font-medium ${theme.text} mb-4`}>{t('sidebar.settings')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className={`block text-sm ${theme.textSecondary} mb-1`}>{t('meds.duration')}</label>
                        <select
                          value={medicationSchedule.duration}
                          onChange={(e) => setMedicationSchedule(prev => ({ ...prev, duration: e.target.value }))}
                          className={`w-full px-3 py-2 rounded-lg border ${theme.input}`}
                        >
                          <option value="1_week">{t('meds.week1')}</option>
                          <option value="2_weeks">{t('meds.weeks2')}</option>
                          <option value="1_month">{t('meds.month1')}</option>
                          <option value="3_months">{t('meds.months3')}</option>
                          <option value="6_months">{t('meds.months6')}</option>
                          <option value="1_year">{t('meds.year1')}</option>
                          <option value="ongoing">{t('meds.ongoing')}</option>
                        </select>
                      </div>
                      <div className="flex items-center">
                        <label className={`flex items-center gap-2 ${theme.text}`}>
                          <input
                            type="checkbox"
                            checked={medicationSchedule.smsEnabled}
                            onChange={(e) => setMedicationSchedule(prev => ({ ...prev, smsEnabled: e.target.checked }))}
                            className="w-4 h-4"
                          />
                          {t('meds.smsReminders')}
                        </label>
                      </div>
                      <div className="flex items-center">
                        <label className={`flex items-center gap-2 ${theme.text}`}>
                          <input
                            type="checkbox"
                            checked={medicationSchedule.emailEnabled}
                            onChange={(e) => setMedicationSchedule(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                            className="w-4 h-4"
                          />
                          {t('meds.emailReminders')}
                        </label>
                      </div>
                      <button
                        onClick={updateMedicationSchedule}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {t('meds.saveSettings')}
                      </button>
                    </div>
                    <div className={`mt-4 p-3 ${theme.bgTertiary} rounded-lg`}>
                      <p className={`text-sm ${theme.textSecondary}`}>
                        <strong>Schedule:</strong> {medicationData.scheduleDuration?.replace('_', ' ')} starting from {new Date(medicationData.scheduleStartDate).toLocaleDateString()}
                        {medicationData.scheduleEndDate && ` until ${new Date(medicationData.scheduleEndDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Add Medication Modal */}
                {showAddMedication && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`${theme.card} rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-medium ${theme.text}`}>{t('meds.addMedication')}</h3>
                        <button onClick={() => setShowAddMedication(false)} className={`${theme.textMuted} hover:${theme.text}`}>
                          <FaTimes />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm ${theme.textSecondary} mb-1`}>{t('meds.medicineName')}</label>
                          <input
                            type="text"
                            value={newMedication.medicineName}
                            onChange={(e) => setNewMedication(prev => ({ ...prev, medicineName: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-lg border ${theme.input}`}
                            placeholder="e.g., Naltrexone"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm ${theme.textSecondary} mb-1`}>{t('meds.dosage')}</label>
                            <input
                              type="number"
                              value={newMedication.dosageMg}
                              onChange={(e) => setNewMedication(prev => ({ ...prev, dosageMg: e.target.value }))}
                              className={`w-full px-3 py-2 rounded-lg border ${theme.input}`}
                              placeholder="50"
                            />
                          </div>
                          <div>
                            <label className={`block text-sm ${theme.textSecondary} mb-1`}>{t('meds.unit')}</label>
                            <select
                              value={newMedication.dosageUnit}
                              onChange={(e) => setNewMedication(prev => ({ ...prev, dosageUnit: e.target.value }))}
                              className={`w-full px-3 py-2 rounded-lg border ${theme.input}`}
                            >
                              <option value="mg">mg</option>
                              <option value="ml">ml</option>
                              <option value="tablets">tablets</option>
                              <option value="capsules">capsules</option>
                              <option value="drops">drops</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className={`block text-sm ${theme.textSecondary} mb-1`}>{t('meds.timesPerDay')}</label>
                          <select
                            value={newMedication.frequencyPerDay}
                            onChange={(e) => {
                              const freq = parseInt(e.target.value);
                              setNewMedication(prev => ({
                                ...prev,
                                frequencyPerDay: freq,
                                reminderTimes: generateReminderTimes(freq)
                              }));
                            }}
                            className={`w-full px-3 py-2 rounded-lg border ${theme.input}`}
                          >
                            <option value={1}>{t('meds.onceDaily')}</option>
                            <option value={2}>{t('meds.twiceDaily')}</option>
                            <option value={3}>{t('meds.thriceDaily')}</option>
                            <option value={4}>{t('meds.fourTimesDaily')}</option>
                          </select>
                        </div>

                        <div>
                          <label className={`block text-sm ${theme.textSecondary} mb-1`}>{t('meds.reminderTimes')}</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(newMedication.reminderTimes.length > 0 ? newMedication.reminderTimes : generateReminderTimes(newMedication.frequencyPerDay)).map((rt, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={rt.time}
                                  onChange={(e) => {
                                    const times = [...newMedication.reminderTimes];
                                    times[idx] = { ...times[idx], time: e.target.value };
                                    setNewMedication(prev => ({ ...prev, reminderTimes: times }));
                                  }}
                                  className={`flex-1 px-3 py-2 rounded-lg border ${theme.input}`}
                                />
                                <span className={`text-xs ${theme.textMuted} capitalize`}>{rt.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className={`block text-sm ${theme.textSecondary} mb-1`}>{t('meds.instructions')}</label>
                          <textarea
                            value={newMedication.instructions}
                            onChange={(e) => setNewMedication(prev => ({ ...prev, instructions: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-lg border ${theme.input}`}
                            rows={2}
                            placeholder="e.g., Take with food, Avoid alcohol"
                          />
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={() => setShowAddMedication(false)}
                            className={`flex-1 px-4 py-2 rounded-lg border ${theme.border} ${theme.text} hover:${theme.bgTertiary}`}
                          >
                            {t('common.cancel')}
                          </button>
                          <button
                            onClick={() => {
                              if (!newMedication.medicineName || !newMedication.dosageMg || !newMedication.frequencyPerDay) {
                                toast.error(t('meds.fillRequired'));
                                return;
                              }
                              addMedication({
                                ...newMedication,
                                dosageMg: parseFloat(newMedication.dosageMg),
                                reminderTimes: newMedication.reminderTimes.length > 0 
                                  ? newMedication.reminderTimes 
                                  : generateReminderTimes(newMedication.frequencyPerDay)
                              });
                            }}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            {t('meds.addMedication')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile/Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h1 className={`text-2xl font-semibold ${theme.text}`}>{t('settings.heading')}</h1>
                  <p className={`${theme.textSecondary} text-sm mt-1`}>{t('settings.subtitle')}</p>
                </div>

                {/* Guardian Info (Logged in user) */}
                <div className={`${theme.card} border rounded-lg p-6 transition-colors`}>
                  <h2 className={`font-medium ${theme.text} mb-4 flex items-center gap-2`}>
                    <FaUser className="text-blue-500" /> {t('settings.guardianProfile')}
                  </h2>
                  <div className="flex items-center gap-4 mb-6">
                    {patientData?.imageUrl ? (
                      <img src={patientData.imageUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className={`w-16 h-16 ${theme.bgTertiary} rounded-full flex items-center justify-center`}>
                        <FaUser className={`text-xl ${theme.textMuted}`} />
                      </div>
                    )}
                    <div>
                      <h2 className={`text-lg font-medium ${theme.text}`}>{patientData?.name || 'Guardian'}</h2>
                      <p className={`text-sm ${theme.textSecondary}`}>{patientData?.email || ''}</p>
                      <p className={`text-xs ${theme.textMuted}`}>{t('settings.loggedInAs')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>{t('settings.yourName')}</label>
                      <input 
                        type="text" 
                        value={guardianInfo.guardianName || ''} 
                        onChange={(e) => setGuardianInfo(prev => ({...prev, guardianName: e.target.value}))}
                        placeholder="Your name"
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.input} transition-colors`} 
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                        {t('settings.yourEmail')} <span className="text-blue-500">({t('settings.forAlerts')})</span>
                      </label>
                      <input 
                        type="email" 
                        value={guardianInfo.guardianEmail || ''} 
                        onChange={(e) => setGuardianInfo(prev => ({...prev, guardianEmail: e.target.value}))}
                        placeholder="your.email@example.com"
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.input} transition-colors`} 
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                        {t('settings.yourPhone')} <span className="text-blue-500">({t('settings.forSmsAlerts')})</span>
                      </label>
                      <input 
                        type="tel" 
                        value={guardianInfo.guardianPhone || ''} 
                        onChange={(e) => setGuardianInfo(prev => ({...prev, guardianPhone: e.target.value}))}
                        placeholder="+919876543210"
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.input} transition-colors`} 
                      />
                      <p className={`text-xs ${theme.textMuted} mt-1`}>{t('settings.includeCountryCode')}</p>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>{t('settings.relationshipToPatient')}</label>
                      <input 
                        type="text" 
                        value={guardianInfo.relationship || ''} 
                        onChange={(e) => setGuardianInfo(prev => ({...prev, relationship: e.target.value}))}
                        placeholder="e.g., Parent, Spouse, Friend"
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.input} transition-colors`} 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={updateGuardianInfo} 
                    className={`mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors`}
                  >
                    {t('settings.saveGuardianInfo')}
                  </button>
                </div>

                {/* Treating Doctor */}
                <div className={`${theme.card} border rounded-lg p-6 transition-colors`}>
                  <h2 className={`font-medium ${theme.text} mb-4 flex items-center gap-2`}>
                    <FaUserMd className="text-blue-500" /> {t('settings.treatingDoctor')}
                  </h2>
                  <p className={`text-sm ${theme.textSecondary} mb-4`}>
                    {t('settings.treatingDoctorDesc')}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>{t('settings.doctorName')}</label>
                      <input 
                        type="text" 
                        value={guardianInfo.doctorName || ''} 
                        onChange={(e) => setGuardianInfo(prev => ({...prev, doctorName: e.target.value}))}
                        placeholder="e.g., Dr. Sarah Johnson"
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.input} transition-colors`} 
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                        {t('settings.doctorEmail')} <span className="text-blue-500">({t('settings.forReportsAlerts')})</span>
                      </label>
                      <input 
                        type="email" 
                        value={guardianInfo.doctorEmail || ''} 
                        onChange={(e) => setGuardianInfo(prev => ({...prev, doctorEmail: e.target.value}))}
                        placeholder="doctor@clinic.com"
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.input} transition-colors`} 
                      />
                      <p className={`text-xs ${theme.textMuted} mt-1`}>{t('settings.doctorInviteNote')}</p>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                        {t('settings.doctorPhone')} <span className={`${theme.textMuted}`}>({t('common.optional')})</span>
                      </label>
                      <input 
                        type="tel" 
                        value={guardianInfo.doctorPhone || ''} 
                        onChange={(e) => setGuardianInfo(prev => ({...prev, doctorPhone: e.target.value}))}
                        placeholder="+919876543210"
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.input} transition-colors`} 
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-6">
                    <button 
                      onClick={updateGuardianInfo} 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      {t('settings.saveDoctorInfo')}
                    </button>
                    {guardianInfo.doctorEmail && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await axios.post(`${API_BASE_URL}/api/guardian/resend-doctor-invite`, { userId: user.id });
                            if (res.data.success) {
                              toast.success(t('settings.doctorInviteResent'));
                            }
                          } catch (err) {
                            toast.error(t('settings.doctorInviteFailed'));
                          }
                        }}
                        className={`px-4 py-2 ${theme.buttonSecondary} border ${theme.border} rounded-lg text-sm font-medium transition-colors flex items-center gap-2`}
                      >
                        <FaEnvelope className="text-xs" /> {t('settings.resendInvite')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Patient Information */}
                <div className={`${theme.card} border rounded-lg p-6 transition-colors`}>
                  <h2 className={`font-medium ${theme.text} mb-4 flex items-center gap-2`}>
                    <FaHeartbeat className="text-red-500" /> {t('settings.patientInformation')}
                  </h2>
                  <p className={`text-sm ${theme.textSecondary} mb-4`}>
                    {t('settings.patientInfoDesc')}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>{t('settings.addictionType')}</label>
                      <select 
                        value={userContext.addiction_type} 
                        onChange={(e) => setUserContext(prev => ({...prev, addiction_type: e.target.value}))} 
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 ${theme.input} transition-colors`}
                      >
                        <option value="">{t('settings.selectAddictionType')}</option>
                        <option value="Alcohol">{t('settings.alcohol')}</option>
                        <option value="Nicotine">{t('settings.nicotine')}</option>
                        <option value="Opioids">{t('settings.opioids')}</option>
                        <option value="Cannabis">{t('settings.cannabis')}</option>
                        <option value="Stimulants">{t('settings.stimulants')}</option>
                        <option value="Prescription Drugs">{t('settings.prescriptionDrugs')}</option>
                        <option value="Other">{t('settings.other')}</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>{t('settings.daysInRecovery')}</label>
                      <input 
                        type="number" 
                        min="0" 
                        value={userContext.days_in_recovery} 
                        onChange={(e) => setUserContext(prev => ({...prev, days_in_recovery: parseInt(e.target.value) || 0}))} 
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 ${theme.input} transition-colors`} 
                      />
                      <p className={`text-xs ${theme.textMuted} mt-1`}>{t('settings.daysInRecoveryNote')}</p>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>{t('settings.stressLevel', { level: userContext.current_stress_level })}</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        value={userContext.current_stress_level} 
                        onChange={(e) => setUserContext(prev => ({...prev, current_stress_level: parseInt(e.target.value)}))} 
                        className={`w-full h-2 rounded-full appearance-none cursor-pointer ${darkMode ? 'bg-zinc-700 accent-zinc-100' : 'bg-zinc-200 accent-zinc-900'}`} 
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>{t('settings.supportStyle')}</label>
                      <select 
                        value={userContext.preferred_support_style} 
                        onChange={(e) => setUserContext(prev => ({...prev, preferred_support_style: e.target.value}))} 
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 ${theme.input} transition-colors`}
                      >
                        <option value="supportive">{t('settings.supportive')}</option>
                        <option value="motivational">{t('settings.motivational')}</option>
                        <option value="direct">{t('settings.direct')}</option>
                        <option value="balanced">{t('settings.balanced')}</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={updateUserContext} 
                    className={`mt-6 px-4 py-2 ${theme.button} rounded-lg text-sm font-medium transition-colors`}
                  >
                    {t('settings.savePatientInfo')}
                  </button>
                </div>

                {/* Recovery Activity Heatmap */}
                <div className={`${theme.card} border rounded-lg p-6 transition-colors`}>
                  <h2 className={`font-medium ${theme.text} mb-4`}>{t('settings.recoveryActivity')}</h2>
                  <RecoveryHeatmap activityData={getActivityData()} darkMode={darkMode} theme={theme} />
                </div>

                {/* Theme Settings */}
                <div className={`${theme.card} border rounded-lg p-6 transition-colors`}>
                  <h2 className={`font-medium ${theme.text} mb-4`}>{t('settings.appearance')}</h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${theme.text}`}>{t('settings.darkMode')}</p>
                      <p className={`text-xs ${theme.textSecondary}`}>{t('settings.darkModeDesc')}</p>
                    </div>
                    <button 
                      onClick={toggleDarkMode}
                      className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-zinc-100' : 'bg-zinc-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${darkMode ? 'left-7 bg-zinc-900' : 'left-1 bg-white'}`}></div>
                    </button>
                  </div>
                </div>

                {/* Language Settings */}
                <div className={`${theme.card} border rounded-lg p-6 transition-colors`}>
                  <h2 className={`font-medium ${theme.text} mb-4`}>{t('settings.language')}</h2>
                  <p className={`text-sm ${theme.textSecondary} mb-4`}>{t('settings.languageDesc')}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                          lang.code === i18n.language
                            ? darkMode
                              ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                              : 'bg-zinc-900 text-white border-zinc-900'
                            : `${theme.card} ${theme.text} hover:${darkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`
                        }`}
                      >
                        <span>{lang.nativeLabel}</span>
                        <span className={`text-xs ${lang.code === i18n.language ? (darkMode ? 'text-zinc-500' : 'text-zinc-400') : theme.textMuted}`}>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Nutrition */}
            {activeTab === 'nutrition' && (() => {
              // Get user's addiction type for personalized recommendations
              const userAddiction = userContext.addiction_type?.toLowerCase() || 'general';
              const matchedSubstance = Object.keys(nutritionBySubstance).find(key => 
                userAddiction.includes(key) || key.includes(userAddiction.split(' ')[0])
              ) || 'general';
              const nutritionInfo = nutritionBySubstance[matchedSubstance];

              // Get meals suitable for user's addiction type
              const getSuitableMeals = (mealType) => {
                return recoveryMeals[mealType].filter(meal => 
                  meal.goodFor.includes(matchedSubstance) || meal.goodFor.includes('general')
                );
              };

              // Generate meal plan for a week
              const generateMealPlan = () => {
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const newPlan = days.map((day, index) => ({
                  day,
                  date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  breakfast: getSuitableMeals('breakfast')[index % getSuitableMeals('breakfast').length],
                  lunch: getSuitableMeals('lunch')[index % getSuitableMeals('lunch').length],
                  dinner: getSuitableMeals('dinner')[index % getSuitableMeals('dinner').length],
                  snacks: [getSuitableMeals('snacks')[index % getSuitableMeals('snacks').length], getSuitableMeals('snacks')[(index + 3) % getSuitableMeals('snacks').length]]
                }));
                setMealPlan(newPlan);
                saveUserData('mealPlan', newPlan);
                
                // Generate grocery list from meal plan
                const allIngredients = new Set();
                newPlan.forEach(day => {
                  [day.breakfast, day.lunch, day.dinner, ...day.snacks].forEach(meal => {
                    if (meal?.ingredients) {
                      meal.ingredients.forEach(ing => allIngredients.add(ing));
                    }
                  });
                });
                const newGroceryList = Array.from(allIngredients).map((item, i) => ({
                  id: `grocery_${i}`,
                  name: item,
                  category: categorizeIngredient(item),
                  purchased: false
                }));
                setGroceryList(newGroceryList);
                saveUserData('groceryList', newGroceryList);
                toast.success('Meal plan generated!');
              };

              // Toggle grocery item purchased
              const toggleGroceryItem = (itemId) => {
                const updated = groceryList.map(item => 
                  item.id === itemId ? { ...item, purchased: !item.purchased } : item
                );
                setGroceryList(updated);
                saveUserData('groceryList', updated);
              };

              // Add custom grocery item
              const addCustomGroceryItem = () => {
                if (!customGroceryItem.trim()) return;
                const newItem = {
                  id: `grocery_custom_${Date.now()}`,
                  name: customGroceryItem,
                  category: categorizeIngredient(customGroceryItem),
                  purchased: false
                };
                const updated = [...groceryList, newItem];
                setGroceryList(updated);
                saveUserData('groceryList', updated);
                setCustomGroceryItem('');
              };

              // Clear purchased items
              const clearPurchasedItems = () => {
                const updated = groceryList.filter(item => !item.purchased);
                setGroceryList(updated);
                saveUserData('groceryList', updated);
              };

              // Log a meal
              const logMeal = (mealType, mealData) => {
                const today = new Date().toISOString().split('T')[0];
                const existingLog = foodLog.find(log => log.date === today);
                
                if (existingLog) {
                  const updated = foodLog.map(log => 
                    log.date === today 
                      ? { ...log, [mealType]: mealData, lastUpdated: new Date().toISOString() }
                      : log
                  );
                  setFoodLog(updated);
                  saveUserData('foodLog', updated);
                } else {
                  const newLog = {
                    date: today,
                    [mealType]: mealData,
                    water: waterIntake,
                    energy: energyLevel,
                    lastUpdated: new Date().toISOString()
                  };
                  const updated = [newLog, ...foodLog];
                  setFoodLog(updated);
                  saveUserData('foodLog', updated);
                }
                toast.success(`${mealType.charAt(0).toUpperCase() + mealType.slice(1)} logged!`);
              };

              // Update water intake
              const updateWater = (amount) => {
                const newAmount = Math.max(0, Math.min(12, waterIntake + amount));
                setWaterIntake(newAmount);
                
                const today = new Date().toISOString().split('T')[0];
                const existingLog = foodLog.find(log => log.date === today);
                if (existingLog) {
                  const updated = foodLog.map(log => 
                    log.date === today ? { ...log, water: newAmount } : log
                  );
                  setFoodLog(updated);
                  saveUserData('foodLog', updated);
                }
              };

              // Get today's log
              const getTodayLog = () => {
                const today = new Date().toISOString().split('T')[0];
                return foodLog.find(log => log.date === today) || { water: 0 };
              };

              // Calculate nutrition adherence
              const calculateAdherence = () => {
                if (foodLog.length === 0) return 0;
                const last7Days = foodLog.slice(0, 7);
                let mealsLogged = 0;
                let totalMeals = last7Days.length * 3;
                last7Days.forEach(log => {
                  if (log.breakfast) mealsLogged++;
                  if (log.lunch) mealsLogged++;
                  if (log.dinner) mealsLogged++;
                });
                return Math.round((mealsLogged / totalMeals) * 100);
              };

              const nutritionSubTabs = [
                { id: 'overview', label: t('nutrition.overview'), icon: FaLeaf },
                { id: 'mealplan', label: t('nutrition.mealPlan'), icon: FaUtensils },
                { id: 'grocery', label: t('nutrition.grocery'), icon: FaShoppingCart },
                { id: 'tracker', label: t('nutrition.track'), icon: FaClipboardList },
                { id: 'progress', label: t('nutrition.progress'), icon: FaChartBar }
              ];

              return (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className={`text-2xl font-semibold ${theme.text}`}>{t('nutrition.heading')}</h1>
                      <p className={`${theme.textSecondary} text-sm mt-1`}>{t('nutrition.subtitle')}</p>
                    </div>
                  </div>

                  {/* Sub-tabs */}
                  <div className={`flex flex-wrap gap-2 p-1 ${theme.bgTertiary} rounded-lg`}>
                    {nutritionSubTabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setNutritionTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          nutritionTab === tab.id
                            ? `${theme.button}`
                            : `${theme.textSecondary} hover:${theme.text}`
                        }`}
                      >
                        <tab.icon className="text-sm" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Overview Tab */}
                  {nutritionTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Personalized Header */}
                      <div className={`${darkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} border rounded-lg p-5`}>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">{nutritionInfo.icon}</div>
                          <div className="flex-1">
                            <h2 className={`font-semibold ${theme.text} text-lg`}>
                              {userContext.addiction_type ? t('nutrition.nutritionGuideFor', { name: nutritionInfo.name }) : t('nutrition.generalGuide')}
                            </h2>
                            <p className={`text-sm ${theme.textSecondary} mt-1`}>
                              {userContext.addiction_type 
                                ? t('nutrition.personalizedRecs', { type: userContext.addiction_type.toLowerCase() })
                                : t('nutrition.setAddictionType')}
                            </p>
                            {!userContext.addiction_type && (
                              <button onClick={() => setActiveTab('profile')} className={`mt-2 text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-600'} font-medium flex items-center gap-1`}>
                                {t('nutrition.updateProfile')} <FaArrowRight className="text-xs" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Key Nutrients */}
                      <div className={`${theme.card} border rounded-lg p-5`}>
                        <h3 className={`font-medium ${theme.text} mb-4 flex items-center gap-2`}>
                          <FaAppleAlt className="text-red-500" /> {t('nutrition.keyNutrients')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {nutritionInfo.keyNutrients.map((nutrient, i) => (
                            <div key={i} className={`${theme.bgTertiary} rounded-lg p-4`}>
                              <h4 className={`font-medium ${theme.text} mb-1`}>{nutrient.name}</h4>
                              <p className={`text-xs ${theme.textSecondary} mb-2`}>{nutrient.reason}</p>
                              <div className="flex flex-wrap gap-1">
                                {nutrient.foods.map((food, j) => (
                                  <span key={j} className={`text-xs px-2 py-1 ${darkMode ? 'bg-zinc-700' : 'bg-zinc-200'} rounded-full ${theme.text}`}>
                                    {food}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommended & Avoid Foods */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={`${theme.card} border rounded-lg p-5`}>
                          <h3 className={`font-medium ${theme.text} mb-4 flex items-center gap-2`}>
                            <FaCheck className="text-emerald-500" /> {t('nutrition.recommendedFoods')}
                          </h3>
                          <ul className="space-y-2">
                            {nutritionInfo.recommendedFoods.map((food, i) => (
                              <li key={i} className={`flex items-center gap-2 text-sm ${theme.textSecondary}`}>
                                <span className="text-emerald-500">✓</span> {food}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className={`${theme.card} border rounded-lg p-5`}>
                          <h3 className={`font-medium ${theme.text} mb-4 flex items-center gap-2`}>
                            <FaTimes className="text-red-500" /> {t('nutrition.foodsToAvoid')}
                          </h3>
                          <ul className="space-y-2">
                            {nutritionInfo.avoidFoods.map((food, i) => (
                              <li key={i} className={`flex items-center gap-2 text-sm ${theme.textSecondary}`}>
                                <span className="text-red-500">✗</span> {food}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Gut Health & Hydration */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={`${theme.card} border rounded-lg p-5`}>
                          <h3 className={`font-medium ${theme.text} mb-4 flex items-center gap-2`}>
                            <FaBrain className="text-purple-500" /> {t('nutrition.gutBrain')}
                          </h3>
                          <p className={`text-sm ${theme.textSecondary} mb-3`}>
                            {t('nutrition.gutBrainDesc')}
                          </p>
                          <ul className="space-y-2">
                            {nutritionInfo.gutHealth.map((item, i) => (
                              <li key={i} className={`flex items-center gap-2 text-sm ${theme.text}`}>
                                <span>🦠</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className={`${theme.card} border rounded-lg p-5`}>
                          <h3 className={`font-medium ${theme.text} mb-4 flex items-center gap-2`}>
                            <FaTint className="text-blue-500" /> {t('nutrition.hydration')}
                          </h3>
                          <p className={`text-sm ${theme.textSecondary} mb-3`}>{nutritionInfo.hydration}</p>
                          <div className={`${theme.bgTertiary} rounded-lg p-4`}>
                            <h4 className={`text-sm font-medium ${theme.text} mb-2`}>💡 {t('nutrition.mealTimingTip')}</h4>
                            <p className={`text-xs ${theme.textSecondary}`}>{nutritionInfo.mealTiming}</p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Start */}
                      <div className={`${darkMode ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white'} rounded-lg p-5`}>
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <FaUtensils /> {t('nutrition.readyToStart')}
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-zinc-600' : 'text-zinc-300'} mb-4`}>
                          {t('nutrition.generateMealPlanDesc')}
                        </p>
                        <button onClick={() => { generateMealPlan(); setNutritionTab('mealplan'); }} className={`px-4 py-2 ${darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'} rounded-lg text-sm font-medium flex items-center gap-2`}>
                          {t('nutrition.generateMyMealPlan')} <FaArrowRight />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Meal Plan Tab */}
                  {nutritionTab === 'mealplan' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className={`font-medium ${theme.text}`}>{t('nutrition.weeklyMealPlan')}</h2>
                        <button onClick={generateMealPlan} className={`px-3 py-1.5 ${theme.button} rounded-lg text-sm font-medium flex items-center gap-2`}>
                          <FaPlus /> {t('nutrition.generateNewPlan')}
                        </button>
                      </div>

                      {mealPlan.length === 0 ? (
                        <div className={`${theme.card} border rounded-lg p-8 text-center`}>
                          <FaUtensils className={`text-4xl ${theme.textMuted} mx-auto mb-4`} />
                          <h3 className={`font-medium ${theme.text} mb-2`}>{t('nutrition.noMealPlanYet')}</h3>
                          <p className={`text-sm ${theme.textSecondary} mb-4`}>{t('nutrition.noMealPlanDesc')}</p>
                          <button onClick={generateMealPlan} className={`px-4 py-2 ${theme.button} rounded-lg text-sm font-medium`}>
                            {t('nutrition.generateMealPlan')}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {mealPlan.map((day, dayIndex) => (
                            <div key={dayIndex} className={`${theme.card} border rounded-lg overflow-hidden`}>
                              <div className={`px-4 py-3 ${theme.bgTertiary} border-b ${theme.border} flex items-center justify-between`}>
                                <span className={`font-medium ${theme.text}`}>{day.day}</span>
                                <span className={`text-xs ${theme.textSecondary}`}>{new Date(day.date).toLocaleDateString()}</span>
                              </div>
                              <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Breakfast */}
                                <div className={`${theme.bgTertiary} rounded-lg p-3`}>
                                  <p className={`text-xs ${theme.textMuted} mb-1`}>{t('nutrition.breakfast')}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">{day.breakfast?.icon}</span>
                                    <div>
                                      <p className={`text-sm font-medium ${theme.text}`}>{day.breakfast?.name}</p>
                                      <p className={`text-xs ${theme.textSecondary}`}>{day.breakfast?.calories} cal</p>
                                    </div>
                                  </div>
                                </div>
                                {/* Lunch */}
                                <div className={`${theme.bgTertiary} rounded-lg p-3`}>
                                  <p className={`text-xs ${theme.textMuted} mb-1`}>{t('nutrition.lunch')}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">{day.lunch?.icon}</span>
                                    <div>
                                      <p className={`text-sm font-medium ${theme.text}`}>{day.lunch?.name}</p>
                                      <p className={`text-xs ${theme.textSecondary}`}>{day.lunch?.calories} cal</p>
                                    </div>
                                  </div>
                                </div>
                                {/* Dinner */}
                                <div className={`${theme.bgTertiary} rounded-lg p-3`}>
                                  <p className={`text-xs ${theme.textMuted} mb-1`}>{t('nutrition.dinner')}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">{day.dinner?.icon}</span>
                                    <div>
                                      <p className={`text-sm font-medium ${theme.text}`}>{day.dinner?.name}</p>
                                      <p className={`text-xs ${theme.textSecondary}`}>{day.dinner?.calories} cal</p>
                                    </div>
                                  </div>
                                </div>
                                {/* Snacks */}
                                <div className={`${theme.bgTertiary} rounded-lg p-3`}>
                                  <p className={`text-xs ${theme.textMuted} mb-1`}>{t('nutrition.snacks')}</p>
                                  {day.snacks?.map((snack, i) => (
                                    <div key={i} className="flex items-center gap-1 text-sm">
                                      <span>{snack?.icon}</span>
                                      <span className={theme.text}>{snack?.name?.split(' ').slice(0, 2).join(' ')}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grocery Tab */}
                  {nutritionTab === 'grocery' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className={`font-medium ${theme.text}`}>{t('nutrition.groceryList')}</h2>
                        <div className="flex gap-2">
                          {groceryList.some(item => item.purchased) && (
                            <button onClick={clearPurchasedItems} className={`px-3 py-1.5 ${theme.buttonSecondary} border ${theme.border} rounded-lg text-sm`}>
                              {t('nutrition.clearPurchased')}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Add custom item */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customGroceryItem}
                          onChange={(e) => setCustomGroceryItem(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addCustomGroceryItem()}
                          placeholder={t('nutrition.addCustomItem')}
                          className={`flex-1 px-3 py-2 border rounded-lg text-sm ${theme.input}`}
                        />
                        <button onClick={addCustomGroceryItem} className={`px-4 py-2 ${theme.button} rounded-lg text-sm`}>
                          <FaPlus />
                        </button>
                      </div>

                      {groceryList.length === 0 ? (
                        <div className={`${theme.card} border rounded-lg p-8 text-center`}>
                          <FaShoppingCart className={`text-4xl ${theme.textMuted} mx-auto mb-4`} />
                          <h3 className={`font-medium ${theme.text} mb-2`}>{t('nutrition.noGroceryItems')}</h3>
                          <p className={`text-sm ${theme.textSecondary} mb-4`}>{t('nutrition.noGroceryDesc')}</p>
                          <button onClick={() => { generateMealPlan(); }} className={`px-4 py-2 ${theme.button} rounded-lg text-sm font-medium`}>
                            {t('nutrition.generateFromPlan')}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {groceryCategories.map(category => {
                            const categoryItems = groceryList.filter(item => item.category === category.id);
                            if (categoryItems.length === 0) return null;
                            return (
                              <div key={category.id} className={`${theme.card} border rounded-lg overflow-hidden`}>
                                <div className={`px-4 py-2 ${theme.bgTertiary} border-b ${theme.border}`}>
                                  <span className={`font-medium ${theme.text} flex items-center gap-2`}>
                                    <span>{category.icon}</span> {category.name}
                                    <span className={`text-xs ${theme.textMuted}`}>({categoryItems.filter(i => !i.purchased).length} remaining)</span>
                                  </span>
                                </div>
                                <div className="p-3 space-y-1">
                                  {categoryItems.map(item => (
                                    <label key={item.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:${theme.bgTertiary} transition-colors`}>
                                      <input
                                        type="checkbox"
                                        checked={item.purchased}
                                        onChange={() => toggleGroceryItem(item.id)}
                                        className={`w-4 h-4 rounded ${darkMode ? 'accent-zinc-100' : 'accent-zinc-900'}`}
                                      />
                                      <span className={`text-sm ${item.purchased ? `line-through ${theme.textMuted}` : theme.text}`}>
                                        {item.name}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tracker Tab */}
                  {nutritionTab === 'tracker' && (
                    <div className="space-y-6">
                      <h2 className={`font-medium ${theme.text}`}>{t('nutrition.dailyFoodTracker')}</h2>

                      {/* Water Tracker */}
                      <div className={`${theme.card} border rounded-lg p-5`}>
                        <h3 className={`font-medium ${theme.text} mb-4 flex items-center gap-2`}>
                          <FaTint className="text-blue-500" /> {t('nutrition.hydration')}
                        </h3>
                        <div className="flex items-center gap-4">
                          <button onClick={() => updateWater(-1)} className={`w-10 h-10 ${theme.buttonSecondary} border ${theme.border} rounded-full text-lg font-bold`}>-</button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {[...Array(8)].map((_, i) => (
                                <div key={i} className={`w-8 h-10 rounded-md ${i < waterIntake ? 'bg-blue-500' : theme.bgTertiary} transition-colors`}></div>
                              ))}
                            </div>
                            <p className={`text-sm ${theme.textSecondary} text-center`}>
                              {waterIntake} / 8 glasses <span className={waterIntake >= 8 ? 'text-emerald-500' : ''}>({waterIntake >= 8 ? `✓ ${t('nutrition.goalReached')}` : t('nutrition.moreToGo', { count: 8 - waterIntake })})</span>
                            </p>
                          </div>
                          <button onClick={() => updateWater(1)} className={`w-10 h-10 ${theme.button} rounded-full text-lg font-bold`}>+</button>
                        </div>
                      </div>

                      {/* Meal Logging */}
                      <div className={`${theme.card} border rounded-lg p-5`}>
                        <h3 className={`font-medium ${theme.text} mb-4`}>{t('nutrition.dailyFoodTracker')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                            const todayLog = getTodayLog();
                            const isLogged = todayLog[mealType];
                            return (
                              <div key={mealType} className={`${theme.bgTertiary} rounded-lg p-4`}>
                                <div className="flex items-center justify-between mb-3">
                                  <span className={`font-medium ${theme.text} capitalize`}>{mealType}</span>
                                  {isLogged && <span className="text-emerald-500 text-sm">✓ {t('nutrition.logged')}</span>}
                                </div>
                                {mealPlan.length > 0 && mealPlan[0][mealType] ? (
                                  <button
                                    onClick={() => logMeal(mealType, mealPlan[0][mealType === 'snack' ? 'snacks' : mealType])}
                                    disabled={isLogged}
                                    className={`w-full px-3 py-2 ${isLogged ? theme.bgSecondary : theme.button} rounded-lg text-sm flex items-center justify-center gap-2 ${isLogged ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <FaCheck /> {isLogged ? t('nutrition.logged') : t('nutrition.logFromPlan')}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => logMeal(mealType, { name: `Custom ${mealType}`, logged: true })}
                                    disabled={isLogged}
                                    className={`w-full px-3 py-2 ${isLogged ? theme.bgSecondary : theme.buttonSecondary} border ${theme.border} rounded-lg text-sm ${isLogged ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    {isLogged ? t('nutrition.logged') : t('nutrition.quickLog')}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Energy Level */}
                      <div className={`${theme.card} border rounded-lg p-5`}>
                        <h3 className={`font-medium ${theme.text} mb-4`}>{t('nutrition.energyLevelToday')}</h3>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm ${theme.textSecondary}`}>{t('nutrition.low')}</span>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={energyLevel}
                            onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                            className={`flex-1 h-2 rounded-full appearance-none cursor-pointer ${darkMode ? 'bg-zinc-700 accent-zinc-100' : 'bg-zinc-200 accent-zinc-900'}`}
                          />
                          <span className={`text-sm ${theme.textSecondary}`}>{t('nutrition.high')}</span>
                          <span className={`font-bold ${theme.text} min-w-[40px] text-center`}>{energyLevel}/10</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Progress Tab */}
                  {nutritionTab === 'progress' && (
                    <div className="space-y-6">
                      <h2 className={`font-medium ${theme.text}`}>{t('nutrition.nutritionProgress')}</h2>

                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className={`${theme.card} border rounded-lg p-4 text-center`}>
                          <p className={`text-3xl font-bold ${theme.text}`}>{calculateAdherence()}%</p>
                          <p className={`text-xs ${theme.textSecondary}`}>{t('nutrition.mealAdherence')}</p>
                        </div>
                        <div className={`${theme.card} border rounded-lg p-4 text-center`}>
                          <p className={`text-3xl font-bold text-blue-500`}>{waterIntake}/8</p>
                          <p className={`text-xs ${theme.textSecondary}`}>{t('nutrition.todaysWater')}</p>
                        </div>
                        <div className={`${theme.card} border rounded-lg p-4 text-center`}>
                          <p className={`text-3xl font-bold ${theme.text}`}>{foodLog.length}</p>
                          <p className={`text-xs ${theme.textSecondary}`}>{t('nutrition.daysTracked')}</p>
                        </div>
                        <div className={`${theme.card} border rounded-lg p-4 text-center`}>
                          <p className={`text-3xl font-bold text-emerald-500`}>{energyLevel}/10</p>
                          <p className={`text-xs ${theme.textSecondary}`}>{t('nutrition.energyLevel')}</p>
                        </div>
                      </div>

                      {/* Hydration Chart */}
                      <div className={`${theme.card} border rounded-lg p-5`}>
                        <h3 className={`font-medium ${theme.text} mb-4`}>{t('nutrition.weeklyHydration')}</h3>
                        <div className="h-48">
                          {foodLog.length > 0 ? (
                            <Line 
                              data={{
                                labels: foodLog.slice(0, 7).reverse().map(log => new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' })),
                                datasets: [{
                                  label: 'Water (glasses)',
                                  data: foodLog.slice(0, 7).reverse().map(log => log.water || 0),
                                  borderColor: '#3b82f6',
                                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                  fill: true,
                                  tension: 0.4
                                }]
                              }}
                              options={{
                                ...chartOptions,
                                scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 12 } }
                              }}
                            />
                          ) : (
                            <div className={`h-full flex items-center justify-center ${theme.textMuted}`}>
                              <p className="text-sm">{t('nutrition.noTrackingData')}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Craving Correlation */}
                      {historicalCravingData.length > 0 && foodLog.length > 0 && (
                        <div className={`${theme.card} border rounded-lg p-5`}>
                          <h3 className={`font-medium ${theme.text} mb-4 flex items-center gap-2`}>
                            <FaBrain className="text-purple-500" /> Nutrition & Craving Correlation
                          </h3>
                          <p className={`text-sm ${theme.textSecondary} mb-4`}>
                            Research shows that proper nutrition can reduce cravings by up to 50%. 
                            Keep tracking your meals to see the relationship between your nutrition and craving levels.
                          </p>
                          <div className={`${theme.bgTertiary} rounded-lg p-4`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-sm ${theme.text}`}>Your avg craving when eating well:</span>
                              <span className={`font-bold ${theme.text}`}>
                                {calculateAdherence() >= 70 
                                  ? (historicalCravingData.reduce((s, e) => s + e.craving_intensity, 0) / historicalCravingData.length * 0.7).toFixed(1)
                                  : '--'}/10
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tips */}
                      <div className={`${darkMode ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white'} rounded-lg p-5`}>
                        <h3 className="font-medium mb-3">💡 Nutrition Tip</h3>
                        <p className={`text-sm ${darkMode ? 'text-zinc-600' : 'text-zinc-300'}`}>
                          {nutritionInfo.mealTiming} Consistency is key - regular healthy eating patterns help stabilize mood and reduce cravings.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)}></div>}
      
      {/* SOS Emergency Button */}
      <SOSButton metrics={currentMetrics} darkMode={darkMode} />
    </div>
  );
};

export default GuardianDashboard;
