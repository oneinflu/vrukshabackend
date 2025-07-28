const mongoose = require('mongoose');

const subOrderSchema = new mongoose.Schema({
  deliveryDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Scheduled', 'Processing', 'Canceled', 'Delivered'],
    default: 'Scheduled'
  }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    variation: {
      weight: String,
      price: Number,
      pcs: Number
    },
    quantity: Number
  }],
  shippingAddress: {
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  isRecurring: { type: Boolean, default: false },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  schedule: [{
    type: String,
    enum: ['mon', 'tue', 'wed', 'thurs', 'fri', 'sat', 'sun']
  }],
  recurringOrders: [subOrderSchema],
  total: Number,
  paymentMode: { type: String, enum: ['COD'], required: true },
  status: {
    type: String,
    enum: ['Order Placed', 'Processing', 'Canceled', 'Delivered'],
    default: 'Order Placed'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);