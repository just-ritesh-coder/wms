const express = require('express');
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Party = require('../models/Party');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const LedgerEntry = require('../models/LedgerEntry');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.use(adminAuth);

// --- Products & Variants ---
router.post('/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().lean();
    for (let p of products) {
      p.variants = await Variant.find({ product: p._id });
    }
    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/products/:id/variants', async (req, res) => {
  try {
    const variant = new Variant({ ...req.body, product: req.params.id });
    await variant.save();
    res.status(201).json(variant);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Parties ---
router.post('/parties', async (req, res) => {
  try {
    const { name, contactInfo, roleFlag, username, password } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role: 'Party' });
    await user.save();

    const party = new Party({ name, contactInfo, roleFlag, user: user._id });
    await party.save();

    res.status(201).json(party);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/parties', async (req, res) => {
  try {
    const parties = await Party.find().populate('user', 'username');
    res.json(parties);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Ledger Entries ---
router.post('/ledger', async (req, res) => {
  try {
    const { date, variant, party, type, quantity, rate, notes } = req.body;
    
    const matchCond = { variant, date: { $lte: new Date(date) } };
    const prevEntries = await LedgerEntry.find(matchCond);
    let currentBalance = 0;
    prevEntries.forEach(entry => {
      if (entry.type === 'IN') currentBalance += entry.quantity;
      else currentBalance -= entry.quantity;
    });

    const qty = Number(quantity);
    const balanceAfter = type === 'IN' ? currentBalance + qty : currentBalance - qty;

    const ledgerEntry = new LedgerEntry({
      date, variant, party, type, quantity: qty, balanceAfter, rate, notes,
      createdBy: req.user.id
    });
    
    await ledgerEntry.save();
    
    const subsequentEntries = await LedgerEntry.find({ variant, date: { $gt: new Date(date) } }).sort({ date: 1 });
    let rollingBalance = balanceAfter;
    for (let entry of subsequentEntries) {
      rollingBalance = entry.type === 'IN' ? rollingBalance + entry.quantity : rollingBalance - entry.quantity;
      entry.balanceAfter = rollingBalance;
      await entry.save();
    }

    res.status(201).json(ledgerEntry);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/parties/:id/ledger', async (req, res) => {
  try {
    const entries = await LedgerEntry.find({ party: req.params.id })
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

router.get('/dashboard', async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const partyCount = await Party.countDocuments();
    const recentActivity = await LedgerEntry.find()
      .populate({ path: 'variant', populate: { path: 'product' } })
      .populate('party')
      .sort({ createdAt: -1 })
      .limit(10);
    
    const lowStockThreshold = 10;
    const variants = await Variant.find().populate('product');
    const alerts = [];
    let totalStockValue = 0;

    for (let v of variants) {
      const latestEntry = await LedgerEntry.findOne({ variant: v._id }).sort({ date: -1, createdAt: -1 });
      if (latestEntry) {
        if (latestEntry.balanceAfter < lowStockThreshold) {
          alerts.push({ variant: v, balance: latestEntry.balanceAfter });
        }
        totalStockValue += latestEntry.balanceAfter * (latestEntry.rate || 0);
      }
    }

    res.json({
      stats: { productCount, partyCount, totalStockValue },
      alerts,
      recentActivity
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
