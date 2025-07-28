const Category = require('../models/Category');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'categories',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});

// Configure multer
exports.upload = multer({ storage: storage });

// Create category
exports.createCategory = async (req, res) => {
  try {
    const { name, parent } = req.body;
    const icon = req.file ? req.file.path : null;

    const category = await Category.create({
      name,
      icon,
      parent: parent || null
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: 'Error creating category', error: err.message });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('parent');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories', error: err.message });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parent');
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching category', error: err.message });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { name, parent } = req.body;
    const updateData = {
      name,
      parent: parent || null
    };

    if (req.file) {
      updateData.icon = req.file.path;
      
      // Delete old icon from Cloudinary if exists
      const category = await Category.findById(req.params.id);
      if (category && category.icon) {
        const publicId = category.icon.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('parent');

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(updatedCategory);
  } catch (err) {
    res.status(500).json({ message: 'Error updating category', error: err.message });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete icon from Cloudinary if exists
    if (category.icon) {
      const publicId = category.icon.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting category', error: err.message });
  }
};