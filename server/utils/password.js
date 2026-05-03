const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const keylen = 32;
  const digest = 'sha256';
  const derived = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
  return { kdf: 'pbkdf2', salt, iterations, keylen, digest, hash: derived };
}

function verifyPassword(password, stored) {
  if (!stored) return false;

  if (typeof stored === 'object' && stored.kdf === 'pbkdf2') {
    const { salt, iterations, keylen, digest, hash } = stored;
    const derived = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
  }

  if (typeof stored === 'string') return stored === password;
  return false;
}

module.exports = {
  hashPassword,
  verifyPassword,
};
