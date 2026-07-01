/**
 * Wraps an async route handler so rejected promises are forwarded to Express's
 * error middleware instead of crashing or hanging.
 * @param {Function} fn
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
