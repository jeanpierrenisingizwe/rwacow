const pool = require('../database/db');
const { getPermissions } = require('../middleware/auth.middleware');
const path = require('path');
const fs = require('fs');

/**
 * Export data as JSON (for backup download).
 * Only admin can export everything; others get scoped data.
 */
const exportBackup = async (req, res) => {
  const perms = getPermissions(req.user.role);
  if (!perms.canBackup) {
    return res.status(403).json({ error: 'Only administrators can perform full backups' });
  }
  try {
    const [cows, owners, vaccinations, offspring, slaughter, transfers, users] = await Promise.all([
      pool.query(`SELECT c.*, o.full_name AS owner_name, l.district, l.sector FROM cows c LEFT JOIN owners o ON c.current_owner_id=o.id LEFT JOIN locations l ON c.current_location_id=l.id`),
      pool.query(`SELECT o.*, l.province, l.district, l.sector, l.village FROM owners o LEFT JOIN locations l ON o.location_id=l.id`),
      pool.query(`SELECT v.*, c.tag_number, u.full_name AS vet_name FROM vaccinations v JOIN cows c ON v.cow_id=c.id LEFT JOIN users u ON v.administered_by=u.id`),
      pool.query(`SELECT o.*, m.tag_number AS mother_tag, c.tag_number AS calf_tag FROM offspring o JOIN cows m ON o.mother_id=m.id LEFT JOIN cows c ON o.calf_id=c.id`),
      pool.query(`SELECT s.*, c.tag_number, o.full_name AS owner_name FROM slaughter_records s JOIN cows c ON s.cow_id=c.id LEFT JOIN owners o ON s.owner_id=o.id`),
      pool.query(`SELECT t.*, c.tag_number, fo.full_name AS from_owner, too.full_name AS to_owner FROM ownership_transfers t JOIN cows c ON t.cow_id=c.id LEFT JOIN owners fo ON t.from_owner_id=fo.id LEFT JOIN owners too ON t.to_owner_id=too.id`),
      pool.query(`SELECT id, full_name, email, phone, role, is_active, created_at FROM users`),
    ]);

    const backup = {
      exported_at: new Date().toISOString(),
      exported_by: req.user.email,
      system: 'RwaCow Tracking System',
      data: {
        cows: cows.rows,
        owners: owners.rows,
        vaccinations: vaccinations.rows,
        offspring: offspring.rows,
        slaughter_records: slaughter.rows,
        ownership_transfers: transfers.rows,
        users: users.rows,
      },
      totals: {
        cows: cows.rows.length,
        owners: owners.rows.length,
        vaccinations: vaccinations.rows.length,
        offspring: offspring.rows.length,
        slaughter_records: slaughter.rows.length,
        transfers: transfers.rows.length,
        users: users.rows.length,
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="rwacow-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(backup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Backup failed' });
  }
};

/**
 * Export specific data sheet as CSV (for Excel).
 * sheet = cows | owners | vaccinations | offspring | slaughter | transfers
 */
const exportCSV = async (req, res) => {
  const { sheet } = req.params;
  const perms = getPermissions(req.user.role);
  if (!perms.canExport) {
    return res.status(403).json({ error: 'You do not have permission to export data' });
  }

  try {
    let rows = [];
    const userId = req.user.id;
    const role = req.user.role;

    switch (sheet) {
      case 'cows': {
        let q = `SELECT c.tag_number, c.name, c.breed, c.gender, c.date_of_birth, c.color,
            c.weight_kg, c.status, o.full_name AS owner_name, o.phone AS owner_phone,
            l.province, l.district, l.sector, l.cell, l.village, c.created_at`;
        if (perms.canReadFinancial) q += `, o.national_id AS owner_national_id`;
        q += ` FROM cows c LEFT JOIN owners o ON c.current_owner_id=o.id LEFT JOIN locations l ON c.current_location_id=l.id`;
        if (!perms.canReadAll && role === 'farmer') {
          q += ` WHERE o.user_id = ?`;
          rows = (await pool.query(q, [userId])).rows;
        } else if (!perms.canReadAll && role === 'slaughterhouse') {
          q += ` WHERE c.id IN (SELECT cow_id FROM slaughter_records)`;
          rows = (await pool.query(q)).rows;
        } else {
          rows = (await pool.query(q)).rows;
        }
        break;
      }
      case 'owners': {
        if (!perms.canReadAll) return res.status(403).json({ error: 'Access denied' });
        rows = (await pool.query(
          `SELECT o.national_id, o.full_name, o.phone, o.email,
            l.province, l.district, l.sector, l.cell, l.village,
            COUNT(c.id) AS active_cow_count
           FROM owners o LEFT JOIN locations l ON o.location_id=l.id
           LEFT JOIN cows c ON c.current_owner_id=o.id AND c.status='active'
           GROUP BY o.id, l.province, l.district, l.sector, l.cell, l.village
           ORDER BY o.full_name`
        )).rows;
        break;
      }
      case 'vaccinations': {
        let q = `SELECT c.tag_number, c.name AS cow_name, o.full_name AS owner_name,
            v.vaccine_name, v.vaccination_date, v.next_due_date,
            v.batch_number, u.full_name AS vet_name, v.notes
           FROM vaccinations v JOIN cows c ON v.cow_id=c.id
           LEFT JOIN owners o ON c.current_owner_id=o.id
           LEFT JOIN users u ON v.administered_by=u.id`;
        if (!perms.canReadAll && role === 'farmer') {
          q += ` WHERE o.user_id = ?`;
          rows = (await pool.query(q, [userId])).rows;
        } else {
          rows = (await pool.query(q)).rows;
        }
        break;
      }
      case 'offspring': {
        rows = (await pool.query(
          `SELECT m.tag_number AS mother_tag, m.name AS mother_name,
            c.tag_number AS calf_tag, c.name AS calf_name,
            o.birth_date, o.birth_weight_kg, o.gender
           FROM offspring o JOIN cows m ON o.mother_id=m.id LEFT JOIN cows c ON o.calf_id=c.id
           ORDER BY o.birth_date DESC`
        )).rows;
        break;
      }
      case 'slaughter': {
        let q = `SELECT c.tag_number, c.name AS cow_name, c.breed,
            own.full_name AS owner_name, s.scheduled_date, s.slaughter_date,
            s.meat_weight_kg, s.status, s.reason, l.district, l.sector
           FROM slaughter_records s JOIN cows c ON s.cow_id=c.id
           LEFT JOIN owners own ON s.owner_id=own.id
           LEFT JOIN locations l ON s.slaughterhouse_location_id=l.id`;
        rows = (await pool.query(q)).rows;
        break;
      }
      case 'transfers': {
        if (!perms.canReadFinancial) {
          // Vet/farmer only see basic transfer info, no prices
          rows = (await pool.query(
            `SELECT c.tag_number, c.name AS cow_name, fo.full_name AS from_owner,
              too.full_name AS to_owner, t.transfer_date, t.reason, l.district
             FROM ownership_transfers t JOIN cows c ON t.cow_id=c.id
             LEFT JOIN owners fo ON t.from_owner_id=fo.id LEFT JOIN owners too ON t.to_owner_id=too.id
             LEFT JOIN locations l ON t.new_location_id=l.id ORDER BY t.transfer_date DESC`
          )).rows;
        } else {
          rows = (await pool.query(
            `SELECT c.tag_number, c.name AS cow_name,
              fo.full_name AS from_owner, fo.national_id AS from_owner_nid,
              too.full_name AS to_owner, too.national_id AS to_owner_nid,
              t.transfer_date, t.sale_price, t.reason, l.district, l.sector
             FROM ownership_transfers t JOIN cows c ON t.cow_id=c.id
             LEFT JOIN owners fo ON t.from_owner_id=fo.id LEFT JOIN owners too ON t.to_owner_id=too.id
             LEFT JOIN locations l ON t.new_location_id=l.id ORDER BY t.transfer_date DESC`
          )).rows;
        }
        break;
      }
      default:
        return res.status(400).json({ error: 'Invalid sheet name' });
    }

    if (rows.length === 0) {
      return res.json({ csv: '', message: 'No data found' });
    }

    // Build CSV
    const headers = Object.keys(rows[0]);
    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => escape(r[h])).join(','))
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="rwacow-${sheet}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
};

module.exports = { exportBackup, exportCSV };
