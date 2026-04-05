const mongoose = require('mongoose');

const guardianSchema = new mongoose.Schema({
  // User identification (from Clerk)
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  userEmail: { 
    type: String, 
    required: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  
  // Guardian information
  guardianEmail: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true
  },
  guardianName: { 
    type: String, 
    required: true,
    trim: true
  },
  guardianPhone: { 
    type: String,
    trim: true
  },
  relationship: { 
    type: String,
    enum: ['Parent', 'Spouse', 'Sibling', 'Friend', 'Counselor', 'Other'],
    default: 'Other'
  },

  // Doctor information
  doctorEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  doctorName: {
    type: String,
    trim: true,
    default: ''
  },
  doctorPhone: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Notification preferences
  notificationPreferences: {
    highRiskAlerts: { 
      type: Boolean, 
      default: true 
    },
    sosAlerts: { 
      type: Boolean, 
      default: true 
    },
    weeklyReports: { 
      type: Boolean, 
      default: true 
    }
  },
  
  // Cooldown tracking (prevent spam)
  lastHighRiskAlert: {
    type: Date,
    default: null
  },
  lastSOSAlert: {
    type: Date,
    default: null
  },
  
  // Onboarding status
  onboardingCompleted: { 
    type: Boolean, 
    default: false 
  },

  // Expo push tokens registered from the guardian mobile app
  expoPushTokens: {
    type: [String],
    default: [],
  },

  // Link to a single patient profile managed by this guardian
  patientProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientProfile',
    default: null
  },
  
  // Email verification (optional future enhancement)
  guardianEmailVerified: {
    type: Boolean,
    default: false
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
guardianSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Check if high risk alert can be sent (4 hour cooldown)
guardianSchema.methods.canSendHighRiskAlert = function() {
  if (!this.lastHighRiskAlert) return true;
  const cooldownHours = 4;
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  return (Date.now() - this.lastHighRiskAlert.getTime()) > cooldownMs;
};

// Check if SOS alert can be sent (1 hour cooldown)
guardianSchema.methods.canSendSOSAlert = function() {
  if (!this.lastSOSAlert) return true;
  const cooldownHours = 1;
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  return (Date.now() - this.lastSOSAlert.getTime()) > cooldownMs;
};

// Get time until next high risk alert can be sent
guardianSchema.methods.getHighRiskCooldownRemaining = function() {
  if (!this.lastHighRiskAlert) return 0;
  const cooldownHours = 4;
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const elapsed = Date.now() - this.lastHighRiskAlert.getTime();
  const remaining = cooldownMs - elapsed;
  return remaining > 0 ? remaining : 0;
};

// Get time until next SOS alert can be sent
guardianSchema.methods.getSOSCooldownRemaining = function() {
  if (!this.lastSOSAlert) return 0;
  const cooldownHours = 1;
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const elapsed = Date.now() - this.lastSOSAlert.getTime();
  const remaining = cooldownMs - elapsed;
  return remaining > 0 ? remaining : 0;
};

const Guardian = mongoose.model('Guardian', guardianSchema);

module.exports = Guardian;
