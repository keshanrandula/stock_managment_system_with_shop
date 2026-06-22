const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI || 'mongodb://localhost:27017/stock_management';
    // Clean up any accidental leading/trailing quotes or whitespace
    uri = uri.replace(/^['"]|['"]$/g, '').trim();

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // Timeout fast if connection fails
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    let maskedUri = (process.env.MONGO_URI || '').replace(/:([^@]+)@/, ':****@');
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error(`Attempted URI (masked): ${maskedUri}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
