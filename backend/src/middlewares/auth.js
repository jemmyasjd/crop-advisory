const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');
const { query } = require('../db/pool');

/**
 * Authentication middleware.
 * 1. Extracts the Bearer token from the Authorization header.
 * 2. Verifies the JWT signature/expiry.
 * 3. Confirms the token matches the one stored in the DB for that user
 *    (so logout / token rotation actually invalidates old tokens).
 * Attaches `req.user = { id, name, email, role }`.
 */
async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Missing or malformed Authorization header');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const { rows } = await query(
      'SELECT id, name, email, role, token, token_expiry FROM users WHERE id = $1',
      [decoded.sub]
    );
    const user = rows[0];
    if (!user) throw ApiError.unauthorized('User no longer exists');

    // Token must match the active token stored in DB.
    if (!user.token || user.token !== token) {
      throw ApiError.unauthorized('Session expired or logged out');
    }
    if (user.token_expiry && new Date(user.token_expiry) < new Date()) {
      throw ApiError.unauthorized('Session expired');
    }

    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role guard. Use after `authenticate`.
 * @param  {...string} roles allowed roles
 */
function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }
    next();
  };
}

module.exports = { authenticate, authorize };
