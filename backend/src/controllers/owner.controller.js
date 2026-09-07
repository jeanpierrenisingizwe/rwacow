const pool = require('../database/db');
const crypto = require('crypto');

const getAllOwners = async (req, res) => {
  try {
    const { search, district } = req.query;
    let query = `
      SELECT o.id, o.national_id, o.full_name, o.phone, o.email, o.location_id, o.user_id,
        o.created_at, o.updated_at,
        l.province, l.district, l.sector, l.cell, l.village,
        (SELECT COUNT(*) FROM cows c WHERE c.current_owner_id = o.id AND c.status = 'active') AS cow_count
      FROM owners o
      LEFT JOIN locations l ON o.location_id = l.id
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      query += ` AND (o.full_name LIKE ? OR o.national_id LIKE ? OR o.phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (district) { query += ` AND l.district LIKE ?`; params.push(`%${district}%`); }
    query += ' ORDER BY o.full_name';
    const result = await pool.query(query, params);
    res.json({ owners: result.rows, total: result.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch owners' });
  }
};

const getOwnerById = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerResult = await pool.query(`
      SELECT o.*, l.province, l.district, l.sector, l.cell, l.village, l.latitude, l.longitude
      FROM owners o LEFT JOIN locations l ON o.location_id = l.id
      WHERE o.id = ?
    `, [id]);
    if (ownerResult.rows.length === 0) return res.status(404).json({ error: 'Owner not found' });

    const cows = await pool.query(`
      SELECT c.id, c.tag_number, c.name, c.breed, c.gender, c.status,
        l.district, l.sector
      FROM cows c LEFT JOIN locations l ON c.current_location_id = l.id
      WHERE c.current_owner_id = ?
      ORDER BY c.created_at DESC
    `, [id]);

    res.json({ ...ownerResult.rows[0], cows: cows.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch owner' });
  }
};

const createOwner = async (req, res) => {
  const { national_id, full_name, phone, email, location, user_id } = req.body;
  if (!national_id || !full_name || !phone) {
    return res.status(400).json({ error: 'National ID, full name and phone are required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let location_id = null;
    if (location && location.district) {
      location_id = crypto.randomUUID();
      await client.query(
        `INSERT INTO locations (id, province, district, sector, cell, village, latitude, longitude)
         VALUES (?,?,?,?,?,?,?,?)`,
        [location_id, location.province, location.district, location.sector,
         location.cell, location.village, location.latitude || null, location.longitude || null]
      );
    }
    const id = crypto.randomUUID();
    await client.query(
      `INSERT INTO owners (id, national_id, full_name, phone, email, location_id, user_id)
       VALUES (?,?,?,?,?,?,?)`,
      [id, national_id, full_name, phone, email || null, location_id, user_id || null]
    );
    const result = await client.query('SELECT * FROM owners WHERE id = ?', [id]);
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY' ||
        (err.message && (err.message.includes('UNIQUE') || err.message.includes('Duplicate')))) {
      return res.status(409).json({ error: 'National ID already registered' });
    }
    res.status(500).json({ error: 'Failed to create owner' });
  } finally {
    client.release();
  }
};

const updateOwner = async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, email } = req.body;
  try {
    await pool.query(
      `UPDATE owners SET full_name=?, phone=?, email=?, updated_at=datetime('now') WHERE id=?`,
      [full_name, phone, email || null, id]
    );
    const result = await pool.query('SELECT * FROM owners WHERE id = ?', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Owner not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update owner' });
  }
};

module.exports = { getAllOwners, getOwnerById, createOwner, updateOwner };
