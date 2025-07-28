const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

// Public admin routes
router.post('/register', adminController.registerAdmin);
router.post('/login', adminController.adminLogin);

// Protected admin routes
router.post('/create', adminAuth, adminController.createAdmin);

module.exports = router;