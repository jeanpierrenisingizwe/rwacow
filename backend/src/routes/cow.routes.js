const express = require('express');
const router = express.Router();
const { getAllCows, getCowById, createCow, updateCow, getCowStats } = require('../controllers/cow.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/stats', authenticate, getCowStats);
router.get('/', authenticate, getAllCows);
router.get('/:id', authenticate, getCowById);
router.post('/', authenticate, authorize('admin', 'government', 'farmer'), createCow);
router.put('/:id', authenticate, authorize('admin', 'government', 'vet'), updateCow);

module.exports = router;
