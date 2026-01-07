const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// User routes
router.post('/create-order', auth, paymentController.createRazorpayOrder);
router.post('/checkout', auth, paymentController.createCheckoutOrder);
router.post('/simple-order', auth, paymentController.createSimpleOrder);
router.post('/verify', auth, paymentController.verifyPayment);

// Admin routes
router.get('/all', adminAuth, paymentController.getAllPayments);
router.post('/record-cod', adminAuth, paymentController.recordCODPayment);
router.put('/update-cod-status/:paymentId', adminAuth, paymentController.updateCODPaymentStatus);

module.exports = router;
