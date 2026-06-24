const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  contactInfo: {
    type: String
  },
  roleFlag: {
    type: String, // e.g., 'Supplier', 'Receiver', 'Both'
    default: 'Both'
  },
  trackingId: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // A party must be linked to a User for login
  }
}, { timestamps: true });

module.exports = mongoose.model('Party', partySchema);
