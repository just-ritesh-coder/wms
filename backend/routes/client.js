const express = require('express');
const Party = require('../models/Party');
const LedgerEntry = require('../models/LedgerEntry');
const Variant = require('../models/Variant');

const router = express.Router();

// Verify Tracking ID
router.get('/auth/:trackingId', async (req, res) => {
  try {
    const party = await Party.findOne({ trackingId: req.params.trackingId });
    if (!party) return res.status(404).json({ error: 'Invalid Tracking ID' });
    res.json({ id: party._id, name: party.name, trackingId: party.trackingId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get Ledger Entries (Dashboard Passbook)
router.get('/track/:trackingId/ledger', async (req, res) => {
  try {
    const party = await Party.findOne({ trackingId: req.params.trackingId });
    if (!party) return res.status(404).json({ error: 'Invalid Tracking ID' });

    const entries = await LedgerEntry.find({ party: party._id })
      .populate({ path: 'variant', populate: { path: 'product' } })
      .populate('createdBy', 'username')
      .sort({ date: 1 });
    
    const grouped = {};
    entries.forEach(entry => {
      const variantId = entry.variant._id.toString();
      if (!grouped[variantId]) {
        grouped[variantId] = {
          variant: entry.variant,
          entries: []
        };
      }
      grouped[variantId].entries.push(entry);
    });

    res.json(Object.values(grouped));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get Global Inventory
router.get('/track/:trackingId/inventory', async (req, res) => {
  try {
    const party = await Party.findOne({ trackingId: req.params.trackingId });
    if (!party) return res.status(404).json({ error: 'Invalid Tracking ID' });

    const variants = await Variant.find().populate('product');
    const inventory = [];

    for (let v of variants) {
      const allEntries = await LedgerEntry.find({ variant: v._id });
      let globalStock = 0;
      let lastRate = 0;
      allEntries.forEach(e => {
        globalStock += e.type === 'IN' ? e.quantity : -e.quantity;
        if (e.rate) lastRate = e.rate;
      });

      inventory.push({
        variant: v,
        currentStock: globalStock,
        totalValue: globalStock * lastRate
      });
    }

    res.json(inventory);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
