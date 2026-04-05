const mongoose = require('mongoose');

const alertHistorySchema = new mongoose.Schema({
  // User identification
  userId: { 
    type: String, 
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  
  // Guardian information
  guardianEmail: { 
    type: String, 
    required: true 
  },
  guardianName: {
    type: String,
    required: true
  },
  
  // Alert details
  alertType: { 
    type: String, 
    required: true,
    enum: ['high_risk', 'sos', 'weekly_report'],
    index: true
  },
  
  // Alert content/metrics at time of alert
  metrics: {
    riskScore: Number,
    factors: [String],
    recommendations: [String],
    // For weekly reports
    weeklyStats: {
      avgRiskScore: Number,
      cravingCount: Number,
      avgSleepQuality: Number,
      avgStressLevel: Number,
      daysLogged: Number,
      soberStreak: Number,
      trend: String // 'improving', 'stable', 'declining'
    },
    // For SOS
    sosMessage: String
  },
  
  // Delivery status
  status: {
    type: String,
    enum: ['sent', 'failed', 'pending'],
    default: 'sent'
  },
  messageId: {
    type: String // Email provider message ID
  },
  errorMessage: {
    type: String
  },
  
  // Timestamps
  sentAt: { 
    type: Date, 
    default: Date.now,
    index: true
  }
});

// Index for querying recent alerts by user
alertHistorySchema.index({ userId: 1, sentAt: -1 });
alertHistorySchema.index({ alertType: 1, sentAt: -1 });

// Static method to get recent alerts for a user
alertHistorySchema.statics.getRecentAlerts = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ sentAt: -1 })
    .limit(limit)
    .exec();
};

// Static method to get alerts by type for a user
alertHistorySchema.statics.getAlertsByType = function(userId, alertType, limit = 10) {
  return this.find({ userId, alertType })
    .sort({ sentAt: -1 })
    .limit(limit)
    .exec();
};

// Static method to count alerts in a time period
alertHistorySchema.statics.countAlertsInPeriod = function(userId, alertType, startDate, endDate) {
  return this.countDocuments({
    userId,
    alertType,
    sentAt: { $gte: startDate, $lte: endDate }
  });
};

// Static method to get all users who need weekly reports
alertHistorySchema.statics.getUsersForWeeklyReport = async function() {
  const Guardian = require('./Guardian');
  return Guardian.find({
    onboardingCompleted: true,
    'notificationPreferences.weeklyReports': true
  });
};

const AlertHistory = mongoose.model('AlertHistory', alertHistorySchema);

module.exports = AlertHistory;
