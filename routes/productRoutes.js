const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const adminAuth = require('../middleware/adminAuth');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes (admin only)
router.post('/', 
  adminAuth, 
  productController.upload.array('images', 5), // Allow up to 5 images
  productController.createProduct
);

router.put('/:id', 
  adminAuth, 
  productController.upload.array('images', 5),
  productController.updateProduct
);

router.delete('/:id', adminAuth, productController.deleteProduct);
router.get('/category/:categoryId', productController.getProductsByCategory);
module.exports = router;