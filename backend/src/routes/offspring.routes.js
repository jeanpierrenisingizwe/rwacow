const express = require('express');
const router = express.Router();
const { getOffspring, registerOffspring } = require('../controllers/offspring.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getOffspring);
router.post('/', authenticate, authorize('admin', 'government', 'farmer', 'vet'), registerOffspring);

module.exports = router;
