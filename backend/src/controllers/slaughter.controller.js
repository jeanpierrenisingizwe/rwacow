const pool = require('../database/db');
const crypto = require('crypto');

const getSlaughterRecords = async (req, res) => {
  try {
    const { status, district, authorization_status } = req.query;
    // origin_* = where the cow comes from (its current location + owner)
    let query = `
      SELECT s.*, c.tag_number, c.name AS cow_name, c.breed, c.gender, c.color, c.weight_kg,
        o.full_name AS owner_name, o.phone AS owner_phone, o.national_id AS owner_national_id,
        ol.province AS origin_province, ol.district AS origin_district,
        ol.sector AS origin_sector, ol.cell AS origin_cell, ol.village AS origin_village,
        u.full_name AS registered_by_name,
        au.full_name AS authorized_by_name
      FROM slaughter_records s
      JOIN cows c ON s.cow_id = c.id
      LEFT JOIN owners o ON s.owner_id = o.id
      LEFT JOIN locations ol ON c.current_location_id = ol.id
      LEFT JOIN users u ON s.registered_by = u.id
      LEFT JOIN users au ON s.authorized_by = au.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { query += ` AND s.status = ?`; params.push(status); }
    if (authorization_status) { query += ` AND s.authorization_status = ?`; params.push(authorization_status); }
    if (district) { query += ` AND ol.district LIKE ?`; params.push(`%${district}%`); }
    query += ' ORDER BY s.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ records: result.rows, total: result.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch slaughter records' });
  }
};

/* ─────────────────────────────────────────────
   STEP 1 — Slaughterhouse registers a cow for slaughter
   → awaits veterinary authorization
───────────────────────────────────────────── */
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
        (id, cow_id, owner_id, scheduled_date, reason, slaughterhouse_location_id,
         status, authorization_status, registered_by, notes)
       VALUES (?,?,?,?,?,?,'pending_authorization','pending',?,?)`,
      [id, cow_id, cow.current_owner_id, scheduled_date || null, reason || null,
       slaughterhouse_location_id || null, req.user.id, notes || null]
    );
    const result = await client.query('SELECT * FROM slaughter_records WHERE id = ?', [id]);
    await client.query('COMMIT');
    res.status(201).json({
      ...result.rows[0],
      message: 'Cow registered. Awaiting veterinary authorization before slaughter.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to register cow for slaughter' });
  } finally {
    client.release();
  }
};

/* ─────────────────────────────────────────────
   STEP 2 — Vet authorizes (or rejects) the slaughter
───────────────────────────────────────────── */
const authorizeSlaughter = async (req, res) => {
  const { id } = req.params;
  const { decision, notes } = req.body; // decision: 'authorized' | 'rejected'
  if (!['authorized', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: "decision must be 'authorized' or 'rejected'" });
  }
  try {
    const rec = await pool.query('SELECT * FROM slaughter_records WHERE id = ?', [id]);
    if (rec.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    if (rec.rows[0].authorization_status !== 'pending') {
      return res.status(400).json({ error: 'This record has already been reviewed' });
    }

    const newStatus = decision === 'authorized' ? 'authorized' : 'cancelled';
    await pool.query(
      `UPDATE slaughter_records
       SET authorization_status = ?, status = ?, authorized_by = ?,
           authorized_at = datetime('now'), authorization_notes = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [decision, newStatus, req.user.id, notes || null, id]
    );
    res.json({
      message: decision === 'authorized'
        ? 'Slaughter authorized. The slaughterhouse may now proceed.'
        : 'Slaughter request rejected.',
      id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to authorize slaughter' });
  }
};

/* ─────────────────────────────────────────────
   STEP 3 — Slaughterhouse confirms the slaughter
   (only allowed AFTER vet authorization)
───────────────────────────────────────────── */
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
    const rec = record.rows[0];

    // Enforce the workflow: must be vet-authorized first
    if (rec.authorization_status !== 'authorized') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: 'This cow has not been authorized by a veterinarian yet. Slaughter is not allowed.',
      });
    }

    await client.query(
      `UPDATE slaughter_records SET status='completed', slaughter_date=?, meat_weight_kg=?, updated_at=datetime('now')
       WHERE id=?`,
      [slaughter_date || null, meat_weight_kg || null, id]
    );
    await client.query(
      `UPDATE cows SET status='slaughtered', is_alive=0, updated_at=datetime('now') WHERE id=?`,
      [rec.cow_id]
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

// Count of slaughter requests awaiting vet authorization (for the vet's badge)
const getPendingAuthCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS cnt FROM slaughter_records WHERE authorization_status = 'pending'`
    );
    const row = result.rows[0];
    const count = parseInt(String(row.cnt ?? row.count ?? 0), 10) || 0;
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch count' });
  }
};

module.exports = {
  getSlaughterRecords, scheduleSlaughter, authorizeSlaughter,
  confirmSlaughter, getPendingAuthCount,
};
