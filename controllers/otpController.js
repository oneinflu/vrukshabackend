const Otp = require('../models/Otp');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Function to generate 4 digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Send OTP via Fast2SMS
const sendSMS = async (phone, otp) => {
  try {
    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      "route": "otp",
      "variables_values": otp,
      "numbers": phone
    }, {
      headers: {
        "authorization": process.env.FAST2SMS_API_KEY,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    console.error('Fast2SMS Error:', error.response?.data || error.message);
    throw new Error('Failed to send SMS');
  }
};

// Send OTP Endpoint
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length !== 10) {
      return res.status(400).json({ message: 'Valid 10-digit phone number is required' });
    }

    const otp = generateOTP();
    
    // Save to DB (Update if exists, else create)
    await Otp.findOneAndUpdate(
      { phone },
      { otp, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    // Send via Fast2SMS
    await sendSMS(phone, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error sending OTP' });
  }
};

// Verify OTP Endpoint
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp, fcmToken } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const otpRecord = await Otp.findOne({ phone, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // OTP Correct - Delete the record
    await Otp.deleteOne({ _id: otpRecord._id });

    // Find or Create User
    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        phone,
        name: 'User ' + phone.slice(-4), // Default name
        fcmToken: fcmToken || null
      });
      isNewUser = true;
    } else if (fcmToken) {
      // Update FCM token if provided for existing user
      user.fcmToken = fcmToken;
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: isNewUser ? 'User registered and logged in' : 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isBusiness: user.isBusiness,
        fcmToken: user.fcmToken
      },
      isNewUser
    });
  } catch (err) {
    res.status(500).json({ message: 'Error verifying OTP', error: err.message });
  }
};

// Resend OTP Endpoint
exports.resendOtp = async (req, res) => {
  // Logic is same as sendOtp
  return exports.sendOtp(req, res);
};
