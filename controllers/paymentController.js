require('dotenv').config();
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Checkout = require('../models/Checkout');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const generateDeliveryDates = (startDate, endDate, schedule) => {
  const deliveryDates = [];
  const dayMapping = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + (30 * 24 * 60 * 60 * 1000));
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayName = Object.keys(dayMapping).find(key => dayMapping[key] === date.getDay());
    if (schedule.includes(dayName)) {
      deliveryDates.push(new Date(date));
    }
  }
  return deliveryDates;
};

// Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'Razorpay configuration missing' });
    }
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

    if (!order.total || order.total <= 0) {
      return res.status(400).json({ message: 'Invalid order total' });
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

// Create Razorpay order directly from cart (checkout-first)
exports.createCheckoutOrder = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'Razorpay configuration missing' });
    }
    const userId = req.user.userId;
    const { addressId, isRecurring, schedule = [], startDate, endDate } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const selectedAddress = user.savedAddress.id(addressId);
    if (!selectedAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const recalculatedTotal = cart.items.reduce((sum, item) => {
      const price = item.variation?.price || 0;
      const qty = item.quantity || 0;
      return sum + price * qty;
    }, 0);
    const effectiveTotal = typeof cart.total === 'number' && cart.total > 0 ? cart.total : recalculatedTotal;
    if (!effectiveTotal || effectiveTotal <= 0) {
      return res.status(400).json({ message: 'Invalid cart total' });
    }
    const amountPaise = Math.round(effectiveTotal * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `checkout_${userId}_${Date.now()}`,
      payment_capture: 1
    });

    const checkout = await Checkout.create({
      user: userId,
      cart: cart._id,
      shippingAddress: {
        address: selectedAddress.address,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode
      },
      isRecurring: !!isRecurring,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      schedule: isRecurring ? schedule : [],
      total: effectiveTotal,
      paymentStatus: 'Pending'
    });

    const payment = await Payment.create({
      orderId: null,
      checkoutId: checkout._id,
      userId,
      amount: effectiveTotal,
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
    res.status(500).json({ message: 'Error creating checkout', error: err.message });
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

    if (payment.checkoutId && !payment.orderId) {
      const checkout = await Checkout.findById(payment.checkoutId);
      if (!checkout) {
        return res.status(404).json({ message: 'Checkout not found' });
      }
      const cart = await Cart.findById(checkout.cart).populate('items.product');
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
      }
      let recurringOrders = [];
      if (checkout.isRecurring) {
        const dates = generateDeliveryDates(checkout.startDate, checkout.endDate, checkout.schedule);
        recurringOrders = dates.map(date => ({ deliveryDate: date, status: 'Scheduled' }));
      } else {
        recurringOrders = [{ deliveryDate: new Date(checkout.startDate), status: 'Scheduled' }];
      }
      const order = await Order.create({
        user: checkout.user,
        items: cart.items,
        shippingAddress: checkout.shippingAddress,
        isRecurring: checkout.isRecurring,
        startDate: new Date(checkout.startDate),
        endDate: checkout.endDate ? new Date(checkout.endDate) : undefined,
        schedule: checkout.isRecurring ? checkout.schedule : [],
        recurringOrders,
        total: checkout.total,
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        status: 'Order Placed'
      });
      await order.populate('user items.product');
      await Cart.findByIdAndDelete(cart._id);
      checkout.paymentStatus = 'Completed';
      await checkout.save();
      payment.orderId = order._id;
      await payment.save();
      return res.json({ message: 'Payment verified successfully', payment, order });
    } else if (payment.orderId) {
      const order = await Order.findById(payment.orderId);
      order.paymentStatus = 'PAID';
      await order.save();
      return res.json({ message: 'Payment verified successfully', payment, order });
    }

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
