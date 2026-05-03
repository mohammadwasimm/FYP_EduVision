const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_prod';

function verifyJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expected = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  if (expected !== signature) return null;

  try {
    const raw = Buffer.from(
      encodedPayload.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    ).toString('utf8');
    const payload = JSON.parse(raw);
    if (payload?.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Express middleware — requires a valid Bearer JWT.
 * Attaches decoded payload to req.admin.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  const claims = verifyJwt(token);
  if (!claims) return res.status(401).json({ error: 'Unauthorized — valid token required' });
  req.admin = claims;
  next();
}

module.exports = { requireAuth, verifyJwt };
