const BusinessOrder = require('../models/BusinessOrder');
const Cart = require('../models/Cart');
const User = require('../models/User');

// Create business order request
exports.createBusinessOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { addressId } = req.body;

    // Verify business user
    const user = await User.findById(userId);
    if (!user.isBusiness) {
      return res.status(403).json({ message: 'Not authorized as business user' });
    }

    const selectedAddress = user.savedAddress.id(addressId);
    if (!selectedAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Get cart items
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Transform cart items to business order format
    const products = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity
    }));

    const businessOrder = await BusinessOrder.create({
      user: userId,
      products,
      shippingAddress: {
        address: selectedAddress.address,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode
      }
    });

    // Clear cart after order creation
    await Cart.findByIdAndDelete(cart._id);

    await businessOrder.populate('user products.product');
    res.status(201).json(businessOrder);
  } catch (err) {
    res.status(500).json({ message: 'Error creating business order', error: err.message });
  }
};

// Admin: Send quote (update final amount)
exports.sendQuote = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { finalAmount } = req.body;

    const businessOrder = await BusinessOrder.findById(orderId);
    if (!businessOrder) {
      return res.status(404).json({ message: 'Business order not found' });
    }

    businessOrder.finalAmount = finalAmount;
    businessOrder.isQuoteSent = true;
    businessOrder.status = 'Quote Sent';
    
    await businessOrder.save();
    await businessOrder.populate('user products.product');
    
    res.json(businessOrder);
  } catch (err) {
    res.status(500).json({ message: 'Error sending quote', error: err.message });
  }
};

// Get all business orders (admin)
exports.getAllBusinessOrders = async (req, res) => {
  try {
    const orders = await BusinessOrder.find()
      .populate('user', 'name email phone')
      .populate('products.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching business orders', error: err.message });
  }
};

// Get user's business orders
exports.getUserBusinessOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await BusinessOrder.find({ user: userId })
      .populate('products.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await BusinessOrder.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();
    await order.populate('user products.product');

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error updating order status', error: err.message });
  }
};