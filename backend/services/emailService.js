const { Resend } = require('resend');
const { 
  getHighRiskAlertTemplate, 
  getSOSAlertTemplate, 
  getWeeklyReportTemplate 
} = require('../utils/emailTemplates');

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.warn(
    '[Email] RESEND_API_KEY is not set. Email notifications will fail until this is configured in your backend .env file.'
  );
}
const resend = new Resend(resendApiKey);

// From email address (must be verified in Resend dashboard)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Rehab Alerts <alerts@resend.dev>';

/**
 * Send high risk alert to guardian
 * @param {Object} params - Alert parameters
 * @param {string} params.guardianEmail - Guardian's email address
 * @param {string} params.guardianName - Guardian's name
 * @param {string} params.userName - User's name
 * @param {number} params.riskScore - Current risk score (0-100)
 * @param {Array} params.factors - Contributing factors
 * @param {Array} params.recommendations - Recommended actions
 */
const sendHighRiskAlert = async ({ 
  guardianEmail, 
  guardianName, 
  userName, 
  riskScore, 
  factors, 
  recommendations 
}) => {
  try {
    const html = getHighRiskAlertTemplate({
      guardianName,
      userName,
      riskScore,
      factors,
      recommendations,
      timestamp: new Date().toLocaleString()
    });

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: guardianEmail,
      subject: `⚠️ High Risk Alert: ${userName} needs support`,
      html
    });

    if (error) {
      console.error('Error sending high risk alert:', error);
      throw error;
    }

    console.log('High risk alert sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send high risk alert:', error);
    throw error;
  }
};

/**
 * Send SOS emergency alert to guardian
 * @param {Object} params - Alert parameters
 * @param {string} params.guardianEmail - Guardian's email address
 * @param {string} params.guardianName - Guardian's name
 * @param {string} params.userName - User's name
 * @param {string} params.userEmail - User's email for contact
 * @param {string} params.message - Optional message from user
 * @param {Object} params.metrics - Current user metrics
 */
const sendSOSAlert = async ({ 
  guardianEmail, 
  guardianName, 
  userName, 
  userEmail,
  message,
  metrics 
}) => {
  try {
    const html = getSOSAlertTemplate({
      guardianName,
      userName,
      userEmail,
      message,
      metrics,
      timestamp: new Date().toLocaleString()
    });

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: guardianEmail,
      subject: `🚨 URGENT SOS: ${userName} needs immediate help!`,
      html
    });

    if (error) {
      console.error('Error sending SOS alert:', error);
      throw error;
    }

    console.log('SOS alert sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send SOS alert:', error);
    throw error;
  }
};

/**
 * Send weekly report to guardian
 * @param {Object} params - Report parameters
 * @param {string} params.guardianEmail - Guardian's email address
 * @param {string} params.guardianName - Guardian's name
 * @param {string} params.userName - User's name
 * @param {Object} params.weeklyStats - Week's statistics
 */
const sendWeeklyReport = async ({ 
  guardianEmail, 
  guardianName, 
  userName, 
  weeklyStats 
}) => {
  try {
    const html = getWeeklyReportTemplate({
      guardianName,
      userName,
      weeklyStats,
      reportDate: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    });

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: guardianEmail,
      subject: `📊 Weekly Recovery Report: ${userName}`,
      html
    });

    if (error) {
      console.error('Error sending weekly report:', error);
      throw error;
    }

    console.log('Weekly report sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send weekly report:', error);
    throw error;
  }
};

/**
 * Generic email sending function
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

/**
 * Send doctor invitation email
 * @param {Object} params - Invitation parameters
 * @param {string} params.doctorEmail - Doctor's email address
 * @param {string} params.doctorName - Doctor's name
 * @param {string} params.patientName - Patient's name
 * @param {string} params.guardianName - Guardian's name
 * @param {string} params.dashboardLink - Link to doctor dashboard
 */
const sendDoctorInvite = async ({
  doctorEmail,
  doctorName,
  patientName,
  guardianName,
  dashboardLink,
  signUpLink
}) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #18181b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f4f4f5; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px; }
          .button-secondary { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px; }
          .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .steps { background: white; padding: 20px; border-radius: 6px; margin: 15px 0; }
          .step { margin-bottom: 12px; padding-left: 8px; }
          .step-num { display: inline-block; background: #18181b; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; font-size: 13px; line-height: 24px; margin-right: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Rehab - Doctor Portal</h1>
          </div>
          <div class="content">
            <h2>Hello Dr. ${doctorName || 'Doctor'},</h2>
            <p>You have been added as a treating physician for a patient in the Rehab recovery monitoring system.</p>
            
            <div class="info-box">
              <p><strong>Patient:</strong> ${patientName}</p>
              <p><strong>Guardian:</strong> ${guardianName}</p>
            </div>
            
            <p>As the treating doctor, you will:</p>
            <ul>
              <li>Receive alerts when the patient's risk level is elevated</li>
              <li>Access patient reports and recovery metrics</li>
              <li>Schedule appointments with the patient/guardian</li>
            </ul>

            <div class="steps">
              <h3 style="margin-top: 0;">How to get started:</h3>
              <div class="step">
                <span class="step-num">1</span>
                <strong>Create your account</strong> — Sign up using this email address (<strong>${doctorEmail}</strong>)
              </div>
              <div class="step">
                <span class="step-num">2</span>
                <strong>Access your dashboard</strong> — After signing in, go to your Doctor Dashboard
              </div>
            </div>
            
            <p>
              <a href="${signUpLink || dashboardLink}" class="button">Create Account</a>
              &nbsp;&nbsp;
              <a href="${dashboardLink}" class="button-secondary">Go to Dashboard</a>
            </p>

            <p style="margin-top: 20px; font-size: 13px; color: #666;">
              <strong>Important:</strong> Please sign up with the same email address (<strong>${doctorEmail}</strong>) to automatically link your account.
            </p>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              If you did not expect this invitation, please ignore this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: doctorEmail,
      subject: `🏥 Rehab: You've been added as a treating physician for ${patientName}`,
      html
    });

    if (error) {
      console.error('Error sending doctor invite:', error);
      throw error;
    }

    console.log('Doctor invite sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send doctor invite:', error);
    throw error;
  }
};

/**
 * Send risk alert to doctor
 * @param {Object} params - Alert parameters
 * @param {string} params.doctorEmail - Doctor's email address
 * @param {string} params.doctorName - Doctor's name
 * @param {string} params.patientName - Patient's name
 * @param {number} params.riskScore - Current risk score
 * @param {Array} params.factors - Contributing factors
 * @param {string} params.dashboardLink - Link to doctor dashboard
 */
const sendDoctorRiskAlert = async ({
  doctorEmail,
  doctorName,
  patientName,
  riskScore,
  factors,
  dashboardLink
}) => {
  try {
    const riskLevel = riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : 'ELEVATED';
    const riskColor = riskScore >= 80 ? '#dc2626' : riskScore >= 60 ? '#ea580c' : '#ca8a04';

    const factorsHtml = factors && factors.length > 0 
      ? factors.map(f => `<li>${f}</li>`).join('') 
      : '<li>Multiple risk indicators detected</li>';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${riskColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f4f4f5; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .risk-score { font-size: 48px; font-weight: bold; color: ${riskColor}; }
          .alert-box { background: white; padding: 20px; border-left: 4px solid ${riskColor}; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ ${riskLevel} RISK ALERT</h1>
            <p>Patient requires attention</p>
          </div>
          <div class="content">
            <h2>Dr. ${doctorName || 'Doctor'},</h2>
            <p>A patient under your care has triggered a high-risk alert.</p>
            
            <div class="alert-box">
              <p><strong>Patient:</strong> ${patientName}</p>
              <p><strong>Risk Score:</strong> <span class="risk-score">${riskScore}</span>/100</p>
              <p><strong>Alert Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <h3>Contributing Factors:</h3>
            <ul>
              ${factorsHtml}
            </ul>
            
            <p>Please review the patient's data and consider scheduling an appointment.</p>
            
            <a href="${dashboardLink}" class="button">View Patient Details & Schedule Meeting</a>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              This is an automated alert from the Rehab recovery monitoring system.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: doctorEmail,
      subject: `⚠️ ${riskLevel} RISK: ${patientName} needs attention - Score ${riskScore}/100`,
      html
    });

    if (error) {
      console.error('Error sending doctor risk alert:', error);
      throw error;
    }

    console.log('Doctor risk alert sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send doctor risk alert:', error);
    throw error;
  }
};

/**
 * Send meeting scheduled notification to guardian
 * @param {Object} params - Meeting parameters
 * @param {string} params.guardianEmail - Guardian's email address
 * @param {string} params.guardianName - Guardian's name
 * @param {string} params.patientName - Patient's name
 * @param {string} params.doctorName - Doctor's name
 * @param {Date} params.scheduledDate - Meeting date
 * @param {Object} params.timeSlot - Meeting time slot
 * @param {string} params.meetingType - 'video' or 'in-person'
 * @param {string} params.meetingLink - Video call link (if video)
 * @param {Object} params.location - Meeting location (if in-person)
 */
const sendMeetingScheduledNotification = async ({
  guardianEmail,
  guardianName,
  patientName,
  doctorName,
  scheduledDate,
  timeSlot,
  meetingType,
  meetingLink,
  location
}) => {
  try {
    const dateStr = new Date(scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const meetingDetails = meetingType === 'video' 
      ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>`
      : `<p><strong>Location:</strong> ${location?.address || ''} ${location?.city ? ', ' + location.city : ''}</p>
         ${location?.notes ? `<p><strong>Notes:</strong> ${location.notes}</p>` : ''}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f4f4f5; padding: 30px; border-radius: 0 0 8px 8px; }
          .meeting-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border: 2px solid #059669; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Meeting Scheduled</h1>
          </div>
          <div class="content">
            <h2>Hello ${guardianName},</h2>
            <p>A meeting has been scheduled with the doctor for ${patientName}'s recovery care.</p>
            
            <div class="meeting-box">
              <h3 style="margin-top: 0;">Meeting Details</h3>
              <p><strong>Doctor:</strong> ${doctorName}</p>
              <p><strong>Date:</strong> ${dateStr}</p>
              <p><strong>Time:</strong> ${timeSlot?.startTime || ''} - ${timeSlot?.endTime || ''}</p>
              <p><strong>Type:</strong> ${meetingType === 'video' ? '📹 Video Call' : '🏥 In-Person'}</p>
              ${meetingDetails}
            </div>
            
            ${meetingType === 'video' && meetingLink ? `
              <a href="${meetingLink}" class="button">Join Video Call</a>
            ` : ''}
            
            <p style="margin-top: 30px;">Please make sure to be available at the scheduled time. If you need to reschedule, please contact the doctor's office.</p>
            
            <p style="font-size: 14px; color: #666;">
              This is an automated notification from the Rehab recovery monitoring system.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: guardianEmail,
      subject: `📅 Meeting Scheduled: ${doctorName} - ${dateStr}`,
      html
    });

    if (error) {
      console.error('Error sending meeting notification:', error);
      throw error;
    }

    console.log('Meeting notification sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send meeting notification:', error);
    throw error;
  }
};

/**
 * Send weekly patient report to doctor
 * @param {Object} params - Report parameters
 * @param {string} params.doctorEmail - Doctor's email address
 * @param {string} params.doctorName - Doctor's name
 * @param {Array} params.patientReports - Array of { patientName, guardianName, weeklyStats }
 */
const sendDoctorWeeklyReport = async ({
  doctorEmail,
  doctorName,
  patientReports
}) => {
  try {
    const reportDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const patientRows = patientReports.map(p => {
      const s = p.weeklyStats || {};
      const trendIcon = s.trend === 'improving' ? '&#x2191;' : s.trend === 'declining' ? '&#x2193;' : '&#x2192;';
      const trendColor = s.trend === 'improving' ? '#059669' : s.trend === 'declining' ? '#dc2626' : '#ca8a04';
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e4e4e7;">${p.patientName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e4e4e7;">${s.soberStreak ?? '-'} days</td>
          <td style="padding: 12px; border-bottom: 1px solid #e4e4e7;">${s.avgRiskScore ?? '-'}/100</td>
          <td style="padding: 12px; border-bottom: 1px solid #e4e4e7;">${s.avgSleepQuality ?? '-'}/10</td>
          <td style="padding: 12px; border-bottom: 1px solid #e4e4e7;">${s.cravingCount ?? '-'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e4e4e7;">${s.avgStressLevel ?? '-'}/10</td>
          <td style="padding: 12px; border-bottom: 1px solid #e4e4e7; color: ${trendColor}; font-weight: bold;">${trendIcon} ${s.trend || 'N/A'}</td>
        </tr>`;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: #18181b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f4f4f5; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
          th { background: #18181b; color: white; padding: 12px; text-align: left; font-size: 13px; }
          td { font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Weekly Patient Report</h1>
            <p>${reportDate}</p>
          </div>
          <div class="content">
            <h2>Dr. ${doctorName || 'Doctor'},</h2>
            <p>Here is your weekly summary for ${patientReports.length} patient${patientReports.length !== 1 ? 's' : ''} under your care.</p>
            
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Sober Streak</th>
                  <th>Risk Score</th>
                  <th>Sleep</th>
                  <th>Cravings</th>
                  <th>Stress</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                ${patientRows}
              </tbody>
            </table>
            
            <p style="margin-top: 20px;">Review detailed patient data and schedule meetings from your dashboard:</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/doctor-dashboard" class="button">Open Doctor Dashboard</a>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              This is an automated weekly report from the Rehab recovery monitoring system.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: doctorEmail,
      subject: `Weekly Patient Report - ${reportDate} (${patientReports.length} patient${patientReports.length !== 1 ? 's' : ''})`,
      html
    });

    if (error) {
      console.error('Error sending doctor weekly report:', error);
      throw error;
    }

    console.log('Doctor weekly report sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send doctor weekly report:', error);
    throw error;
  }
};

/**
 * Test email connection
 */
const testEmailConnection = async () => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'delivered@resend.dev', // Resend test address
      subject: 'Test Email from Rehab App',
      html: '<p>This is a test email to verify Resend integration.</p>'
    });

    if (error) {
      console.error('Email test failed:', error);
      return { success: false, error };
    }

    console.log('Email test successful:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Email connection test failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendHighRiskAlert,
  sendSOSAlert,
  sendWeeklyReport,
  sendEmail,
  sendDoctorInvite,
  sendDoctorRiskAlert,
  sendMeetingScheduledNotification,
  sendDoctorWeeklyReport,
  testEmailConnection
};
