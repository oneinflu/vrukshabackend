const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// User routes
router.post('/create-order', auth, paymentController.createRazorpayOrder);
router.post('/verify', auth, paymentController.verifyPayment);
router.post('/record-cod', auth, paymentController.recordCODPayment);

// Admin routes
router.get('/all', adminAuth, paymentController.getAllPayments);
router.put('/update-cod-status/:paymentId', adminAuth, paymentController.updateCODPaymentStatus);

module.exports = router;