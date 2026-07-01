const bcrypt = require('bcryptjs');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');

const PUBLIC_FIELDS = 'id, name, email, role, phone, created_at, updated_at';

async function getProfile(userId) {
  const { rows } = await query(
    `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`,
    [userId]
  );
  if (!rows[0]) throw ApiError.notFound('User not found');
  return rows[0];
}

async function updateProfile(userId, { name, phone, password }) {
  const sets = [];
  const params = [];
  let i = 1;

  if (name !== undefined) {
    sets.push(`name = $${i++}`);
    params.push(name);
  }
  if (phone !== undefined) {
    sets.push(`phone = $${i++}`);
    params.push(phone);
  }
  if (password !== undefined) {
    const hash = await bcrypt.hash(password, 10);
    sets.push(`password_hash = $${i++}`);
    params.push(hash);
  }
  if (!sets.length) throw ApiError.badRequest('No fields to update');

  params.push(userId);
  const { rows } = await query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING ${PUBLIC_FIELDS}`,
    params
  );
  if (!rows[0]) throw ApiError.notFound('User not found');
  return rows[0];
}

module.exports = { getProfile, updateProfile };
