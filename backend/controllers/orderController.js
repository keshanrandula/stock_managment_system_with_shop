const PurchaseOrder = require('../models/PurchaseOrder');
const SalesOrder = require('../models/SalesOrder');
const Product = require('../models/Product');
const StockLog = require('../models/StockLog');

// ==========================================
// PURCHASE ORDERS (RESTOCKING)
// ==========================================

// @desc    Get all purchase orders
// @route   GET /api/orders/purchases
// @access  Private
const getPurchaseOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.find({})
      .populate('supplier', 'name email')
      .populate('items.product', 'sku name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a purchase order
// @route   POST /api/orders/purchases
// @access  Private (Admin, Manager)
const createPurchaseOrder = async (req, res) => {
  try {
    const { supplier, items } = req.body;

    if (!supplier || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide supplier and items' });
    }

    // Auto-generate PO number: PO-TIMESTAMP
    const poNumber = `PO-${Date.now().toString().slice(-8).toUpperCase()}`;

    let totalAmount = 0;
    const formattedItems = items.map(item => {
      totalAmount += Number(item.quantity) * Number(item.costPrice);
      return {
        product: item.product,
        quantity: Number(item.quantity),
        costPrice: Number(item.costPrice)
      };
    });

    const order = await PurchaseOrder.create({
      poNumber,
      supplier,
      items: formattedItems,
      totalAmount,
      status: 'Draft'
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Receive a purchase order (increases stock)
// @route   PATCH /api/orders/purchases/:id/receive
// @access  Private (Admin, Manager)
const receivePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }

    if (order.status === 'Received') {
      return res.status(400).json({ success: false, message: 'Purchase Order has already been received' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cancelled Purchase Orders cannot be received' });
    }

    // Loop through items and update stock levels
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const previousQuantity = product.quantity;
        const newQuantity = previousQuantity + item.quantity;

        product.quantity = newQuantity;
        await product.save();

        // Create Stock Log
        await StockLog.create({
          product: product._id,
          type: 'Purchase',
          quantityChanged: item.quantity,
          previousQuantity,
          newQuantity,
          reason: `Received Purchase Order: ${order.poNumber}`,
          performedBy: req.user._id
        });
      }
    }

    order.status = 'Received';
    order.receivedDate = Date.now();
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// SALES ORDERS (CHECKOUT / CUSTOMERS)
// ==========================================

// @desc    Get all sales orders
// @route   GET /api/orders/sales
// @access  Private
const getSalesOrders = async (req, res) => {
  try {
    const orders = await SalesOrder.find({})
      .populate({
        path: 'items.product',
        select: 'sku name category sellingPrice',
        populate: {
          path: 'category',
          select: 'name'
        }
      })
      .populate('recordedBy', 'name email')
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map(order => {
      const o = order.toObject({ virtuals: true });
      if (o.items) {
        o.items.forEach(item => {
          if (item.product && item.product.category && typeof item.product.category === 'object') {
            item.product.category = item.product.category.name;
          }
        });
      }
      return o;
    });

    res.json({ success: true, count: formattedOrders.length, data: formattedOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a sales order (decreases stock)
// @route   POST /api/orders/sales
// @access  Private (Admin, Manager, Staff)
const createSalesOrder = async (req, res) => {
  try {
    const { customerName, items, discountAmount, taxAmount, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in the cart' });
    }

    // 1. Verify availability of all stock items before processing
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product with ID ${item.product} not found` });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.name}. Available: ${product.quantity}, Required: ${item.quantity}`
        });
      }
    }

    // Generate Invoice Number: INV-TIMESTAMP
    const invoiceNumber = `INV-${Date.now().toString().slice(-8).toUpperCase()}`;

    let subTotal = 0;
    const formattedItems = [];
    const lowStockAlerts = [];

    // 2. Decrement stock and calculate total
    for (const item of items) {
      const product = await Product.findById(item.product);
      const previousQuantity = product.quantity;
      const newQuantity = previousQuantity - Number(item.quantity);

      product.quantity = newQuantity;
      await product.save();

      subTotal += Number(item.quantity) * product.sellingPrice;

      formattedItems.push({
        product: product._id,
        quantity: Number(item.quantity),
        sellingPrice: product.sellingPrice
      });

      // Write Stock Log
      await StockLog.create({
        product: product._id,
        type: 'Sale',
        quantityChanged: -Number(item.quantity),
        previousQuantity,
        newQuantity,
        reason: `Sold via Invoice: ${invoiceNumber}`,
        performedBy: req.user._id
      });

      // Check low stock threshold
      if (newQuantity <= product.lowStockThreshold) {
        lowStockAlerts.push({
          productId: product._id,
          sku: product.sku,
          name: product.name,
          quantity: newQuantity,
          lowStockThreshold: product.lowStockThreshold
        });
      }
    }

    const totalAmount = subTotal + Number(taxAmount || 0) - Number(discountAmount || 0);

    const isCustomer = req.user && req.user.role.toLowerCase() === 'customer';
    const sale = await SalesOrder.create({
      invoiceNumber,
      customerName: isCustomer ? (req.user.name || customerName) : (customerName || 'Walk-in Customer'),
      items: formattedItems,
      totalAmount: Math.max(0, totalAmount),
      taxAmount: isCustomer ? 0 : (taxAmount || 0),
      discountAmount: isCustomer ? 0 : (discountAmount || 0),
      paymentMethod: paymentMethod || 'Cash',
      status: (isCustomer && paymentMethod !== 'Card') ? 'Pending' : 'Completed',
      recordedBy: req.user._id
    });

    res.status(201).json({ success: true, data: sale, lowStockAlerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged-in customer's own sales orders
// @route   GET /api/orders/my-orders
// @access  Private (Customer, Staff, Manager, Admin)
const getCustomerOrders = async (req, res) => {
  try {
    const orders = await SalesOrder.find({ recordedBy: req.user._id })
      .populate({
        path: 'items.product',
        select: 'sku name category sellingPrice',
        populate: {
          path: 'category',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map(order => {
      const o = order.toObject({ virtuals: true });
      if (o.items) {
        o.items.forEach(item => {
          if (item.product && item.product.category && typeof item.product.category === 'object') {
            item.product.category = item.product.category.name;
          }
        });
      }
      return o;
    });

    res.json({ success: true, count: formattedOrders.length, data: formattedOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update sales order status (Pending -> Completed or Cancelled)
// @route   PUT /api/orders/sales/:id/status
// @access  Private (Admin, Manager)
const updateSalesOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update. Must be Completed or Cancelled.' });
    }

    const order = await SalesOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cancelled orders cannot be modified' });
    }

    if (order.status === status) {
      return res.status(400).json({ success: false, message: `Order status is already ${status}` });
    }

    // If transitioning to Cancelled, restore stock!
    if (status === 'Cancelled') {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const previousQuantity = product.quantity;
          const newQuantity = previousQuantity + item.quantity;

          product.quantity = newQuantity;
          await product.save();

          // Write Stock Log as Return
          await StockLog.create({
            product: product._id,
            type: 'Return',
            quantityChanged: item.quantity,
            previousQuantity,
            newQuantity,
            reason: `Order Cancelled: ${order.invoiceNumber}`,
            performedBy: req.user._id
          });
        }
      }
    }

    order.status = status;
    order.recordedBy = req.user._id;
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
  getSalesOrders,
  createSalesOrder,
  getCustomerOrders,
  updateSalesOrderStatus
};

