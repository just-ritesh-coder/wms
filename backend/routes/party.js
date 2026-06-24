const express = require('express');
const { auth } = require('../middleware/auth');
const LedgerEntry = require('../models/LedgerEntry');
const Product = require('../models/Product');
const Variant = require('../models/Variant');

const router = express.Router();

router.use(auth);

router.get('/products', async (req, res) => {
  try {
    if (req.user.role !== 'Party') return res.status(403).json({ error: 'Access denied' });
    const products = await Product.find().lean();
    for (let p of products) {
      p.variants = await Variant.find({ product: p._id });
    }
    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Party can only view their own ledger
router.get('/ledger', async (req, res) => {
  try {
    if (req.user.role !== 'Party') return res.status(403).json({ error: 'Access denied' });
    
    const entries = await LedgerEntry.find({ party: req.user.partyId })
      .populate({ path: 'variant', populate: { path: 'product' } })
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

router.get('/inventory', async (req, res) => {
  try {
    if (req.user.role !== 'Party') return res.status(403).json({ error: 'Access denied' });
    
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
