require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('./db');

// Run migrations first
require('./migrate');

const seed = async () => {
  console.log('Seeding data...');

  const makeUUID = () => {
    const { randomUUID } = require('crypto');
    return randomUUID();
  };

  // Check if already seeded
  const existing = db.prepare("SELECT COUNT(*) as c FROM users").get();
  if (existing.c > 0) {
    console.log('ℹ️  Database already has data. Skipping seed.');
    console.log('\nTest accounts:');
    console.log('  Admin:  admin@rwacow.rw   / admin123');
    console.log('  Vet:    vet@rwacow.rw     / vet123');
    console.log('  Farmer: farmer@rwacow.rw  / farmer123');
    return;
  }

  const adminId    = makeUUID();
  const vetId      = makeUUID();
  const farmerId   = makeUUID();
  const ownerId    = makeUUID();
  const locationId = makeUUID();
  const cowId      = makeUUID();

  const adminHash  = await bcrypt.hash('admin123', 12);
  const vetHash    = await bcrypt.hash('vet123', 12);
  const farmerHash = await bcrypt.hash('farmer123', 12);

  const insertAll = db.transaction(() => {
    // Users
    db.prepare(`INSERT INTO users (id, full_name, email, phone, password_hash, role) VALUES (?,?,?,?,?,?)`)
      .run(adminId, 'System Admin', 'admin@rwacow.rw', '+250780000001', adminHash, 'admin');
    db.prepare(`INSERT INTO users (id, full_name, email, phone, password_hash, role) VALUES (?,?,?,?,?,?)`)
      .run(vetId, 'Dr. Jean Mutabazi', 'vet@rwacow.rw', '+250780000002', vetHash, 'vet');
    db.prepare(`INSERT INTO users (id, full_name, email, phone, password_hash, role) VALUES (?,?,?,?,?,?)`)
      .run(farmerId, 'Uwimana Marie', 'farmer@rwacow.rw', '+250780000003', farmerHash, 'farmer');

    // Location
    db.prepare(`INSERT INTO locations (id, province, district, sector, cell, village) VALUES (?,?,?,?,?,?)`)
      .run(locationId, 'Eastern', 'Rwamagana', 'Kigabiro', 'Nyamirama', 'Rugende');

    // Owner
    db.prepare(`INSERT INTO owners (id, national_id, full_name, phone, email, location_id, user_id) VALUES (?,?,?,?,?,?,?)`)
      .run(ownerId, '1199380123456789', 'Uwimana Marie', '+250780000003', 'farmer@rwacow.rw', locationId, farmerId);

    // Cow
    db.prepare(`INSERT INTO cows (id, tag_number, name, breed, gender, date_of_birth, color, weight_kg, current_owner_id, current_location_id)
                VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(cowId, 'RW-2024-001', 'Inyange', 'Ankole', 'female', '2020-03-15', 'Brown', 380.5, ownerId, locationId);

    // Sample vaccination
    db.prepare(`INSERT INTO vaccinations (id, cow_id, vaccine_name, vaccination_date, next_due_date, administered_by)
                VALUES (?,?,?,?,?,?)`)
      .run(makeUUID(), cowId, 'FMD Vaccine', '2024-01-10', '2024-07-10', vetId);
  });

  insertAll();

  console.log('✅ Seed data inserted');
  console.log('\nTest accounts:');
  console.log('  Admin:  admin@rwacow.rw   / admin123');
  console.log('  Vet:    vet@rwacow.rw     / vet123');
  console.log('  Farmer: farmer@rwacow.rw  / farmer123');
};

seed().catch(console.error);
