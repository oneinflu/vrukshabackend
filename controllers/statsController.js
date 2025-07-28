const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const BusinessOrder = require('../models/BusinessOrder');

exports.getStats = async (req, res) => {
  try {
    // Users stats
    const totalUsers = await User.countDocuments();
    const totalBusinessUsers = await User.countDocuments({ isBusiness: true });

    // Categories and Products
    const totalCategories = await Category.countDocuments();
    const totalProducts = await Product.countDocuments();

    // Regular Orders
    const totalOrders = await Order.countDocuments();
    const scheduledOrders = await Order.countDocuments({
      'recurringOrders.status': 'Scheduled'
    });
    const processingOrders = await Order.countDocuments({ status: 'Processing' });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const canceledOrders = await Order.countDocuments({ status: 'Canceled' });

    // Calculate total income from regular orders
    const regularOrdersIncome = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Business Orders
    const totalBusinessOrders = await BusinessOrder.countDocuments();
    
    // Calculate total quoted amount
    const quotedAmount = await BusinessOrder.aggregate([
      { $match: { isQuoteSent: true } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);

    // Calculate total income from business orders
    const businessOrdersIncome = await BusinessOrder.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);

    const stats = {
      users: {
        total: totalUsers,
        businessUsers: totalBusinessUsers
      },
      inventory: {
        categories: totalCategories,
        products: totalProducts
      },
      orders: {
        total: totalOrders,
        scheduled: scheduledOrders,
        processing: processingOrders,
        delivered: deliveredOrders,
        canceled: canceledOrders
      },
      businessOrders: {
        total: totalBusinessOrders,
        quotedAmount: quotedAmount[0]?.total || 0
      },
      finance: {
        totalIncome: (regularOrdersIncome[0]?.total || 0) + (businessOrdersIncome[0]?.total || 0)
      }
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats', error: err.message });
  }
};