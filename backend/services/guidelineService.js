const path = require('path');
const fs = require('fs');

let nutritionGuidelines;
let dosageGuidelines;

const loadJson = (filename) => {
  const fullPath = path.join(__dirname, '..', 'utils', filename);
  if (!fs.existsSync(fullPath)) return null;
  const raw = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(raw);
};

const getAgeGroup = (age) => {
  if (typeof age !== 'number') return null;
  if (age < 13) return '<13';
  if (age <= 17) return '13-17';
  if (age <= 40) return '18-40';
  if (age <= 65) return '40-65';
  return '65+';
};

const normaliseAddictionType = (type) => {
  if (!type) return null;
  return String(type).trim();
};

const ensureNutritionGuidelines = () => {
  if (!nutritionGuidelines) {
    nutritionGuidelines = loadJson('nutritionGuidelines.json') || {};
  }
};

const ensureDosageGuidelines = () => {
  if (!dosageGuidelines) {
    dosageGuidelines = loadJson('dosageGuidelines.json') || {};
  }
};

exports.getNutritionGuidance = ({ addictionType, age }) => {
  ensureNutritionGuidelines();
  const normalisedType = normaliseAddictionType(addictionType);
  const ageGroup = getAgeGroup(age);
  if (!normalisedType || !ageGroup) {
    return { consultDoctorOnly: true, reason: 'Missing addiction type or age for guidelines.' };
  }

  const byType = nutritionGuidelines[normalisedType];
  if (!byType) {
    return { consultDoctorOnly: true, reason: 'No nutrition guidelines for this addiction type.' };
  }

  const guideline = byType[ageGroup];
  if (!guideline) {
    return { consultDoctorOnly: true, reason: 'No nutrition guidelines for this age group.' };
  }

  return {
    consultDoctorOnly: false,
    guideline,
  };
};

exports.getDosageGuidanceForPlan = ({ addictionType, age, medications }) => {
  ensureDosageGuidelines();
  const normalisedType = normaliseAddictionType(addictionType);
  const ageGroup = getAgeGroup(age);
  if (!normalisedType || !ageGroup || !Array.isArray(medications)) {
    return { consultDoctorOnly: true, medications: [] };
  }

  const byType = dosageGuidelines[normalisedType];
  if (!byType) {
    return { consultDoctorOnly: true, medications: medications.map(m => ({ ...m, guideline: null })) };
  }

  const entries = byType[ageGroup] || [];
  if (!entries.length) {
    return { consultDoctorOnly: true, medications: medications.map(m => ({ ...m, guideline: null })) };
  }

  const enriched = medications.map((m) => {
    const match = entries.find(
      (e) => e.medicineName.toLowerCase() === String(m.medicineName).toLowerCase()
    );
    if (!match) return { ...m, guideline: null };
    return {
      ...m,
      guideline: {
        sourceName: match.sourceName,
        sourceUrl: match.sourceUrl,
        typicalDoseMgPerDayRange: match.typicalDoseMgPerDayRange,
        notes: match.notes,
      },
    };
  });

  return { consultDoctorOnly: false, medications: enriched };
};

