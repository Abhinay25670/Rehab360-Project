const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema(
  {
    guardianUserId: {
      // Clerk user ID for the guardian who owns this patient profile
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'PreferNotToSay'],
      default: 'PreferNotToSay',
    },
    addictionType: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe', 'Unknown'],
      default: 'Unknown',
    },
    treatingDoctor: {
      name: { type: String, trim: true },
      contactPhone: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

const PatientProfile = mongoose.model('PatientProfile', patientProfileSchema);

module.exports = PatientProfile;

