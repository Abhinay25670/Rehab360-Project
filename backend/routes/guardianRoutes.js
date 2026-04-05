const express = require('express');
const router = express.Router();
const Guardian = require('../models/Guardian');
const Doctor = require('../models/Doctor');
const AlertHistory = require('../models/AlertHistory');
const PatientProfile = require('../models/PatientProfile');
const MedicationPlan = require('../models/MedicationPlan');
const groupedCenters = require('../data/rehab_centers_grouped.json');
const { getNutritionGuidance, getDosageGuidanceForPlan } = require('../services/guidelineService');
const { 
  sendHighRiskAlert, 
  sendSOSAlert, 
  sendWeeklyReport,
  sendDoctorInvite,
  sendDoctorRiskAlert
} = require('../services/emailService');
const { sendEmergencyAlertSms, sendDoctorRiskAlertSms } = require('../services/smsService');

/**
 * GET /api/guardian/test
 * Test endpoint to verify routes are loaded
 */
router.get('/test', (req, res) => {
  console.log('[Guardian] Test endpoint hit');
  res.json({ success: true, message: 'Guardian routes are working!' });
});

/**
 * POST /api/guardian/test-sms
 * Test SMS endpoint for demo purposes
 * Send a test SMS to verify Twilio integration
 */
router.post('/test-sms', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'phoneNumber is required (with country code, e.g., +919876543210)' 
      });
    }

    const { sendSms } = require('../services/smsService');
    
    const testMessage = message || '[Rehab Demo] This is a test SMS alert. Your guardian notification system is working correctly!';
    
    const result = await sendSms({
      to: phoneNumber,
      message: testMessage
    });

    if (result.success) {
      console.log('[Guardian] Test SMS sent successfully to', phoneNumber);
      res.json({ 
        success: true, 
        message: 'Test SMS sent successfully!',
        details: {
          to: phoneNumber,
          messageSid: result.messageSid,
          status: result.status
        }
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Failed to send SMS',
        error: result.error
      });
    }
  } catch (error) {
    console.error('[Guardian] Test SMS error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test SMS',
      error: error.message 
    });
  }
});

/**
 * POST /api/guardian/set-phone
 * Quick endpoint to set guardian phone number (for demo purposes)
 */
router.post('/set-phone', async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;

    if (!userId || !phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and phoneNumber are required' 
      });
    }

    if (!phoneNumber.startsWith('+')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number must include country code (e.g., +919876543210)' 
      });
    }

    const guardian = await Guardian.findOne({ userId });

    if (!guardian) {
      return res.status(404).json({ 
        success: false, 
        message: 'Guardian record not found. Please complete onboarding first.' 
      });
    }

    guardian.guardianPhone = phoneNumber;
    await guardian.save();

    console.log(`[Guardian] Phone number updated for ${guardian.guardianName}: ${phoneNumber}`);

    res.json({ 
      success: true, 
      message: 'Guardian phone number updated successfully',
      data: {
        guardianName: guardian.guardianName,
        guardianPhone: guardian.guardianPhone
      }
    });
  } catch (error) {
    console.error('[Guardian] Set phone error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update phone number',
      error: error.message 
    });
  }
});

/**
 * POST /api/guardian/setup
 * Save guardian information during onboarding
 */
router.post('/setup', async (req, res) => {
  console.log('[Guardian] Setup endpoint hit');
  console.log('[Guardian] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { 
      userId, 
      userEmail, 
      userName, 
      guardianEmail, 
      guardianName, 
      guardianPhone, 
      relationship,
      notificationPreferences,
      doctorEmail,
      doctorName,
      doctorPhone
    } = req.body;

    // Validate required fields
    if (!userId || !userEmail || !userName || !guardianEmail || !guardianName) {
      console.log('[Guardian] Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: userId, userEmail, userName, guardianEmail, guardianName' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guardianEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid guardian email format' 
      });
    }

    // Validate doctor email format if provided
    if (doctorEmail && !emailRegex.test(doctorEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid doctor email format' 
      });
    }

    // Check if guardian record already exists for this user
    let guardian = await Guardian.findOne({ userId });

    if (guardian) {
      // Update existing record
      console.log('[Guardian] Updating existing record for userId:', userId);
      guardian.userEmail = userEmail;
      guardian.userName = userName;
      guardian.guardianEmail = guardianEmail;
      guardian.guardianName = guardianName;
      guardian.guardianPhone = guardianPhone || guardian.guardianPhone;
      guardian.relationship = relationship || guardian.relationship;
      guardian.notificationPreferences = notificationPreferences || guardian.notificationPreferences;
      guardian.doctorEmail = doctorEmail || guardian.doctorEmail;
      guardian.doctorName = doctorName || guardian.doctorName;
      guardian.doctorPhone = doctorPhone || guardian.doctorPhone;
      guardian.onboardingCompleted = true;
      await guardian.save();
      console.log('[Guardian] Record updated successfully');
    } else {
      // Create new record
      console.log('[Guardian] Creating new record for userId:', userId);
      guardian = new Guardian({
        userId,
        userEmail,
        userName,
        guardianEmail,
        guardianName,
        guardianPhone,
        relationship: relationship || 'Other',
        notificationPreferences: notificationPreferences || {
          highRiskAlerts: true,
          sosAlerts: true,
          weeklyReports: true
        },
        doctorEmail: doctorEmail || '',
        doctorName: doctorName || '',
        doctorPhone: doctorPhone || '',
        onboardingCompleted: true
      });
      await guardian.save();
      console.log('[Guardian] Record created successfully');
    }

    // Handle doctor registration/invitation if doctor email provided
    if (doctorEmail) {
      try {
        let doctor = await Doctor.findOne({ email: doctorEmail.toLowerCase() });
        
        if (!doctor) {
          // Create new doctor record
          console.log('[Guardian] Creating new doctor record for:', doctorEmail);
          doctor = new Doctor({
            email: doctorEmail.toLowerCase(),
            name: doctorName || '',
            phone: doctorPhone || '',
            patients: [{
              userId: userId,
              patientName: userName,
              guardianEmail: guardianEmail
            }]
          });
          await doctor.save();

          // Send invitation email to doctor
          const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const dashboardLink = `${baseUrl}/doctor-dashboard`;
          const signUpLink = `${baseUrl}/sign-up`;
          try {
            await sendDoctorInvite({
              doctorEmail: doctorEmail,
              doctorName: doctorName || 'Doctor',
              patientName: userName,
              guardianName: guardianName,
              dashboardLink,
              signUpLink
            });
            doctor.invitationSentAt = new Date();
            await doctor.save();
            console.log('[Guardian] Doctor invite email sent to:', doctorEmail);
          } catch (emailError) {
            console.error('[Guardian] Failed to send doctor invite email:', emailError.message);
          }
        } else {
          // Check if patient already exists in doctor's list
          const patientExists = doctor.patients.some(p => p.userId === userId);
          if (!patientExists) {
            doctor.patients.push({
              userId: userId,
              patientName: userName,
              guardianEmail: guardianEmail
            });
            await doctor.save();
            console.log('[Guardian] Patient added to existing doctor:', doctorEmail);
          }
        }
      } catch (doctorError) {
        console.error('[Guardian] Error handling doctor record:', doctorError.message);
        // Don't fail the whole setup if doctor handling fails
      }
    }

    console.log('[Guardian] Sending success response');
    res.status(201).json({ 
      success: true, 
      message: 'Guardian information saved successfully',
      data: {
        guardianName: guardian.guardianName,
        guardianEmail: guardian.guardianEmail,
        doctorEmail: guardian.doctorEmail,
        onboardingCompleted: guardian.onboardingCompleted
      }
    });
  } catch (error) {
    console.error('[Guardian] Error saving guardian:', error);
    console.error('[Guardian] Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save guardian information',
      error: error.message 
    });
  }
});

/**
 * PUT /api/guardian/update
 * Update guardian information
 */
router.put('/update', async (req, res) => {
  try {
    const { userId, ...updateData } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    const guardian = await Guardian.findOne({ userId });

    if (!guardian) {
      return res.status(404).json({ 
        success: false, 
        message: 'Guardian record not found. Please complete onboarding first.' 
      });
    }

    const previousDoctorEmail = guardian.doctorEmail || '';

    // Update allowed fields
    const allowedFields = [
      'guardianEmail', 
      'guardianName', 
      'guardianPhone', 
      'relationship', 
      'notificationPreferences',
      'doctorEmail',
      'doctorName',
      'doctorPhone'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        guardian[field] = updateData[field];
      }
    });

    await guardian.save();

    // Handle doctor registration/invitation
    let doctorInviteSent = false;
    const newDoctorEmail = guardian.doctorEmail;
    if (newDoctorEmail) {
      try {
        let doctor = await Doctor.findOne({ email: newDoctorEmail.toLowerCase() });
        const emailChanged = newDoctorEmail !== previousDoctorEmail;
        
        if (!doctor) {
          doctor = new Doctor({
            email: newDoctorEmail.toLowerCase(),
            name: guardian.doctorName || '',
            phone: guardian.doctorPhone || '',
            patients: [{
              userId: guardian.userId,
              patientName: guardian.userName,
              guardianEmail: guardian.guardianEmail
            }]
          });
          await doctor.save();
        } else {
          if (guardian.doctorName) doctor.name = guardian.doctorName;
          if (guardian.doctorPhone) doctor.phone = guardian.doctorPhone;
          const patientExists = doctor.patients.some(p => p.userId === guardian.userId);
          if (!patientExists) {
            doctor.patients.push({
              userId: guardian.userId,
              patientName: guardian.userName,
              guardianEmail: guardian.guardianEmail
            });
          }
          await doctor.save();
        }

        // Send invite if email changed or invite was never successfully sent
        if (emailChanged || !doctor.invitationSentAt) {
          const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const signUpLink = `${baseUrl}/sign-up`;
          const dashboardLink = `${baseUrl}/doctor-dashboard`;
          try {
            await sendDoctorInvite({
              doctorEmail: newDoctorEmail,
              doctorName: guardian.doctorName || 'Doctor',
              patientName: guardian.userName,
              guardianName: guardian.guardianName,
              dashboardLink,
              signUpLink
            });
            doctor.invitationSentAt = new Date();
            await doctor.save();
            doctorInviteSent = true;
            console.log('[Guardian] Doctor invite email sent to:', newDoctorEmail);
          } catch (emailError) {
            console.error('[Guardian] Failed to send doctor invite email:', emailError.message);
          }
        } else {
          console.log('[Guardian] Doctor already invited, skipping invite for:', newDoctorEmail);
        }
      } catch (doctorError) {
        console.error('[Guardian] Error handling doctor record on update:', doctorError.message);
      }
    }

    res.json({ 
      success: true, 
      message: 'Guardian information updated successfully',
      doctorInviteSent,
      data: {
        guardianName: guardian.guardianName,
        guardianEmail: guardian.guardianEmail,
        guardianPhone: guardian.guardianPhone,
        notificationPreferences: guardian.notificationPreferences,
        doctorEmail: guardian.doctorEmail,
        doctorName: guardian.doctorName,
        doctorPhone: guardian.doctorPhone
      }
    });
  } catch (error) {
    console.error('Error updating guardian:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update guardian information',
      error: error.message 
    });
  }
});

/**
 * POST /api/guardian/resend-doctor-invite
 * Resend the invitation email to the treating doctor
 */
router.post('/resend-doctor-invite', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const guardian = await Guardian.findOne({ userId });
    if (!guardian || !guardian.doctorEmail) {
      return res.status(404).json({ success: false, message: 'No doctor email found. Please add the doctor email first.' });
    }

    let doctor = await Doctor.findOne({ email: guardian.doctorEmail.toLowerCase() });
    if (!doctor) {
      doctor = new Doctor({
        email: guardian.doctorEmail.toLowerCase(),
        name: guardian.doctorName || '',
        phone: guardian.doctorPhone || '',
        patients: [{ userId: guardian.userId, patientName: guardian.userName, guardianEmail: guardian.guardianEmail }]
      });
      await doctor.save();
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const signUpLink = `${baseUrl}/sign-up`;
    const dashboardLink = `${baseUrl}/doctor-dashboard`;

    await sendDoctorInvite({
      doctorEmail: guardian.doctorEmail,
      doctorName: guardian.doctorName || 'Doctor',
      patientName: guardian.userName,
      guardianName: guardian.guardianName,
      dashboardLink,
      signUpLink
    });

    doctor.invitationSentAt = new Date();
    await doctor.save();

    res.json({ success: true, message: 'Doctor invitation resent successfully' });
  } catch (error) {
    console.error('[Guardian] Error resending doctor invite:', error);
    res.status(500).json({ success: false, message: 'Failed to resend doctor invitation', error: error.message });
  }
});

/**
 * GET /api/guardian/status
 * Check if onboarding is completed
 */
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    const guardian = await Guardian.findOne({ userId });

    if (!guardian) {
      return res.json({ 
        success: true, 
        onboardingCompleted: false,
        guardian: null
      });
    }

    res.json({ 
      success: true, 
      onboardingCompleted: guardian.onboardingCompleted,
      guardian: {
        guardianName: guardian.guardianName,
        guardianEmail: guardian.guardianEmail,
        guardianPhone: guardian.guardianPhone,
        relationship: guardian.relationship,
        notificationPreferences: guardian.notificationPreferences
      }
    });
  } catch (error) {
    console.error('Error checking guardian status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check guardian status',
      error: error.message 
    });
  }
});

/**
 * GET /api/guardian/info/:userId
 * Get full guardian information
 */
router.get('/info/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const guardian = await Guardian.findOne({ userId });

    if (!guardian) {
      return res.status(404).json({ 
        success: false, 
        message: 'Guardian record not found' 
      });
    }

    res.json({ 
      success: true, 
      data: {
        guardianName: guardian.guardianName,
        guardianEmail: guardian.guardianEmail,
        guardianPhone: guardian.guardianPhone,
        relationship: guardian.relationship,
        notificationPreferences: guardian.notificationPreferences,
        doctorEmail: guardian.doctorEmail,
        doctorName: guardian.doctorName,
        doctorPhone: guardian.doctorPhone,
        onboardingCompleted: guardian.onboardingCompleted,
        createdAt: guardian.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching guardian info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch guardian information',
      error: error.message 
    });
  }
});

/**
 * POST /api/guardian/alert/risk
 * Trigger high-risk alert to guardian
 */
router.post('/alert/risk', async (req, res) => {
  try {
    const { userId, riskScore, factors, recommendations } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    const guardian = await Guardian.findOne({ userId });

    if (!guardian) {
      return res.status(404).json({ 
        success: false, 
        message: 'Guardian record not found. Please complete onboarding.' 
      });
    }

    // Check notification preferences
    if (!guardian.notificationPreferences.highRiskAlerts) {
      return res.json({ 
        success: true, 
        sent: false,
        message: 'High risk alerts are disabled for this user' 
      });
    }

    // NO COOLDOWN - Send alert immediately every time
    console.log(`[Guardian] Sending high risk alert for ${guardian.userName} - Risk Score: ${riskScore}`);

    // Send email alert
    const result = await sendHighRiskAlert({
      guardianEmail: guardian.guardianEmail,
      guardianName: guardian.guardianName,
      userName: guardian.userName,
      riskScore,
      factors: factors || [],
      recommendations: recommendations || []
    });

    // Send SMS alert if phone number is available
    if (guardian.guardianPhone) {
      try {
        await sendEmergencyAlertSms({
          to: guardian.guardianPhone,
          patientName: guardian.userName,
          alertType: 'high_risk',
          details: `Risk score: ${riskScore}/10`
        });
        console.log(`[Guardian] SMS alert sent to ${guardian.guardianPhone}`);
      } catch (smsError) {
        console.error(`[Guardian] SMS alert failed for ${guardian.guardianPhone}:`, smsError.message);
      }
    }

    // Send alert to doctor if assigned
    let doctorAlertSent = false;
    if (guardian.doctorEmail) {
      try {
        const doctor = await Doctor.findOne({ email: guardian.doctorEmail.toLowerCase() });
        const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/doctor-dashboard`;
        
        // Send email to doctor
        await sendDoctorRiskAlert({
          doctorEmail: guardian.doctorEmail,
          doctorName: doctor?.name || guardian.doctorName || 'Doctor',
          patientName: guardian.userName,
          riskScore,
          factors: factors || [],
          dashboardLink
        });
        console.log(`[Guardian] Doctor email alert sent to ${guardian.doctorEmail}`);
        doctorAlertSent = true;

        // Send SMS to doctor if phone available
        const doctorPhone = doctor?.phone || guardian.doctorPhone;
        if (doctorPhone) {
          try {
            await sendDoctorRiskAlertSms({
              to: doctorPhone,
              patientName: guardian.userName,
              riskScore,
              riskLevel: riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : 'ELEVATED'
            });
            console.log(`[Guardian] Doctor SMS alert sent to ${doctorPhone}`);
          } catch (doctorSmsError) {
            console.error(`[Guardian] Doctor SMS alert failed:`, doctorSmsError.message);
          }
        }
      } catch (doctorError) {
        console.error(`[Guardian] Doctor alert failed for ${guardian.doctorEmail}:`, doctorError.message);
      }
    }

    // Log alert (no cooldown tracking)
    const alertLog = new AlertHistory({
      userId,
      userName: guardian.userName,
      userEmail: guardian.userEmail,
      guardianEmail: guardian.guardianEmail,
      guardianName: guardian.guardianName,
      alertType: 'high_risk',
      metrics: {
        riskScore,
        factors,
        recommendations,
        doctorNotified: doctorAlertSent,
        doctorEmail: guardian.doctorEmail || null
      },
      status: 'sent',
      messageId: result.messageId
    });
    await alertLog.save();

    res.json({ 
      success: true, 
      sent: true,
      doctorNotified: doctorAlertSent,
      message: doctorAlertSent 
        ? 'High risk alert sent to guardian and doctor' 
        : 'High risk alert sent to guardian',
      alertId: alertLog._id
    });
  } catch (error) {
    console.error('Error sending high risk alert:', error);
    
    // Log failed alert
    try {
      const guardian = await Guardian.findOne({ userId: req.body.userId });
      if (guardian) {
        const alertLog = new AlertHistory({
          userId: req.body.userId,
          userName: guardian.userName,
          userEmail: guardian.userEmail,
          guardianEmail: guardian.guardianEmail,
          guardianName: guardian.guardianName,
          alertType: 'high_risk',
          metrics: {
            riskScore: req.body.riskScore,
            factors: req.body.factors,
            recommendations: req.body.recommendations
          },
          status: 'failed',
          errorMessage: error.message
        });
        await alertLog.save();
      }
    } catch (logError) {
      console.error('Failed to log alert error:', logError);
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to send high risk alert',
      error: error.message 
    });
  }
});

/**
 * POST /api/guardian/alert/sos
 * Trigger SOS emergency alert to guardian
 */
router.post('/alert/sos', async (req, res) => {
  try {
    const { userId, message, metrics } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    const guardian = await Guardian.findOne({ userId });

    if (!guardian) {
      return res.status(404).json({ 
        success: false, 
        message: 'Guardian record not found. Please complete onboarding.' 
      });
    }

    // Check notification preferences
    if (!guardian.notificationPreferences.sosAlerts) {
      return res.json({ 
        success: true, 
        sent: false,
        message: 'SOS alerts are disabled for this user' 
      });
    }

    // NO COOLDOWN - SOS alerts are always sent immediately when triggered by user
    console.log(`[Guardian] Sending SOS alert for ${guardian.userName}`);

    // Send SOS email alert
    const result = await sendSOSAlert({
      guardianEmail: guardian.guardianEmail,
      guardianName: guardian.guardianName,
      userName: guardian.userName,
      userEmail: guardian.userEmail,
      message: message || 'User has triggered an emergency SOS alert.',
      metrics: metrics || {}
    });

    // Send SOS SMS alert if phone number is available
    if (guardian.guardianPhone) {
      try {
        await sendEmergencyAlertSms({
          to: guardian.guardianPhone,
          patientName: guardian.userName,
          alertType: 'sos',
          details: message || 'Emergency SOS triggered'
        });
        console.log(`[Guardian] SOS SMS alert sent to ${guardian.guardianPhone}`);
      } catch (smsError) {
        console.error(`[Guardian] SOS SMS alert failed for ${guardian.guardianPhone}:`, smsError.message);
      }
    }

    // Notify doctor on SOS alert
    let doctorAlertSent = false;
    if (guardian.doctorEmail) {
      try {
        const doctor = await Doctor.findOne({ email: guardian.doctorEmail.toLowerCase() });
        const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/doctor-dashboard`;
        
        await sendDoctorRiskAlert({
          doctorEmail: guardian.doctorEmail,
          doctorName: doctor?.name || guardian.doctorName || 'Doctor',
          patientName: guardian.userName,
          riskScore: 100,
          factors: ['SOS Emergency Alert triggered by patient', message || 'Immediate help requested'].filter(Boolean),
          dashboardLink
        });
        console.log(`[Guardian] Doctor SOS email alert sent to ${guardian.doctorEmail}`);
        doctorAlertSent = true;

        const doctorPhone = doctor?.phone || guardian.doctorPhone;
        if (doctorPhone) {
          try {
            await sendDoctorRiskAlertSms({
              to: doctorPhone,
              patientName: guardian.userName,
              riskScore: 100,
              riskLevel: 'SOS EMERGENCY'
            });
            console.log(`[Guardian] Doctor SOS SMS sent to ${doctorPhone}`);
          } catch (doctorSmsError) {
            console.error(`[Guardian] Doctor SOS SMS failed:`, doctorSmsError.message);
          }
        }
      } catch (doctorError) {
        console.error(`[Guardian] Doctor SOS alert failed for ${guardian.doctorEmail}:`, doctorError.message);
      }
    }

    // Log alert (no cooldown tracking)
    const alertLog = new AlertHistory({
      userId,
      userName: guardian.userName,
      userEmail: guardian.userEmail,
      guardianEmail: guardian.guardianEmail,
      guardianName: guardian.guardianName,
      alertType: 'sos',
      metrics: {
        sosMessage: message,
        doctorNotified: doctorAlertSent,
        doctorEmail: guardian.doctorEmail || null,
        ...metrics
      },
      status: 'sent',
      messageId: result.messageId
    });
    await alertLog.save();

    res.json({ 
      success: true, 
      sent: true,
      doctorNotified: doctorAlertSent,
      message: doctorAlertSent 
        ? 'SOS alert sent to guardian and doctor' 
        : 'SOS alert sent to guardian',
      alertId: alertLog._id
    });
  } catch (error) {
    console.error('Error sending SOS alert:', error);
    
    // Log failed alert
    try {
      const guardian = await Guardian.findOne({ userId: req.body.userId });
      if (guardian) {
        const alertLog = new AlertHistory({
          userId: req.body.userId,
          userName: guardian.userName,
          userEmail: guardian.userEmail,
          guardianEmail: guardian.guardianEmail,
          guardianName: guardian.guardianName,
          alertType: 'sos',
          metrics: {
            sosMessage: req.body.message
          },
          status: 'failed',
          errorMessage: error.message
        });
        await alertLog.save();
      }
    } catch (logError) {
      console.error('Failed to log alert error:', logError);
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to send SOS alert',
      error: error.message 
    });
  }
});

/**
 * GET /api/guardian/alerts/:userId
 * Get alert history for a user
 */
router.get('/alerts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, type } = req.query;

    let query = { userId };
    if (type && ['high_risk', 'sos', 'weekly_report'].includes(type)) {
      query.alertType = type;
    }

    const alerts = await AlertHistory.find(query)
      .sort({ sentAt: -1 })
      .limit(parseInt(limit))
      .exec();

    res.json({ 
      success: true, 
      data: alerts 
    });
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch alert history',
      error: error.message 
    });
  }
});

/**
 * POST /api/guardian/device-token
 * Save Expo push token for guardian device
 */
router.post('/device-token', async (req, res) => {
  try {
    const { userId, expoPushToken } = req.body;
    if (!userId || !expoPushToken) {
      return res.status(400).json({
        success: false,
        message: 'userId and expoPushToken are required',
      });
    }

    const guardian = await Guardian.findOne({ userId });
    if (!guardian) {
      return res.status(404).json({
        success: false,
        message: 'Guardian record not found. Please complete onboarding first.',
      });
    }

    if (!guardian.expoPushTokens.includes(expoPushToken)) {
      guardian.expoPushTokens.push(expoPushToken);
      await guardian.save();
    }

    res.json({
      success: true,
      message: 'Expo push token saved',
    });
  } catch (error) {
    console.error('Error saving device token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save device token',
      error: error.message,
    });
  }
});

/**
 * POST /api/guardian/patient
 * Create or update the patient profile for this guardian (one patient per guardian)
 */
router.post('/patient', async (req, res) => {
  try {
    const { userId, name, age, gender, addictionType, severity, treatingDoctor } = req.body;

    if (!userId || !name || typeof age === 'undefined' || !addictionType) {
      return res.status(400).json({
        success: false,
        message: 'userId, name, age and addictionType are required',
      });
    }

    const guardian = await Guardian.findOne({ userId });
    if (!guardian) {
      return res.status(404).json({
        success: false,
        message: 'Guardian record not found. Please complete guardian setup first.',
      });
    }

    let profile = await PatientProfile.findOne({ guardianUserId: userId });
    if (!profile) {
      profile = new PatientProfile({ guardianUserId: userId, name, age, gender, addictionType, severity, treatingDoctor });
    } else {
      profile.name = name;
      profile.age = age;
      profile.gender = gender || profile.gender;
      profile.addictionType = addictionType;
      profile.severity = severity || profile.severity;
      if (treatingDoctor) {
        profile.treatingDoctor = treatingDoctor;
      }
    }

    await profile.save();

    guardian.patientProfile = profile._id;
    await guardian.save();

    res.status(201).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error creating/updating patient profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save patient profile',
      error: error.message,
    });
  }
});

/**
 * GET /api/guardian/patient/:userId
 * Fetch guardian's patient profile and basic medication info
 */
router.get('/patient/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const guardian = await Guardian.findOne({ userId }).populate('patientProfile');

    if (!guardian || !guardian.patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found for this guardian',
      });
    }

    const plan = await MedicationPlan.findOne({ patientProfile: guardian.patientProfile._id });

    res.json({
      success: true,
      data: {
        patient: guardian.patientProfile,
        medicationPlan: plan || null,
      },
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient profile',
      error: error.message,
    });
  }
});

/**
 * POST /api/guardian/medication-plan
 * Save or update a simple medication plan for the guardian's patient
 * NOTE: This endpoint stores doctor-prescribed data; it does not auto-prescribe.
 */
router.post('/medication-plan', async (req, res) => {
  try {
    const { userId, ageGroup, addictionType, medications, prescribedBy } = req.body;

    if (!userId || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userId and at least one medication entry are required',
      });
    }

    const guardian = await Guardian.findOne({ userId }).populate('patientProfile');
    if (!guardian || !guardian.patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found for this guardian',
      });
    }

    let plan = await MedicationPlan.findOne({ patientProfile: guardian.patientProfile._id });
    if (!plan) {
      plan = new MedicationPlan({
        patientProfile: guardian.patientProfile._id,
        ageGroup,
        addictionType,
        medications,
        prescribedBy,
      });
    } else {
      plan.ageGroup = ageGroup || plan.ageGroup;
      plan.addictionType = addictionType || plan.addictionType;
      plan.medications = medications;
      plan.prescribedBy = prescribedBy || plan.prescribedBy;
    }

    await plan.save();

    res.status(201).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Error saving medication plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save medication plan',
      error: error.message,
    });
  }
});

/**
 * GET /api/guardian/medication-plan/:userId
 * Fetch medication plan for guardian's patient
 */
router.get('/medication-plan/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const guardian = await Guardian.findOne({ userId }).populate('patientProfile');

    if (!guardian || !guardian.patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found for this guardian',
      });
    }

    const plan = await MedicationPlan.findOne({ patientProfile: guardian.patientProfile._id });

    if (!plan) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const enriched = getDosageGuidanceForPlan({
      addictionType: plan.addictionType || guardian.patientProfile.addictionType,
      age: guardian.patientProfile.age,
      medications: plan.medications || [],
    });

    res.json({
      success: true,
      data: {
        ...plan.toObject(),
        medications: enriched.medications,
        consultDoctorOnly: enriched.consultDoctorOnly,
      },
    });
  } catch (error) {
    console.error('Error fetching medication plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medication plan',
      error: error.message,
    });
  }
});

/**
 * GET /api/guardian/nutrition-plan/:userId
 * Return age- and addiction-specific nutrition guidance for this guardian's patient.
 */
router.get('/nutrition-plan/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const guardian = await Guardian.findOne({ userId }).populate('patientProfile');

    if (!guardian || !guardian.patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found for this guardian',
      });
    }

    const guidance = getNutritionGuidance({
      addictionType: guardian.patientProfile.addictionType,
      age: guardian.patientProfile.age,
    });

    res.json({
      success: true,
      data: guidance,
    });
  } catch (error) {
    console.error('Error fetching nutrition plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nutrition plan',
      error: error.message,
    });
  }
});

/**
 * GET /api/guardian/dashboard-summary/:userId
 * Get summary metrics for guardian dashboard
 */
router.get('/dashboard-summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const guardian = await Guardian.findOne({ userId }).populate('patientProfile');

    if (!guardian) {
      return res.status(404).json({
        success: false,
        message: 'Guardian record not found',
      });
    }

    const patient = guardian.patientProfile;
    const medicationPlan = patient
      ? await MedicationPlan.findOne({ patientProfile: patient._id })
      : null;

    // Count recent alerts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAlerts = await AlertHistory.countDocuments({
      userId: guardian.userId,
      sentAt: { $gte: sevenDaysAgo },
    });

    // Get latest alert of any type
    const latestAlert = await AlertHistory.findOne({
      userId: guardian.userId,
    })
      .sort({ sentAt: -1 })
      .limit(1);

    // Get latest weekly report (for richer recovery metrics)
    const latestWeeklyReport = await AlertHistory.findOne({
      userId: guardian.userId,
      alertType: 'weekly_report',
    })
      .sort({ sentAt: -1 })
      .limit(1);

    const summary = {
      patient: patient
        ? {
            name: patient.name,
            age: patient.age,
            addictionType: patient.addictionType,
            severity: patient.severity,
          }
        : null,
      medicationPlan: medicationPlan
        ? {
            medicationCount: medicationPlan.medications?.length || 0,
            hasPlan: true,
            prescribedBy: medicationPlan.prescribedBy,
          }
        : { medicationCount: 0, hasPlan: false },
      alerts: {
        recentCount: recentAlerts,
        latestAlert: latestAlert
          ? {
              type: latestAlert.alertType,
              sentAt: latestAlert.sentAt,
              status: latestAlert.status,
            }
          : null,
      },
      weeklyStats: latestWeeklyReport?.metrics?.weeklyStats
        ? {
            avgRiskScore: latestWeeklyReport.metrics.weeklyStats.avgRiskScore ?? null,
            cravingCount: latestWeeklyReport.metrics.weeklyStats.cravingCount ?? null,
            avgSleepQuality: latestWeeklyReport.metrics.weeklyStats.avgSleepQuality ?? null,
            avgStressLevel: latestWeeklyReport.metrics.weeklyStats.avgStressLevel ?? null,
            daysLogged: latestWeeklyReport.metrics.weeklyStats.daysLogged ?? null,
            soberStreak: latestWeeklyReport.metrics.weeklyStats.soberStreak ?? null,
            trend: latestWeeklyReport.metrics.weeklyStats.trend ?? null,
          }
        : null,
      notifications: {
        pushEnabled: guardian.expoPushTokens?.length > 0,
        preferences: guardian.notificationPreferences || {},
      },
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary',
      error: error.message,
    });
  }
});

/**
 * GET /api/guardian/rehab-centers
 * Uses grouped JSON you provided, but returns only entries whose name contains "HOSPITAL".
 * Query:
 *  - city: one of Mumbai, Delhi, Bengaluru, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad, Others
 */
router.get('/rehab-centers', (req, res) => {
  try {
    const raw = (req.query.city || '').trim();

    // Map app labels to JSON keys
    const cityKeyMap = {
      Mumbai: 'Mumbai',
      Delhi: 'Delhi',
      Bengaluru: 'Bangalore',
      Bangalore: 'Bangalore',
      Chennai: 'Chennai',
      Hyderabad: 'Hyderabad',
      Kolkata: 'Kolkata',
      Pune: 'Pune',
      Ahmedabad: 'Ahmedabad',
      Others: 'Others',
    };

    const key = cityKeyMap[raw] || raw || 'Mumbai';
    const dataByCity = groupedCenters.data || {};
    const list = (dataByCity[key] || []).filter((item) =>
      /hospital/i.test(item.name || '')
    );

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Error fetching rehab centers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rehab centers',
      error: error.message,
    });
  }
});

module.exports = router;
