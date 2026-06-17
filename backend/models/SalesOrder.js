const mongoose = require('mongoose');
const Sale = require('./Sale');

// Reuses the Sale schema to share the 'sales' collection for backwards compatibility
module.exports = mongoose.models.SalesOrder || mongoose.model('SalesOrder', Sale.schema, 'sales');
