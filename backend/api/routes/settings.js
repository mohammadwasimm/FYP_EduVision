const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db/database');
const { hashPassword, verifyPassword } = require('../utils/password');
const { verifyJwt } = require('../middleware/auth');

const router = express.Router();

// ── Profile Picture Upload Setup ───────────────────────────────────────
const uploadDir = path.resolve(__dirname, '..', 'data', 'uploads', 'profiles');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: admin-{id}-{timestamp}.ext
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `admin-${timestamp}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (validMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

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

// POST /api/settings/profile-picture
router.post('/profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get admin email from JWT
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const claims = verifyJwt(token);
    const adminEmail = claims?.email;

    if (!adminEmail) {
      // Clean up uploaded file if auth fails
      fs.unlinkSync(req.file.path);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find admin by email
    const admin = db.prepare('SELECT id FROM admins WHERE email=?').get(adminEmail);
    if (!admin) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Generate the image URL (relative to the server root)
    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    // Delete old profile picture if it exists
    const oldAdmin = db.prepare('SELECT profile_picture FROM admins WHERE id=?').get(admin.id);
    if (oldAdmin?.profile_picture) {
      const oldPath = oldAdmin.profile_picture.replace('/uploads/profiles/', '');
      const fullOldPath = path.join(uploadDir, oldPath);
      try {
        if (fs.existsSync(fullOldPath)) {
          fs.unlinkSync(fullOldPath);
        }
      } catch (e) {
        console.warn('Failed to delete old profile picture:', e);
      }
    }

    // Update admin's profile picture in database
    db.prepare('UPDATE admins SET profile_picture=? WHERE id=?')
      .run(imageUrl, admin.id);

    res.json({
      success: true,
      data: {
        profilePicture: imageUrl
      }
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);

    // Clean up uploaded file on error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.warn('Failed to clean up uploaded file:', e);
      }
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 5MB limit' });
      }
      return res.status(400).json({ error: `Upload error: ${error.message}` });
    }

    res.status(500).json({ error: error.message || 'Failed to upload profile picture' });
  }
});

module.exports = router;
