const express = require('express');
const router = express.Router();
const { getVaccinations, addVaccination, deleteVaccination } = require('../controllers/vaccination.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getVaccinations);
router.post('/', authenticate, authorize('admin', 'vet', 'government'), addVaccination);
router.delete('/:id', authenticate, authorize('admin', 'vet'), deleteVaccination);

module.exports = router;
