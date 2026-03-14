const User = require('../models/User');
const { sendNotification, sendToTopic } = require('../config/firebase');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage for notifications
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'notifications',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});

exports.upload = multer({ storage: storage });

// Send promotional notification to all users
exports.sendPromoToAll = async (req, res) => {
  try {
    const { title, body } = req.body;
    
    // Use uploaded image URL if existing, otherwise use provided imageUrl from body
    const imageUrl = req.file ? req.file.path : req.body.imageUrl;

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and Body are required' });
    }

    // Send to a "promotions" topic (Recommended)
    await sendToTopic('promotions', title, body, { 
      imageUrl: imageUrl || '',
      type: 'promotion'
    });

    res.json({ 
      message: 'Promotional notification sent successfully',
      imageUrl: imageUrl || null
    });
  } catch (err) {
    res.status(500).json({ message: 'Error sending notification', error: err.message });
  }
};

// Send notification to specific user
exports.sendToUser = async (req, res) => {
  try {
    const { userId, title, body } = req.body;
    const user = await User.findById(userId);

    if (!user || !user.fcmToken) {
      return res.status(404).json({ message: 'User or FCM token not found' });
    }

    await sendNotification(user.fcmToken, title, body);
    res.json({ message: 'Notification sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending notification', error: err.message });
  }
};
