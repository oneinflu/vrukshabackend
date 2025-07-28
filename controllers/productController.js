const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});

// Configure multer for multiple images
exports.upload = multer({ storage: storage });

// Create product
exports.createProduct = async (req, res) => {
  try {
    const { name, category, description, variation } = req.body;
    
    // Handle multiple image uploads
    const images = req.files ? req.files.map(file => file.path) : [];
    
    // Parse variation array from JSON string if needed
    const parsedVariation = typeof variation === 'string' ? 
      JSON.parse(variation) : variation;

    const product = await Product.create({
      name,
      images,
      category,
      description,
      variation: parsedVariation
    });

    res.status(201).json(await product.populate('category'));
  } catch (err) {
    res.status(500).json({ message: 'Error creating product', error: err.message });
  }
};
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await Product.find({ category: categoryId }).populate('category');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products by category', error: err.message });
  }
};
// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product', error: err.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { name, category, description, variation } = req.body;
    const updateData = {
      name,
      category,
      description
    };

    // Handle variation update
    if (variation) {
      updateData.variation = typeof variation === 'string' ? 
        JSON.parse(variation) : variation;
    }

    // Handle image updates if new images are uploaded
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      const product = await Product.findById(req.params.id);
      if (product && product.images.length > 0) {
        for (const imageUrl of product.images) {
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }
      }
      // Add new images
      updateData.images = req.files.map(file => file.path);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('category');

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete all images from Cloudinary
    if (product.images.length > 0) {
      for (const imageUrl of product.images) {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
};