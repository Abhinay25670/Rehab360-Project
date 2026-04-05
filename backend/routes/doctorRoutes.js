const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const DoctorMeeting = require('../models/DoctorMeeting');
const Guardian = require('../models/Guardian');
const AlertHistory = require('../models/AlertHistory');
const PatientProfile = require('../models/PatientProfile');
const MedicationPlan = require('../models/MedicationPlan');
const { sendMeetingScheduledNotification } = require('../services/emailService');
const { sendMeetingScheduledSms } = require('../services/smsService');
const { sendExpoPushNotification } = require('../services/pushService');

/**
 * GET /api/doctor/test
 * Test endpoint to verify routes are loaded
 */
router.get('/test', (req, res) => {
  console.log('[Doctor] Test endpoint hit');
  res.json({ success: true, message: 'Doctor routes are working!' });
});

/**
 * GET /api/doctor/check/:email
 * Check if an email belongs to a registered doctor
 */
router.get('/check/:email', async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.json({ success: true, isDoctor: false });
    }
    const doctor = await Doctor.findOne({ email: email.toLowerCase() });
    res.json({ success: true, isDoctor: !!doctor });
  } catch (error) {
    console.error('[Doctor] Error checking doctor status:', error);
    res.json({ success: true, isDoctor: false });
  }
});

/**
 * GET /api/doctor/profile/:email
 * Get doctor profile by email
 */
router.get('/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const doctor = await Doctor.findOne({ email: email.toLowerCase() });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: {
        email: doctor.email,
        name: doctor.name,
        phone: doctor.phone,
        specialty: doctor.specialty,
        patientCount: doctor.patients.length,
        isActivated: doctor.isActivated,
        availabilitySlots: doctor.availabilitySlots || [],
        createdAt: doctor.createdAt
      }
    });
  } catch (error) {
    console.error('[Doctor] Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor profile',
      error: error.message
    });
  }
});

/**
 * PUT /api/doctor/profile
 * Update doctor profile
 */
router.put('/profile', async (req, res) => {
  try {
    const { email, name, phone, specialty, clerkUserId } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    let doctor = await Doctor.findOne({ email: email.toLowerCase() });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Update fields
    if (name) doctor.name = name;
    if (phone) doctor.phone = phone;
    if (specialty) doctor.specialty = specialty;
    if (clerkUserId) {
      doctor.clerkUserId = clerkUserId;
      doctor.isActivated = true;
      doctor.lastLoginAt = new Date();
    }

    await doctor.save();

    res.json({
      success: true,
      message: 'Doctor profile updated',
      data: {
        email: doctor.email,
        name: doctor.name,
        phone: doctor.phone,
        specialty: doctor.specialty,
        isActivated: doctor.isActivated
      }
    });
  } catch (error) {
    console.error('[Doctor] Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor profile',
      error: error.message
    });
  }
});

/**
 * GET /api/doctor/patients/:email
 * Get list of patients assigned to this doctor
 */
router.get('/patients/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Doctor email is required'
      });
    }

    const doctor = await Doctor.findOne({ email: email.toLowerCase() });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get detailed patient information
    const patientDetails = await Promise.all(
      doctor.patients.map(async (patient) => {
        try {
          const guardian = await Guardian.findOne({ userId: patient.userId });
          
          // Get recent alerts for risk assessment
          const recentAlerts = await AlertHistory.find({
            userId: patient.userId,
            alertType: { $in: ['high_risk', 'sos'] }
          })
            .sort({ sentAt: -1 })
            .limit(5);

          // Calculate risk level based on recent alerts
          let riskLevel = 'low';
          const lastWeekAlerts = recentAlerts.filter(a => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(a.sentAt) > weekAgo;
          });

          if (lastWeekAlerts.some(a => a.alertType === 'sos')) {
            riskLevel = 'critical';
          } else if (lastWeekAlerts.length >= 3) {
            riskLevel = 'high';
          } else if (lastWeekAlerts.length >= 1) {
            riskLevel = 'moderate';
          }

          // Get latest risk score from alerts
          const latestRiskAlert = recentAlerts.find(a => a.metrics?.riskScore);
          const latestRiskScore = latestRiskAlert?.metrics?.riskScore || null;

          return {
            userId: patient.userId,
            patientName: patient.patientName || guardian?.userName || 'Unknown',
            guardianEmail: patient.guardianEmail || guardian?.guardianEmail || '',
            guardianName: guardian?.guardianName || '',
            guardianPhone: guardian?.guardianPhone || '',
            assignedAt: patient.assignedAt,
            riskLevel,
            latestRiskScore,
            recentAlertCount: lastWeekAlerts.length,
            lastAlertDate: recentAlerts[0]?.sentAt || null
          };
        } catch (err) {
          console.error(`[Doctor] Error fetching patient ${patient.userId}:`, err);
          return {
            userId: patient.userId,
            patientName: patient.patientName || 'Unknown',
            guardianEmail: patient.guardianEmail || '',
            riskLevel: 'unknown',
            error: true
          };
        }
      })
    );

    res.json({
      success: true,
      data: {
        doctor: {
          email: doctor.email,
          name: doctor.name,
          specialty: doctor.specialty
        },
        patients: patientDetails,
        totalPatients: patientDetails.length
      }
    });
  } catch (error) {
    console.error('[Doctor] Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: error.message
    });
  }
});

/**
 * GET /api/doctor/patient/:userId
 * Get detailed patient information including reports
 */
router.get('/patient/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { doctorEmail } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Patient userId is required'
      });
    }

    // Verify doctor has access to this patient
    if (doctorEmail) {
      const doctor = await Doctor.findOne({ email: doctorEmail.toLowerCase() });
      if (!doctor || !doctor.patients.some(p => p.userId === userId)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this patient'
        });
      }
    }

    const guardian = await Guardian.findOne({ userId }).populate('patientProfile');

    if (!guardian) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get alert history
    const alertHistory = await AlertHistory.find({ userId })
      .sort({ sentAt: -1 })
      .limit(50);

    // Get medication plan
    let medicationPlan = null;
    if (guardian.patientProfile) {
      medicationPlan = await MedicationPlan.findOne({ 
        patientProfile: guardian.patientProfile._id 
      });
    }

    // Get scheduled meetings
    const meetings = await DoctorMeeting.find({ patientUserId: userId })
      .sort({ scheduledDate: -1 })
      .limit(10);

    // Calculate statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAlerts = alertHistory.filter(a => new Date(a.sentAt) > thirtyDaysAgo);
    const highRiskAlerts = recentAlerts.filter(a => a.alertType === 'high_risk');
    const sosAlerts = recentAlerts.filter(a => a.alertType === 'sos');

    // Get weekly reports for trend analysis
    const weeklyReports = alertHistory
      .filter(a => a.alertType === 'weekly_report')
      .slice(0, 4);

    res.json({
      success: true,
      data: {
        patient: {
          userId: guardian.userId,
          name: guardian.userName,
          email: guardian.userEmail,
          profile: guardian.patientProfile || null
        },
        guardian: {
          name: guardian.guardianName,
          email: guardian.guardianEmail,
          phone: guardian.guardianPhone,
          relationship: guardian.relationship
        },
        statistics: {
          totalAlerts30Days: recentAlerts.length,
          highRiskAlerts30Days: highRiskAlerts.length,
          sosAlerts30Days: sosAlerts.length,
          lastAlertDate: alertHistory[0]?.sentAt || null
        },
        weeklyReports: weeklyReports.map(r => ({
          date: r.sentAt,
          stats: r.metrics?.weeklyStats || {}
        })),
        recentAlerts: alertHistory.slice(0, 20).map(a => ({
          type: a.alertType,
          date: a.sentAt,
          riskScore: a.metrics?.riskScore || null,
          factors: a.metrics?.factors || [],
          status: a.status
        })),
        medicationPlan: medicationPlan ? {
          medications: medicationPlan.medications || [],
          prescribedBy: medicationPlan.prescribedBy,
          updatedAt: medicationPlan.updatedAt
        } : null,
        meetings: meetings.map(m => ({
          id: m._id,
          scheduledDate: m.scheduledDate,
          timeSlot: m.timeSlot,
          meetingType: m.meetingType,
          status: m.status,
          reason: m.reason
        }))
      }
    });
  } catch (error) {
    console.error('[Doctor] Error fetching patient details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient details',
      error: error.message
    });
  }
});

/**
 * POST /api/doctor/meeting
 * Schedule a meeting with a patient
 */
router.post('/meeting', async (req, res) => {
  try {
    const {
      doctorEmail,
      doctorName,
      patientUserId,
      scheduledDate,
      startTime,
      endTime,
      meetingType,
      meetingLink,
      location,
      reason,
      notes
    } = req.body;

    // Validate required fields
    if (!doctorEmail || !patientUserId || !scheduledDate || !startTime || !meetingType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: doctorEmail, patientUserId, scheduledDate, startTime, meetingType'
      });
    }

    // Validate meeting type
    if (!['video', 'in-person'].includes(meetingType)) {
      return res.status(400).json({
        success: false,
        message: 'meetingType must be "video" or "in-person"'
      });
    }

    // Verify doctor exists
    const doctor = await Doctor.findOne({ email: doctorEmail.toLowerCase() });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Verify patient exists and is assigned to doctor
    const patientAssigned = doctor.patients.some(p => p.userId === patientUserId);
    if (!patientAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Patient is not assigned to this doctor'
      });
    }

    // Get guardian info
    const guardian = await Guardian.findOne({ userId: patientUserId });
    if (!guardian) {
      return res.status(404).json({
        success: false,
        message: 'Patient guardian not found'
      });
    }

    // Create meeting
    const meeting = new DoctorMeeting({
      doctorEmail: doctorEmail.toLowerCase(),
      doctorName: doctorName || doctor.name || '',
      patientUserId,
      patientName: guardian.userName,
      guardianEmail: guardian.guardianEmail,
      guardianName: guardian.guardianName,
      scheduledDate: new Date(scheduledDate),
      timeSlot: {
        startTime,
        endTime: endTime || calculateEndTime(startTime)
      },
      meetingType,
      meetingLink: meetingType === 'video' ? meetingLink : '',
      location: meetingType === 'in-person' ? location : {},
      reason: reason || '',
      notes: notes || '',
      status: 'scheduled'
    });

    await meeting.save();
    console.log('[Doctor] Meeting scheduled:', meeting._id);

    // Send notifications to guardian (email, SMS, push)
    const meetingDoctorName = doctorName || doctor.name || 'Your doctor';
    const meetingDateStr = new Date(meeting.scheduledDate).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });

    // Email notification
    try {
      await sendMeetingScheduledNotification({
        guardianEmail: guardian.guardianEmail,
        guardianName: guardian.guardianName,
        patientName: guardian.userName,
        doctorName: meetingDoctorName,
        scheduledDate: meeting.scheduledDate,
        timeSlot: meeting.timeSlot,
        meetingType,
        meetingLink: meeting.meetingLink,
        location: meeting.location
      });
      meeting.notificationsSent.guardianEmail = true;
      console.log('[Doctor] Meeting email notification sent to guardian');
    } catch (emailError) {
      console.error('[Doctor] Failed to send meeting email notification:', emailError.message);
    }

    // SMS notification
    if (guardian.guardianPhone) {
      try {
        await sendMeetingScheduledSms({
          to: guardian.guardianPhone,
          patientName: guardian.userName,
          doctorName: meetingDoctorName,
          dateTime: `${meetingDateStr} at ${meeting.timeSlot.startTime}`,
          meetingType
        });
        meeting.notificationsSent.guardianSms = true;
        console.log('[Doctor] Meeting SMS notification sent to guardian');
      } catch (smsError) {
        console.error('[Doctor] Failed to send meeting SMS:', smsError.message);
      }
    }

    // Push notification
    if (guardian.expoPushTokens && guardian.expoPushTokens.length > 0) {
      const pushBody = `Dr. ${meetingDoctorName} scheduled a ${meetingType} appointment on ${meetingDateStr} at ${meeting.timeSlot.startTime}`;
      for (const token of guardian.expoPushTokens) {
        try {
          await sendExpoPushNotification({
            expoPushToken: token,
            title: 'Meeting Scheduled',
            body: pushBody,
            data: {
              type: 'meeting_scheduled',
              meetingId: meeting._id.toString(),
              meetingType,
              scheduledDate: meeting.scheduledDate
            }
          });
        } catch (pushError) {
          console.error(`[Doctor] Push notification failed for token ${token}:`, pushError.message);
        }
      }
      meeting.notificationsSent.reminder = true;
      console.log('[Doctor] Meeting push notification sent to guardian');
    }

    await meeting.save();

    res.status(201).json({
      success: true,
      message: 'Meeting scheduled successfully',
      data: {
        meetingId: meeting._id,
        scheduledDate: meeting.scheduledDate,
        timeSlot: meeting.timeSlot,
        meetingType: meeting.meetingType,
        status: meeting.status
      }
    });
  } catch (error) {
    console.error('[Doctor] Error scheduling meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule meeting',
      error: error.message
    });
  }
});

/**
 * GET /api/doctor/meetings/:doctorEmail
 * Get all meetings for a doctor
 */
router.get('/meetings/:doctorEmail', async (req, res) => {
  try {
    const { doctorEmail } = req.params;
    const { status, upcoming } = req.query;

    if (!doctorEmail) {
      return res.status(400).json({
        success: false,
        message: 'Doctor email is required'
      });
    }

    let query = { doctorEmail: doctorEmail.toLowerCase() };

    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query.scheduledDate = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'confirmed'] };
    }

    const meetings = await DoctorMeeting.find(query)
      .sort({ scheduledDate: 1 })
      .limit(50);

    res.json({
      success: true,
      data: meetings.map(m => ({
        id: m._id,
        patientUserId: m.patientUserId,
        patientName: m.patientName,
        guardianName: m.guardianName,
        scheduledDate: m.scheduledDate,
        timeSlot: m.timeSlot,
        meetingType: m.meetingType,
        meetingLink: m.meetingLink,
        location: m.location,
        status: m.status,
        reason: m.reason,
        createdAt: m.createdAt
      })),
      total: meetings.length
    });
  } catch (error) {
    console.error('[Doctor] Error fetching meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meetings',
      error: error.message
    });
  }
});

/**
 * GET /api/doctor/meetings/patient/:userId
 * Get all meetings for a specific patient
 */
router.get('/meetings/patient/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Patient userId is required'
      });
    }

    let query = { patientUserId: userId };

    if (status) {
      query.status = status;
    }

    const meetings = await DoctorMeeting.find(query)
      .sort({ scheduledDate: -1 });

    res.json({
      success: true,
      data: meetings.map(m => ({
        id: m._id,
        doctorEmail: m.doctorEmail,
        doctorName: m.doctorName,
        scheduledDate: m.scheduledDate,
        timeSlot: m.timeSlot,
        meetingType: m.meetingType,
        meetingLink: m.meetingLink,
        location: m.location,
        status: m.status,
        reason: m.reason,
        createdAt: m.createdAt
      })),
      total: meetings.length
    });
  } catch (error) {
    console.error('[Doctor] Error fetching patient meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient meetings',
      error: error.message
    });
  }
});

/**
 * PUT /api/doctor/meeting/:meetingId
 * Update a meeting (status, link, notes, etc.)
 */
router.put('/meeting/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { status, meetingLink, location, notes, scheduledDate, startTime, endTime } = req.body;

    const meeting = await DoctorMeeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Update fields
    if (status) meeting.status = status;
    if (meetingLink !== undefined) meeting.meetingLink = meetingLink;
    if (location) meeting.location = location;
    if (notes !== undefined) meeting.notes = notes;
    if (scheduledDate) meeting.scheduledDate = new Date(scheduledDate);
    if (startTime) meeting.timeSlot.startTime = startTime;
    if (endTime) meeting.timeSlot.endTime = endTime;

    await meeting.save();

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      data: {
        id: meeting._id,
        status: meeting.status,
        scheduledDate: meeting.scheduledDate,
        timeSlot: meeting.timeSlot
      }
    });
  } catch (error) {
    console.error('[Doctor] Error updating meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meeting',
      error: error.message
    });
  }
});

/**
 * DELETE /api/doctor/meeting/:meetingId
 * Cancel a meeting
 */
router.delete('/meeting/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await DoctorMeeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    meeting.status = 'cancelled';
    await meeting.save();

    res.json({
      success: true,
      message: 'Meeting cancelled successfully'
    });
  } catch (error) {
    console.error('[Doctor] Error cancelling meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel meeting',
      error: error.message
    });
  }
});

/**
 * PUT /api/doctor/availability
 * Update doctor's availability slots
 */
router.put('/availability', async (req, res) => {
  try {
    const { email, availabilitySlots } = req.body;

    if (!email || !Array.isArray(availabilitySlots)) {
      return res.status(400).json({
        success: false,
        message: 'Email and availabilitySlots array are required'
      });
    }

    const doctor = await Doctor.findOne({ email: email.toLowerCase() });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    doctor.availabilitySlots = availabilitySlots;
    await doctor.save();

    res.json({
      success: true,
      message: 'Availability updated',
      data: doctor.availabilitySlots
    });
  } catch (error) {
    console.error('[Doctor] Error updating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: error.message
    });
  }
});

// Helper function to calculate end time (default 30 min appointment)
function calculateEndTime(startTime) {
  const [hours, minutes] = startTime.split(':').map(Number);
  let endMinutes = minutes + 30;
  let endHours = hours;
  
  if (endMinutes >= 60) {
    endMinutes -= 60;
    endHours += 1;
  }
  
  if (endHours >= 24) {
    endHours -= 24;
  }
  
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

module.exports = router;
