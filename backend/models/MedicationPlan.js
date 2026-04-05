const mongoose = require('mongoose');

const medicationEntrySchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    dosageMg: {
      type: Number,
      required: true,
      min: 0,
    },
    frequencyPerDay: {
      type: Number,
      required: true,
      min: 1,
    },
    notes: {
      type: String,
      trim: true,
    },
    // For future guideline annotation (evidence-based table)
    guideline: {
      sourceName: { type: String, trim: true },
      sourceUrl: { type: String, trim: true },
    },
  },
  { _id: false }
);

const medicationPlanSchema = new mongoose.Schema(
  {
    patientProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
      required: true,
      index: true,
    },
    ageGroup: {
      type: String,
      trim: true,
    },
    addictionType: {
      type: String,
      trim: true,
    },
    medications: [medicationEntrySchema],
    prescribedBy: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const MedicationPlan = mongoose.model('MedicationPlan', medicationPlanSchema);

module.exports = MedicationPlan;

