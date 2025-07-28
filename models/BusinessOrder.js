const mongoose = require('mongoose');

const businessOrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true }
  }],
  isQuoteSent: { type: Boolean, default: false },
  finalAmount: { type: Number, default: null },
  status: {
    type: String,
    enum: ['Order Placed', 'Quote Sent', 'Processing', 'Canceled', 'Delivered'],
    default: 'Order Placed'
  },
  shippingAddress: {
    address: String,
    city: String,
    state: String,
    pincode: String
  }
}, { timestamps: true });

module.exports = mongoose.model('BusinessOrder', businessOrderSchema);