const express = require('express');
const router = express.Router();
const MedicationReminder = require('../models/MedicationReminder');
const Guardian = require('../models/Guardian');
const dosageGuidelines = require('../utils/dosageGuidelines.json');
const { sendMedicationReminderSms } = require('../services/smsService');
const { sendEmail } = require('../services/emailService');

/**
 * GET /api/medications/guidelines/:addictionType
 * Get recommended medications based on addiction type
 */
router.get('/guidelines/:addictionType', (req, res) => {
  try {
    const { addictionType } = req.params;
    const { ageGroup = '18-40' } = req.query;

    const guidelines = dosageGuidelines[addictionType];
    
    if (!guidelines) {
      return res.json({
        success: true,
        data: [],
        message: `No medication guidelines found for ${addictionType}`
      });
    }

    const ageSpecificGuidelines = guidelines[ageGroup] || guidelines['18-40'] || [];

    res.json({
      success: true,
      data: ageSpecificGuidelines.map(med => ({
        ...med,
        isRecommended: true,
        dosageRange: `${med.typicalDoseMgPerDayRange[0]}-${med.typicalDoseMgPerDayRange[1]} mg/day`
      })),
      addictionType,
      ageGroup
    });
  } catch (error) {
    console.error('Error fetching medication guidelines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medication guidelines',
      error: error.message
    });
  }
});

/**
 * GET /api/medications/all-guidelines
 * Get all available addiction types and their medications
 */
router.get('/all-guidelines', (req, res) => {
  try {
    const addictionTypes = Object.keys(dosageGuidelines);
    
    res.json({
      success: true,
      addictionTypes,
      guidelines: dosageGuidelines
    });
  } catch (error) {
    console.error('Error fetching all guidelines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guidelines',
      error: error.message
    });
  }
});

/**
 * GET /api/medications/:userId
 * Get user's medication reminder settings
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    let medicationReminder = await MedicationReminder.findOne({ userId });

    if (!medicationReminder) {
      return res.json({
        success: true,
        data: null,
        message: 'No medication reminders set up yet'
      });
    }

    res.json({
      success: true,
      data: medicationReminder
    });
  } catch (error) {
    console.error('Error fetching medication reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medication reminders',
      error: error.message
    });
  }
});

/**
 * POST /api/medications/setup
 * Set up or update medication reminder system
 */
router.post('/setup', async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      userName,
      addictionType,
      ageGroup,
      scheduleDuration,
      notificationPreferences,
      timezone
    } = req.body;

    if (!userId || !userEmail) {
      return res.status(400).json({
        success: false,
        message: 'userId and userEmail are required'
      });
    }

    // Find or create medication reminder
    let medicationReminder = await MedicationReminder.findOne({ userId });

    if (medicationReminder) {
      // Update existing
      medicationReminder.userEmail = userEmail || medicationReminder.userEmail;
      medicationReminder.userName = userName || medicationReminder.userName;
      medicationReminder.addictionType = addictionType || medicationReminder.addictionType;
      medicationReminder.ageGroup = ageGroup || medicationReminder.ageGroup;
      medicationReminder.scheduleDuration = scheduleDuration || medicationReminder.scheduleDuration;
      if (notificationPreferences) {
        medicationReminder.notificationPreferences = {
          ...medicationReminder.notificationPreferences,
          ...notificationPreferences
        };
      }
      if (timezone) medicationReminder.timezone = timezone;
    } else {
      // Create new
      medicationReminder = new MedicationReminder({
        userId,
        userEmail,
        userName,
        addictionType,
        ageGroup: ageGroup || '18-40',
        scheduleDuration: scheduleDuration || '1_month',
        notificationPreferences: notificationPreferences || {},
        timezone: timezone || 'Asia/Kolkata',
        medications: []
      });
    }

    // Link to guardian if exists
    const guardian = await Guardian.findOne({ userId });
    if (guardian) {
      medicationReminder.guardianId = guardian._id;
    }

    await medicationReminder.save();

    res.json({
      success: true,
      message: 'Medication reminder system set up successfully',
      data: medicationReminder
    });
  } catch (error) {
    console.error('Error setting up medication reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set up medication reminders',
      error: error.message
    });
  }
});

/**
 * POST /api/medications/add
 * Add a medication to the reminder list
 */
router.post('/add', async (req, res) => {
  try {
    const {
      userId,
      medicineName,
      dosageMg,
      dosageUnit,
      frequencyPerDay,
      reminderTimes,
      instructions,
      isRecommended,
      guideline,
      startDate,
      endDate
    } = req.body;

    if (!userId || !medicineName || !dosageMg || !frequencyPerDay) {
      return res.status(400).json({
        success: false,
        message: 'userId, medicineName, dosageMg, and frequencyPerDay are required'
      });
    }

    let medicationReminder = await MedicationReminder.findOne({ userId });

    if (!medicationReminder) {
      return res.status(404).json({
        success: false,
        message: 'Please set up medication reminders first'
      });
    }

    // Generate default reminder times based on frequency if not provided
    let times = reminderTimes;
    if (!times || times.length === 0) {
      times = generateDefaultReminderTimes(frequencyPerDay);
    }

    const newMedication = {
      medicineName,
      dosageMg,
      dosageUnit: dosageUnit || 'mg',
      frequencyPerDay,
      reminderTimes: times,
      instructions: instructions || '',
      isRecommended: isRecommended || false,
      guideline: guideline || {},
      isActive: true,
      startDate: startDate || new Date(),
      endDate: endDate || null
    };

    medicationReminder.medications.push(newMedication);
    await medicationReminder.save();

    console.log(`[Medication] Added ${medicineName} for user ${userId}`);

    res.json({
      success: true,
      message: `${medicineName} added to your medication list`,
      data: medicationReminder
    });
  } catch (error) {
    console.error('Error adding medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add medication',
      error: error.message
    });
  }
});

/**
 * PUT /api/medications/update/:medicationId
 * Update a specific medication
 */
router.put('/update/:medicationId', async (req, res) => {
  try {
    const { medicationId } = req.params;
    const { userId, ...updateData } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    const medicationReminder = await MedicationReminder.findOne({ userId });

    if (!medicationReminder) {
      return res.status(404).json({
        success: false,
        message: 'Medication reminders not found'
      });
    }

    const medicationIndex = medicationReminder.medications.findIndex(
      med => med._id.toString() === medicationId
    );

    if (medicationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Update medication fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        medicationReminder.medications[medicationIndex][key] = updateData[key];
      }
    });

    await medicationReminder.save();

    res.json({
      success: true,
      message: 'Medication updated successfully',
      data: medicationReminder
    });
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update medication',
      error: error.message
    });
  }
});

/**
 * DELETE /api/medications/remove/:medicationId
 * Remove a medication from the list
 */
router.delete('/remove/:medicationId', async (req, res) => {
  try {
    const { medicationId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    const medicationReminder = await MedicationReminder.findOne({ userId });

    if (!medicationReminder) {
      return res.status(404).json({
        success: false,
        message: 'Medication reminders not found'
      });
    }

    const medicationIndex = medicationReminder.medications.findIndex(
      med => med._id.toString() === medicationId
    );

    if (medicationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    const removedMed = medicationReminder.medications[medicationIndex].medicineName;
    medicationReminder.medications.splice(medicationIndex, 1);
    await medicationReminder.save();

    res.json({
      success: true,
      message: `${removedMed} removed from your medication list`,
      data: medicationReminder
    });
  } catch (error) {
    console.error('Error removing medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove medication',
      error: error.message
    });
  }
});

/**
 * PUT /api/medications/schedule
 * Update schedule duration and preferences
 */
router.put('/schedule', async (req, res) => {
  try {
    const {
      userId,
      scheduleDuration,
      scheduleStartDate,
      notificationPreferences
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    const medicationReminder = await MedicationReminder.findOne({ userId });

    if (!medicationReminder) {
      return res.status(404).json({
        success: false,
        message: 'Medication reminders not found'
      });
    }

    if (scheduleDuration) {
      medicationReminder.scheduleDuration = scheduleDuration;
    }
    if (scheduleStartDate) {
      medicationReminder.scheduleStartDate = new Date(scheduleStartDate);
    }
    if (notificationPreferences) {
      medicationReminder.notificationPreferences = {
        ...medicationReminder.notificationPreferences,
        ...notificationPreferences
      };
    }

    await medicationReminder.save();

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: {
        scheduleDuration: medicationReminder.scheduleDuration,
        scheduleStartDate: medicationReminder.scheduleStartDate,
        scheduleEndDate: medicationReminder.scheduleEndDate,
        notificationPreferences: medicationReminder.notificationPreferences
      }
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update schedule',
      error: error.message
    });
  }
});

/**
 * POST /api/medications/send-reminder
 * Manually trigger a medication reminder (for testing)
 */
router.post('/send-reminder', async (req, res) => {
  try {
    const { userId, medicationId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    const medicationReminder = await MedicationReminder.findOne({ userId });

    if (!medicationReminder) {
      return res.status(404).json({
        success: false,
        message: 'Medication reminders not found'
      });
    }

    // Find the guardian for this user
    const guardian = await Guardian.findOne({ userId });

    if (!guardian) {
      return res.status(404).json({
        success: false,
        message: 'Guardian not found'
      });
    }

    // Get medications to remind about
    let medicationsToRemind = medicationReminder.medications.filter(m => m.isActive);
    
    if (medicationId) {
      medicationsToRemind = medicationsToRemind.filter(m => m._id.toString() === medicationId);
    }

    if (medicationsToRemind.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active medications to remind about'
      });
    }

    const medicationList = medicationsToRemind
      .map(m => `${m.medicineName} (${m.dosageMg} ${m.dosageUnit})`)
      .join(', ');

    let emailSent = false;
    let smsSent = false;

    // Send email reminder
    if (medicationReminder.notificationPreferences.emailEnabled) {
      try {
        await sendEmail({
          to: guardian.guardianEmail,
          subject: `Medication Reminder for ${medicationReminder.userName}`,
          html: `
            <h2>Medication Reminder</h2>
            <p>It's time for <strong>${medicationReminder.userName}</strong>'s medication:</p>
            <ul>
              ${medicationsToRemind.map(m => `
                <li>
                  <strong>${m.medicineName}</strong> - ${m.dosageMg} ${m.dosageUnit}
                  ${m.instructions ? `<br><em>${m.instructions}</em>` : ''}
                </li>
              `).join('')}
            </ul>
            <p>Please ensure medications are taken as prescribed.</p>
          `
        });
        emailSent = true;
        console.log(`[Medication] Email reminder sent to ${guardian.guardianEmail}`);
      } catch (emailError) {
        console.error('[Medication] Email reminder failed:', emailError);
      }
    }

    // Send SMS reminder
    if (medicationReminder.notificationPreferences.smsEnabled && guardian.guardianPhone) {
      try {
        await sendMedicationReminderSms({
          to: guardian.guardianPhone,
          patientName: medicationReminder.userName,
          medicationName: medicationList
        });
        smsSent = true;
        console.log(`[Medication] SMS reminder sent to ${guardian.guardianPhone}`);
      } catch (smsError) {
        console.error('[Medication] SMS reminder failed:', smsError);
      }
    }

    res.json({
      success: true,
      message: 'Medication reminder sent',
      details: {
        emailSent,
        smsSent,
        medications: medicationList,
        guardianEmail: guardian.guardianEmail,
        guardianPhone: guardian.guardianPhone || 'Not set'
      }
    });
  } catch (error) {
    console.error('Error sending medication reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send medication reminder',
      error: error.message
    });
  }
});

/**
 * POST /api/medications/toggle/:medicationId
 * Toggle a medication's active status
 */
router.post('/toggle/:medicationId', async (req, res) => {
  try {
    const { medicationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    const medicationReminder = await MedicationReminder.findOne({ userId });

    if (!medicationReminder) {
      return res.status(404).json({
        success: false,
        message: 'Medication reminders not found'
      });
    }

    const medication = medicationReminder.medications.id(medicationId);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    medication.isActive = !medication.isActive;
    await medicationReminder.save();

    res.json({
      success: true,
      message: `${medication.medicineName} ${medication.isActive ? 'activated' : 'paused'}`,
      data: medicationReminder
    });
  } catch (error) {
    console.error('Error toggling medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle medication',
      error: error.message
    });
  }
});

// Helper function to generate default reminder times
function generateDefaultReminderTimes(frequency) {
  const defaultTimes = {
    1: [{ time: '09:00', label: 'morning' }],
    2: [{ time: '09:00', label: 'morning' }, { time: '21:00', label: 'night' }],
    3: [{ time: '08:00', label: 'morning' }, { time: '14:00', label: 'afternoon' }, { time: '20:00', label: 'evening' }],
    4: [{ time: '08:00', label: 'morning' }, { time: '12:00', label: 'afternoon' }, { time: '18:00', label: 'evening' }, { time: '22:00', label: 'night' }],
  };

  return defaultTimes[frequency] || defaultTimes[1];
}

module.exports = router;
