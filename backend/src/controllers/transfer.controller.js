const pool = require('../database/db');

const getTransfers = async (req, res) => {
  try {
    const { cow_id } = req.query;
    let query = `
      SELECT t.*,
        c.tag_number, c.name AS cow_name,
        fo.full_name AS from_owner_name, fo.national_id AS from_owner_nid,
        to_o.full_name AS to_owner_name, to_o.national_id AS to_owner_nid,
        l.district, l.sector, l.village,
        u.full_name AS registered_by_name
      FROM ownership_transfers t
      JOIN cows c ON t.cow_id = c.id
      LEFT JOIN owners fo ON t.from_owner_id = fo.id
      LEFT JOIN owners to_o ON t.to_owner_id = to_o.id
      LEFT JOIN locations l ON t.new_location_id = l.id
      LEFT JOIN users u ON t.registered_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Farmers only see transfers where they were the seller or the buyer
    if (req.user.role === 'farmer') {
      query += ` AND (t.from_owner_id IN (SELECT id FROM owners WHERE user_id = ?)
                   OR t.to_owner_id IN (SELECT id FROM owners WHERE user_id = ?))`;
      params.push(req.user.id, req.user.id);
    }

    if (cow_id) { query += ` AND t.cow_id = ?`; params.push(cow_id); }
    query += ' ORDER BY t.transfer_date DESC';
    const result = await pool.query(query, params);
    res.json({ transfers: result.rows, total: result.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
};

const transferOwnership = async (req, res) => {
  const { cow_id, to_owner_id, sale_price, reason, new_location, transfer_date, notes } = req.body;
  const crypto = require('crypto');

  if (!cow_id || !to_owner_id) {
    return res.status(400).json({ error: 'Cow and new owner are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cowResult = await client.query('SELECT * FROM cows WHERE id = ?', [cow_id]);
    if (cowResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cow not found' });
    }
    const cow = cowResult.rows[0];

    // Farmers may only transfer cows they currently own
    if (req.user.role === 'farmer') {
      const own = await client.query(
        'SELECT id FROM owners WHERE id = ? AND user_id = ?',
        [cow.current_owner_id, req.user.id]
      );
      if (own.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'You can only transfer cows that belong to you' });
      }
    }

    // ── Resolve the cow's new location ────────────────
    // Priority:
    //   1. A new location explicitly entered in the transfer form
    //   2. The new owner's own registered location (if they're already in the system)
    //   3. Fall back to the cow's current location
    let new_location_id = cow.current_location_id;

    if (new_location && new_location.district) {
      // (1) A location was typed in — create and use it
      const locId = crypto.randomUUID();
      await client.query(
        `INSERT INTO locations (id, province, district, sector, cell, village, latitude, longitude)
         VALUES (?,?,?,?,?,?,?,?)`,
        [locId, new_location.province, new_location.district, new_location.sector,
         new_location.cell, new_location.village,
         new_location.latitude || null, new_location.longitude || null]
      );
      new_location_id = locId;
    } else {
      // (2) No location entered — inherit the new owner's registered location
      const ownerRow = await client.query(
        'SELECT location_id FROM owners WHERE id = ?', [to_owner_id]
      );
      if (ownerRow.rows.length > 0 && ownerRow.rows[0].location_id) {
        new_location_id = ownerRow.rows[0].location_id;
      }
      // (3) else: keep cow.current_location_id (already the default)
    }

    // Record the transfer
    const transferId = crypto.randomUUID();
    await client.query(
      `INSERT INTO ownership_transfers
        (id, cow_id, from_owner_id, to_owner_id, transfer_date, sale_price, reason, new_location_id, registered_by, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [transferId, cow_id, cow.current_owner_id, to_owner_id,
       transfer_date || new Date().toISOString().split('T')[0],
       sale_price || null, reason || 'sale', new_location_id, req.user.id, notes || null]
    );

    // Update the cow's current owner and location
    await client.query(
      `UPDATE cows SET current_owner_id=?, current_location_id=?, status='active', updated_at=datetime('now') WHERE id=?`,
      [to_owner_id, new_location_id, cow_id]
    );

    const transferRes = await client.query('SELECT * FROM ownership_transfers WHERE id = ?', [transferId]);
    await client.query('COMMIT');
    res.status(201).json(transferRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to transfer ownership' });
  } finally {
    client.release();
  }
};

module.exports = { getTransfers, transferOwnership };
