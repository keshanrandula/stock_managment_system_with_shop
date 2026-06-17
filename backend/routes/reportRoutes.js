const express = require('express');
const router = express.Router();
const { getDashboardStats, getSalesRevenueTrend, getAnalyticsSummary, getStockLogs } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, authorize('Admin', 'Manager'), getDashboardStats);
router.get('/sales-revenue', protect, authorize('Admin', 'Manager'), getSalesRevenueTrend);
router.get('/analytics-summary', protect, authorize('Admin', 'Manager'), getAnalyticsSummary);
router.get('/stock-logs', protect, authorize('Admin', 'Manager'), getStockLogs);

module.exports = router;
