// ─────────────────────────────────────────────
// Demo data — realistic Rwanda cattle records
// ─────────────────────────────────────────────

export const DEMO_USER = {
  id: 'demo-admin-001',
  full_name: 'Demo Admin',
  email: 'admin@rwacow.rw',
  role: 'admin',
};

export const DEMO_OWNERS = [
  { id: 'own-001', national_id: '1199380123456789', full_name: 'Uwimana Marie',    phone: '+250780111001', email: 'marie@example.com',   province: 'Eastern',  district: 'Rwamagana', sector: 'Kigabiro',  cell: 'Nyamirama', village: 'Rugende',   cow_count: 3 },
  { id: 'own-002', national_id: '1198560234567890', full_name: 'Habimana Jean',    phone: '+250780111002', email: 'jean@example.com',    province: 'Northern', district: 'Musanze',   sector: 'Muhoza',    cell: 'Cyabararika', village: 'Gitwa',   cow_count: 2 },
  { id: 'own-003', national_id: '1200140345678901', full_name: 'Mukamana Alice',   phone: '+250780111003', email: 'alice@example.com',   province: 'Southern', district: 'Huye',      sector: 'Ngoma',     cell: 'Butare',    village: 'Kabutare', cow_count: 4 },
  { id: 'own-004', national_id: '1197920456789012', full_name: 'Nshimiyimana Paul',phone: '+250780111004', email: 'paul@example.com',   province: 'Western',  district: 'Karongi',   sector: 'Bwishyura', cell: 'Kirambo',   village: 'Gacura',   cow_count: 1 },
  { id: 'own-005', national_id: '1201260567890123', full_name: 'Ingabire Grace',   phone: '+250780111005', email: 'grace@example.com',  province: 'Kigali',   district: 'Gasabo',    sector: 'Remera',    cell: 'Nyabisindu', village: 'Kagugu',  cow_count: 2 },
];

export const DEMO_COWS = [
  { id: 'cow-001', tag_number: 'RW-2024-001', name: 'Inyange',   breed: 'Ankole',   gender: 'female', date_of_birth: '2020-03-15', color: 'Brown',       weight_kg: 380, status: 'active',     current_owner_id: 'own-001', owner_name: 'Uwimana Marie',     owner_phone: '+250780111001', owner_national_id: '1199380123456789', province: 'Eastern',  district: 'Rwamagana', sector: 'Kigabiro',  cell: 'Nyamirama', village: 'Rugende',  latitude: -1.9441, longitude: 30.4378 },
  { id: 'cow-002', tag_number: 'RW-2024-002', name: 'Inzovu',    breed: 'Friesian', gender: 'female', date_of_birth: '2019-07-20', color: 'Black/White', weight_kg: 450, status: 'active',     current_owner_id: 'own-001', owner_name: 'Uwimana Marie',     owner_phone: '+250780111001', owner_national_id: '1199380123456789', province: 'Eastern',  district: 'Rwamagana', sector: 'Kigabiro',  cell: 'Nyamirama', village: 'Rugende',  latitude: -1.9441, longitude: 30.4378 },
  { id: 'cow-003', tag_number: 'RW-2024-003', name: 'Shyaka',    breed: 'Ankole',   gender: 'male',   date_of_birth: '2021-01-10', color: 'Red',         weight_kg: 410, status: 'active',     current_owner_id: 'own-002', owner_name: 'Habimana Jean',     owner_phone: '+250780111002', owner_national_id: '1198560234567890', province: 'Northern', district: 'Musanze',   sector: 'Muhoza',    cell: 'Cyabararika', village: 'Gitwa',   latitude: -1.4994, longitude: 29.6340 },
  { id: 'cow-004', tag_number: 'RW-2024-004', name: 'Umutoni',   breed: 'Sahiwal',  gender: 'female', date_of_birth: '2018-11-05', color: 'Reddish',     weight_kg: 320, status: 'sold',       current_owner_id: 'own-003', owner_name: 'Mukamana Alice',    owner_phone: '+250780111003', owner_national_id: '1200140345678901', province: 'Southern', district: 'Huye',      sector: 'Ngoma',     cell: 'Butare',    village: 'Kabutare', latitude: -2.5967, longitude: 29.7397 },
  { id: 'cow-005', tag_number: 'RW-2024-005', name: 'Imana',     breed: 'Jersey',   gender: 'female', date_of_birth: '2022-06-18', color: 'Tan',         weight_kg: 280, status: 'active',     current_owner_id: 'own-003', owner_name: 'Mukamana Alice',    owner_phone: '+250780111003', owner_national_id: '1200140345678901', province: 'Southern', district: 'Huye',      sector: 'Ngoma',     cell: 'Butare',    village: 'Kabutare', latitude: -2.5967, longitude: 29.7397 },
  { id: 'cow-006', tag_number: 'RW-2024-006', name: 'Gahire',    breed: 'Ankole',   gender: 'male',   date_of_birth: '2020-09-30', color: 'Brown',       weight_kg: 470, status: 'slaughtered',current_owner_id: 'own-004', owner_name: 'Nshimiyimana Paul', owner_phone: '+250780111004', owner_national_id: '1197920456789012', province: 'Western',  district: 'Karongi',   sector: 'Bwishyura', cell: 'Kirambo',   village: 'Gacura',   latitude: -2.0098, longitude: 29.3801 },
  { id: 'cow-007', tag_number: 'RW-2024-007', name: 'Umulisa',   breed: 'Friesian', gender: 'female', date_of_birth: '2021-04-22', color: 'Black/White', weight_kg: 390, status: 'active',     current_owner_id: 'own-005', owner_name: 'Ingabire Grace',    owner_phone: '+250780111005', owner_national_id: '1201260567890123', province: 'Kigali',   district: 'Gasabo',    sector: 'Remera',    cell: 'Nyabisindu', village: 'Kagugu',   latitude: -1.9441, longitude: 30.0619 },
  { id: 'cow-008', tag_number: 'RW-2024-008', name: 'Inkingi',   breed: 'Sahiwal',  gender: 'female', date_of_birth: '2019-12-01', color: 'White',       weight_kg: 340, status: 'active',     current_owner_id: 'own-005', owner_name: 'Ingabire Grace',    owner_phone: '+250780111005', owner_national_id: '1201260567890123', province: 'Kigali',   district: 'Gasabo',    sector: 'Remera',    cell: 'Nyabisindu', village: 'Kagugu',   latitude: -1.9441, longitude: 30.0619 },
];

export const DEMO_VACCINATIONS = [
  { id: 'vac-001', cow_id: 'cow-001', tag_number: 'RW-2024-001', cow_name: 'Inyange',  vaccine_name: 'FMD Vaccine',        vaccination_date: '2024-01-10', next_due_date: '2024-07-10', vet_name: 'Dr. Jean Mutabazi', owner_name: 'Uwimana Marie' },
  { id: 'vac-002', cow_id: 'cow-001', tag_number: 'RW-2024-001', cow_name: 'Inyange',  vaccine_name: 'Brucellosis Vaccine', vaccination_date: '2024-03-05', next_due_date: '2025-03-05', vet_name: 'Dr. Jean Mutabazi', owner_name: 'Uwimana Marie' },
  { id: 'vac-003', cow_id: 'cow-002', tag_number: 'RW-2024-002', cow_name: 'Inzovu',   vaccine_name: 'Lumpy Skin Disease',  vaccination_date: '2024-02-14', next_due_date: '2024-08-14', vet_name: 'Dr. Jean Mutabazi', owner_name: 'Uwimana Marie' },
  { id: 'vac-004', cow_id: 'cow-003', tag_number: 'RW-2024-003', cow_name: 'Shyaka',   vaccine_name: 'FMD Vaccine',        vaccination_date: '2024-01-20', next_due_date: '2026-09-15', vet_name: 'Dr. Amina Uwera',   owner_name: 'Habimana Jean' },
  { id: 'vac-005', cow_id: 'cow-007', tag_number: 'RW-2024-007', cow_name: 'Umulisa',  vaccine_name: 'Anthrax Vaccine',    vaccination_date: '2024-04-01', next_due_date: '2026-09-20', vet_name: 'Dr. Jean Mutabazi', owner_name: 'Ingabire Grace' },
];

export const DEMO_OFFSPRING = [
  { id: 'off-001', mother_id: 'cow-001', mother_tag: 'RW-2024-001', mother_name: 'Inyange', calf_id: 'cow-007', calf_tag: 'RW-2024-007', calf_name: 'Umulisa', calf_gender: 'female', birth_date: '2021-04-22', birth_weight_kg: 28.5 },
  { id: 'off-002', mother_id: 'cow-002', mother_tag: 'RW-2024-002', mother_name: 'Inzovu',  calf_id: 'cow-008', calf_tag: 'RW-2024-008', calf_name: 'Inkingi', calf_gender: 'female', birth_date: '2019-12-01', birth_weight_kg: 32.0 },
];

export const DEMO_SLAUGHTER = [
  { id: 'sla-001', cow_id: 'cow-006', tag_number: 'RW-2024-006', cow_name: 'Gahire', breed: 'Ankole', owner_name: 'Nshimiyimana Paul', owner_phone: '+250780111004', scheduled_date: '2024-05-10', slaughter_date: '2024-05-10', meat_weight_kg: 210, status: 'completed', district: 'Karongi', sector: 'Bwishyura', reason: 'Commercial sale', registered_by_name: 'Demo Admin' },
  { id: 'sla-002', cow_id: 'cow-004', tag_number: 'RW-2024-004', cow_name: 'Umutoni', breed: 'Sahiwal', owner_name: 'Mukamana Alice', owner_phone: '+250780111003', scheduled_date: '2026-09-15', slaughter_date: null, meat_weight_kg: null, status: 'scheduled', district: 'Huye', sector: 'Ngoma', reason: 'Age', registered_by_name: 'Demo Admin' },
];

export const DEMO_TRANSFERS = [
  { id: 'tr-001', cow_id: 'cow-004', tag_number: 'RW-2024-004', cow_name: 'Umutoni', from_owner_name: 'Habimana Jean', from_owner_nid: '1198560234567890', to_owner_name: 'Mukamana Alice', to_owner_nid: '1200140345678901', transfer_date: '2024-02-20', sale_price: 350000, district: 'Huye', sector: 'Ngoma', registered_by_name: 'Demo Admin' },
];

export const DEMO_STATS = {
  total_active: 6,
  total_vaccinated: 5,
  total_slaughtered: 1,
  total_sold: 1,
  by_district: [
    { district: 'Rwamagana', count: 2 },
    { district: 'Huye',      count: 2 },
    { district: 'Gasabo',    count: 2 },
    { district: 'Musanze',   count: 1 },
    { district: 'Karongi',   count: 1 },
  ],
};

// Full cow detail (with nested records)
export const demoCowDetail = (id: string) => {
  const cow = DEMO_COWS.find(c => c.id === id);
  if (!cow) return null;
  return {
    ...cow,
    notes: 'Healthy. Regular vaccinations up to date.',
    vaccinations: DEMO_VACCINATIONS.filter(v => v.cow_id === id),
    offspring: DEMO_OFFSPRING.filter(o => o.mother_id === id),
    transfers: DEMO_TRANSFERS.filter(t => t.cow_id === id),
    slaughter_record: DEMO_SLAUGHTER.find(s => s.cow_id === id) || null,
  };
};
