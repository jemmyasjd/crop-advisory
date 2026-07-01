// Vercel serverless entry point.
// Re-exports the Express app (which does NOT call app.listen) so Vercel can
// wrap it as a serverless function.
module.exports = require('../src/app');
