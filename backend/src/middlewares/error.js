const ApiError = require('../utils/ApiError');
const config = require('../config');

/** 404 handler for unmatched routes. */
function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/** Central error handler. Must have 4 args for Express to recognize it. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Postgres unique-violation -> 409
  if (err.code === '23505') {
    statusCode = 409;
    message = 'A record with these details already exists';
  }
  // Postgres FK violation -> 400
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced record does not exist';
  }

  if (statusCode >= 500) {
    console.error('Unhandled error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.details ? { details: err.details } : {}),
    ...(config.env === 'development' && statusCode >= 500
      ? { stack: err.stack }
      : {}),
  });
}

module.exports = { notFound, errorHandler };
