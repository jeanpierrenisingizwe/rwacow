const express = require('express');
const router = express.Router();
const { getAllOwners, getOwnerById, createOwner, updateOwner } = require('../controllers/owner.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getAllOwners);
router.get('/:id', authenticate, getOwnerById);
router.post('/', authenticate, authorize('admin', 'government'), createOwner);
router.put('/:id', authenticate, authorize('admin', 'government'), updateOwner);

module.exports = router;
