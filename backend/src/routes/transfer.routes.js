const express = require('express');
const router = express.Router();
const { getTransfers, transferOwnership } = require('../controllers/transfer.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getTransfers);
router.post('/', authenticate, authorize('admin', 'government', 'farmer'), transferOwnership);

module.exports = router;
