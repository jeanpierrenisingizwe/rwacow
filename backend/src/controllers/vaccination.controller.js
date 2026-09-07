const pool = require('../database/db');

const getVaccinations = async (req, res) => {
  try {
    const { cow_id, upcoming } = req.query;
    let query = `
      SELECT v.*, c.tag_number, c.name AS cow_name,
        u.full_name AS vet_name,
        o.full_name AS owner_name
      FROM vaccinations v
      JOIN cows c ON v.cow_id = c.id
      LEFT JOIN users u ON v.administered_by = u.id
      LEFT JOIN owners o ON c.current_owner_id = o.id
      WHERE 1=1
    `;
    const params = [];

    // Farmers only see vaccinations for their own cows
    if (req.user.role === 'farmer') {
      query += ` AND c.current_owner_id IN (SELECT id FROM owners WHERE user_id = ?)`;
      params.push(req.user.id);
    }

    if (cow_id) { query += ` AND v.cow_id = ?`; params.push(cow_id); }
    if (upcoming === 'true') {
      query += ` AND v.next_due_date IS NOT NULL
                 AND v.next_due_date <= date('now', '+30 days')
                 AND v.next_due_date >= date('now')`;
    }
    query += ' ORDER BY v.vaccination_date DESC';
    const result = await pool.query(query, params);
    res.json({ vaccinations: result.rows, total: result.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vaccinations' });
  }
};

const addVaccination = async (req, res) => {
  const {
    cow_id, vaccine_name, vaccine_name_rw, vaccination_date,
    next_due_date, batch_number, location_id, notes
  } = req.body;
  const crypto = require('crypto');
  if (!cow_id || !vaccine_name || !vaccination_date) {
    return res.status(400).json({ error: 'Cow, vaccine name and date are required' });
  }
  try {
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO vaccinations
        (id, cow_id, vaccine_name, vaccine_name_rw, vaccination_date, next_due_date,
         administered_by, batch_number, location_id, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, cow_id, vaccine_name, vaccine_name_rw || null, vaccination_date, next_due_date || null,
       req.user.id, batch_number || null, location_id || null, notes || null]
    );
    const result = await pool.query('SELECT * FROM vaccinations WHERE id = ?', [id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add vaccination' });
  }
};

const deleteVaccination = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM vaccinations WHERE id = ?', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Vaccination record not found' });
    res.json({ message: 'Vaccination record deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vaccination' });
  }
};

module.exports = { getVaccinations, addVaccination, deleteVaccination };
