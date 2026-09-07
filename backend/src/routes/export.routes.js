const express = require('express');
const router = express.Router();
const { exportBackup, exportCSV } = require('../controllers/export.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Full JSON backup — admin only
router.get('/backup', authenticate, authorize('admin'), exportBackup);

// CSV export per sheet — role-scoped inside controller
router.get('/csv/:sheet', authenticate, exportCSV);

module.exports = router;
