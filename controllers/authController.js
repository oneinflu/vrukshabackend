const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage for profile images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile-images',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});

exports.uploadProfileImage = multer({ storage: storage });


// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword
    });

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isBusiness: user.isBusiness
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password, fcmToken } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update FCM token if provided
    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isBusiness: user.isBusiness,
        fcmToken: user.fcmToken
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout (client-side token removal)
exports.logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

// Add address
exports.addAddress = async (req, res) => {
  try {
    const { address, city, state, pincode } = req.body;
    const user = await User.findById(req.user.userId);

    user.savedAddress.push({ address, city, state, pincode });
    await user.save();

    res.json({ addresses: user.savedAddress });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update address
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { address, city, state, pincode } = req.body;
    
    const user = await User.findById(req.user.userId);
    const addressIndex = user.savedAddress.findIndex(addr => addr._id.toString() === addressId);
    
    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }

    user.savedAddress[addressIndex] = { address, city, state, pincode };
    await user.save();

    res.json({ addresses: user.savedAddress });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.userId);
    
    user.savedAddress = user.savedAddress.filter(addr => addr._id.toString() !== addressId);
    await user.save();

    res.json({ addresses: user.savedAddress });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user addresses
exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ addresses: user.savedAddress });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isBusiness: user.isBusiness,
        profileImage: user.profileImage,
        savedAddress: user.savedAddress
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update FCM Token
exports.updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fcmToken = fcmToken;
    await user.save();

    res.json({ message: 'FCM token updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile (name, email, profileImage)
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email } = req.body;

    // Update name if provided
    if (name !== undefined) {
      user.name = name;
    }

    // Update email if provided
    if (email !== undefined) {
      user.email = email;
    }

    // Handle profile image upload
    if (req.file) {
      // Delete old profile image from Cloudinary if exists
      if (user.profileImage) {
        try {
          const publicId = 'profile-images/' + user.profileImage.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error('Error deleting old profile image:', err.message);
        }
      }
      // Set new profile image URL from Cloudinary
      user.profileImage = req.file.path;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isBusiness: user.isBusiness,
        profileImage: user.profileImage,
        savedAddress: user.savedAddress
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};