const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey123_change_this_in_production', {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, avatarUrl } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Auto-promote first user in database to Admin
    const userCount = await User.countDocuments({});
    let assignedRole = 'Customer';
    
    if (userCount === 0) {
      assignedRole = 'Admin';
    } else {
      // Check if requester has admin role to specify custom roles
      let isAdmin = false;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123_change_this_in_production');
          const requester = await User.findById(decoded.id);
          if (requester && requester.role.toLowerCase() === 'admin') {
            isAdmin = true;
          }
        } catch (err) {
          // Token invalid or verification failed
        }
      }

      if (isAdmin) {
        assignedRole = role || 'Customer';
      } else {
        assignedRole = 'Customer';
      }
    }

    if (assignedRole.toLowerCase() === 'admin') assignedRole = 'Admin';
    if (assignedRole.toLowerCase() === 'staff') assignedRole = 'Staff';
    if (assignedRole.toLowerCase() === 'manager') assignedRole = 'Manager';
    if (assignedRole.toLowerCase() === 'customer') assignedRole = 'Customer';

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      avatarUrl: avatarUrl || ''
    });

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Your account has been deactivated' });
      }

      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private (Admin only)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/auth/users/:id/role
// @access  Private (Admin only)
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ success: false, message: 'Please provide role' });
    }

    let normalizedRole = role;
    if (role.toLowerCase() === 'admin') normalizedRole = 'Admin';
    if (role.toLowerCase() === 'staff') normalizedRole = 'Staff';
    if (role.toLowerCase() === 'manager') normalizedRole = 'Manager';
    if (role.toLowerCase() === 'customer') normalizedRole = 'Customer';

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: normalizedRole },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle user status (Active / Inactive deactivation)
// @route   PATCH /api/auth/users/:id/status
// @access  Private (Admin only)
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deactivating own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User status changed to ${user.isActive ? 'Active' : 'Inactive'}`,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/auth/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user wishlist
// @route   GET /api/auth/wishlist
// @access  Private
const getUserWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, count: user.wishlist.length, data: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle wishlist item (add or remove)
// @route   POST /api/auth/wishlist/toggle
// @access  Private
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Please provide productId' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const index = user.wishlist.indexOf(productId);
    let added = false;
    if (index === -1) {
      user.wishlist.push(productId);
      added = true;
    } else {
      user.wishlist.splice(index, 1);
    }

    await user.save();
    res.json({ 
      success: true, 
      message: added ? 'Added to wishlist' : 'Removed from wishlist', 
      wishlist: user.wishlist,
      added
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getUserWishlist,
  toggleWishlist
};
