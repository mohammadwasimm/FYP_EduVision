const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../db/database');

const router = express.Router();

const SNAP_DIR = path.resolve(__dirname, '..', 'data', 'snapshots');
const DATA_DIR = path.resolve(__dirname, '..', 'data');

// ─── Helpers ───────────────────────────────────────────────────────────────

function nextIncidentId() {
  const row = db.prepare(`SELECT id FROM incidents WHERE id LIKE 'inc-%' ORDER BY id DESC LIMIT 1`).get();
  if (!row) return 'inc-0001';
  const n = parseInt(row.id.split('-')[1], 10) + 1;
  return `inc-${String(n).padStart(4, '0')}`;
}

// ─── GET /api/reports ──────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { search, exam, subject, date, severity } = req.query || {};

  let sql = 'SELECT * FROM incidents WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (lower(studentName) LIKE ? OR lower(rollNumber) LIKE ?)';
    const q = `%${String(search).toLowerCase()}%`;
    params.push(q, q);
  }
  if (exam && exam !== 'all')       { sql += ' AND exam = ?';     params.push(exam); }
  if (subject && subject !== 'all') { sql += ' AND subject = ?';  params.push(subject); }
  if (date)                         { sql += ' AND date = ?';      params.push(date); }
  if (severity)                     { sql += ' AND severity = ?';  params.push(severity); }

  sql += ' ORDER BY timestamp DESC';
  const rows = db.prepare(sql).all(...params);
  res.json({ data: rows });
});

// ─── GET /api/reports/stats/summary ───────────────────────────────────────
router.get('/stats/summary', (req, res) => {
  const total  = db.prepare('SELECT COUNT(*) as c FROM incidents').get().c;
  const high   = db.prepare(`SELECT COUNT(*) as c FROM incidents WHERE severity='high'`).get().c;
  const medium = db.prepare(`SELECT COUNT(*) as c FROM incidents WHERE severity='medium'`).get().c;
  const low    = db.prepare(`SELECT COUNT(*) as c FROM incidents WHERE severity='low'`).get().c;
  res.json({ data: { total, high, medium, low } });
});

// ─── GET /api/reports/export.csv ──────────────────────────────────────────
router.get('/export.csv', (req, res) => {
  const { search, exam, subject, date, severity } = req.query || {};
  let sql = 'SELECT * FROM incidents WHERE 1=1';
  const params = [];
  if (search) { sql += ' AND (lower(studentName) LIKE ? OR lower(rollNumber) LIKE ?)'; const q=`%${String(search).toLowerCase()}%`; params.push(q,q); }
  if (exam&&exam!=='all')       { sql += ' AND exam=?';    params.push(exam); }
  if (subject&&subject!=='all') { sql += ' AND subject=?'; params.push(subject); }
  if (date)                     { sql += ' AND date=?';    params.push(date); }
  if (severity)                 { sql += ' AND severity=?';params.push(severity); }
  sql += ' ORDER BY timestamp DESC';
  const rows = db.prepare(sql).all(...params);

  const header = ['id','studentName','rollNumber','exam','subject','cheatingType','timestamp','date','severity','mobileDetected','headMovement','eyeMovement','headPose','evidenceFile'];
  const lines  = [header.join(','), ...rows.map(r => header.map(h => `"${String(r[h]??'').replace(/"/g,'""')}"`).join(','))];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="incidents.csv"');
  res.send(lines.join('\n'));
});

// ─── POST /api/reports ─────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const raw = req.body || {};
  const id = nextIncidentId();
  db.prepare(`INSERT INTO incidents (id,studentName,rollNumber,exam,subject,cheatingType,timestamp,date,severity,evidenceFile,instanceId,mobileDetected,headMovement,eyeMovement,headPose) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, raw.studentName||null, raw.rollNumber||null, raw.exam||null, raw.subject||null,
        raw.cheatingType||null, raw.timestamp||new Date().toISOString(),
        raw.date||new Date().toISOString().slice(0,10),
        raw.severity||'low', raw.evidenceFile||null, raw.instanceId||null,
        raw.mobileDetected||'No', raw.headMovement||'Normal', raw.eyeMovement||'Unknown', raw.headPose||'Unknown');
  const inc = db.prepare('SELECT * FROM incidents WHERE id=?').get(id);
  if (global._io) global._io.emit('new_incident', inc);

  // Trigger notifications based on settings
  notifyAdmins(inc).catch(err => console.error('Notification error:', err));

  res.status(201).json({ data: inc });
});

// Helper function to send notifications to admins
async function notifyAdmins(incident) {
  try {
    // Get settings and all admins
    const settingsRow = db.prepare('SELECT data FROM settings WHERE id=1').get();
    let settings = {};
    try { settings = JSON.parse(settingsRow?.data || '{}'); } catch(e) {}

    const admins = db.prepare('SELECT email, fullName FROM admins').all() || [];

    const notifyPrefs = settings.notifications || {};

    // Check if we should send notifications
    const shouldNotifyEmail = notifyPrefs.emailAlerts && (!notifyPrefs.criticalOnly || incident.severity === 'high');
    const shouldNotifyDaily = notifyPrefs.dailyDigest;
    const shouldPlaySound = notifyPrefs.soundAlerts;

    // Emit sound alert via Socket.io if enabled
    if (shouldPlaySound && global._io) {
      global._io.emit('sound_alert', {
        incidentId: incident.id,
        severity: incident.severity,
        studentName: incident.studentName
      });
    }

    // Send email alerts (if SMTP is configured)
    if (shouldNotifyEmail && admins.length > 0) {
      const adminEmails = admins.map(a => a.email).filter(Boolean);
      if (adminEmails.length > 0 && process.env.SMTP_ENABLED === 'true') {
        sendEmailAlerts(adminEmails, incident).catch(err =>
          console.error('Email alert failed:', err)
        );
      }
    }

    // Note: Daily digest would be handled by a scheduled job (e.g., cron)
    // not triggered per-incident

  } catch (err) {
    console.error('Error in notifyAdmins:', err);
  }
}

// Helper function to send email alerts
async function sendEmailAlerts(emails, incident) {
  try {
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    });

    const severityColor = {
      high: '#dc2626',
      medium: '#f59e0b',
      low: '#10b981'
    }[incident.severity] || '#6b7280';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #667eea, #764ba2); padding: 20px; color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🚨 New Incident Alert</h1>
        </div>
        <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
          <div style="background: white; padding: 15px; border-left: 4px solid ${severityColor}; margin-bottom: 15px;">
            <p style="margin: 0 0 10px 0;"><strong>Student:</strong> ${incident.studentName || 'Unknown'}</p>
            <p style="margin: 0 0 10px 0;"><strong>Roll Number:</strong> ${incident.rollNumber || '—'}</p>
            <p style="margin: 0 0 10px 0;"><strong>Exam:</strong> ${incident.exam || '—'}</p>
            <p style="margin: 0 0 10px 0;"><strong>Cheating Type:</strong> ${incident.cheatingType || '—'}</p>
            <p style="margin: 0;"><strong>Severity:</strong> <span style="color: ${severityColor}; font-weight: bold; text-transform: uppercase;">${incident.severity}</span></p>
          </div>
          <div style="background: white; padding: 15px; margin-bottom: 15px; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; color: #666;"><strong>Detected Issues:</strong></p>
            <ul style="margin: 5px 0; padding-left: 20px; color: #666;">
              ${incident.mobileDetected === 'Yes' ? '<li>Mobile phone detected</li>' : ''}
              ${incident.headMovement === 'Critical' ? '<li>Critical head movement</li>' : incident.headMovement === 'Warning' ? '<li>Head movement warning</li>' : ''}
              ${incident.eyeMovement && incident.eyeMovement !== 'Looking Center' ? `<li>Eye movement: ${incident.eyeMovement}</li>` : ''}
              ${incident.headPose && incident.headPose !== 'Looking at Screen' ? `<li>Head pose: ${incident.headPose}</li>` : ''}
            </ul>
          </div>
          <p style="text-align: center; margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reports"
               style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View in Dashboard
            </a>
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: emails.join(','),
      subject: `[${incident.severity.toUpperCase()}] Incident Alert: ${incident.studentName || 'Unknown Student'} - ${incident.cheatingType || 'Exam Violation'}`,
      html: htmlContent
    });

    console.log(`Email alert sent to ${emails.length} admin(s)`);
  } catch (err) {
    console.error('Failed to send email alerts:', err.message);
    // Non-fatal error — don't break incident creation
  }
}

// ─── DELETE /api/reports/:id ───────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM incidents WHERE id=?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Incident not found' });
  res.status(204).send();
});

// ─── GET /api/reports/:id/evidence ────────────────────────────────────────
router.get('/:id/evidence', (req, res) => {
  const inc = db.prepare('SELECT * FROM incidents WHERE id=?').get(req.params.id);
  if (!inc) return res.status(404).json({ error: 'Incident not found' });
  const file = inc.evidenceFile;
  if (!file) return res.status(404).json({ error: 'No evidence file attached' });

  const wantDownload = req.query.download === '1' || req.query.download === 'true';
  const candidates = [];

  // snapshot URL produced by exams route
  if (typeof file === 'string' && file.startsWith('/api/exams/instances')) {
    candidates.push(path.resolve(SNAP_DIR, path.basename(file)));
  }
  candidates.push(
    path.resolve(DATA_DIR, file),
    path.resolve(__dirname, '..', 'build', file),
    path.resolve(__dirname, '..', 'public', file),
  );

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      if (wantDownload) res.setHeader('Content-Disposition', `attachment; filename="${path.basename(p)}"`);
      return res.sendFile(p);
    }
  }

  // placeholder fallback
  const placeholder = path.resolve(DATA_DIR, 'evidence-placeholder.txt');
  if (!fs.existsSync(placeholder)) fs.writeFileSync(placeholder, 'No evidence file available.');
  res.sendFile(placeholder);
});

// ─── POST /api/reports/:id/evidence (JSON base64) ─────────────────────────
router.post('/:id/evidence', (req, res, next) => {
  if (!req.is('application/json')) return next();
  const { filename, data } = req.body || {};
  if (!filename || !data) return res.status(400).json({ error: 'filename and data (base64) required' });

  const inc = db.prepare('SELECT id FROM incidents WHERE id=?').get(req.params.id);
  if (!inc) return res.status(404).json({ error: 'Incident not found' });

  try {
    fs.writeFileSync(path.resolve(DATA_DIR, filename), Buffer.from(data, 'base64'));
    db.prepare('UPDATE incidents SET evidenceFile=? WHERE id=?').run(filename, req.params.id);
    res.status(201).json({ data: { evidenceFile: filename } });
  } catch (e) {
    res.status(500).json({ error: 'Failed to write file' });
  }
});

// multer upload (optional)
let upload = null;
try {
  const multer = require('multer');
  const storage = multer.diskStorage({ destination: (r,f,cb)=>cb(null,DATA_DIR), filename: (r,f,cb)=>cb(null,f.originalname) });
  upload = multer({ storage });
} catch(e) { /* multer optional */ }

if (upload) {
  router.post('/:id/evidence', upload.single('evidence'), (req, res) => {
    const inc = db.prepare('SELECT id FROM incidents WHERE id=?').get(req.params.id);
    if (!inc) return res.status(404).json({ error: 'Incident not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    db.prepare('UPDATE incidents SET evidenceFile=? WHERE id=?').run(req.file.filename, req.params.id);
    res.status(201).json({ data: { evidenceFile: req.file.filename } });
  });
}

// ─── GET /api/reports/:id ─────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const inc = db.prepare('SELECT * FROM incidents WHERE id=?').get(req.params.id);
  if (!inc) return res.status(404).json({ error: 'Incident not found' });
  res.json({ data: inc });
});

module.exports = { reportsRouter: router };
