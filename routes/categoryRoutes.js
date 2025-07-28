const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const adminAuth = require('../middleware/adminAuth');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Protected routes (admin only)
router.post('/', adminAuth, categoryController.upload.single('icon'), categoryController.createCategory);
router.put('/:id', adminAuth, categoryController.upload.single('icon'), categoryController.updateCategory);
router.delete('/:id', adminAuth, categoryController.deleteCategory);


module.exports = router;