require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'cow_tracking';

const migrate = async () => {
  const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  let conn;

  if (dbUrl) {
    // Managed host (Railway) — the database already exists in the URL
    conn = await mysql.createConnection(dbUrl + (dbUrl.includes('?') ? '&' : '?') + 'multipleStatements=true');
    console.log('Connected to MySQL via connection URL.');
  } else {
    // Local — connect without a DB first so we can create it
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
    });
    console.log('Connected to MySQL server.');
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${DB_NAME}\``);
    console.log(`Database "${DB_NAME}" ready.`);
  }

  // Tables (order matters for foreign keys)
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(30),
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'farmer',
      is_active TINYINT(1) DEFAULT 1,
      reset_token VARCHAR(255),
      reset_token_expiry DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS locations (
      id CHAR(36) PRIMARY KEY,
      province VARCHAR(100) NOT NULL,
      district VARCHAR(100) NOT NULL,
      sector VARCHAR(100),
      cell VARCHAR(100),
      village VARCHAR(100),
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS owners (
      id CHAR(36) PRIMARY KEY,
      national_id VARCHAR(30) NOT NULL UNIQUE,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      email VARCHAR(255),
      location_id CHAR(36),
      user_id CHAR(36),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS cows (
      id CHAR(36) PRIMARY KEY,
      tag_number VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100),
      breed VARCHAR(100),
      gender VARCHAR(10),
      date_of_birth DATE,
      color VARCHAR(50),
      weight_kg DECIMAL(6,2),
      current_owner_id CHAR(36),
      current_location_id CHAR(36),
      mother_id CHAR(36),
      is_alive TINYINT(1) DEFAULT 1,
      status VARCHAR(50) DEFAULT 'active',
      approval_status VARCHAR(20) DEFAULT 'approved',
      submitted_by CHAR(36),
      reviewed_by CHAR(36),
      reviewed_at DATETIME,
      rejection_reason TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (current_owner_id) REFERENCES owners(id) ON DELETE SET NULL,
      FOREIGN KEY (current_location_id) REFERENCES locations(id) ON DELETE SET NULL,
      FOREIGN KEY (mother_id) REFERENCES cows(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS ownership_transfers (
      id CHAR(36) PRIMARY KEY,
      cow_id CHAR(36) NOT NULL,
      from_owner_id CHAR(36),
      to_owner_id CHAR(36) NOT NULL,
      transfer_date DATE NOT NULL,
      sale_price DECIMAL(12,2),
      reason VARCHAR(100) DEFAULT 'sale',
      new_location_id CHAR(36),
      registered_by CHAR(36),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cow_id) REFERENCES cows(id) ON DELETE CASCADE,
      FOREIGN KEY (from_owner_id) REFERENCES owners(id) ON DELETE SET NULL,
      FOREIGN KEY (to_owner_id) REFERENCES owners(id) ON DELETE CASCADE,
      FOREIGN KEY (new_location_id) REFERENCES locations(id) ON DELETE SET NULL,
      FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS vaccinations (
      id CHAR(36) PRIMARY KEY,
      cow_id CHAR(36) NOT NULL,
      vaccine_name VARCHAR(255) NOT NULL,
      vaccine_name_rw VARCHAR(255),
      vaccination_date DATE NOT NULL,
      next_due_date DATE,
      administered_by CHAR(36),
      location_id CHAR(36),
      batch_number VARCHAR(100),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cow_id) REFERENCES cows(id) ON DELETE CASCADE,
      FOREIGN KEY (administered_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS offspring (
      id CHAR(36) PRIMARY KEY,
      mother_id CHAR(36) NOT NULL,
      father_id CHAR(36),
      calf_id CHAR(36),
      birth_date DATE NOT NULL,
      birth_weight_kg DECIMAL(5,2),
      gender VARCHAR(10),
      notes TEXT,
      registered_by CHAR(36),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mother_id) REFERENCES cows(id) ON DELETE CASCADE,
      FOREIGN KEY (father_id) REFERENCES cows(id) ON DELETE SET NULL,
      FOREIGN KEY (calf_id) REFERENCES cows(id) ON DELETE SET NULL,
      FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS slaughter_records (
      id CHAR(36) PRIMARY KEY,
      cow_id CHAR(36) NOT NULL,
      owner_id CHAR(36),
      scheduled_date DATE,
      slaughter_date DATE,
      slaughterhouse_location_id CHAR(36),
      reason VARCHAR(255),
      meat_weight_kg DECIMAL(8,2),
      status VARCHAR(50) DEFAULT 'scheduled',
      registered_by CHAR(36),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cow_id) REFERENCES cows(id) ON DELETE CASCADE,
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE SET NULL,
      FOREIGN KEY (slaughterhouse_location_id) REFERENCES locations(id) ON DELETE SET NULL,
      FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ];

  for (const stmt of statements) {
    await conn.query(stmt);
  }

  console.log('✅ All MySQL tables created successfully.');
  await conn.end();
};

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
