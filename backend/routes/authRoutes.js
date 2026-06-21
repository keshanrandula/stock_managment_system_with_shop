const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  getUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getUserWishlist,
  toggleWishlist
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dest = process.env.VERCEL ? '/tmp' : 'uploads/';
    cb(null, dest);
  },
  filename(req, file, cb) {
    cb(
      null,
      `avatar-${Date.now()}${path.extname(file.originalname)}`
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

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload an image file' });
  }
  const host = req.get('host');
  const protocol = req.protocol;
  const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    imageUrl
  });
});

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/wishlist', protect, getUserWishlist);
router.post('/wishlist/toggle', protect, toggleWishlist);

// Admin-only User Administration Panel routes
router.get('/users', protect, authorize('Admin'), getUsers);
router.put('/users/:id/role', protect, authorize('Admin'), updateUserRole);
router.patch('/users/:id/status', protect, authorize('Admin'), toggleUserStatus);
router.delete('/users/:id', protect, authorize('Admin'), deleteUser);

module.exports = router;
