require('dotenv').config();
const mysql = require('mysql2/promise');

/**
 * Adds the cow approval-workflow columns to an existing database.
 * Safe to run multiple times (checks if columns exist first).
 */
const run = async () => {
  const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  const conn = dbUrl
    ? await mysql.createConnection(dbUrl)
    : await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cow_tracking',
      });

  const columns = [
    ['approval_status', "VARCHAR(20) DEFAULT 'approved'"],
    ['submitted_by', 'CHAR(36)'],
    ['reviewed_by', 'CHAR(36)'],
    ['reviewed_at', 'DATETIME'],
    ['rejection_reason', 'TEXT'],
  ];

  for (const [name, type] of columns) {
    // Check if column already exists
    const [rows] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cows' AND COLUMN_NAME = ?`,
      [name]
    );
    if (rows.length === 0) {
      await conn.query(`ALTER TABLE cows ADD COLUMN ${name} ${type}`);
      console.log(`✅ Added column: ${name}`);
    } else {
      console.log(`ℹ️  Column already exists: ${name}`);
    }
  }

  // Existing cows should be treated as approved
  await conn.query(`UPDATE cows SET approval_status = 'approved' WHERE approval_status IS NULL`);

  console.log('\n✅ Approval workflow columns ready.');
  await conn.end();
};

run().catch(err => {
  console.error('❌ Failed:', err.code || '', err.message || err);
  if (err.code === 'ECONNREFUSED') {
    console.error('   → MySQL is not running. Start it in XAMPP, or run this against Railway.');
  }
  process.exit(1);
});
