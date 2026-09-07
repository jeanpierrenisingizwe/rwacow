require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

const seed = async () => {
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

  const [existing] = await conn.query('SELECT COUNT(*) AS c FROM users');
  if (existing[0].c > 0) {
    console.log('ℹ️  Database already has users. Skipping seed.');
    console.log('\nTest accounts:');
    console.log('  Admin:  admin@rwacow.rw   / admin123');
    console.log('  Vet:    vet@rwacow.rw     / vet123');
    console.log('  Farmer: farmer@rwacow.rw  / farmer123');
    await conn.end();
    return;
  }

  const uuid = () => crypto.randomUUID();
  const adminId = uuid(), vetId = uuid(), farmerId = uuid();
  const ownerId = uuid(), locId = uuid(), cowId = uuid();

  const [adminHash, vetHash, farmerHash] = await Promise.all([
    bcrypt.hash('admin123', 12),
    bcrypt.hash('vet123', 12),
    bcrypt.hash('farmer123', 12),
  ]);

  await conn.beginTransaction();
  try {
    await conn.query(
      `INSERT INTO users (id, full_name, email, phone, password_hash, role) VALUES
        (?,?,?,?,?,?), (?,?,?,?,?,?), (?,?,?,?,?,?)`,
      [
        adminId, 'System Admin', 'admin@rwacow.rw', '+250780000001', adminHash, 'admin',
        vetId, 'Dr. Jean Mutabazi', 'vet@rwacow.rw', '+250780000002', vetHash, 'vet',
        farmerId, 'Uwimana Marie', 'farmer@rwacow.rw', '+250780000003', farmerHash, 'farmer',
      ]
    );

    await conn.query(
      `INSERT INTO locations (id, province, district, sector, cell, village) VALUES (?,?,?,?,?,?)`,
      [locId, 'Eastern', 'Rwamagana', 'Kigabiro', 'Nyamirama', 'Rugende']
    );

    await conn.query(
      `INSERT INTO owners (id, national_id, full_name, phone, email, location_id, user_id)
       VALUES (?,?,?,?,?,?,?)`,
      [ownerId, '1199380123456789', 'Uwimana Marie', '+250780000003', 'farmer@rwacow.rw', locId, farmerId]
    );

    await conn.query(
      `INSERT INTO cows (id, tag_number, name, breed, gender, date_of_birth, color, weight_kg, current_owner_id, current_location_id)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [cowId, 'RW-2024-001', 'Inyange', 'Ankole', 'female', '2020-03-15', 'Brown', 380.5, ownerId, locId]
    );

    await conn.query(
      `INSERT INTO vaccinations (id, cow_id, vaccine_name, vaccination_date, next_due_date, administered_by)
       VALUES (?,?,?,?,?,?)`,
      [uuid(), cowId, 'FMD Vaccine', '2024-01-10', '2024-07-10', vetId]
    );

    await conn.commit();
    console.log('✅ Seed data inserted into MySQL.');
    console.log('\nTest accounts:');
    console.log('  Admin:  admin@rwacow.rw   / admin123');
    console.log('  Vet:    vet@rwacow.rw     / vet123');
    console.log('  Farmer: farmer@rwacow.rw  / farmer123');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.end();
  }
};

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
