const express = require('express');
const db = require('../db/database');
const { hashPassword, verifyPassword } = require('../utils/password');
const { verifyJwt } = require('../middleware/auth');

const router = express.Router();

function getSettings() {
  const row = db.prepare('SELECT data FROM settings WHERE id=1').get();
  try { return JSON.parse(row?.data || '{}'); } catch(e) { return {}; }
}

function saveSettings(obj) {
  db.prepare('INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)').run(JSON.stringify(obj));
}

const DEFAULT_SETTINGS = {
  notifications: { emailAlerts: true, criticalOnly: false, dailyDigest: true, soundAlerts: true, browserNotifications: false },
  security: { passwordStrength: 'medium' },
  reports: { autoClearDays: 30, exportFormat: 'csv' },
};

// GET /api/settings
router.get('/', (req, res) => {
  const s = getSettings();
  res.json({ data: Object.keys(s).length ? s : DEFAULT_SETTINGS });
});

// PUT /api/settings
router.put('/', (req, res) => {
  const incoming = req.body || {};
  const current  = getSettings() || DEFAULT_SETTINGS;
  const merged = {
    ...current,
    ...incoming,
    notifications: { ...current.notifications, ...(incoming.notifications || {}) },
    security:      { ...current.security,      ...(incoming.security || {}) },
    reports:       { ...current.reports,       ...(incoming.reports || {}) },
  };
  saveSettings(merged);
  res.json({ data: merged });
});

// POST /api/settings/clear-incidents
router.post('/clear-incidents', (req, res) => {
  const { days } = req.body || {};
  const d = parseInt(days, 10);
  if (isNaN(d) || d < 1) return res.status(400).json({ error: 'days must be a positive integer' });
  const info = db.prepare(`DELETE FROM incidents WHERE datetime(timestamp) < datetime('now', ?)`)
    .run(`-${d} days`);
  res.json({ data: { deleted: info.changes, days: d } });
});

// PUT /api/settings/password
router.put('/password', (req, res) => {
  const { email, currentPassword, newPassword } = req.body || {};

  // Allow resolving email from JWT
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const claims = verifyJwt(token);
  const resolvedEmail = claims?.email || email;

  if (!resolvedEmail || !currentPassword || !newPassword)
    return res.status(400).json({ error: 'email, currentPassword and newPassword are required' });
  if (typeof newPassword !== 'string' || newPassword.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters' });

  const admin = db.prepare('SELECT * FROM admins WHERE email=?').get(resolvedEmail);
  if (!admin) return res.status(404).json({ error: 'Admin not found' });

  let stored;
  try { stored = JSON.parse(admin.password); } catch(e) { stored = admin.password; }

  if (!verifyPassword(currentPassword, stored))
    return res.status(401).json({ error: 'Current password is incorrect' });

  db.prepare('UPDATE admins SET password=? WHERE email=?')
    .run(JSON.stringify(hashPassword(newPassword)), resolvedEmail);

  res.json({ message: 'Password updated successfully' });
});

module.exports = router;
