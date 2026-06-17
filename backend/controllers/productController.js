const mongoose = require('mongoose');
const Product = require('../models/Product');
const StockLog = require('../models/StockLog');
const Category = require('../models/Category');
const SalesOrder = require('../models/SalesOrder');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const { search, category, supplier } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      // Find category with matching name
      const categoryObj = await Category.findOne({ name: { $regex: new RegExp(`^${category.trim()}$`, 'i') } });
      if (categoryObj) {
        query.category = categoryObj._id;
      } else {
        // If no category matches, return empty result
        return res.json({ success: true, count: 0, data: [] });
      }
    }

    if (supplier) {
      query.supplier = supplier;
    }

    const products = await Product.find(query)
      .populate('supplier', 'name email')
      .populate('category', 'name');

    // Aggregate 30-day sales for depletion calculation
    const startOf30Days = new Date();
    startOf30Days.setDate(startOf30Days.getDate() - 30);

    const sales30Days = await SalesOrder.aggregate([
      { $match: { createdAt: { $gte: startOf30Days } } },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.product',
          totalQty: { $sum: '$items.quantity' }
        }
      }
    ]);

    const salesMap = {};
    sales30Days.forEach(s => {
      salesMap[s._id.toString()] = s.totalQty;
    });

    // Format output to keep category as string for frontend compatibility
    const formattedProducts = products.map(prod => {
      const p = prod.toObject({ virtuals: true });
      if (p.category && typeof p.category === 'object') {
        p.category = p.category.name;
      }

      // Calculate depletion prediction
      const totalSold = salesMap[prod._id.toString()] || 0;
      const rate = totalSold / 30;
      let days = null;
      if (rate > 0) {
        days = Math.ceil(prod.quantity / rate);
      }

      p.dailySalesRate = Number(rate.toFixed(2));
      p.daysToDepletion = days;

      return p;
    });

    res.json({ success: true, count: formattedProducts.length, data: formattedProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin, Manager)
const createProduct = async (req, res) => {
  try {
    const { sku, name, description, category, costPrice, sellingPrice, quantity, lowStockThreshold, supplier, imageUrl } = req.body;

    const skuExists = await Product.findOne({ sku });
    if (skuExists) {
      return res.status(400).json({ success: false, message: 'Product SKU already exists' });
    }

    // Resolve or create category by string name
    let categoryId;
    if (category) {
      let categoryObj = await Category.findOne({ name: { $regex: new RegExp(`^${category.trim()}$`, 'i') } });
      if (!categoryObj) {
        categoryObj = await Category.create({ name: category.trim() });
      }
      categoryId = categoryObj._id;
    } else {
      return res.status(400).json({ success: false, message: 'Please provide a category' });
    }

    const product = await Product.create({
      sku,
      name,
      description,
      category: categoryId,
      costPrice,
      sellingPrice,
      quantity: quantity || 0,
      lowStockThreshold: lowStockThreshold || 10,
      supplier,
      imageUrl: imageUrl || ''
    });

    // Write initial stock log if quantity is greater than 0
    if (product.quantity > 0) {
      await StockLog.create({
        product: product._id,
        type: 'Adjustment',
        quantityChanged: product.quantity,
        previousQuantity: 0,
        newQuantity: product.quantity,
        reason: 'Initial stock setup',
        performedBy: req.user._id
      });
    }

    // Populate and format response
    const populatedProduct = await Product.findById(product._id)
      .populate('supplier', 'name email')
      .populate('category', 'name');

    const formattedProduct = populatedProduct.toObject({ virtuals: true });
    if (formattedProduct.category && typeof formattedProduct.category === 'object') {
      formattedProduct.category = formattedProduct.category.name;
    }

    res.status(201).json({ success: true, data: formattedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin, Manager)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let updateData = { ...req.body };
    if (updateData.category && typeof updateData.category === 'string') {
      let categoryObj = await Category.findOne({ name: { $regex: new RegExp(`^${updateData.category.trim()}$`, 'i') } });
      if (!categoryObj) {
        categoryObj = await Category.create({ name: updateData.category.trim() });
      }
      updateData.category = categoryObj._id;
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('supplier', 'name email').populate('category', 'name');

    const formattedProduct = updatedProduct.toObject({ virtuals: true });
    if (formattedProduct.category && typeof formattedProduct.category === 'object') {
      formattedProduct.category = formattedProduct.category.name;
    }

    res.json({ success: true, data: formattedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    // Delete associated stock logs
    await StockLog.deleteMany({ product: req.params.id });

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Adjust product stock manually
// @route   PATCH /api/products/:id/adjust
// @access  Private (Admin, Manager, Staff)
const adjustProductStock = async (req, res) => {
  try {
    const { quantityChanged, reason } = req.body;
    if (quantityChanged === undefined || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide quantityChanged and reason' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousQuantity = product.quantity;
    const newQuantity = previousQuantity + Number(quantityChanged);

    if (newQuantity < 0) {
      return res.status(400).json({ success: false, message: 'Stock quantity cannot drop below 0' });
    }

    product.quantity = newQuantity;
    await product.save();

    // Log the change
    const log = await StockLog.create({
      product: product._id,
      type: 'Adjustment',
      quantityChanged: Number(quantityChanged),
      previousQuantity,
      newQuantity,
      reason,
      performedBy: req.user._id
    });

    // Populate and format response
    const populatedProduct = await Product.findById(product._id)
      .populate('supplier', 'name email')
      .populate('category', 'name');

    const formattedProduct = populatedProduct.toObject({ virtuals: true });
    if (formattedProduct.category && typeof formattedProduct.category === 'object') {
      formattedProduct.category = formattedProduct.category.name;
    }

    const lowStockAlert = formattedProduct.quantity <= formattedProduct.lowStockThreshold;

    res.json({ 
      success: true, 
      data: formattedProduct, 
      log,
      lowStockAlert,
      message: lowStockAlert ? `Warning: Product ${formattedProduct.name} is now low in stock (${formattedProduct.quantity} units remaining)` : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get product stock logs
// @route   GET /api/products/:id/logs
// @access  Private
const getProductLogs = async (req, res) => {
  try {
    const logs = await StockLog.find({ product: req.params.id })
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all low stock products
// @route   GET /api/products/alerts/low-stock
// @access  Private
const getLowStockAlerts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    }).populate('supplier', 'name email').populate('category', 'name');

    // Aggregate 30-day sales for depletion calculation
    const startOf30Days = new Date();
    startOf30Days.setDate(startOf30Days.getDate() - 30);

    const sales30Days = await SalesOrder.aggregate([
      { $match: { createdAt: { $gte: startOf30Days } } },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.product',
          totalQty: { $sum: '$items.quantity' }
        }
      }
    ]);

    const salesMap = {};
    sales30Days.forEach(s => {
      salesMap[s._id.toString()] = s.totalQty;
    });

    // Format output to keep category as string for frontend compatibility
    const formattedProducts = products.map(prod => {
      const p = prod.toObject({ virtuals: true });
      if (p.category && typeof p.category === 'object') {
        p.category = p.category.name;
      }

      // Calculate depletion prediction
      const totalSold = salesMap[prod._id.toString()] || 0;
      const rate = totalSold / 30;
      let days = null;
      if (rate > 0) {
        days = Math.ceil(prod.quantity / rate);
      }

      p.dailySalesRate = Number(rate.toFixed(2));
      p.daysToDepletion = days;

      return p;
    });

    res.json({ success: true, count: formattedProducts.length, data: formattedProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const Review = require('../models/Review');

// @desc    Get all reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide rating and comment' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const alreadyReviewed = await Review.findOne({ product: req.params.id, user: req.user._id });
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      product: req.params.id,
      user: req.user._id,
      userName: req.user.name,
      rating: Number(rating),
      comment
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get related products (same category)
// @route   GET /api/products/:id/related
// @access  Public
const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    }).limit(4);

    res.json({ success: true, count: related.length, data: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustProductStock,
  getProductLogs,
  getLowStockAlerts,
  getProductReviews,
  createProductReview,
  getRelatedProducts
};
