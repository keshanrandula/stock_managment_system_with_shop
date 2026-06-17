require('dotenv').config();
const mongoose = require('mongoose');
const Coupon = require('./models/Coupon');
const Product = require('./models/Product');
const Review = require('./models/Review');
const User = require('./models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stock_management');
    console.log(`MongoDB Connected for more seeding: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const seed = async () => {
  await connectDB();

  try {
    // 1. Seed Coupons
    await Coupon.deleteMany(); // Clear existing to prevent duplicates
    const coupons = [
      {
        code: 'WELCOME10',
        discountPercentage: 10,
        isActive: true,
        expirationDate: new Date('2030-12-31')
      },
      {
        code: 'APEX50',
        discountPercentage: 50,
        isActive: true,
        expirationDate: new Date('2030-12-31')
      },
      {
        code: 'BLACKFRIDAY',
        discountPercentage: 30,
        isActive: true,
        expirationDate: new Date('2030-12-31')
      }
    ];
    await Coupon.insertMany(coupons);
    console.log('Seeded coupons successfully!');

    // 2. Seed Reviews
    await Review.deleteMany(); // Clear existing
    
    // Find products
    const zenaudio = await Product.findOne({ sku: 'APX-99-BT' });
    const nova = await Product.findOne({ sku: 'APX-01-TIME' });
    const aviators = await Product.findOne({ sku: 'APX-SHADE-X' });
    
    // Find or create a user for review authoring
    let reviewer = await User.findOne({ email: 'reviewer@apex.com' });
    if (!reviewer) {
      reviewer = await User.create({
        name: 'Samantha Lee',
        email: 'reviewer@apex.com',
        password: 'password123',
        role: 'Customer'
      });
    }

    let reviewer2 = await User.findOne({ email: 'john.smith@apex.com' });
    if (!reviewer2) {
      reviewer2 = await User.create({
        name: 'John Smith',
        email: 'john.smith@apex.com',
        password: 'password123',
        role: 'Customer'
      });
    }

    if (zenaudio) {
      await Review.create([
        {
          product: zenaudio._id,
          user: reviewer._id,
          userName: reviewer.name,
          rating: 5,
          comment: 'Absolutely amazing sound quality and the active noise cancellation blocks everything. Extremely comfortable for long hours!'
        },
        {
          product: zenaudio._id,
          user: reviewer2._id,
          userName: reviewer2.name,
          rating: 4,
          comment: 'Great product and superb build, but the bass is slightly heavy for classical music. Overall, highly recommended.'
        }
      ]);
      console.log('Seeded reviews for ZenAudio X1!');
    }

    if (nova) {
      await Review.create([
        {
          product: nova._id,
          user: reviewer.id,
          userName: reviewer.name,
          rating: 5,
          comment: 'A masterpiece watch. The leather strap is premium and matches any business casual outfit perfectly.'
        }
      ]);
      console.log('Seeded reviews for Nova Classic!');
    }

    if (aviators) {
      await Review.create([
        {
          product: aviators._id,
          user: reviewer2._id,
          userName: reviewer2.name,
          rating: 5,
          comment: 'Perfect polarization. These shades are extremely light and fit perfectly without pinching behind ears.'
        }
      ]);
      console.log('Seeded reviews for Apex Aviators!');
    }

    console.log('Extra seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding extra data:', error);
    process.exit(1);
  }
};

seed();
