const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const adminAuth = require('../middleware/adminAuth');

router.post('/send-promo', 
  adminAuth, 
  notificationController.upload.single('image'), 
  notificationController.sendPromoToAll
);

router.post('/send-to-user', adminAuth, notificationController.sendToUser);

module.exports = router;
