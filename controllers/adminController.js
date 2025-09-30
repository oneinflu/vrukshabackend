const Admin = require('../models/Admin');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { adminId: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Register initial admin
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if admin exists
    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin
    admin = await Admin.create({
      name,
      email,
      phone,
      password: hashedPassword
    });

    // Generate token
    const token = jwt.sign(
      { adminId: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new admin (by existing admin)
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if admin exists
    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin
    admin = await Admin.create({
      name,
      email,
      phone,
      password: hashedPassword
    });

    res.status(201).json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    // Get all users with selected fields (excluding password)
    const users = await User.find({}, {
      name: 1,
      email: 1,
      phone: 1,
      isBusiness: 1,
      profileImage: 1,
      savedAddress: 1,
      createdAt: 1,
      updatedAt: 1
    });

    res.json({
      users,
      total: users.length
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
};