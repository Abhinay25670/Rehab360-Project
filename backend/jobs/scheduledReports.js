const cron = require('node-cron');
const Guardian = require('../models/Guardian');
const Doctor = require('../models/Doctor');
const AlertHistory = require('../models/AlertHistory');
const { sendWeeklyReport, sendDoctorWeeklyReport } = require('../services/emailService');
const { sendExpoPushNotification } = require('../services/pushService');

/**
 * Weekly Report Scheduler
 * Sends weekly recovery reports to all guardians with weeklyReports enabled
 * Runs every Sunday at 9:00 AM
 */

// Calculate weekly stats for a user (placeholder - in production, fetch from actual user data)
const calculateWeeklyStats = async (userId) => {
  // In a full implementation, you would:
  // 1. Fetch user's craving data, sleep data, etc. from the past week
  // 2. Calculate averages and trends
  // 3. Return the aggregated stats
  
  // For now, return sample data structure
  // This should be replaced with actual data fetching logic
  return {
    daysLogged: Math.floor(Math.random() * 5) + 2, // 2-7 days
    soberStreak: Math.floor(Math.random() * 30) + 1, // 1-30 days
    avgRiskScore: Math.floor(Math.random() * 50) + 20, // 20-70
    cravingCount: Math.floor(Math.random() * 10), // 0-10
    avgSleepQuality: Math.floor(Math.random() * 4) + 5, // 5-9
    avgStressLevel: Math.floor(Math.random() * 5) + 3, // 3-8
    trend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)]
  };
};

// Send weekly reports to all eligible guardians
const sendWeeklyReports = async () => {
  console.log('[Scheduler] Starting weekly report job...');
  
  try {
    // Find all guardians with weekly reports enabled
    const guardians = await Guardian.find({
      onboardingCompleted: true,
      'notificationPreferences.weeklyReports': true
    });

    console.log(`[Scheduler] Found ${guardians.length} guardians to notify`);

    let successCount = 0;
    let failCount = 0;

    for (const guardian of guardians) {
      try {
        // Calculate weekly stats for this user
        const weeklyStats = await calculateWeeklyStats(guardian.userId);

        // Send push notifications to all registered devices
        if (guardian.expoPushTokens && guardian.expoPushTokens.length > 0) {
          const pushTitle = 'Weekly Recovery Report';
          const pushBody = `${guardian.userName}'s weekly report is ready. Check your email for details.`;
          
          for (const token of guardian.expoPushTokens) {
            try {
              await sendExpoPushNotification({
                expoPushToken: token,
                title: pushTitle,
                body: pushBody,
                data: {
                  type: 'weekly_report',
                  userName: guardian.userName,
                  weeklyStats,
                },
              });
            } catch (pushError) {
              console.error(`[Scheduler] Push notification failed for token ${token}:`, pushError);
            }
          }
        }

        // Send the email report
        const result = await sendWeeklyReport({
          guardianEmail: guardian.guardianEmail,
          guardianName: guardian.guardianName,
          userName: guardian.userName,
          weeklyStats
        });

        // Log the alert
        const alertLog = new AlertHistory({
          userId: guardian.userId,
          userName: guardian.userName,
          userEmail: guardian.userEmail,
          guardianEmail: guardian.guardianEmail,
          guardianName: guardian.guardianName,
          alertType: 'weekly_report',
          metrics: {
            weeklyStats
          },
          status: 'sent',
          messageId: result.messageId
        });
        await alertLog.save();

        successCount++;
        console.log(`[Scheduler] Sent weekly report for user: ${guardian.userName}`);
      } catch (error) {
        failCount++;
        console.error(`[Scheduler] Failed to send report for user ${guardian.userName}:`, error.message);
        
        // Log failed alert
        try {
          const alertLog = new AlertHistory({
            userId: guardian.userId,
            userName: guardian.userName,
            userEmail: guardian.userEmail,
            guardianEmail: guardian.guardianEmail,
            guardianName: guardian.guardianName,
            alertType: 'weekly_report',
            metrics: {},
            status: 'failed',
            errorMessage: error.message
          });
          await alertLog.save();
        } catch (logError) {
          console.error('[Scheduler] Failed to log error:', logError);
        }
      }
    }

    console.log(`[Scheduler] Guardian weekly reports complete. Success: ${successCount}, Failed: ${failCount}`);

    // Send weekly reports to doctors
    await sendDoctorWeeklyReports();
  } catch (error) {
    console.error('[Scheduler] Error in weekly report job:', error);
  }
};

const sendDoctorWeeklyReports = async () => {
  console.log('[Scheduler] Starting doctor weekly reports...');
  
  try {
    const doctors = await Doctor.find({
      'patients.0': { $exists: true }
    });

    console.log(`[Scheduler] Found ${doctors.length} doctors with patients`);

    let doctorSuccessCount = 0;
    let doctorFailCount = 0;

    for (const doctor of doctors) {
      try {
        const patientReports = [];

        for (const patient of doctor.patients) {
          try {
            const weeklyStats = await calculateWeeklyStats(patient.userId);
            patientReports.push({
              patientName: patient.patientName || 'Patient',
              guardianEmail: patient.guardianEmail || '',
              weeklyStats
            });
          } catch (patientError) {
            console.error(`[Scheduler] Failed to get stats for patient ${patient.userId}:`, patientError.message);
            patientReports.push({
              patientName: patient.patientName || 'Patient',
              guardianEmail: patient.guardianEmail || '',
              weeklyStats: {}
            });
          }
        }

        if (patientReports.length > 0) {
          await sendDoctorWeeklyReport({
            doctorEmail: doctor.email,
            doctorName: doctor.name || 'Doctor',
            patientReports
          });
          doctorSuccessCount++;
          console.log(`[Scheduler] Doctor weekly report sent to: ${doctor.email} (${patientReports.length} patients)`);
        }
      } catch (error) {
        doctorFailCount++;
        console.error(`[Scheduler] Failed to send doctor report to ${doctor.email}:`, error.message);
      }
    }

    console.log(`[Scheduler] Doctor weekly reports complete. Success: ${doctorSuccessCount}, Failed: ${doctorFailCount}`);
  } catch (error) {
    console.error('[Scheduler] Error in doctor weekly report job:', error);
  }
};

// Initialize the scheduler
const initScheduler = () => {
  // Schedule for Sunday at 9:00 AM
  // Cron format: minute hour day-of-month month day-of-week
  // '0 9 * * 0' = At 09:00 on Sunday
  cron.schedule('0 9 * * 0', () => {
    console.log('[Scheduler] Running weekly report cron job...');
    sendWeeklyReports();
  }, {
    scheduled: true,
    timezone: 'America/New_York' // Adjust to your timezone
  });

  console.log('[Scheduler] Weekly report scheduler initialized (Sundays at 9:00 AM)');
};

// Manual trigger for testing
const triggerWeeklyReports = async () => {
  console.log('[Scheduler] Manually triggering weekly reports...');
  await sendWeeklyReports();
};

module.exports = {
  initScheduler,
  sendWeeklyReports,
  triggerWeeklyReports
};
