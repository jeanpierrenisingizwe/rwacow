const pool = require('../database/db');

const crypto = require('crypto');

const getSlaughterRecords = async (req, res) => {
  try {
    const { status, district } = req.query;
    let query = `
      SELECT s.*, c.tag_number, c.name AS cow_name, c.breed,
        o.full_name AS owner_name, o.phone AS owner_phone,
        l.district, l.sector,
        u.full_name AS registered_by_name
      FROM slaughter_records s
      JOIN cows c ON s.cow_id = c.id
      LEFT JOIN owners o ON s.owner_id = o.id
      LEFT JOIN locations l ON s.slaughterhouse_location_id = l.id
      LEFT JOIN users u ON s.registered_by = u.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { query += ` AND s.status = ?`; params.push(status); }
    if (district) { query += ` AND l.district LIKE ?`; params.push(`%${district}%`); }
    query += ' ORDER BY s.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ records: result.rows, total: result.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch slaughter records' });
  }
};

const scheduleSlaughter = async (req, res) => {
  const { cow_id, scheduled_date, reason, slaughterhouse_location_id, notes } = req.body;
  if (!cow_id) return res.status(400).json({ error: 'Cow is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cowResult = await client.query('SELECT * FROM cows WHERE id = ?', [cow_id]);
    if (cowResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cow not found' });
    }
    const cow = cowResult.rows[0];
    const id = crypto.randomUUID();
    await client.query(
      `INSERT INTO slaughter_records
        (id, cow_id, owner_id, scheduled_date, reason, slaughterhouse_location_id, status, registered_by, notes)
       VALUES (?,?,?,?,?,?,'scheduled',?,?)`,
      [id, cow_id, cow.current_owner_id, scheduled_date || null, reason || null,
       slaughterhouse_location_id || null, req.user.id, notes || null]
    );
    const result = await client.query('SELECT * FROM slaughter_records WHERE id = ?', [id]);
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to schedule slaughter' });
  } finally {
    client.release();
  }
};

const confirmSlaughter = async (req, res) => {
  const { id } = req.params;
  const { slaughter_date, meat_weight_kg } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const record = await client.query('SELECT * FROM slaughter_records WHERE id = ?', [id]);
    if (record.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Record not found' });
    }
    await client.query(
      `UPDATE slaughter_records SET status='completed', slaughter_date=?, meat_weight_kg=?, updated_at=datetime('now')
       WHERE id=?`,
      [slaughter_date || null, meat_weight_kg || null, id]
    );
    await client.query(
      `UPDATE cows SET status='slaughtered', is_alive=0, updated_at=datetime('now') WHERE id=?`,
      [record.rows[0].cow_id]
    );
    const updated = await client.query('SELECT * FROM slaughter_records WHERE id = ?', [id]);
    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to confirm slaughter' });
  } finally {
    client.release();
  }
};

module.exports = { getSlaughterRecords, scheduleSlaughter, confirmSlaughter };
