const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    required: true,
    min: 0,
    max: 6
  },
  startTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: true
  },
  endTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const doctorSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  specialty: {
    type: String,
    trim: true,
    default: 'Addiction Medicine'
  },
  // Array of patient userIds this doctor is assigned to
  patients: [{
    userId: {
      type: String,
      required: true
    },
    patientName: {
      type: String,
      default: ''
    },
    guardianEmail: {
      type: String,
      default: ''
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Doctor's availability slots for scheduling
  availabilitySlots: [availabilitySlotSchema],
  // Clerk user ID if doctor has signed up
  clerkUserId: {
    type: String,
    sparse: true
  },
  // Has the doctor activated their account
  isActivated: {
    type: Boolean,
    default: false
  },
  // Invitation token for first-time login
  invitationToken: {
    type: String,
    sparse: true
  },
  invitationSentAt: {
    type: Date
  },
  lastLoginAt: {
    type: Date
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

// Update the updatedAt field before saving
doctorSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
doctorSchema.index({ email: 1 });
doctorSchema.index({ 'patients.userId': 1 });
doctorSchema.index({ clerkUserId: 1 });

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
