const mongoose = require('mongoose');

const checkoutSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', required: true },
  shippingAddress: {
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  isRecurring: { type: Boolean, default: false },
  startDate: { type: Date },
  endDate: { type: Date },
  schedule: [{
    type: String,
    enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  }],
  total: Number,
  paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Checkout', checkoutSchema);
