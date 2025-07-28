const express = require('express');
const router = express.Router();
const businessOrderController = require('../controllers/businessOrderController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Business user routes
router.post('/create', auth, businessOrderController.createBusinessOrder);
router.get('/my-orders', auth, businessOrderController.getUserBusinessOrders);

// Admin routes
router.get('/all', adminAuth, businessOrderController.getAllBusinessOrders);
router.put('/quote/:orderId', adminAuth, businessOrderController.sendQuote);
router.put('/status/:orderId', adminAuth, businessOrderController.updateOrderStatus);

module.exports = router;