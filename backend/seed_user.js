require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stock_management');
    console.log('MongoDB Connected for user seeding');

    let admin = await User.findOne({ email: 'admin@admin.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Admin User',
        email: 'admin@admin.com',
        password: 'password123',
        role: 'Admin'
      });
      console.log('Admin user created:', admin.email);
    } else {
      console.log('Admin user already exists:', admin.email);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding user:', error);
    process.exit(1);
  }
};

seedUser();
