const bcrypt = require('bcryptjs');
const { query } = require('../db/pool');
const { signToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

const PUBLIC_FIELDS = 'id, name, email, role, phone, created_at, updated_at';

/** Issue a token, persist it on the user row, and return token + user. */
async function issueSession(user) {
  const { token, expiresAt } = signToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });
  await query('UPDATE users SET token = $1, token_expiry = $2 WHERE id = $3', [
    token,
    expiresAt,
    user.id,
  ]);
  return { token, expiresAt };
}

/** Farmer signup. */
async function signup({ name, email, password, phone }) {
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) {
    throw ApiError.conflict('Email already registered');
  }
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role, phone)
     VALUES ($1, $2, $3, 'farmer', $4)
     RETURNING ${PUBLIC_FIELDS}`,
    [name, email, hash, phone || null]
  );
  const user = rows[0];
  const session = await issueSession(user);
  return { user, ...session };
}

/** Login for a given expected role ('farmer' or 'admin'). */
async function login({ email, password }, expectedRole) {
  const { rows } = await query(
    `SELECT id, name, email, role, phone, password_hash FROM users WHERE email = $1`,
    [email]
  );
  const user = rows[0];
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  if (expectedRole && user.role !== expectedRole) {
    throw ApiError.forbidden(`This account is not authorized as ${expectedRole}`);
  }

  delete user.password_hash;
  const session = await issueSession(user);
  return { user, ...session };
}

/** Logout: clear the active token. */
async function logout(userId) {
  await query('UPDATE users SET token = NULL, token_expiry = NULL WHERE id = $1', [
    userId,
  ]);
}

module.exports = { signup, login, logout };
