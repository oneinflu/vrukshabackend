const Slider = require('../models/Slider');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sliders',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});

// Configure multer
exports.upload = multer({ storage: storage });

// Create slider
exports.createSlider = async (req, res) => {
  try {
    const image = req.file ? req.file.path : null;
    
    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const slider = await Slider.create({ image });

    res.status(201).json(slider);
  } catch (err) {
    res.status(500).json({ message: 'Error creating slider', error: err.message });
  }
};

// Get all sliders
exports.getAllSliders = async (req, res) => {
  try {
    const sliders = await Slider.find();
    res.json(sliders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sliders', error: err.message });
  }
};

// Get slider by ID
exports.getSliderById = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) {
      return res.status(404).json({ message: 'Slider not found' });
    }
    res.json(slider);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching slider', error: err.message });
  }
};

// Delete slider
exports.deleteSlider = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) {
      return res.status(404).json({ message: 'Slider not found' });
    }

    // Delete image from Cloudinary if exists
    if (slider.image) {
      const publicId = slider.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await Slider.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slider deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting slider', error: err.message });
  }
};