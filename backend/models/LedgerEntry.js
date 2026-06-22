const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Variant',
    required: true
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  type: {
    type: String,
    enum: ['IN', 'OUT'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true // Calculated server-side on creation
  },
  rate: {
    type: Number
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Admin who created the entry
  }
}, { timestamps: true });

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
