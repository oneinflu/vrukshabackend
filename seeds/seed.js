require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Admin = require('../models/Admin');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Clear existing data
async function clearDatabase() {
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
  await Admin.deleteMany({});
  console.log('Database cleared');
}

// Admin data
const admin = {
  name: 'Vruksha Admin',
  email: 'admin@vrukshafarms.com',
  phone: '9876543210',
  password: '@Vruksha123$'
};

// Categories data
const categories = [
  {
    name: 'Fresh Vegetables',
    description: 'Farm fresh vegetables delivered to your doorstep',
    icon: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7'
  },
  {
    name: 'Fresh Fruits',
    description: 'Seasonal and exotic fruits collection',
    icon: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b'
  },
  {
    name: 'Leafy Vegetables',
    description: 'Fresh leafy greens',
    icon: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb'
  },
  {
    name: 'Exotic Vegetables',
    description: 'Premium exotic vegetables',
    icon: 'https://images.unsplash.com/photo-1597362485714-aa9c3d4c8a8a'
  },
  {
    name: 'Seasonal Fruits',
    description: 'Fresh seasonal fruits',
    icon: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf'
  },
  {
    name: 'Pulses & Dals',
    description: 'Quality pulses and dals',
    icon: 'https://images.unsplash.com/photo-1515543904379-dd67a58c71f1'
  },
  {
    name: 'Rice & Rice Products',
    description: 'Premium quality rice varieties',
    icon: 'https://images.unsplash.com/photo-1586201375761-83865001e31c'
  },
  {
    name: 'Atta & Flours',
    description: 'Fresh and pure flour varieties',
    icon: 'https://images.unsplash.com/photo-1509440159596-0249088772ff'
  },
  {
    name: 'Spices & Masalas',
    description: 'Authentic spices and masalas',
    icon: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d'
  },
  {
    name: 'Oils & Ghee',
    description: 'Pure oils and ghee',
    icon: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5'
  }
];

// Products data
const products = [
  // Fresh Vegetables (10 products)
  {
    name: 'Tomatoes',
    description: 'Fresh, ripe tomatoes',
    category: 'Fresh Vegetables',
    images: ['https://images.unsplash.com/photo-1546094096-0df4bcaaa337'],
    variation: [{ weight: '500g', price: 30, pcs: 6 }, { weight: '1kg', price: 55, pcs: 12 }]
  },
  {
    name: 'Onions',
    description: 'Premium quality onions',
    category: 'Fresh Vegetables',
    images: ['https://images.unsplash.com/photo-1508747703725-719777637510'],
    variation: [{ weight: '500g', price: 25, pcs: 4 }, { weight: '1kg', price: 45, pcs: 8 }]
  },
  {
    name: 'Potatoes',
    description: 'Fresh potatoes',
    category: 'Fresh Vegetables',
    images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655'],
    variation: [{ weight: '500g', price: 20, pcs: 4 }, { weight: '1kg', price: 35, pcs: 8 }]
  },
  {
    name: 'Carrots',
    description: 'Fresh orange carrots',
    category: 'Fresh Vegetables',
    images: ['https://images.unsplash.com/photo-1598170845058-32b9d6a5da37'],
    variation: [{ weight: '500g', price: 35, pcs: 6 }, { weight: '1kg', price: 60, pcs: 12 }]
  },
  {
    name: 'Capsicum',
    description: 'Green bell peppers',
    category: 'Fresh Vegetables',
    images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea'],
    variation: [{ weight: '250g', price: 25, pcs: 3 }, { weight: '500g', price: 45, pcs: 6 }]
  },
  {
    name: 'Cucumber',
    description: 'Fresh green cucumbers',
    category: 'Fresh Vegetables',
    images: ['https://images.unsplash.com/photo-1604977042946-1eecc30f269e'],
    variation: [{ weight: '500g', price: 30, pcs: 3 }, { weight: '1kg', price: 55, pcs: 6 }]
  },
  {
    name: 'Cauliflower',
    description: 'Fresh cauliflower',
    category: 'Fresh Vegetables',
    images: ['https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3'],
    variation: [{ weight: 'per piece', price: 35, pcs: 1 }]
  },
  {
    name: 'Brinjal',
    description: 'Fresh purple brinjals',
    category: 'Fresh Vegetables',
    images: ['https://images.unsplash.com/photo-1635274605638-d44babc08a4f'],
    variation: [{ weight: '500g', price: 30, pcs: 4 }, { weight: '1kg', price: 55, pcs: 8 }]
  },
  {
    name: 'Lady Finger',
    description: 'Fresh okra/bhindi',
    category: 'Fresh Vegetables',
    images: ['https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2'],
    variation: [{ weight: '250g', price: 20, pcs: 15 }, { weight: '500g', price: 35, pcs: 30 }]
  },
  {
    name: 'Green Peas',
    description: 'Fresh green peas',
    category: 'Fresh Vegetables',
    images: ['https://images.unsplash.com/photo-1587735243615-c03f25aaff15'],
    variation: [{ weight: '250g', price: 25, pcs: null }, { weight: '500g', price: 45, pcs: null }]
  },

  // Fresh Fruits (10 products)
  {
    name: 'Apples',
    description: 'Fresh Shimla apples',
    category: 'Fresh Fruits',
    images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6'],
    variation: [{ weight: '500g', price: 80, pcs: 2 }, { weight: '1kg', price: 150, pcs: 4 }]
  },
  {
    name: 'Bananas',
    description: 'Fresh ripe bananas',
    category: 'Fresh Fruits',
    images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e'],
    variation: [{ weight: '6 pcs', price: 35, pcs: 6 }, { weight: '12 pcs', price: 65, pcs: 12 }]
  },
  {
    name: 'Oranges',
    description: 'Sweet and juicy oranges',
    category: 'Fresh Fruits',
    images: ['https://images.unsplash.com/photo-1611080626919-7cf5a9999775'],
    variation: [{ weight: '500g', price: 60, pcs: 3 }, { weight: '1kg', price: 110, pcs: 6 }]
  },
  {
    name: 'Pomegranate',
    description: 'Fresh pomegranates',
    category: 'Fresh Fruits',
    images: ['https://images.unsplash.com/photo-1615485925600-97237c4fc1ec'],
    variation: [{ weight: '500g', price: 90, pcs: 2 }, { weight: '1kg', price: 170, pcs: 4 }]
  },
  {
    name: 'Grapes',
    description: 'Fresh green/black grapes',
    category: 'Fresh Fruits',
    images: ['https://images.unsplash.com/photo-1537640538966-79f369143f8f'],
    variation: [{ weight: '500g', price: 70, pcs: null }, { weight: '1kg', price: 130, pcs: null }]
  },
  {
    name: 'Watermelon',
    description: 'Sweet watermelon',
    category: 'Fresh Fruits',
    images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38'],
    variation: [{ weight: 'per piece', price: 80, pcs: 1 }]
  },
  {
    name: 'Papaya',
    description: 'Fresh ripe papaya',
    category: 'Fresh Fruits',
    images: ['https://images.unsplash.com/photo-1617112848923-cc2234396a8d'],
    variation: [{ weight: 'per piece', price: 60, pcs: 1 }]
  },
  {
    name: 'Pineapple',
    description: 'Fresh pineapple',
    category: 'Fresh Fruits',
    images: ['https://images.unsplash.com/photo-1550258987-190a2d41a8ba'],
    variation: [{ weight: 'per piece', price: 70, pcs: 1 }]
  },
  {
    name: 'Sweet Lime',
    description: 'Fresh sweet lime (mosambi)',
    category: 'Fresh Fruits',
    images: ['https://images.unsplash.com/photo-1621506289937-a8e4df240d0b'],
    variation: [{ weight: '500g', price: 50, pcs: 4 }, { weight: '1kg', price: 90, pcs: 8 }]
  },
  {
    name: 'Guava',
    description: 'Fresh guava',
    category: 'Fresh Fruits',
    images: ['https://images.unsplash.com/photo-1536511132770-e5058c7e8c46'],
    variation: [{ weight: '500g', price: 45, pcs: 3 }, { weight: '1kg', price: 80, pcs: 6 }]
  },

  // Atta & Flours (10 products)
  {
    name: 'Aashirvaad Atta',
    description: 'Premium wheat flour',
    category: 'Atta & Flours',
    images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff'],
    variation: [{ weight: '5kg', price: 250, pcs: 1 }, { weight: '10kg', price: 480, pcs: 1 }]
  },
  {
    name: 'Fortune Chakki Fresh Atta',
    description: 'Fresh chakki atta',
    category: 'Atta & Flours',
    images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b'],
    variation: [{ weight: '5kg', price: 235, pcs: 1 }, { weight: '10kg', price: 460, pcs: 1 }]
  },
  {
    name: 'Organic Wheat Flour',
    description: 'Organic whole wheat flour',
    category: 'Atta & Flours',
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c'],
    variation: [{ weight: '5kg', price: 290, pcs: 1 }]
  },
  {
    name: 'Besan (Gram Flour)',
    description: 'Fine gram flour',
    category: 'Atta & Flours',
    images: ['https://images.unsplash.com/photo-1612257999691-c6d77ea3d979'],
    variation: [{ weight: '500g', price: 60, pcs: 1 }, { weight: '1kg', price: 110, pcs: 1 }]
  },
  {
    name: 'Rice Flour',
    description: 'Fine rice flour',
    category: 'Atta & Flours',
    images: ['https://images.unsplash.com/photo-1586201375789-c2d509a8c157'],
    variation: [{ weight: '500g', price: 45, pcs: 1 }, { weight: '1kg', price: 85, pcs: 1 }]
  },
  {
    name: 'Maida',
    description: 'All-purpose flour',
    category: 'Atta & Flours',
    images: ['https://images.unsplash.com/photo-1574323347506-952211951e3a'],
    variation: [{ weight: '500g', price: 30, pcs: 1 }, { weight: '1kg', price: 55, pcs: 1 }]
  },
  {
    name: 'Sooji/Rava',
    description: 'Semolina flour',
    category: 'Atta & Flours',
    images: ['https://images.unsplash.com/photo-1590779033100-9f60a05a013d'],
    variation: [{ weight: '500g', price: 35, pcs: 1 }, { weight: '1kg', price: 65, pcs: 1 }]
  },
  {
    name: 'Corn Flour',
    description: 'Fine corn flour',
    category: 'Atta & Flours',
    images: ['https://images.unsplash.com/photo-1586201375813-78c003c22f8c'],
    variation: [{ weight: '500g', price: 45, pcs: 1 }]
  },
  {
    name: 'Multigrain Atta',
    description: 'Healthy multigrain flour',
    category: 'Atta & Flours',
    images: ['https://images.unsplash.com/photo-1590779033445-901f9c99edb7'],
    variation: [{ weight: '5kg', price: 280, pcs: 1 }]
  },
  {
    name: 'Jowar Flour',
    description: 'Sorghum flour',
    category: 'Atta & Flours',
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c'],
    variation: [{ weight: '500g', price: 50, pcs: 1 }, { weight: '1kg', price: 95, pcs: 1 }]
  },

  // Pulses & Dals (10 products)
  {
    name: 'Toor Dal',
    description: 'Premium quality toor dal',
    category: 'Pulses & Dals',
    images: ['https://images.unsplash.com/photo-1515543904379-b5c6c5155f9b'],
    variation: [{ weight: '500g', price: 75, pcs: 1 }, { weight: '1kg', price: 140, pcs: 1 }]
  },
  {
    name: 'Moong Dal',
    description: 'Yellow moong dal',
    category: 'Pulses & Dals',
    images: ['https://images.unsplash.com/photo-1515543904379-dd67a58c71f1'],
    variation: [{ weight: '500g', price: 70, pcs: 1 }, { weight: '1kg', price: 130, pcs: 1 }]
  },
  {
    name: 'Urad Dal',
    description: 'Black gram dal',
    category: 'Pulses & Dals',
    images: ['https://images.unsplash.com/photo-1515543904379-dd67a58c71f2'],
    variation: [{ weight: '500g', price: 80, pcs: 1 }, { weight: '1kg', price: 150, pcs: 1 }]
  },
  {
    name: 'Chana Dal',
    description: 'Split chickpeas',
    category: 'Pulses & Dals',
    images: ['https://images.unsplash.com/photo-1515543904379-dd67a58c71f3'],
    variation: [{ weight: '500g', price: 60, pcs: 1 }, { weight: '1kg', price: 110, pcs: 1 }]
  },
  {
    name: 'Masoor Dal',
    description: 'Red lentils',
    category: 'Pulses & Dals',
    images: ['https://images.unsplash.com/photo-1515543904379-dd67a58c71f4'],
    variation: [{ weight: '500g', price: 65, pcs: 1 }, { weight: '1kg', price: 120, pcs: 1 }]
  },
  {
    name: 'Rajma',
    description: 'Kidney beans',
    category: 'Pulses & Dals',
    images: ['https://images.unsplash.com/photo-1515543904379-dd67a58c71f5'],
    variation: [{ weight: '500g', price: 85, pcs: 1 }, { weight: '1kg', price: 160, pcs: 1 }]
  },
  {
    name: 'White Peas',
    description: 'Dried white peas',
    category: 'Pulses & Dals',
    images: ['https://images.unsplash.com/photo-1515543904379-dd67a58c71f6'],
    variation: [{ weight: '500g', price: 55, pcs: 1 }, { weight: '1kg', price: 100, pcs: 1 }]
  },
  {
    name: 'Green Moong Whole',
    description: 'Whole green gram',
    category: 'Pulses & Dals',
    images: ['https://images.unsplash.com/photo-1515543904379-dd67a58c71f7'],
    variation: [{ weight: '500g', price: 75, pcs: 1 }, { weight: '1kg', price: 140, pcs: 1 }]
  },
  {
    name: 'Black Chana',
    description: 'Black chickpeas',
    category: 'Pulses & Dals',
    images: ['https://images.unsplash.com/photo-1515543904379-dd67a58c71f8'],
    variation: [{ weight: '500g', price: 70, pcs: 1 }, { weight: '1kg', price: 130, pcs: 1 }]
  },
  {
    name: 'Mixed Dal',
    description: 'Mix of 5 dals',
    category: 'Pulses & Dals',
    images: ['https://images.unsplash.com/photo-1515543904379-dd67a58c71f9'],
    variation: [{ weight: '500g', price: 75, pcs: 1 }, { weight: '1kg', price: 140, pcs: 1 }]
  }
];

// Seed data
async function seedDatabase() {
  try {
    // Clear existing data
    await clearDatabase();

    // Create admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(admin.password, salt);
    await Admin.create({
      ...admin,
      password: hashedPassword
    });
    console.log('Admin seeded');

    // Insert categories
    const savedCategories = await Category.insertMany(categories);
    console.log('Categories seeded');

    // Create a map of category names to their IDs
    const categoryMap = {};
    savedCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // Update products with category IDs
    const productsWithCategoryIds = products.map(product => ({
      ...product,
      category: categoryMap[product.category]
    }));

    // Insert products
    await Product.insertMany(productsWithCategoryIds);
    console.log('Products seeded');

    console.log('Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding process
seedDatabase();