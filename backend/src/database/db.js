/**
 * Database adapter supporting BOTH MySQL and SQLite.
 * Controllers use `?` placeholders and a pg-like { rows } interface,
 * so switching engines requires no controller changes.
 *
 * Set DB_ENGINE=mysql or DB_ENGINE=sqlite in .env
 */
require('dotenv').config();

const ENGINE = (process.env.DB_ENGINE || 'sqlite').toLowerCase();

let pool;

if (ENGINE === 'mysql') {
  // ─────────────────────────────────────────────
  // MySQL / MariaDB
  // ─────────────────────────────────────────────
  const mysql = require('mysql2/promise');

  // Railway/PlanetScale provide a single connection URL. Prefer it if present.
  const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

  const mysqlPool = dbUrl
    ? mysql.createPool(dbUrl)
    : mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cow_tracking',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        multipleStatements: false,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      });

  console.log(`MySQL pool ready → ${dbUrl ? 'via connection URL' : `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`}`);

  // Translate SQLite-flavoured SQL to MySQL
  const toMySQL = (sql) =>
    sql
      .replace(/datetime\('now'\)/gi, 'NOW()')
      .replace(/date\('now',\s*'\+(\d+)\s*days'\)/gi, 'DATE_ADD(CURDATE(), INTERVAL $1 DAY)')
      .replace(/date\('now'\)/gi, 'CURDATE()');

  pool = {
    query: async (sql, params = []) => {
      const [rows] = await mysqlPool.query(toMySQL(sql), params);
      // For SELECT, rows is an array. For INSERT/UPDATE/DELETE it's an OkPacket.
      if (Array.isArray(rows)) {
        return { rows, rowCount: rows.length };
      }
      return { rows: [], rowCount: rows.affectedRows || 0, insertId: rows.insertId };
    },

    connect: async () => {
      const conn = await mysqlPool.getConnection();
      return {
        query: async (sql, params = []) => {
          const trimmed = sql.trim().toUpperCase();
          if (trimmed === 'BEGIN') { await conn.beginTransaction(); return { rows: [] }; }
          if (trimmed === 'COMMIT') { await conn.commit(); return { rows: [] }; }
          if (trimmed === 'ROLLBACK') { await conn.rollback(); return { rows: [] }; }
          const [rows] = await conn.query(toMySQL(sql), params);
          if (Array.isArray(rows)) return { rows, rowCount: rows.length };
          return { rows: [], rowCount: rows.affectedRows || 0, insertId: rows.insertId };
        },
        release: () => conn.release(),
      };
    },

    // Expose raw pool for migrate/seed
    _mysql: mysqlPool,
    _engine: 'mysql',
  };

} else {
  // ─────────────────────────────────────────────
  // SQLite (fallback / offline dev)
  // ─────────────────────────────────────────────
  const Database = require('better-sqlite3');
  const path = require('path');
  const fs = require('fs');

  const dbDir = path.join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  const dbPath = path.join(dbDir, 'cow_tracking.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  console.log(`SQLite ready: ${dbPath}`);

  function splitReturning(sql) {
    const m = sql.match(/^([\s\S]+?)\s+RETURNING\s+([\s\S]+)$/i);
    if (!m) return { sql, returning: null };
    return { sql: m[1].trim(), returning: m[2].trim() };
  }
  function getTable(sql) {
    const m = sql.match(/(?:INSERT\s+(?:OR\s+\w+\s+)?INTO|UPDATE|DELETE\s+FROM)\s+(\w+)/i);
    return m ? m[1] : null;
  }
  function runQuery(sql, params = []) {
    const { sql: cleanSQL, returning } = splitReturning(sql);
    const t = cleanSQL.trim().toUpperCase();
    if (t.startsWith('SELECT') || t.startsWith('WITH') || t.startsWith('PRAGMA')) {
      const rows = db.prepare(cleanSQL).all(...params);
      return { rows, rowCount: rows.length };
    }
    if (t.startsWith('CREATE') || t.startsWith('DROP') || t.startsWith('ALTER')) {
      db.exec(cleanSQL); return { rows: [], rowCount: 0 };
    }
    if (t.startsWith('INSERT') && returning) {
      const info = db.prepare(cleanSQL).run(...params);
      const table = getTable(cleanSQL);
      if (table && info.lastInsertRowid) {
        const row = db.prepare(`SELECT ${returning} FROM ${table} WHERE rowid = ?`).get(info.lastInsertRowid);
        return { rows: row ? [row] : [], rowCount: info.changes };
      }
      return { rows: [], rowCount: info.changes };
    }
    const info = db.prepare(cleanSQL).run(...params);
    return { rows: [], rowCount: info.changes };
  }

  pool = {
    query: (sql, params = []) => {
      try { return Promise.resolve(runQuery(sql, params)); }
      catch (err) { console.error('DB error:', err.message, '\nSQL:', sql); return Promise.reject(err); }
    },
    connect: () => Promise.resolve({
      query: (sql, params = []) => {
        if (/^\s*BEGIN\s*$/i.test(sql)) { try { db.prepare('BEGIN').run(); } catch {} return Promise.resolve({ rows: [] }); }
        if (/^\s*COMMIT\s*$/i.test(sql)) { try { db.prepare('COMMIT').run(); } catch {} return Promise.resolve({ rows: [] }); }
        if (/^\s*ROLLBACK\s*$/i.test(sql)) { try { db.prepare('ROLLBACK').run(); } catch {} return Promise.resolve({ rows: [] }); }
        return pool.query(sql, params);
      },
      release: () => {},
    }),
    db,
    _engine: 'sqlite',
  };
}

module.exports = pool;
