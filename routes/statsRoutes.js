const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const adminAuth = require('../middleware/adminAuth');

// Admin only route
router.get('/', adminAuth, statsController.getStats);

// Dashboard stats route
router.get('/dashboard', adminAuth, statsController.getDashboardStats);

module.exports = router;