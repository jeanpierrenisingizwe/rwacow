/**
 * Ensures the cow approval-workflow columns exist.
 * Runs automatically on server startup (MySQL only). Idempotent & safe.
 */
const pool = require('./db');

const COLUMNS = [
  ['approval_status', "VARCHAR(20) DEFAULT 'approved'"],
  ['submitted_by', 'CHAR(36)'],
  ['reviewed_by', 'CHAR(36)'],
  ['reviewed_at', 'DATETIME'],
  ['rejection_reason', 'TEXT'],
];

async function ensureApprovalColumns() {
  // Only relevant for MySQL. SQLite migrate already includes these.
  if (pool._engine !== 'mysql') return;

  try {
    for (const [name, type] of COLUMNS) {
      const check = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cows' AND COLUMN_NAME = ?`,
        [name]
      );
      if (check.rows.length === 0) {
        await pool.query(`ALTER TABLE cows ADD COLUMN ${name} ${type}`);
        console.log(`[startup] Added cows.${name}`);
      }
    }
    await pool.query(`UPDATE cows SET approval_status = 'approved' WHERE approval_status IS NULL`);
  } catch (err) {
    console.error('[startup] ensureApprovalColumns error:', err.message);
  }
}

module.exports = ensureApprovalColumns;
