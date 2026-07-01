const jwt = require('jsonwebtoken');
const config = require('../config');

/** Sign a JWT for a user. Returns { token, expiresAt }. */
function signToken(payload) {
  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);
  return { token, expiresAt };
}

/** Verify a JWT. Throws on invalid/expired. */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = { signToken, verifyToken };
