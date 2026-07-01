const { Pool, types } = require('pg');
const config = require('../config');

// Return DATE columns (OID 1082) as plain 'YYYY-MM-DD' strings instead of JS
// Date objects. The default parser builds a Date at local midnight, which can
// shift the day across timezones when re-serialized — breaking GDD/DAP math.
types.setTypeParser(1082, (val) => val);

/**
 * Parse the connection string into discrete fields. We deliberately do NOT
 * pass the raw connectionString to pg, because a `sslmode=require` query param
 * is interpreted by newer pg as `verify-full`, which rejects Aiven's
 * self-signed CA chain. Splitting it out lets our explicit `ssl` config
 * (rejectUnauthorized:false) take effect.
 */
function parseConnection(connectionString) {
  const u = new URL(connectionString);
  return {
    host: u.hostname,
    port: u.port ? parseInt(u.port, 10) : 5432,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
  };
}

/**
 * A single shared connection pool for the whole app.
 * Aiven enforces a connection limit (20), so we cap the pool well below that.
 */
const pool = new Pool({
  ...parseConnection(config.db.connectionString),
  ssl: config.db.ssl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  // Log and keep running; a dead idle client should not crash the process.
  console.error('Unexpected PG pool error:', err.message);
});

/**
 * Run a query against the pool.
 * @param {string} text - SQL text with $1, $2 placeholders.
 * @param {Array} params - parameter values.
 */
const query = (text, params) => pool.query(text, params);

/**
 * Run a function inside a single transaction. The callback receives a
 * dedicated client; commit/rollback is handled automatically.
 * @param {(client: import('pg').PoolClient) => Promise<any>} fn
 */
const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, withTransaction };
