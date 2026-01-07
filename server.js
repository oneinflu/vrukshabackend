const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  const origJson = res.json.bind(res);
  const origSend = res.send.bind(res);
  try {
    console.log(JSON.stringify({
      dir: 'req',
      time: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      body: req.body
    }));
  } catch (_) {}
  res.json = (body) => {
    try {
      console.log(JSON.stringify({
        dir: 'res',
        time: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration_ms: Number((process.hrtime.bigint() - start) / BigInt(1e6)),
        body
      }));
    } catch (_) {}
    return origJson(body);
  };
  res.send = (body) => {
    try {
      console.log(JSON.stringify({
        dir: 'res',
        time: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration_ms: Number((process.hrtime.bigint() - start) / BigInt(1e6)),
        body
      }));
    } catch (_) {}
    return origSend(body);
  };
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const businessOrderRoutes = require('./routes/businessOrderRoutes');
const statsRoutes = require('./routes/statsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const sliderRoutes = require('./routes/sliderRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/business-orders', businessOrderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sliders', sliderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Add this after your middleware setup and before routes
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
