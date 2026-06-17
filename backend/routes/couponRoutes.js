const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Validate a coupon code
// @route   GET /api/coupons/validate/:code
// @access  Private (Registered users)
router.get('/validate/:code', protect, async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: 'This coupon is inactive' });
    }

    if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'This coupon has expired' });
    }

    res.json({
      success: true,
      message: 'Coupon is valid',
      discountPercentage: coupon.discountPercentage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private (Admin, Manager)
router.get('/', protect, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a coupon
// @route   POST /api/coupons
// @access  Private (Admin, Manager)
router.post('/', protect, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const { code, discountPercentage, expirationDate } = req.body;
    if (!code || discountPercentage === undefined || !expirationDate) {
      return res.status(400).json({ success: false, message: 'Please provide code, discount percentage and expiration date' });
    }

    const uppercaseCode = code.trim().toUpperCase();
    const exists = await Coupon.findOne({ code: uppercaseCode });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: uppercaseCode,
      discountPercentage: Number(discountPercentage),
      expirationDate: new Date(expirationDate)
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private (Admin, Manager)
router.delete('/:id', protect, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
