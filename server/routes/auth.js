const express = require('express');
const crypto = require('crypto');
const db = require('../db/database');
const { hashPassword, verifyPassword } = require('../utils/password');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_prod';
const JWT_EXP_SECONDS = (() => {
  const v = process.env.JWT_EXP || '365d';
  if (/^[0-9]+$/.test(v)) return parseInt(v, 10);
  if (v.endsWith('d')) return parseInt(v, 10) * 86400;
  if (v.endsWith('h')) return parseInt(v, 10) * 3600;
  if (v.endsWith('m')) return parseInt(v, 10) * 60;
  return 31536000; // 1 year
})();

function base64url(input) {
  return Buffer.from(input).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function jwtSign(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + JWT_EXP_SECONDS;
  const full = { ...payload, iat, exp };
  const enc = base64url(JSON.stringify(header)) + '.' + base64url(JSON.stringify(full));
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(enc).digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${enc}.${sig}`;
}

// GET /api/auth/me — returns profile of the currently signed-in admin
router.get('/me', (req, res) => {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const parts = token.split('.');
  if (parts.length !== 3) return res.status(401).json({ error: 'Invalid token' });
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const row = db.prepare('SELECT id, fullName, email FROM admins WHERE id = ?').get(payload.id);
  if (!row) return res.status(404).json({ error: 'Admin not found' });
  res.json({ data: { id: row.id, fullName: row.fullName, email: row.email } });
});

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  try {
    const { fullName, email, password } = req.body || {};
    if (!fullName || !email || !password)
      return res.status(400).json({ error: 'Missing required fields: fullName, email, password' });

    const existing = db.prepare('SELECT id FROM admins WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Admin with this email already exists' });

    const hashed = hashPassword(password);
    const result = db.prepare('INSERT INTO admins (fullName, email, password) VALUES (?,?,?)')
      .run(fullName, email, JSON.stringify(hashed));

    const admin = { id: result.lastInsertRowid, fullName, email };
    const token = jwtSign({ id: admin.id, email });
    res.status(201).json({ admin, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// POST /api/auth/signin
router.post('/signin', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: 'Missing required fields: email, password' });

    const row = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });

    let stored;
    try { stored = JSON.parse(row.password); } catch (e) { stored = row.password; }

    if (!verifyPassword(password, stored)) {
      // legacy plaintext migration
      if (typeof stored === 'string' && stored === password) {
        const hashed = hashPassword(password);
        db.prepare('UPDATE admins SET password = ? WHERE id = ?')
          .run(JSON.stringify(hashed), row.id);
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    const admin = { id: row.id, fullName: row.fullName, email: row.email };
    const token = jwtSign({ id: row.id, email: row.email });
    res.json({ admin, token });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Signin failed' });
  }
});

module.exports = router;
