const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true // e.g., 'pcs', 'kg', 'ml'
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
