const mongoose = require('mongoose');

const doctorMeetingSchema = new mongoose.Schema({
  // Doctor information
  doctorEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  doctorName: {
    type: String,
    trim: true,
    default: ''
  },
  // Patient/Guardian information
  patientUserId: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    trim: true,
    default: ''
  },
  guardianEmail: {
    type: String,
    trim: true
  },
  guardianName: {
    type: String,
    trim: true
  },
  // Meeting schedule
  scheduledDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    startTime: {
      type: String, // Format: "HH:MM" (24-hour)
      required: true
    },
    endTime: {
      type: String, // Format: "HH:MM" (24-hour)
      required: true
    }
  },
  // Meeting type and details
  meetingType: {
    type: String,
    enum: ['video', 'in-person'],
    required: true
  },
  // For video meetings
  meetingLink: {
    type: String,
    trim: true,
    default: ''
  },
  // For in-person meetings
  location: {
    address: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  // Meeting status
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  // Reason for the meeting
  reason: {
    type: String,
    trim: true,
    default: ''
  },
  // Doctor's notes
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  // Risk level at time of scheduling (for context)
  riskLevelAtScheduling: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    default: 'moderate'
  },
  // Notification tracking
  notificationsSent: {
    guardianEmail: {
      type: Boolean,
      default: false
    },
    guardianSms: {
      type: Boolean,
      default: false
    },
    reminderSent: {
      type: Boolean,
      default: false
    }
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
doctorMeetingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
doctorMeetingSchema.index({ doctorEmail: 1, scheduledDate: 1 });
doctorMeetingSchema.index({ patientUserId: 1, status: 1 });
doctorMeetingSchema.index({ scheduledDate: 1, status: 1 });

const DoctorMeeting = mongoose.model('DoctorMeeting', doctorMeetingSchema);

module.exports = DoctorMeeting;
