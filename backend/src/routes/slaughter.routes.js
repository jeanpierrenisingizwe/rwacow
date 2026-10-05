const express = require('express');
const router = express.Router();
const {
  getSlaughterRecords, scheduleSlaughter, authorizeSlaughter,
  confirmSlaughter, getPendingAuthCount,
} = require('../controllers/slaughter.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getSlaughterRecords);

// Count of requests awaiting vet authorization (vet / admin / government)
router.get('/pending-auth/count', authenticate, authorize('admin', 'government', 'vet'), getPendingAuthCount);

// Step 1 — slaughterhouse registers a cow for slaughter
router.post('/', authenticate, authorize('admin', 'government', 'slaughterhouse'), scheduleSlaughter);

// Step 2 — a veterinarian authorizes or rejects
router.put('/:id/authorize', authenticate, authorize('admin', 'government', 'vet'), authorizeSlaughter);

// Step 3 — slaughterhouse confirms the slaughter (only after authorization)
router.put('/:id/confirm', authenticate, authorize('admin', 'slaughterhouse'), confirmSlaughter);

module.exports = router;
