/**
 * Email Templates for Guardian Notifications
 * Professional, clean HTML email templates
 */

/**
 * Base styles shared across all templates
 */
const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #18181b;
    margin: 0;
    padding: 0;
    background-color: #f4f4f5;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
  }
  .header {
    padding: 32px 24px;
    text-align: center;
  }
  .content {
    padding: 24px;
  }
  .footer {
    padding: 24px;
    text-align: center;
    background-color: #fafafa;
    border-top: 1px solid #e4e4e7;
  }
  .footer p {
    margin: 0;
    font-size: 12px;
    color: #71717a;
  }
  .btn {
    display: inline-block;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    border-radius: 8px;
    margin: 8px 4px;
  }
  .metric-card {
    background-color: #fafafa;
    border-radius: 8px;
    padding: 16px;
    margin: 8px 0;
  }
  .metric-label {
    font-size: 12px;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .metric-value {
    font-size: 24px;
    font-weight: 700;
    margin-top: 4px;
  }
`;

/**
 * High Risk Alert Email Template
 */
const getHighRiskAlertTemplate = ({ 
  guardianName, 
  userName, 
  riskScore, 
  factors, 
  recommendations,
  timestamp 
}) => {
  const riskColor = riskScore >= 70 ? '#dc2626' : riskScore >= 50 ? '#f59e0b' : '#22c55e';
  const riskLevel = riskScore >= 70 ? 'High' : riskScore >= 50 ? 'Moderate' : 'Low';
  
  const factorsList = factors && factors.length > 0 
    ? factors.map(f => `<li style="margin: 4px 0; color: #52525b;">${f}</li>`).join('')
    : '<li style="color: #71717a;">No specific factors identified</li>';
  
  const recommendationsList = recommendations && recommendations.length > 0
    ? recommendations.map(r => `<li style="margin: 4px 0; color: #52525b;">${r}</li>`).join('')
    : '<li style="color: #71717a;">Reach out to check on their wellbeing</li>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>High Risk Alert</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header" style="background-color: #fef2f2; border-bottom: 3px solid ${riskColor};">
      <div style="font-size: 48px; margin-bottom: 8px;">⚠️</div>
      <h1 style="margin: 0; font-size: 24px; color: #18181b;">High Risk Alert</h1>
      <p style="margin: 8px 0 0; color: #71717a; font-size: 14px;">${timestamp}</p>
    </div>
    
    <!-- Content -->
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 24px;">
        Hello <strong>${guardianName}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #52525b; margin-bottom: 24px;">
        We're reaching out because <strong>${userName}</strong> is showing elevated risk indicators. 
        As their registered guardian, we wanted to ensure you're aware so you can provide support.
      </p>
      
      <!-- Risk Score Card -->
      <div style="background: linear-gradient(135deg, ${riskColor}15, ${riskColor}05); border: 1px solid ${riskColor}30; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">Current Risk Score</p>
        <p style="margin: 0; font-size: 48px; font-weight: 700; color: ${riskColor};">${riskScore}</p>
        <p style="margin: 8px 0 0; font-size: 14px; font-weight: 600; color: ${riskColor};">${riskLevel} Risk</p>
      </div>
      
      <!-- Contributing Factors -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 16px; color: #18181b;">Contributing Factors</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${factorsList}
        </ul>
      </div>
      
      <!-- Recommendations -->
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 16px; color: #166534;">Recommended Actions</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${recommendationsList}
        </ul>
      </div>
      
      <!-- Action Button -->
      <div style="text-align: center; margin-top: 32px;">
        <p style="font-size: 14px; color: #71717a; margin-bottom: 16px;">
          Consider reaching out to ${userName} to offer support and encouragement.
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>This alert was sent by the Rehab Recovery App</p>
      <p style="margin-top: 8px;">You're receiving this because you're registered as a guardian for ${userName}.</p>
    </div>
  </div>
</body>
</html>
`;
};

/**
 * SOS Emergency Alert Email Template
 */
const getSOSAlertTemplate = ({ 
  guardianName, 
  userName, 
  userEmail,
  message,
  metrics,
  timestamp 
}) => {
  const metricsHtml = metrics && Object.keys(metrics).length > 0 ? `
    <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
      ${metrics.riskScore !== undefined ? `
        <div class="metric-card" style="flex: 1; min-width: 120px;">
          <p class="metric-label">Risk Score</p>
          <p class="metric-value" style="color: #dc2626;">${metrics.riskScore}</p>
        </div>
      ` : ''}
      ${metrics.stressLevel !== undefined ? `
        <div class="metric-card" style="flex: 1; min-width: 120px;">
          <p class="metric-label">Stress Level</p>
          <p class="metric-value">${metrics.stressLevel}/10</p>
        </div>
      ` : ''}
      ${metrics.cravingLevel !== undefined ? `
        <div class="metric-card" style="flex: 1; min-width: 120px;">
          <p class="metric-label">Craving</p>
          <p class="metric-value">${metrics.cravingLevel}/10</p>
        </div>
      ` : ''}
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>URGENT SOS Alert</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header" style="background-color: #dc2626; color: white;">
      <div style="font-size: 48px; margin-bottom: 8px;">🚨</div>
      <h1 style="margin: 0; font-size: 28px; color: white;">URGENT: SOS Alert</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${timestamp}</p>
    </div>
    
    <!-- Content -->
    <div class="content">
      <div style="background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #dc2626;">
          ⚡ ${userName} has triggered an emergency SOS alert and may need immediate support.
        </p>
      </div>
      
      <p style="font-size: 16px; margin-bottom: 24px;">
        Dear <strong>${guardianName}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #52525b; margin-bottom: 24px;">
        <strong>${userName}</strong> has manually triggered an SOS emergency alert through the Rehab app. 
        This means they are asking for help and support right now.
      </p>
      
      ${message ? `
        <div style="background-color: #fafafa; border-left: 4px solid #dc2626; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #71717a; text-transform: uppercase;">Message from ${userName}:</p>
          <p style="margin: 0; font-size: 16px; font-style: italic; color: #18181b;">"${message}"</p>
        </div>
      ` : ''}
      
      ${metricsHtml}
      
      <!-- Contact Info -->
      <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 16px; color: #1e40af;">Contact ${userName}</h3>
        <p style="margin: 0; font-size: 14px; color: #52525b;">
          Email: <a href="mailto:${userEmail}" style="color: #2563eb;">${userEmail}</a>
        </p>
      </div>
      
      <!-- Immediate Actions -->
      <div style="border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px;">
        <h3 style="margin: 0 0 12px; font-size: 16px; color: #18181b;">Recommended Immediate Actions</h3>
        <ul style="margin: 0; padding-left: 20px; color: #52525b;">
          <li style="margin: 8px 0;">Try to reach ${userName} immediately by phone or message</li>
          <li style="margin: 8px 0;">If you cannot reach them and are concerned for their safety, consider visiting them in person</li>
          <li style="margin: 8px 0;">Remind them that support is available and they are not alone</li>
          <li style="margin: 8px 0;">If there's immediate danger, contact emergency services (911)</li>
        </ul>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer" style="background-color: #fef2f2;">
      <p style="color: #dc2626; font-weight: 600;">This is an urgent notification requiring immediate attention</p>
      <p style="margin-top: 8px;">Rehab Recovery App - Guardian Alert System</p>
    </div>
  </div>
</body>
</html>
`;
};

/**
 * Weekly Report Email Template
 */
const getWeeklyReportTemplate = ({ 
  guardianName, 
  userName, 
  weeklyStats,
  reportDate 
}) => {
  const stats = weeklyStats || {};
  const trend = stats.trend || 'stable';
  const trendColor = trend === 'improving' ? '#22c55e' : trend === 'declining' ? '#f59e0b' : '#71717a';
  const trendIcon = trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️';
  const trendText = trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Needs Attention' : 'Stable';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Recovery Report</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header" style="background: linear-gradient(135deg, #18181b, #27272a);">
      <div style="font-size: 48px; margin-bottom: 8px;">📊</div>
      <h1 style="margin: 0; font-size: 24px; color: white;">Weekly Recovery Report</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">${reportDate}</p>
    </div>
    
    <!-- Content -->
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 24px;">
        Hello <strong>${guardianName}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #52525b; margin-bottom: 24px;">
        Here's a summary of <strong>${userName}</strong>'s recovery journey for the past week.
      </p>
      
      <!-- Overall Trend -->
      <div style="background-color: ${trendColor}15; border: 1px solid ${trendColor}30; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 32px;">${trendIcon}</p>
        <p style="margin: 8px 0 0; font-size: 18px; font-weight: 600; color: ${trendColor};">Overall Trend: ${trendText}</p>
      </div>
      
      <!-- Key Metrics Grid -->
      <h3 style="margin: 0 0 16px; font-size: 16px; color: #18181b;">Key Metrics</h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px;">
        <div class="metric-card">
          <p class="metric-label">Days Logged</p>
          <p class="metric-value" style="color: #18181b;">${stats.daysLogged || 0}/7</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Sober Streak</p>
          <p class="metric-value" style="color: #22c55e;">${stats.soberStreak || 0} days</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Avg Risk Score</p>
          <p class="metric-value" style="color: ${(stats.avgRiskScore || 0) >= 60 ? '#dc2626' : (stats.avgRiskScore || 0) >= 40 ? '#f59e0b' : '#22c55e'};">${stats.avgRiskScore || 0}</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Craving Episodes</p>
          <p class="metric-value" style="color: #18181b;">${stats.cravingCount || 0}</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Avg Sleep Quality</p>
          <p class="metric-value" style="color: #18181b;">${stats.avgSleepQuality || 0}/10</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Avg Stress Level</p>
          <p class="metric-value" style="color: ${(stats.avgStressLevel || 0) >= 7 ? '#dc2626' : '#18181b'};">${stats.avgStressLevel || 0}/10</p>
        </div>
      </div>
      
      <!-- Insights -->
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 16px; color: #166534;">💡 Weekly Insights</h3>
        <ul style="margin: 0; padding-left: 20px; color: #52525b;">
          ${stats.daysLogged >= 5 ? 
            '<li style="margin: 8px 0;">Great engagement! Logged activities on most days this week.</li>' : 
            '<li style="margin: 8px 0;">Consider encouraging more frequent check-ins for better tracking.</li>'
          }
          ${(stats.avgRiskScore || 0) < 40 ? 
            '<li style="margin: 8px 0;">Risk levels have been manageable this week.</li>' : 
            '<li style="margin: 8px 0;">Risk levels were elevated this week - continued support is important.</li>'
          }
          ${(stats.avgSleepQuality || 0) >= 6 ? 
            '<li style="margin: 8px 0;">Sleep quality has been good, which supports recovery.</li>' : 
            '<li style="margin: 8px 0;">Sleep quality could be improved - rest is crucial for recovery.</li>'
          }
        </ul>
      </div>
      
      <!-- Supportive Message -->
      <div style="text-align: center; padding: 20px; background-color: #fafafa; border-radius: 8px;">
        <p style="margin: 0; font-size: 14px; color: #52525b;">
          Your continued support makes a difference in ${userName}'s recovery journey. 
          Consider reaching out to share encouragement and let them know you care.
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>Weekly Report from Rehab Recovery App</p>
      <p style="margin-top: 8px;">You're receiving this because you're registered as a guardian for ${userName}.</p>
      <p style="margin-top: 8px; font-size: 11px; color: #a1a1aa;">
        To change notification preferences, ask ${userName} to update settings in the app.
      </p>
    </div>
  </div>
</body>
</html>
`;
};

module.exports = {
  getHighRiskAlertTemplate,
  getSOSAlertTemplate,
  getWeeklyReportTemplate
};
