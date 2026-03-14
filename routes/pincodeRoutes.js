const express = require('express');
const router = express.Router();
const pincodeController = require('../controllers/pincodeController');
const adminAuth = require('../middleware/adminAuth');

// Public routes
router.get('/check/:pincode', pincodeController.checkPincode);

// Admin routes
router.post('/add', adminAuth, pincodeController.addPincode);
router.put('/update/:id', adminAuth, pincodeController.updatePincode);
router.delete('/:id', adminAuth, pincodeController.deletePincode);
router.get('/all', adminAuth, pincodeController.getAllPincodes);
router.get('/:id', adminAuth, pincodeController.getPincodeById);

module.exports = router;
