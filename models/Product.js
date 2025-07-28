const mongoose = require('mongoose');

const variationSchema = new mongoose.Schema({
  weight: String,
  price: Number,
  pcs: Number
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  images: [String],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  description: String,
  variation: [variationSchema]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);