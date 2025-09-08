const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  address: String,
  city: String,
  state: String,
  pincode: String
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },  // Removed required: true to make it optional
  password: { type: String, required: true },
  isBusiness: { type: Boolean, default: false },
  profileImage: { type: String, default: null },
  savedAddress: [addressSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);