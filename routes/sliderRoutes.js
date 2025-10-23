const express = require('express');
const router = express.Router();
const sliderController = require('../controllers/sliderController');
const adminAuth = require('../middleware/adminAuth');

// Public routes
router.get('/', sliderController.getAllSliders);
router.get('/:id', sliderController.getSliderById);

// Protected routes (admin only)
router.post('/', adminAuth, sliderController.upload.single('image'), sliderController.createSlider);
router.delete('/:id', adminAuth, sliderController.deleteSlider);

module.exports = router;