const express = require('express');
const router = express.Router();
const {
  getPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
  getSalesOrders,
  createSalesOrder,
  getCustomerOrders,
  updateSalesOrderStatus
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Purchase Orders (Restocking)
router.route('/purchases')
  .get(protect, getPurchaseOrders)
  .post(protect, authorize('Admin', 'Manager'), createPurchaseOrder);

router.patch('/purchases/:id/receive', protect, authorize('Admin', 'Manager'), receivePurchaseOrder);

// Sales Orders (POS Transactions & Customer Portal)
router.get('/my-orders', protect, getCustomerOrders);

router.route('/sales')
  .get(protect, getSalesOrders)
  .post(protect, createSalesOrder); // Staff and managers can sell

router.put('/sales/:id/status', protect, authorize('Admin', 'Manager'), updateSalesOrderStatus);

module.exports = router;
