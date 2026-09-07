const pool = require('../database/db');

const getOffspring = async (req, res) => {
  try {
    const { mother_id } = req.query;
    let query = `
      SELECT o.*, 
        m.tag_number AS mother_tag, m.name AS mother_name,
        c.tag_number AS calf_tag, c.name AS calf_name, c.gender AS calf_gender,
        c.status AS calf_status,
        u.full_name AS registered_by_name
      FROM offspring o
      JOIN cows m ON o.mother_id = m.id
      LEFT JOIN cows c ON o.calf_id = c.id
      LEFT JOIN users u ON o.registered_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Farmers only see offspring where the mother cow belongs to them
    if (req.user.role === 'farmer') {
      query += ` AND m.current_owner_id IN (SELECT id FROM owners WHERE user_id = ?)`;
      params.push(req.user.id);
    }

    if (mother_id) { query += ` AND o.mother_id = ?`; params.push(mother_id); }
    query += ' ORDER BY o.birth_date DESC';
    const result = await pool.query(query, params);
    res.json({ offspring: result.rows, total: result.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch offspring records' });
  }
};

const registerOffspring = async (req, res) => {
  const {
    mother_id, father_id, birth_date, birth_weight_kg, gender,
    calf_tag_number, calf_name, calf_breed, owner_id, location_id, notes
  } = req.body;
  const crypto = require('crypto');

  if (!mother_id || !calf_tag_number || !birth_date) {
    return res.status(400).json({ error: 'Mother, calf tag number and birth date are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Look up the mother cow
    const motherRes = await client.query('SELECT current_owner_id, current_location_id FROM cows WHERE id = ?', [mother_id]);
    if (motherRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Mother cow not found' });
    }
    const mother = motherRes.rows[0];

    // Farmers may only register offspring for a mother cow they own
    if (req.user.role === 'farmer') {
      const own = await client.query(
        'SELECT id FROM owners WHERE id = ? AND user_id = ?',
        [mother.current_owner_id, req.user.id]
      );
      if (own.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'You can only register offspring for your own cows' });
      }
    }

    // The calf inherits the mother's owner and location unless explicitly provided.
    const calfOwnerId = owner_id || mother.current_owner_id;
    const calfLocationId = location_id || mother.current_location_id;

    // Register the calf as a new cow
    const calfId = crypto.randomUUID();
    await client.query(
      `INSERT INTO cows (id, tag_number, name, breed, gender, date_of_birth, weight_kg,
        current_owner_id, current_location_id, mother_id, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [calfId, calf_tag_number, calf_name || null, calf_breed || null, gender || null,
       birth_date, birth_weight_kg || null, calfOwnerId, calfLocationId, mother_id, notes || null]
    );
    const calfRes = await client.query('SELECT * FROM cows WHERE id = ?', [calfId]);
    const calf = calfRes.rows[0];

    // Record the offspring relationship
    const offId = crypto.randomUUID();
    await client.query(
      `INSERT INTO offspring (id, mother_id, father_id, calf_id, birth_date, birth_weight_kg, gender, notes, registered_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [offId, mother_id, father_id || null, calfId, birth_date, birth_weight_kg || null, gender || null, notes || null, req.user.id]
    );
    const offRes = await client.query('SELECT * FROM offspring WHERE id = ?', [offId]);

    await client.query('COMMIT');
    res.status(201).json({ offspring: offRes.rows[0], calf });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Calf tag number already exists' });
    }
    res.status(500).json({ error: 'Failed to register offspring' });
  } finally {
    client.release();
  }
};

module.exports = { getOffspring, registerOffspring };
