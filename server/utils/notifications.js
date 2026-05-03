const nodemailer = require('nodemailer');
const db = require('../db/database');

function getSettings() {
  const row = db.prepare('SELECT data FROM settings WHERE id=1').get();
  try { return JSON.parse(row?.data || '{}'); } catch(e) { return {}; }
}

// Create transporter lazily so missing env vars don't crash startup
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
}

/**
 * Send an incident alert email.
 * Only fires if:
 *  - SMTP env vars are configured
 *  - settings.notifications.emailAlerts is true
 *  - incident severity qualifies (criticalOnly = high only, else any)
 */
async function sendIncidentAlert(incident) {
  try {
    const settings = getSettings();
    const notif = settings.notifications || {};
    if (!notif.emailAlerts) return;
    if (notif.criticalOnly && incident.severity !== 'high') return;

    const to = process.env.ALERT_EMAIL || process.env.SMTP_USER;
    if (!to) return;

    const transport = createTransporter();
    if (!transport) return;

    const subject = `[EduVision] ${incident.severity?.toUpperCase()} Alert — ${incident.studentName || 'Unknown'}`;
    const html = `
      <h2 style="color:${incident.severity==='high'?'#e11d48':'#d97706'}">
        ${incident.severity?.toUpperCase()} Severity Incident Detected
      </h2>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
        <tr><td style="padding:6px;font-weight:bold">Student</td><td style="padding:6px">${incident.studentName||'—'} (${incident.rollNumber||'—'})</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Exam</td><td style="padding:6px">${incident.exam||'—'}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Subject</td><td style="padding:6px">${incident.subject||'—'}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Cheating Type</td><td style="padding:6px">${incident.cheatingType||'—'}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Time</td><td style="padding:6px">${incident.timestamp||'—'}</td></tr>
      </table>
      <p style="color:#64748b;font-size:12px;margin-top:16px">
        EduVision AI Monitor — automated alert
      </p>
    `;

    await transport.sendMail({ from: process.env.SMTP_USER, to, subject, html });
    console.log(`[notify] alert email sent to ${to} for incident ${incident.id}`);
  } catch (err) {
    console.warn('[notify] email failed:', err.message);
  }
}

module.exports = { sendIncidentAlert };
