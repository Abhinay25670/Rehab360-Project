// SMS Service using Twilio
// Sends real SMS alerts to guardians and patients

const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

let client = null;

// Check if Twilio is configured
const isTwilioConfigured = () => {
  if (!accountSid || !authToken) {
    console.warn('[SMS] Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
    return false;
  }
  if (!twilioPhoneNumber && !messagingServiceSid) {
    console.warn('[SMS] Twilio not configured. Set either TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID in .env');
    return false;
  }
  return true;
};

// Initialize client lazily
const getClient = () => {
  if (!client && isTwilioConfigured()) {
    client = twilio(accountSid, authToken);
  }
  return client;
};

/**
 * Send SMS to a phone number
 * @param {Object} params - SMS parameters
 * @param {string} params.to - Recipient phone number (with country code, e.g., +919876543210)
 * @param {string} params.message - SMS message content
 * @returns {Promise<Object>} - Result with success status and message SID
 */
exports.sendSms = async ({ to, message }) => {
  // Validate phone number format
  if (!to || !to.startsWith('+')) {
    console.error('[SMS] Invalid phone number format. Must include country code (e.g., +919876543210)');
    return { success: false, error: 'Invalid phone number format' };
  }

  const twilioClient = getClient();
  
  if (!twilioClient) {
    // Fallback: log the message if Twilio isn't configured
    console.log('[SMS] FALLBACK - Would send SMS to', to, 'with message:', message);
    return { success: false, error: 'Twilio not configured', provider: 'placeholder' };
  }

  try {
    // Build message options - use Messaging Service SID if available, otherwise use phone number
    const messageOptions = {
      body: message,
      to: to
    };

    if (messagingServiceSid) {
      messageOptions.messagingServiceSid = messagingServiceSid;
    } else {
      messageOptions.from = twilioPhoneNumber;
    }

    const result = await twilioClient.messages.create(messageOptions);

    console.log('[SMS] Sent successfully to', to, '- SID:', result.sid);
    return { 
      success: true, 
      provider: 'twilio',
      messageSid: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('[SMS] Failed to send to', to, '- Error:', error.message);
    return { 
      success: false, 
      provider: 'twilio',
      error: error.message,
      code: error.code
    };
  }
};

/**
 * Send medication reminder SMS
 * @param {Object} params
 * @param {string} params.to - Guardian phone number
 * @param {string} params.patientName - Patient's name
 * @param {string} [params.medicationName] - Optional medication name
 */
exports.sendMedicationReminderSms = async ({ to, patientName, medicationName }) => {
  const message = medicationName 
    ? `[Rehab Alert] Medication reminder for ${patientName}: Time to take ${medicationName}. Please ensure they follow the prescribed schedule.`
    : `[Rehab Alert] Medication reminder for ${patientName}. Please ensure they follow the doctor-prescribed schedule.`;

  const result = await exports.sendSms({ to, message });
  if (!result.success) {
    throw new Error(result.error || 'Failed to send medication reminder SMS');
  }
  return result;
};

/**
 * Send emergency/high-risk alert SMS
 * @param {Object} params
 * @param {string} params.to - Guardian phone number
 * @param {string} params.patientName - Patient's name
 * @param {string} [params.alertType] - Type of alert (e.g., 'high_risk', 'crisis', 'sos')
 * @param {string} [params.details] - Additional details
 */
exports.sendEmergencyAlertSms = async ({ to, patientName, alertType = 'emergency', details }) => {
  let message;
  
  switch (alertType) {
    case 'high_risk':
      message = `[URGENT - Rehab Alert] High risk alert for ${patientName}. Their recent activity indicates elevated risk. Please check on them immediately.`;
      break;
    case 'crisis':
      message = `[CRITICAL - Rehab Alert] Crisis alert for ${patientName}. Immediate attention required. Please contact them or emergency services if needed.`;
      break;
    case 'sos':
      message = `[SOS - Rehab Alert] ${patientName} has triggered an SOS alert. Please respond immediately and ensure their safety.`;
      break;
    default:
      message = `[ALERT - Rehab] Emergency alert for ${patientName}. Please check on them immediately and contact emergency services if needed.`;
  }

  if (details) {
    message += ` Details: ${details}`;
  }

  const result = await exports.sendSms({ to, message });
  if (!result.success) {
    throw new Error(result.error || 'Failed to send emergency alert SMS');
  }
  return result;
};

/**
 * Send weekly report notification SMS
 * @param {Object} params
 * @param {string} params.to - Guardian phone number
 * @param {string} params.patientName - Patient's name
 * @param {string} [params.summary] - Brief summary
 */
exports.sendWeeklyReportSms = async ({ to, patientName, summary }) => {
  let message = `[Rehab Weekly] Weekly recovery report for ${patientName} is now available. Check your email for the full report.`;

  if (summary) {
    message += ` Summary: ${summary}`;
  }

  const result = await exports.sendSms({ to, message });
  if (!result.success) {
    throw new Error(result.error || 'Failed to send weekly report SMS');
  }
  return result;
};

/**
 * Send craving alert SMS
 * @param {Object} params
 * @param {string} params.to - Guardian phone number  
 * @param {string} params.patientName - Patient's name
 * @param {number} [params.intensity] - Craving intensity (1-10)
 */
exports.sendCravingAlertSms = async ({ to, patientName, intensity }) => {
  const severityText = intensity >= 8 ? 'severe' : intensity >= 5 ? 'moderate' : 'mild';
  const message = `[Rehab Alert] ${patientName} reported a ${severityText} craving (intensity: ${intensity}/10). Consider reaching out to offer support.`;

  const result = await exports.sendSms({ to, message });
  if (!result.success) {
    throw new Error(result.error || 'Failed to send craving alert SMS');
  }
  return result;
};

/**
 * Send check-in reminder SMS to patient
 * @param {Object} params
 * @param {string} params.to - Patient phone number
 * @param {string} params.patientName - Patient's name
 */
exports.sendCheckInReminderSms = async ({ to, patientName }) => {
  const message = `Hi ${patientName}! This is your daily check-in reminder from Rehab. Take a moment to log how you're feeling today. Your progress matters!`;

  const result = await exports.sendSms({ to, message });
  if (!result.success) {
    throw new Error(result.error || 'Failed to send check-in reminder SMS');
  }
  return result;
};

/**
 * Send risk alert SMS to doctor
 * @param {Object} params
 * @param {string} params.to - Doctor phone number
 * @param {string} params.patientName - Patient's name
 * @param {number} params.riskScore - Risk score (0-100)
 * @param {string} [params.riskLevel] - Risk level (low/moderate/high/critical)
 */
exports.sendDoctorRiskAlertSms = async ({ to, patientName, riskScore, riskLevel }) => {
  const level = riskLevel || (riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : 'ELEVATED');
  const message = `[DOCTOR ALERT - Rehab] ${level} risk alert for patient ${patientName}. Risk Score: ${riskScore}/100. Please review patient data and consider scheduling an appointment. Login to your dashboard for details.`;

  const result = await exports.sendSms({ to, message });
  if (!result.success) {
    throw new Error(result.error || 'Failed to send doctor risk alert SMS');
  }
  return result;
};

/**
 * Send meeting scheduled SMS to guardian
 * @param {Object} params
 * @param {string} params.to - Guardian phone number
 * @param {string} params.patientName - Patient's name
 * @param {string} params.doctorName - Doctor's name
 * @param {string} params.dateTime - Meeting date and time
 * @param {string} params.meetingType - 'video' or 'in-person'
 */
exports.sendMeetingScheduledSms = async ({ to, patientName, doctorName, dateTime, meetingType }) => {
  const typeText = meetingType === 'video' ? 'video call' : 'in-person appointment';
  const message = `[Rehab] Meeting scheduled! Dr. ${doctorName} has scheduled a ${typeText} for ${patientName} on ${dateTime}. Check your email for details and meeting link.`;

  const result = await exports.sendSms({ to, message });
  if (!result.success) {
    throw new Error(result.error || 'Failed to send meeting scheduled SMS');
  }
  return result;
};