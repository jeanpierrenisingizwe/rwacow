const pool = require('../database/db');
const { getPermissions } = require('../middleware/auth.middleware');

const getAllCows = async (req, res) => {
  try {
    const { status, owner_id, district, search } = req.query;
    const perms = getPermissions(req.user.role);

    let query = `
      SELECT c.id, c.tag_number, c.name, c.breed, c.gender, c.date_of_birth,
        c.color, c.weight_kg, c.status, c.notes, c.created_at,
        o.full_name AS owner_name, o.phone AS owner_phone,
        l.province, l.district, l.sector, l.cell, l.village, l.latitude, l.longitude
    `;
    // Financial / PII fields only for admin, government
    if (perms.canReadFinancial) {
      query += `, o.national_id AS owner_national_id`;
    }
    query += ` FROM cows c
      LEFT JOIN owners o ON c.current_owner_id = o.id
      LEFT JOIN locations l ON c.current_location_id = l.id
      WHERE 1=1`;

    const params = [];
    let idx = 1;

    // Farmers only see their own cows
    if (!perms.canReadAll) {
      if (req.user.role === 'farmer') {
        query += ` AND o.user_id = ?`; params.push(req.user.id); idx++;
      } else if (req.user.role === 'slaughterhouse') {
        // Slaughterhouse sees cows scheduled/confirmed for slaughter
        query += ` AND c.id IN (SELECT cow_id FROM slaughter_records)`; 
      }
    }

    if (status) { query += ` AND c.status = ?`; params.push(status); idx++; }
    if (owner_id && perms.canReadAll) { query += ` AND c.current_owner_id = ?`; params.push(owner_id); idx++; }
    if (district) { query += ` AND l.district LIKE ?`; params.push(`%${district}%`); idx++; }
    if (search) {
      query += ` AND (c.tag_number LIKE ? OR c.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`); idx += 2;
    }
    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ cows: result.rows, total: result.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cows' });
  }
};

const getCowById = async (req, res) => {
  try {
    const { id } = req.params;
    const perms = getPermissions(req.user.role);

    let selectFields = `c.id, c.tag_number, c.name, c.breed, c.gender, c.date_of_birth,
        c.color, c.weight_kg, c.status, c.is_alive, c.notes, c.created_at, c.updated_at,
        c.current_owner_id, c.current_location_id, c.mother_id,
        o.full_name AS owner_name, o.phone AS owner_phone,
        l.province, l.district, l.sector, l.cell, l.village, l.latitude, l.longitude`;
    if (perms.canReadFinancial) {
      selectFields += `, o.national_id AS owner_national_id`;
    }

    const cowResult = await pool.query(
      `SELECT ${selectFields} FROM cows c
       LEFT JOIN owners o ON c.current_owner_id = o.id
       LEFT JOIN locations l ON c.current_location_id = l.id
       WHERE c.id = ?`, [id]
    );
    if (cowResult.rows.length === 0) return res.status(404).json({ error: 'Cow not found' });

    const cow = cowResult.rows[0];

    // Farmer: verify ownership
    if (req.user.role === 'farmer') {
      const ownerCheck = await pool.query(
        'SELECT id FROM owners WHERE id = ? AND user_id = ?',
        [cow.current_owner_id, req.user.id]
      );
      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied: this cow does not belong to you' });
      }
    }

    const vaccines = await pool.query(
      `SELECT v.id, v.vaccine_name, v.vaccination_date, v.next_due_date,
        v.batch_number, v.notes, u.full_name AS vet_name
       FROM vaccinations v
       LEFT JOIN users u ON v.administered_by = u.id
       WHERE v.cow_id = ? ORDER BY v.vaccination_date DESC`, [id]
    );

    const offspringList = await pool.query(
      `SELECT o.id, o.birth_date, o.birth_weight_kg, o.gender,
        c.tag_number AS calf_tag, c.name AS calf_name, c.gender AS calf_gender
       FROM offspring o LEFT JOIN cows c ON o.calf_id = c.id
       WHERE o.mother_id = ? ORDER BY o.birth_date DESC`, [id]
    );

    // Transfer history — hide sale prices from vet and slaughterhouse
    let transferSelect = `t.id, t.transfer_date, t.reason,
        fo.full_name AS from_owner_name, to_o.full_name AS to_owner_name,
        l.district, l.sector`;
    if (perms.canReadFinancial) {
      transferSelect += `, t.sale_price, fo.national_id AS from_owner_nid, to_o.national_id AS to_owner_nid`;
    }
    const transfers = await pool.query(
      `SELECT ${transferSelect}
       FROM ownership_transfers t
       LEFT JOIN owners fo ON t.from_owner_id = fo.id
       LEFT JOIN owners to_o ON t.to_owner_id = to_o.id
       LEFT JOIN locations l ON t.new_location_id = l.id
       WHERE t.cow_id = ? ORDER BY t.transfer_date DESC`, [id]
    );

    const slaughter = await pool.query(
      `SELECT * FROM slaughter_records WHERE cow_id = ? ORDER BY created_at DESC LIMIT 1`, [id]
    );

    res.json({
      ...cow,
      vaccinations: vaccines.rows,
      offspring: offspringList.rows,
      transfers: transfers.rows,
      slaughter_record: slaughter.rows[0] || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cow' });
  }
};

const createCow = async (req, res) => {
  const { tag_number, name, breed, gender, date_of_birth, color,
    weight_kg, mother_id, notes } = req.body;
  let { current_owner_id, location } = req.body;
  const crypto = require('crypto');

  if (!tag_number || !tag_number.trim()) {
    return res.status(400).json({ error: 'Tag number is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Location ──────────────────────────────────────
    let location_id = null;
    if (location && location.district) {
      const locId = crypto.randomUUID();
      await client.query(
        `INSERT INTO locations (id, province, district, sector, cell, village, latitude, longitude)
         VALUES (?,?,?,?,?,?,?,?)`,
        [locId, location.province, location.district, location.sector,
         location.cell, location.village,
         location.latitude || null, location.longitude || null]
      );
      location_id = locId;
    }

    // ── Owner resolution ──────────────────────────────
    // If a FARMER registers a cow, always assign it to THEIR own owner record.
    // Create one automatically if it doesn't exist yet.
    if (req.user.role === 'farmer') {
      const ownerRow = await client.query(
        'SELECT id FROM owners WHERE user_id = ?', [req.user.id]
      );
      if (ownerRow.rows.length > 0) {
        current_owner_id = ownerRow.rows[0].id;
      } else {
        // Auto-create an owner profile from the user's account
        const userRow = await client.query(
          'SELECT full_name, phone, email FROM users WHERE id = ?', [req.user.id]
        );
        const u = userRow.rows[0] || {};
        const newOwnerId = crypto.randomUUID();
        // national_id is required + unique — generate a placeholder tied to the user
        const placeholderNid = 'AUTO-' + req.user.id.slice(0, 12);
        await client.query(
          `INSERT INTO owners (id, national_id, full_name, phone, email, location_id, user_id)
           VALUES (?,?,?,?,?,?,?)`,
          [newOwnerId, placeholderNid, u.full_name || 'Farmer',
           u.phone || 'N/A', u.email || null, location_id, req.user.id]
        );
        current_owner_id = newOwnerId;
      }
    }

    if (!current_owner_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'An owner must be selected for this cow' });
    }

    // ── Create the cow ────────────────────────────────
    const cowId = crypto.randomUUID();
    await client.query(
      `INSERT INTO cows (id, tag_number, name, breed, gender, date_of_birth, color, weight_kg,
        current_owner_id, current_location_id, mother_id, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [cowId, tag_number, name || null, breed || null, gender || null,
       date_of_birth || null, color || null, weight_kg || null,
       current_owner_id, location_id, mother_id || null, notes || null]
    );
    const result = await client.query('SELECT * FROM cows WHERE id = ?', [cowId]);
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create cow error:', err);
    // Duplicate key: SQLite → "UNIQUE", MySQL → code ER_DUP_ENTRY / "Duplicate entry"
    if (err.code === 'ER_DUP_ENTRY' ||
        (err.message && (err.message.includes('UNIQUE') || err.message.includes('Duplicate')))) {
      return res.status(409).json({ error: 'Tag number already exists' });
    }
    res.status(500).json({ error: 'Failed to create cow' });
  } finally {
    client.release();
  }
};

const updateCow = async (req, res) => {
  const { id } = req.params;
  const { name, breed, color, weight_kg, notes, status } = req.body;
  try {
    await pool.query(
      `UPDATE cows SET name=?, breed=?, color=?, weight_kg=?, notes=?, status=?, updated_at=datetime('now')
       WHERE id=?`,
      [name, breed, color, weight_kg, notes, status, id]
    );
    const result = await pool.query('SELECT * FROM cows WHERE id = ?', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cow not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cow' });
  }
};

const getCowStats = async (req, res) => {
  try {
    const perms = getPermissions(req.user.role);
    let ownerFilter = '';
    const params = [];

    if (!perms.canReadAll && req.user.role === 'farmer') {
      ownerFilter = `AND c.current_owner_id IN (SELECT id FROM owners WHERE user_id = ?)`;
      params.push(req.user.id);
    }

    // Helper: read the first numeric value from a result row regardless of column name
    const firstNum = (rows) => {
      if (!rows || rows.length === 0) return 0;
      const row = rows[0];
      const val = row.cnt ?? row.count ?? Object.values(row)[0];
      const num = parseInt(String(val ?? '0'), 10);
      return isNaN(num) ? 0 : num;
    };

    const total = await pool.query(
      `SELECT COUNT(*) as cnt FROM cows c WHERE c.status = 'active' ${ownerFilter}`, params
    );
    const byDistrict = await pool.query(
      `SELECT l.district, COUNT(c.id) as cnt
       FROM cows c JOIN locations l ON c.current_location_id = l.id
       WHERE c.status = 'active' ${ownerFilter}
       GROUP BY l.district ORDER BY cnt DESC`, params
    );
    const vaccinated = await pool.query(`SELECT COUNT(DISTINCT cow_id) as cnt FROM vaccinations`);
    const slaughtered = await pool.query(`SELECT COUNT(*) as cnt FROM cows WHERE status = 'slaughtered'`);
    const sold = await pool.query(`SELECT COUNT(*) as cnt FROM cows WHERE status = 'sold'`);

    // Normalize district rows to always have a numeric `count` field
    const districts = byDistrict.rows.map(d => ({
      district: d.district,
      count: parseInt(String(d.cnt ?? d.count ?? 0), 10) || 0,
    }));

    res.json({
      total_active: firstNum(total.rows),
      total_vaccinated: firstNum(vaccinated.rows),
      total_slaughtered: firstNum(slaughtered.rows),
      total_sold: firstNum(sold.rows),
      by_district: districts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

module.exports = { getAllCows, getCowById, createCow, updateCow, getCowStats };
