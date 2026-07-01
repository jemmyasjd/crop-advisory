/**
 * Standardized success/error JSON envelopes.
 */

function success(res, { statusCode = 200, message = 'OK', data = undefined, extra = {} } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...extra,
    ...(data !== undefined ? { data } : {}),
  });
}

function fail(res, { statusCode = 400, message = 'Error', details = undefined } = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details !== undefined ? { details } : {}),
  });
}

module.exports = { success, fail };
