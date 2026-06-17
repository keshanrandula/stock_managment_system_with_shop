require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Supplier = require('./models/Supplier');
const StockLog = require('./models/StockLog');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stock_management');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const seed = async () => {
  await connectDB();

  try {
    // 1. Get or create a default Supplier
    let supplier = await Supplier.findOne();
    if (!supplier) {
      supplier = await Supplier.create({
        name: 'Apex Global Logistics',
        contactPerson: 'John Doe',
        email: 'john@apex.com',
        phone: '1234567890',
        address: '123 Supply Chain Ave'
      });
      console.log('Created supplier:', supplier.name);
    } else {
      console.log('Using existing supplier:', supplier.name);
    }

    // 2. Get or create Categories
    const categoriesData = ['Electronics', 'Lifestyle', 'Accessories'];
    const categoriesMap = {};
    for (const catName of categoriesData) {
      let cat = await Category.findOne({ name: { $regex: new RegExp(`^${catName}$`, 'i') } });
      if (!cat) {
        cat = await Category.create({ name: catName });
        console.log('Created category:', cat.name);
      } else {
        console.log('Using existing category:', cat.name);
      }
      categoriesMap[catName] = cat._id;
    }

    // 3. Define target products from user screenshot
    const targetProducts = [
      {
        sku: 'APX-30-20',
        name: 'Chargers',
        description: 'for c pin chargers',
        category: categoriesMap['Electronics'],
        costPrice: 0.02,
        sellingPrice: 0.06,
        quantity: 0, // Out of stock
        imageUrl: '', // Trigger fallback USB trident icon
        supplier: supplier._id
      },
      {
        sku: 'APX-99-BT',
        name: 'ZenAudio X1',
        description: 'High-fidelity Bluetooth 5.2 connectivity with active noise cancellation.',
        category: categoriesMap['Electronics'],
        costPrice: 100.00,
        sellingPrice: 189.00,
        quantity: 15,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
        supplier: supplier._id
      },
      {
        sku: 'APX-01-TIME',
        name: 'Nova Classic',
        description: 'Swiss-movement analog watch with premium sapphire glass and leather strap.',
        category: categoriesMap['Lifestyle'],
        costPrice: 70.00,
        sellingPrice: 120.50,
        quantity: 8,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
        supplier: supplier._id
      },
      {
        sku: 'APX-SHADE-X',
        name: 'Apex Aviators',
        description: 'Polarized lenses with lightweight titanium frame for all-day comfort.',
        category: categoriesMap['Accessories'],
        costPrice: 40.00,
        sellingPrice: 75.00,
        quantity: 12,
        imageUrl: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&q=80',
        supplier: supplier._id
      }
    ];

    // 4. Upsert products
    for (const prodData of targetProducts) {
      let existing = await Product.findOne({ sku: prodData.sku });
      if (existing) {
        console.log(`Product ${prodData.sku} already exists, updating...`);
        // Just update properties
        existing.name = prodData.name;
        existing.description = prodData.description;
        existing.category = prodData.category;
        existing.sellingPrice = prodData.sellingPrice;
        existing.quantity = prodData.quantity;
        existing.imageUrl = prodData.imageUrl;
        await existing.save();
      } else {
        const newProd = await Product.create(prodData);
        console.log(`Created product: ${newProd.name} (${newProd.sku})`);

        // Create stock log
        if (newProd.quantity > 0) {
          await StockLog.create({
            product: newProd._id,
            type: 'Adjustment',
            quantityChanged: newProd.quantity,
            previousQuantity: 0,
            newQuantity: newProd.quantity,
            reason: 'Seeded mockup product',
            performedBy: newProd._id // Use itself since we don't have a user ID here
          });
        }
      }
    }

    console.log('Database seeded successfully with reference products!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seed();
