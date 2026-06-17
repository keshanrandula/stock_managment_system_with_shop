const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only (jpg, jpeg, png, webp)!'));
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

// File upload route
router.post('/upload', protect, authorize('Admin', 'Manager'), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload an image file' });
  }
  
  // Construct the absolute URL
  const host = req.get('host');
  const protocol = req.protocol;
  const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  
  res.json({
    success: true,
    message: 'Image uploaded successfully',
    imageUrl
  });
});


router.route('/')
  .get(protect, getProducts)
  .post(protect, authorize('Admin', 'Manager'), createProduct);

router.get('/alerts/low-stock', protect, authorize('Admin', 'Manager'), getLowStockAlerts);

router.route('/:id')
  .put(protect, authorize('Admin', 'Manager'), updateProduct)
  .delete(protect, authorize('Admin'), deleteProduct);

router.patch('/:id/adjust', protect, authorize('Admin', 'Manager'), adjustProductStock);
router.get('/:id/logs', protect, authorize('Admin', 'Manager'), getProductLogs);

router.route('/:id/reviews')
  .get(protect, getProductReviews)
  .post(protect, createProductReview);

router.get('/:id/related', protect, getRelatedProducts);

module.exports = router;
