const cron = require('node-cron');
const Guardian = require('../models/Guardian');
const MedicationPlan = require('../models/MedicationPlan');
const MedicationReminder = require('../models/MedicationReminder');
const { sendExpoPushNotification } = require('../services/pushService');
const { sendMedicationReminderSms } = require('../services/smsService');
const { sendEmail } = require('../services/emailService');

/**
 * Medication Reminder Scheduler
 * Sends medication reminders to guardians based on their patient's medication plan
 * Runs at common medication times: 8 AM, 12 PM, 6 PM, 10 PM
 */

// Send medication reminders for a specific time slot
const sendMedicationReminders = async (timeSlot) => {
  console.log(`[Medication Reminders] Starting reminder job for ${timeSlot}...`);

  try {
    // Find all guardians with patient profiles and medication plans
    const guardians = await Guardian.find({
      onboardingCompleted: true,
      patientProfile: { $ne: null },
    }).populate('patientProfile');

    console.log(`[Medication Reminders] Found ${guardians.length} guardians with patients`);

    let successCount = 0;
    let failCount = 0;

    for (const guardian of guardians) {
      try {
        const plan = await MedicationPlan.findOne({
          patientProfile: guardian.patientProfile._id,
        });

        if (!plan || !plan.medications || plan.medications.length === 0) {
          continue; // Skip if no medication plan
        }

        // Determine which medications should be taken at this time
        // For simplicity, we'll send reminders for all medications that need to be taken multiple times per day
        // In a more sophisticated implementation, you'd calculate based on specific dosing schedules
        const medicationsToRemind = plan.medications.filter((med) => {
          // If frequency is 2x/day, remind at 8 AM and 6 PM
          // If frequency is 3x/day, remind at 8 AM, 12 PM, and 6 PM
          // If frequency is 4x/day, remind at all times
          const freq = med.frequencyPerDay || 1;
          if (timeSlot === 'morning' && freq >= 1) return true;
          if (timeSlot === 'noon' && freq >= 3) return true;
          if (timeSlot === 'evening' && freq >= 2) return true;
          if (timeSlot === 'night' && freq >= 4) return true;
          return false;
        });

        if (medicationsToRemind.length === 0) {
          continue; // No medications for this time slot
        }

        const medicationList = medicationsToRemind
          .map((m) => `${m.medicineName} (${m.dosageMg} mg)`)
          .join(', ');

        const title = 'Medication Reminder';
        const body = `Time for ${guardian.patientProfile.name}'s medication: ${medicationList}`;

        // Send push notifications to all registered devices
        if (guardian.expoPushTokens && guardian.expoPushTokens.length > 0) {
          for (const token of guardian.expoPushTokens) {
            try {
              await sendExpoPushNotification({
                expoPushToken: token,
                title,
                body,
                data: {
                  type: 'medication_reminder',
                  patientName: guardian.patientProfile.name,
                  medications: medicationsToRemind,
                },
              });
            } catch (pushError) {
              console.error(`[Medication Reminders] Push notification failed for token ${token}:`, pushError);
            }
          }
        }

        // Send SMS if phone number is available
        if (guardian.guardianPhone) {
          try {
            await sendMedicationReminderSms({
              to: guardian.guardianPhone,
              patientName: guardian.patientProfile.name,
            });
          } catch (smsError) {
            console.error(`[Medication Reminders] SMS failed for ${guardian.guardianPhone}:`, smsError);
          }
        }

        // Send email reminder
        try {
          await sendEmail({
            to: guardian.guardianEmail,
            subject: title,
            html: `
              <h2>Medication Reminder</h2>
              <p>It's time for <strong>${guardian.patientProfile.name}</strong>'s medication:</p>
              <ul>
                ${medicationsToRemind.map((m) => `<li>${m.medicineName} - ${m.dosageMg} mg</li>`).join('')}
              </ul>
              <p><em>Please ensure medications are taken as prescribed by the doctor.</em></p>
            `,
          });
        } catch (emailError) {
          console.error(`[Medication Reminders] Email failed for ${guardian.guardianEmail}:`, emailError);
        }

        successCount++;
        console.log(`[Medication Reminders] Sent reminder to ${guardian.guardianName} for ${guardian.patientProfile.name}`);
      } catch (error) {
        failCount++;
        console.error(`[Medication Reminders] Failed for guardian ${guardian.guardianName}:`, error.message);
      }
    }

    console.log(`[Medication Reminders] Complete for ${timeSlot}. Success: ${successCount}, Failed: ${failCount}`);
  } catch (error) {
    console.error(`[Medication Reminders] Error in ${timeSlot} reminder job:`, error);
  }
};

// Initialize medication reminder schedulers
const initMedicationReminders = () => {
  // Morning reminders: 8:00 AM IST
  cron.schedule('0 8 * * *', () => {
    console.log('[Medication Reminders] Running morning reminder cron job...');
    sendMedicationReminders('morning');
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  // Noon reminders: 12:00 PM IST
  cron.schedule('0 12 * * *', () => {
    console.log('[Medication Reminders] Running noon reminder cron job...');
    sendMedicationReminders('noon');
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  // Evening reminders: 6:00 PM IST
  cron.schedule('0 18 * * *', () => {
    console.log('[Medication Reminders] Running evening reminder cron job...');
    sendMedicationReminders('evening');
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  // Night reminders: 10:00 PM IST
  cron.schedule('0 22 * * *', () => {
    console.log('[Medication Reminders] Running night reminder cron job...');
    sendMedicationReminders('night');
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  console.log('[Medication Reminders] Medication reminder schedulers initialized');
  console.log('[Medication Reminders] Schedule: 8:00 AM, 12:00 PM, 6:00 PM, 10:00 PM');
};

// Manual trigger for testing
const triggerMedicationReminders = async (timeSlot = 'morning') => {
  console.log(`[Medication Reminders] Manually triggering ${timeSlot} reminders...`);
  await sendMedicationReminders(timeSlot);
};

// Track which reminders were already sent this minute to avoid duplicates
const sentThisMinute = new Set();

// Send reminders based on the new MedicationReminder model (user-scheduled)
const sendUserScheduledReminders = async () => {
  try {
    const reminders = await MedicationReminder.find({ isActive: true });

    if (reminders.length === 0) return;

    let successCount = 0;
    let failCount = 0;

    for (const reminder of reminders) {
      try {
        if (!reminder.isScheduleActive()) {
          continue;
        }

        // Compute current time in this reminder's timezone (not the system timezone)
        const tz = reminder.timezone || 'Asia/Kolkata';
        const currentTime = new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: tz
        });

        // Find medications that have reminders at the current time
        const medicationsToRemind = reminder.medications.filter(med => {
          if (!med.isActive) return false;
          return med.reminderTimes.some(rt => {
            if (rt.time !== currentTime) return false;
            // Deduplicate: skip if we already sent this exact reminder this minute
            const key = `${reminder.userId}_${med.medicineName}_${rt.time}`;
            if (sentThisMinute.has(key)) return false;
            sentThisMinute.add(key);
            return true;
          });
        });

        if (medicationsToRemind.length === 0) {
          continue;
        }

        // Get guardian for notifications
        const guardian = await Guardian.findOne({ userId: reminder.userId });
        
        if (!guardian) {
          console.log(`[Medication Reminders] No guardian found for user ${reminder.userId}`);
          continue;
        }

        const medicationList = medicationsToRemind
          .map(m => `${m.medicineName} (${m.dosageMg} ${m.dosageUnit})`)
          .join(', ');

        const title = 'Medication Reminder';
        const body = `Time for ${reminder.userName}'s medication: ${medicationList}`;

        // Send SMS if enabled
        if (reminder.notificationPreferences.smsEnabled && guardian.guardianPhone) {
          try {
            await sendMedicationReminderSms({
              to: guardian.guardianPhone,
              patientName: reminder.userName,
              medicationName: medicationList
            });
            console.log(`[Medication Reminders] SMS sent to ${guardian.guardianPhone}`);
          } catch (smsError) {
            console.error(`[Medication Reminders] SMS failed:`, smsError.message);
          }
        }

        // Send email if enabled
        if (reminder.notificationPreferences.emailEnabled) {
          try {
            await sendEmail({
              to: guardian.guardianEmail,
              subject: title,
              html: `
                <h2>Medication Reminder</h2>
                <p>It's time for <strong>${reminder.userName}</strong>'s medication:</p>
                <ul>
                  ${medicationsToRemind.map(m => `
                    <li>
                      <strong>${m.medicineName}</strong> - ${m.dosageMg} ${m.dosageUnit}
                      ${m.instructions ? `<br><em>${m.instructions}</em>` : ''}
                    </li>
                  `).join('')}
                </ul>
                <p><em>Please ensure medications are taken as prescribed.</em></p>
              `
            });
            console.log(`[Medication Reminders] Email sent to ${guardian.guardianEmail}`);
          } catch (emailError) {
            console.error(`[Medication Reminders] Email failed:`, emailError.message);
          }
        }

        // Send push notifications if enabled
        if (reminder.notificationPreferences.pushEnabled && guardian.expoPushTokens?.length > 0) {
          for (const token of guardian.expoPushTokens) {
            try {
              await sendExpoPushNotification({
                expoPushToken: token,
                title,
                body,
                data: {
                  type: 'medication_reminder',
                  patientName: reminder.userName,
                  medications: medicationsToRemind.map(m => m.medicineName)
                }
              });
            } catch (pushError) {
              console.error(`[Medication Reminders] Push failed:`, pushError.message);
            }
          }
        }

        successCount++;
        console.log(`[Medication Reminders] Sent reminder to ${guardian.guardianName} for ${reminder.userName}`);
      } catch (error) {
        failCount++;
        console.error(`[Medication Reminders] Error processing reminder:`, error.message);
      }
    }

    if (successCount > 0 || failCount > 0) {
      console.log(`[Medication Reminders] User-scheduled complete. Success: ${successCount}, Failed: ${failCount}`);
    }
  } catch (error) {
    console.error('[Medication Reminders] Error in user-scheduled reminders:', error);
  }
};

// Initialize per-minute checker for user-scheduled reminders using setInterval
// (node-cron's per-minute schedule misses executions under WSL2 / heavy event loops)
let userScheduledRunning = false;
let lastCheckedMinute = '';

const initUserScheduledReminders = () => {
  setInterval(async () => {
    // Only run once per calendar minute
    const now = new Date();
    const minute = `${now.getUTCHours()}:${now.getUTCMinutes()}`;
    if (minute === lastCheckedMinute) return;
    lastCheckedMinute = minute;

    if (userScheduledRunning) return;
    userScheduledRunning = true;
    try {
      await sendUserScheduledReminders();
    } catch (err) {
      console.error('[Medication Reminders] setInterval tick error:', err.message);
    } finally {
      userScheduledRunning = false;
    }
  }, 15000); // check every 15 seconds so we never miss a minute boundary

  // Clear the dedup set at the start of each new minute
  setInterval(() => sentThisMinute.clear(), 60000);

  console.log('[Medication Reminders] User-scheduled reminder checker initialized (setInterval, checks every 15s)');
};

module.exports = {
  initMedicationReminders,
  sendMedicationReminders,
  triggerMedicationReminders,
  initUserScheduledReminders,
  sendUserScheduledReminders
};
