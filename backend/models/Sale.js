const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  customerName: {
    type: String,
    default: 'Walk-in Customer'
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
    sellingPrice: {
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
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Due'],
    default: 'Cash'
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Completed'
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  collection: 'sales' // Share the exact collection name
});

module.exports = mongoose.model('Sale', saleSchema);
