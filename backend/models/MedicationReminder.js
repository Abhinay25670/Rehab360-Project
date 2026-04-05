const mongoose = require('mongoose');

// Schema for individual reminder times
const reminderTimeSchema = new mongoose.Schema({
  time: {
    type: String,  // Format: "HH:MM" (24-hour)
    required: true
  },
  label: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night', 'custom'],
    default: 'custom'
  }
}, { _id: false });

// Schema for each medication
const medicationSchema = new mongoose.Schema({
  medicineName: {
    type: String,
    required: true,
    trim: true
  },
  dosageMg: {
    type: Number,
    required: true,
    min: 0
  },
  dosageUnit: {
    type: String,
    enum: ['mg', 'ml', 'tablets', 'capsules', 'drops'],
    default: 'mg'
  },
  frequencyPerDay: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  reminderTimes: [reminderTimeSchema],
  instructions: {
    type: String,
    trim: true  // e.g., "Take with food", "Take on empty stomach"
  },
  isRecommended: {
    type: Boolean,
    default: false  // true if from our guidelines, false if custom
  },
  guideline: {
    sourceName: { type: String, trim: true },
    sourceUrl: { type: String, trim: true }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date  // Optional - for fixed duration medications
  }
});

// Main medication reminder schema
const medicationReminderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
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
  guardianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guardian'
  },
  addictionType: {
    type: String,
    trim: true
  },
  ageGroup: {
    type: String,
    enum: ['18-40', '41-65', '65+'],
    default: '18-40'
  },
  medications: [medicationSchema],
  
  // Schedule duration
  scheduleDuration: {
    type: String,
    enum: ['1_week', '2_weeks', '1_month', '3_months', '6_months', '1_year', 'ongoing'],
    default: '1_month'
  },
  scheduleStartDate: {
    type: Date,
    default: Date.now
  },
  scheduleEndDate: {
    type: Date
  },
  
  // Notification preferences
  notificationPreferences: {
    smsEnabled: {
      type: Boolean,
      default: true
    },
    emailEnabled: {
      type: Boolean,
      default: true
    },
    pushEnabled: {
      type: Boolean,
      default: true
    },
    reminderMinutesBefore: {
      type: Number,
      default: 5  // Send reminder 5 minutes before scheduled time
    }
  },
  
  // Tracking
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Calculate end date based on duration
medicationReminderSchema.pre('save', function(next) {
  if (this.scheduleDuration && this.scheduleStartDate) {
    const startDate = new Date(this.scheduleStartDate);
    let endDate;
    
    switch(this.scheduleDuration) {
      case '1_week':
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case '2_weeks':
        endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        break;
      case '1_month':
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case '3_months':
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case '6_months':
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case '1_year':
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'ongoing':
        endDate = null;
        break;
      default:
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
    }
    
    this.scheduleEndDate = endDate;
  }
  next();
});

// Method to check if schedule is still active
medicationReminderSchema.methods.isScheduleActive = function() {
  if (!this.isActive) return false;
  if (this.scheduleDuration === 'ongoing') return true;
  if (!this.scheduleEndDate) return true;
  return new Date() < new Date(this.scheduleEndDate);
};

// Method to get next reminder time
medicationReminderSchema.methods.getNextReminderTime = function() {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  let nextReminder = null;
  let nextMedicine = null;
  
  for (const med of this.medications) {
    if (!med.isActive) continue;
    
    for (const reminder of med.reminderTimes) {
      if (reminder.time > currentTime) {
        if (!nextReminder || reminder.time < nextReminder) {
          nextReminder = reminder.time;
          nextMedicine = med.medicineName;
        }
      }
    }
  }
  
  return nextReminder ? { time: nextReminder, medicine: nextMedicine } : null;
};

const MedicationReminder = mongoose.model('MedicationReminder', medicationReminderSchema);

module.exports = MedicationReminder;
