/**
 * Ensures the slaughter authorization-workflow columns exist.
 * Runs automatically on server startup (MySQL only). Idempotent & safe.
 */
const pool = require('./db');

const COLUMNS = [
  ['authorization_status', "VARCHAR(20) DEFAULT 'pending'"],
  ['authorized_by', 'CHAR(36)'],
  ['authorized_at', 'DATETIME'],
  ['authorization_notes', 'TEXT'],
];

async function ensureSlaughterAuth() {
  if (pool._engine !== 'mysql') return;

  try {
    for (const [name, type] of COLUMNS) {
      const check = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'slaughter_records' AND COLUMN_NAME = ?`,
        [name]
      );
      if (check.rows.length === 0) {
        await pool.query(`ALTER TABLE slaughter_records ADD COLUMN ${name} ${type}`);
        console.log(`[startup] Added slaughter_records.${name}`);
      }
    }
    // Any legacy records with the old 'scheduled' status become authorized
    // (so they aren't stuck in the new workflow).
    await pool.query(
      `UPDATE slaughter_records SET authorization_status = 'authorized'
       WHERE authorization_status IS NULL OR status = 'scheduled'`
    );
  } catch (err) {
    console.error('[startup] ensureSlaughterAuth error:', err.message);
  }
}

module.exports = ensureSlaughterAuth;
