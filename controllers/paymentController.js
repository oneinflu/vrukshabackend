require('dotenv').config();
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Get order details
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: order.total * 100, // Convert to paise
      currency: 'INR',
      receipt: orderId,
      payment_capture: 1
    });

    // Create payment record
    const payment = await Payment.create({
      orderId: order._id,
      userId: req.user.userId,
      amount: order.total,
      paymentMethod: 'RAZORPAY',
      razorpayOrderId: razorpayOrder.id,
      status: 'PENDING'
    });

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      paymentId: payment._id
    });
  } catch (err) {
    res.status(500).json({ message: 'Error creating order', error: err.message });
  }
};

// Verify Razorpay payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

    // Get payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      payment.status = 'FAILED';
      await payment.save();
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Update payment record
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'SUCCESS';
    payment.paidAt = new Date();
    await payment.save();

    // Update order status
    const order = await Order.findById(payment.orderId);
    order.paymentStatus = 'PAID';
    await order.save();

    res.json({ message: 'Payment verified successfully', payment });
  } catch (err) {
    res.status(500).json({ message: 'Error verifying payment', error: err.message });
  }
};

// Record COD payment
exports.recordCODPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Get order details
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Create payment record
    const payment = await Payment.create({
      orderId: order._id,
      userId: order.user, // Use the order's user ID
      amount: order.total,
      paymentMethod: 'COD',
      status: 'PENDING'
    });

    res.json({ message: 'COD payment recorded', payment });
  } catch (err) {
    res.status(500).json({ message: 'Error recording payment', error: err.message });
  }
};

// Get all payments (admin only)
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('orderId', 'orderNumber total')
      .populate('userId', 'name email');

    res.json({
      payments,
      total: payments.length
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching payments', error: err.message });
  }
};

// Update COD payment status (admin only)
exports.updateCODPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['SUCCESS', 'FAILED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if payment is COD
    if (payment.paymentMethod !== 'COD') {
      return res.status(400).json({ message: 'Can only update COD payment status' });
    }

    // Update payment status
    payment.status = status;
    if (status === 'SUCCESS') {
      payment.paidAt = new Date();
    }
    await payment.save();

    // Update order status if payment is successful
    if (status === 'SUCCESS') {
      const order = await Order.findById(payment.orderId);
      order.paymentStatus = 'PAID';
      await order.save();
    }

    res.json({ message: 'Payment status updated', payment });
  } catch (err) {
    res.status(500).json({ message: 'Error updating payment status', error: err.message });
  }
};