const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  address: String,
  city: String,
  state: String,
  pincode: String
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: false }, // Name might be added later after OTP
  email: { type: String, required: false, sparse: true }, // Sparse unique index
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  isBusiness: { type: Boolean, default: false },
  profileImage: { type: String, default: null },
  savedAddress: [addressSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);