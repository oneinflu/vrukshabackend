const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');

// Helper function to generate delivery dates
const generateDeliveryDates = (startDate, endDate, schedule) => {
  const deliveryDates = [];
  const dayMapping = {
    'mon': 1, 'tue': 2, 'wed': 3, 'thurs': 4, 'fri': 5, 'sat': 6, 'sun': 0
  };

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + (30 * 24 * 60 * 60 * 1000)); // Default 30 days if no end date

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayName = Object.keys(dayMapping).find(key => dayMapping[key] === date.getDay());
    if (schedule.includes(dayName)) {
      deliveryDates.push(new Date(date));
    }
  }
  return deliveryDates;
};

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { addressId, isRecurring, schedule, startDate, endDate } = req.body;

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

    let recurringOrders = [];
    if (isRecurring) {
      const deliveryDates = generateDeliveryDates(startDate, endDate, schedule);
      recurringOrders = deliveryDates.map(date => ({
        deliveryDate: date,
        status: 'Scheduled'
      }));
    } else {
      // For non-recurring orders, create single delivery date
      recurringOrders = [{
        deliveryDate: new Date(startDate),
        status: 'Scheduled'
      }];
    }

    const order = await Order.create({
      user: userId,
      items: cart.items,
      shippingAddress: {
        address: selectedAddress.address,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode
      },
      isRecurring,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      schedule: isRecurring ? schedule : [],
      recurringOrders,
      total: cart.total,
      paymentMode: 'COD'
    });

    await Cart.findByIdAndDelete(cart._id);
    await order.populate('user items.product');
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error creating order', error: err.message });
  }
};

// Add new controller function to cancel specific recurring order
exports.cancelRecurringOrder = async (req, res) => {
  try {
    const { orderId, recurringOrderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.isRecurring) {
      return res.status(400).json({ message: 'Not a recurring order' });
    }

    // Check authorization
    if (!req.admin && order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const recurringOrder = order.recurringOrders.id(recurringOrderId);
    if (!recurringOrder) {
      return res.status(404).json({ message: 'Recurring order not found' });
    }

    if (recurringOrder.status === 'Delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered order' });
    }

    recurringOrder.status = 'Canceled';
    await order.save();
    await order.populate('user items.product');
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error canceling recurring order', error: err.message });
  }
};

// Get all orders (for admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email phone')
      .populate('items.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await Order.find({ user: userId })
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized to view this order
    if (!req.admin && order.user._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching order', error: err.message });
  }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();
    await order.populate('user items.product');

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error updating order', error: err.message });
  }
};

// Cancel order (user or admin)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized to cancel this order
    if (!req.admin && order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only allow cancellation if order is not delivered
    if (order.status === 'Delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered order' });
    }

    order.status = 'Canceled';
    await order.save();
    await order.populate('user items.product');

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error canceling order', error: err.message });
  }
};