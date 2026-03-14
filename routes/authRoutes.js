const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', auth, authController.getMe);

// Protected routes
router.get('/address', auth, authController.getAddresses);
router.post('/address', auth, authController.addAddress);
router.put('/address/:addressId', auth, authController.updateAddress);
router.delete('/address/:addressId', auth, authController.deleteAddress);
router.put('/fcm-token', auth, authController.updateFcmToken);

module.exports = router;