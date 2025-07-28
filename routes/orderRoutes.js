const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// User routes
router.post('/create', auth, orderController.createOrder);
router.get('/my-orders', auth, orderController.getUserOrders);
router.get('/details/:id', auth, orderController.getOrderById);
router.put('/cancel/:id', auth, orderController.cancelOrder);

// Admin routes
router.get('/all', adminAuth, orderController.getAllOrders);
router.put('/status/:id', adminAuth, orderController.updateOrderStatus);

// Add this new route
router.put('/recurring/:orderId/:recurringOrderId/cancel', auth, orderController.cancelRecurringOrder);

module.exports = router;