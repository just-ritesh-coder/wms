const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true // e.g., 'Orange', 'Mango'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  reorderLevel: {
    type: Number,
    default: 10
  }
}, { timestamps: true });

module.exports = mongoose.model('Variant', variantSchema);
