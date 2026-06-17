const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Ordered', 'Received', 'Cancelled'],
    default: 'Draft'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  receivedDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
