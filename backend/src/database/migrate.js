require('dotenv').config();
const { db } = require('./db');

const migrate = () => {
  console.log('Running migrations...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-'||substr('89ab',abs(random())%4+1,1)||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))),
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'farmer',
      is_active INTEGER DEFAULT 1,
      reset_token TEXT,
      reset_token_expiry TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-'||substr('89ab',abs(random())%4+1,1)||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))),
      province TEXT NOT NULL,
      district TEXT NOT NULL,
      sector TEXT,
      cell TEXT,
      village TEXT,
      latitude REAL,
      longitude REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS owners (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-'||substr('89ab',abs(random())%4+1,1)||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))),
      national_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      location_id TEXT REFERENCES locations(id),
      user_id TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cows (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-'||substr('89ab',abs(random())%4+1,1)||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))),
      tag_number TEXT UNIQUE NOT NULL,
      name TEXT,
      breed TEXT,
      gender TEXT,
      date_of_birth TEXT,
      color TEXT,
      weight_kg REAL,
      current_owner_id TEXT REFERENCES owners(id),
      current_location_id TEXT REFERENCES locations(id),
      mother_id TEXT REFERENCES cows(id),
      is_alive INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ownership_transfers (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-'||substr('89ab',abs(random())%4+1,1)||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))),
      cow_id TEXT NOT NULL REFERENCES cows(id),
      from_owner_id TEXT REFERENCES owners(id),
      to_owner_id TEXT NOT NULL REFERENCES owners(id),
      transfer_date TEXT NOT NULL DEFAULT (date('now')),
      sale_price REAL,
      reason TEXT DEFAULT 'sale',
      new_location_id TEXT REFERENCES locations(id),
      registered_by TEXT REFERENCES users(id),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vaccinations (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-'||substr('89ab',abs(random())%4+1,1)||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))),
      cow_id TEXT NOT NULL REFERENCES cows(id),
      vaccine_name TEXT NOT NULL,
      vaccine_name_rw TEXT,
      vaccination_date TEXT NOT NULL,
      next_due_date TEXT,
      administered_by TEXT REFERENCES users(id),
      location_id TEXT REFERENCES locations(id),
      batch_number TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS offspring (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-'||substr('89ab',abs(random())%4+1,1)||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))),
      mother_id TEXT NOT NULL REFERENCES cows(id),
      father_id TEXT REFERENCES cows(id),
      calf_id TEXT REFERENCES cows(id),
      birth_date TEXT NOT NULL,
      birth_weight_kg REAL,
      gender TEXT,
      notes TEXT,
      registered_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS slaughter_records (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-'||substr('89ab',abs(random())%4+1,1)||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))),
      cow_id TEXT NOT NULL REFERENCES cows(id),
      owner_id TEXT REFERENCES owners(id),
      scheduled_date TEXT,
      slaughter_date TEXT,
      slaughterhouse_location_id TEXT REFERENCES locations(id),
      reason TEXT,
      meat_weight_kg REAL,
      status TEXT DEFAULT 'scheduled',
      registered_by TEXT REFERENCES users(id),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Migrations complete');
};

migrate();
