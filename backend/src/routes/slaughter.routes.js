const express = require('express');
const router = express.Router();
const { getSlaughterRecords, scheduleSlaughter, confirmSlaughter } = require('../controllers/slaughter.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getSlaughterRecords);
router.post('/', authenticate, authorize('admin', 'government', 'slaughterhouse'), scheduleSlaughter);
router.put('/:id/confirm', authenticate, authorize('admin', 'slaughterhouse'), confirmSlaughter);

module.exports = router;
