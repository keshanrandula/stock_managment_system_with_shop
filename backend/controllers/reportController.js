const Product = require('../models/Product');
const SalesOrder = require('../models/SalesOrder');
const Supplier = require('../models/Supplier');
const StockLog = require('../models/StockLog');
const Category = require('../models/Category');
const PurchaseOrder = require('../models/PurchaseOrder');

// @desc    Get dashboard metrics & cards info
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    // 1. Total products & suppliers counts
    const totalProducts = await Product.countDocuments({});
    const totalSuppliers = await Supplier.countDocuments({});

    // 2. Low stock count and details
    const lowStockProductsRaw = await Product.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    }).populate('supplier', 'name').populate('category', 'name');

    const lowStockProducts = lowStockProductsRaw.map(prod => {
      const p = prod.toObject({ virtuals: true });
      if (p.category && typeof p.category === 'object') {
        p.category = p.category.name;
      }
      return p;
    });

    // 3. Inventory Value (Asset Valuation)
    const valuation = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalCost: { $sum: { $multiply: ['$costPrice', '$quantity'] } },
          totalValue: { $sum: { $multiply: ['$sellingPrice', '$quantity'] } }
        }
      }
    ]);

    const totalCostValue = valuation[0] ? valuation[0].totalCost : 0;
    const totalRetailValue = valuation[0] ? valuation[0].totalValue : 0;

    // 4. Sales metrics
    const salesTotal = await SalesOrder.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);
    const totalSalesRevenue = salesTotal[0] ? salesTotal[0].totalRevenue : 0;

    // 5. Recent sales orders
    const recentSales = await SalesOrder.find({})
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // 6. Recent stock activity log
    const recentActivity = await StockLog.find({})
      .populate('product', 'name sku')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        metrics: {
          totalProducts,
          totalSuppliers,
          lowStockCount: lowStockProducts.length,
          totalCostValue,
          totalRetailValue,
          totalSalesRevenue
        },
        lowStockProducts,
        recentSales,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get sales trend charts data (daily sales for last 7 days)
// @route   GET /api/reports/sales-revenue
// @access  Private
const getSalesRevenueTrend = async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Aggregate sales grouped by date
    const dailySales = await SalesOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          transactions: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Fill in dates with zero value if there were no sales that day
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = dailySales.find(item => item._id === dateStr);
      result.push({
        date: dateStr,
        revenue: match ? match.revenue : 0,
        transactions: match ? match.transactions : 0
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get advanced ERP analytics & stock forecasting predictions
// @route   GET /api/reports/analytics-summary
// @access  Private
const getAnalyticsSummary = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const startOfMonth = new Date();
    startOfMonth.setDate(startOfMonth.getDate() - 30);

    // Helper to calculate total revenue, cogs, profit and count
    const aggregatePeriod = async (startDate) => {
      const result = await SalesOrder.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $unwind: '$items' },
        { $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'prod'
          }
        },
        { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
        { $group: {
            _id: null,
            revenue: { $sum: { $multiply: ['$items.quantity', '$items.sellingPrice'] } },
            cogs: { $sum: { $multiply: ['$items.quantity', { $ifNull: ['$prod.costPrice', '$items.sellingPrice'] }] } },
            orders: { $addToSet: '$_id' }
          }
        }
      ]);

      if (result.length === 0) {
        return { revenue: 0, cogs: 0, profit: 0, count: 0 };
      }

      const revenue = result[0].revenue;
      const cogs = result[0].cogs;
      const profit = revenue - cogs;
      const count = result[0].orders.length;

      return { revenue, cogs, profit, count };
    };

    const daily = await aggregatePeriod(startOfDay);
    const weekly = await aggregatePeriod(startOfWeek);
    const monthly = await aggregatePeriod(startOfMonth);

    // Best-selling products aggregation
    const bestSellers = await SalesOrder.aggregate([
      { $unwind: '$items' },
      { $group: {
          _id: '$items.product',
          quantitySold: { $sum: '$items.quantity' },
          revenueGenerated: { $sum: { $multiply: ['$items.quantity', '$items.sellingPrice'] } }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 },
      { $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'prod'
        }
      },
      { $unwind: '$prod' },
      { $project: {
          _id: 1,
          name: '$prod.name',
          sku: '$prod.sku',
          quantitySold: 1,
          revenueGenerated: 1
        }
      }
    ]);

    // Supplier spend aggregation
    const supplierSpend = await PurchaseOrder.aggregate([
      { $match: { status: 'Received' } },
      { $group: {
          _id: '$supplier',
          totalSpend: { $sum: '$totalAmount' }
        }
      },
      { $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'sup'
        }
      },
      { $unwind: '$sup' },
      { $project: {
          _id: 1,
          name: '$sup.name',
          totalSpend: 1
        }
      }
    ]);

    // Active purchase orders per supplier
    const activePOs = await PurchaseOrder.aggregate([
      { $match: { status: { $in: ['Ordered', 'Draft'] } } },
      { $group: {
          _id: '$supplier',
          activeOrdersCount: { $sum: 1 }
        }
      },
      { $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'sup'
        }
      },
      { $unwind: '$sup' },
      { $project: {
          _id: 1,
          name: '$sup.name',
          activeOrdersCount: 1
        }
      }
    ]);

    // Combined supplier analytics data
    const supplierAnalytics = supplierSpend.map(s => {
      const activeObj = activePOs.find(a => a._id.toString() === s._id.toString());
      return {
        _id: s._id,
        name: s.name,
        totalSpend: s.totalSpend,
        activeOrdersCount: activeObj ? activeObj.activeOrdersCount : 0
      };
    });

    // Handle suppliers that have active POs but 0 spend
    activePOs.forEach(a => {
      const spendObj = supplierAnalytics.find(s => s._id.toString() === a._id.toString());
      if (!spendObj) {
        supplierAnalytics.push({
          _id: a._id,
          name: a.name,
          totalSpend: 0,
          activeOrdersCount: a.activeOrdersCount
        });
      }
    });

    // 30-day depletion prediction mapping
    const sales30Days = await SalesOrder.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
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

    const allProducts = await Product.find({}).populate('category', 'name');
    const depletionPredictions = allProducts.map(prod => {
      const totalSold = salesMap[prod._id.toString()] || 0;
      const rate = totalSold / 30;
      let days = null;
      if (rate > 0) {
        days = Math.ceil(prod.quantity / rate);
      }
      return {
        productId: prod._id,
        sku: prod.sku,
        name: prod.name,
        quantity: prod.quantity,
        category: prod.category?.name || 'Uncategorized',
        dailySalesRate: Number(rate.toFixed(2)),
        daysToDepletion: days
      };
    }).filter(p => p.daysToDepletion !== null && p.daysToDepletion <= 7) // Warn on <= 7 days
      .sort((a, b) => a.daysToDepletion - b.daysToDepletion);

    res.json({
      success: true,
      data: {
        salesSummary: {
          daily,
          weekly,
          monthly
        },
        bestSellers,
        supplierAnalytics,
        depletionPredictions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all stock logs / audit trail
// @route   GET /api/reports/stock-logs
// @access  Private (Admin, Manager)
const getStockLogs = async (req, res) => {
  try {
    const logs = await StockLog.find({})
      .populate('product', 'name sku')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getSalesRevenueTrend,
  getAnalyticsSummary,
  getStockLogs
};

