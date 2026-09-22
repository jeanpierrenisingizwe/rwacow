const express = require('express');
const router = express.Router();
const {
  getAllCows, getCowById, createCow, updateCow, getCowStats,
  getPendingCows, approveCow, rejectCow, getPendingCount,
} = require('../controllers/cow.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/stats', authenticate, getCowStats);

// ── Approval workflow (admin / government only) ──
router.get('/pending', authenticate, authorize('admin', 'government'), getPendingCows);
router.get('/pending/count', authenticate, authorize('admin', 'government'), getPendingCount);
router.put('/:id/approve', authenticate, authorize('admin', 'government'), approveCow);
router.put('/:id/reject', authenticate, authorize('admin', 'government'), rejectCow);

router.get('/', authenticate, getAllCows);
router.get('/:id', authenticate, getCowById);
router.post('/', authenticate, authorize('admin', 'government', 'farmer'), createCow);
router.put('/:id', authenticate, authorize('admin', 'government', 'vet'), updateCow);

module.exports = router;
