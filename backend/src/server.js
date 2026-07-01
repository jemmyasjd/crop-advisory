const app = require('./app');
const config = require('./config');
const { pool } = require('./db/pool');

const server = app.listen(config.port, () => {
  console.log(`🍉 Crop Advisory API listening on http://localhost:${config.port}`);
  console.log(`   Environment: ${config.env}`);
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down...`);
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;
