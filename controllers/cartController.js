const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, variationIndex, quantity } = req.body;
    const userId = req.user.userId;

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if variation exists
    if (variationIndex >= product.variation.length) {
      return res.status(400).json({ message: 'Invalid variation' });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // Create new cart if doesn't exist
      cart = await Cart.create({
        user: userId,
        items: [{
          product: productId,
          variation: product.variation[variationIndex],
          quantity
        }],
        total: product.variation[variationIndex].price * quantity
      });
    } else {
      // Check if item already exists with same variation
      const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId && 
        item.variation.weight === product.variation[variationIndex].weight
      );

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.items.push({
          product: productId,
          variation: product.variation[variationIndex],
          quantity
        });
      }

      // Recalculate total
      cart.total = cart.items.reduce((total, item) => 
        total + (item.variation.price * item.quantity), 0);

      await cart.save();
    }

    await cart.populate('items.product');
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Error adding to cart', error: err.message });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const userId = req.user.userId;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = quantity;

    // Recalculate total
    cart.total = cart.items.reduce((total, item) => 
      total + (item.variation.price * item.quantity), 0);

    await cart.save();
    await cart.populate('items.product');
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Error updating cart', error: err.message });
  }
};

// Delete cart item
exports.deleteCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.userId;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);

    // Recalculate total
    cart.total = cart.items.reduce((total, item) => 
      total + (item.variation.price * item.quantity), 0);

    await cart.save();
    await cart.populate('items.product');
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Error deleting cart item', error: err.message });
  }
};

// Get cart items
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart) {
      return res.json({ items: [], total: 0 });
    }
    
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cart', error: err.message });
  }
};