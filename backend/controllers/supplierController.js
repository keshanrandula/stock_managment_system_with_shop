const Supplier = require('../models/Supplier');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({});
    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private (Admin, Manager)
const createSupplier = async (req, res) => {
  try {
    const { name, contactPerson, email, phone, address } = req.body;

    const supplier = await Supplier.create({
      name,
      contactPerson,
      email,
      phone,
      address
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Admin, Manager)
const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: updatedSupplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin)
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
