/**
 * Runs schema.sql against the configured database.
 * Usage: npm run migrate
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('Running migration (schema.sql) ...');
  await pool.query(sql);
  console.log('✓ Schema created successfully.');
}

migrate()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('✗ Migration failed:', err.message);
    pool.end().finally(() => process.exit(1));
  });
