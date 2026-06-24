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

// --- Global Search ---
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json({ parties: [], products: [], variants: [] });
    
    const regex = new RegExp(q, 'i');
    const parties = await Party.find({ name: regex }).limit(5);
    const products = await Product.find({ name: regex }).limit(5);
    const variants = await Variant.find({ name: regex }).populate('product').limit(5);
    
    res.json({ parties, products, variants });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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

router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    await Variant.deleteMany({ product: req.params.id });
    res.json({ message: 'Product and variants deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/variants/:id', async (req, res) => {
  try {
    const variant = await Variant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(variant);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/variants/:id', async (req, res) => {
  try {
    await Variant.findByIdAndDelete(req.params.id);
    // Optionally delete ledger entries or just leave them
    res.json({ message: 'Variant deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Parties ---
router.post('/parties', async (req, res) => {
  try {
    const { name, contactInfo, roleFlag, username, password } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role: 'Party' });
    await user.save();

    const generateId = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    const trackingId = 'PTY-' + generateId();

    const party = new Party({ name, contactInfo, roleFlag, trackingId, user: user._id });
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
const recalculateBalances = async (variantId, partyId) => {
  const allEntries = await LedgerEntry.find({ variant: variantId, party: partyId }).sort({ date: 1, createdAt: 1 });
  let rolling = 0;
  for (let entry of allEntries) {
    rolling = entry.type === 'IN' ? rolling + entry.quantity : rolling - entry.quantity;
    if (entry.balanceAfter !== rolling) {
      entry.balanceAfter = rolling;
      await entry.save();
    }
  }
};

router.post('/ledger', async (req, res) => {
  try {
    const { date, variant, party, type, quantity, rate, notes } = req.body;
    
    const ledgerEntry = new LedgerEntry({
      date, variant, party, type, quantity: Number(quantity), balanceAfter: 0, rate, notes,
      createdBy: req.user.id
    });
    
    await ledgerEntry.save();
    await recalculateBalances(variant, party);

    res.status(201).json(ledgerEntry);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/ledger/:id', async (req, res) => {
  try {
    const { quantity, type, notes } = req.body;
    const entry = await LedgerEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    
    if (quantity !== undefined) entry.quantity = Number(quantity);
    if (type !== undefined) entry.type = type;
    if (notes !== undefined) entry.notes = notes;
    
    await entry.save();
    await recalculateBalances(entry.variant, entry.party);
    
    res.json(entry);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/ledger/:id/reverse', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason is required for reversal' });

    const original = await LedgerEntry.findById(req.params.id);
    if (!original) return res.status(404).json({ error: 'Entry not found' });
    if (original.isReversed) return res.status(400).json({ error: 'Entry is already reversed' });

    original.isReversed = true;
    await original.save();

    const reverseType = original.type === 'IN' ? 'OUT' : 'IN';
    
    const reversalEntry = new LedgerEntry({
      date: new Date(), 
      variant: original.variant,
      party: original.party,
      type: reverseType,
      quantity: original.quantity,
      rate: original.rate,
      balanceAfter: 0,
      notes: 'REVERSAL: ' + reason,
      reversalOf: original._id,
      createdBy: req.user.id
    });

    await reversalEntry.save();
    await recalculateBalances(original.variant, original.party);

    res.status(201).json(reversalEntry);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/ledger/:id', async (req, res) => {
  try {
    const entry = await LedgerEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    
    const variantId = entry.variant;
    const partyId = entry.party;
    
    await LedgerEntry.findByIdAndDelete(req.params.id);
    await recalculateBalances(variantId, partyId);
    
    res.json({ message: 'Entry deleted successfully' });
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
    
    const variants = await Variant.find().populate('product');
    const alerts = [];
    let totalStockValue = 0;

    for (let v of variants) {
      const allEntries = await LedgerEntry.find({ variant: v._id });
      let globalStock = 0;
      let lastRate = 0;
      allEntries.forEach(e => {
        globalStock += e.type === 'IN' ? e.quantity : -e.quantity;
        if (e.rate) lastRate = e.rate;
      });

      const threshold = v.reorderLevel !== undefined ? v.reorderLevel : 10;
      if (globalStock <= threshold) {
        alerts.push({ variant: v, balance: globalStock });
      }
      totalStockValue += globalStock * lastRate;
    }

    res.json({
      stats: { productCount, partyCount, totalStockValue },
      alerts,
      recentActivity
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/inventory', async (req, res) => {
  try {
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

router.post('/inventory/adjust', async (req, res) => {
  try {
    const { variantId, currentStock, desiredStock } = req.body;
    
    const diff = Number(desiredStock) - Number(currentStock);
    if (diff === 0) return res.status(200).json({ message: 'No adjustment needed' });

    let party = await Party.findOne({ name: 'Internal Adjustment' });
    if (!party) {
       const user = new User({ username: 'internal_adjustment', password: 'no_login', role: 'Party' });
       await user.save();
       party = new Party({ name: 'Internal Adjustment', roleFlag: 'Both', user: user._id });
       await party.save();
    }

    const ledgerEntry = new LedgerEntry({
      date: new Date(),
      variant: variantId,
      party: party._id,
      type: diff > 0 ? 'IN' : 'OUT',
      quantity: Math.abs(diff),
      balanceAfter: 0,
      rate: 0,
      notes: 'Stock Adjustment',
      createdBy: req.user.id
    });
    
    await ledgerEntry.save();
    await recalculateBalances(variantId, party._id);

    res.status(201).json(ledgerEntry);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/ledger/bulk', async (req, res) => {
  try {
    const entries = req.body;
    let importedCount = 0;

    const uniquePairs = new Set();

    for (let row of entries) {
      if (!row.partyName || !row.productName || !row.variantName || !row.type || !row.quantity) {
        continue; // Skip invalid rows
      }

      // 1. Find or create Party
      let party = await Party.findOne({ name: new RegExp('^' + row.partyName.trim() + '$', 'i') });
      if (!party) {
        const hashedPassword = await bcrypt.hash('party123', 10);
        let username = row.partyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        let uniqueUsername = username;
        let suffix = 1;
        while (await User.findOne({ username: uniqueUsername })) {
          uniqueUsername = username + suffix;
          suffix++;
        }
        
        const user = new User({ username: uniqueUsername, password: hashedPassword, role: 'Party' });
        await user.save();

        party = new Party({ name: row.partyName.trim(), roleFlag: 'Both', user: user._id });
        await party.save();
      }

      // 2. Find or create Product
      let product = await Product.findOne({ name: new RegExp('^' + row.productName.trim() + '$', 'i') });
      if (!product) {
        product = new Product({ name: row.productName.trim(), unit: 'pcs' });
        await product.save();
      }

      // 3. Find or create Variant
      let variant = await Variant.findOne({ name: new RegExp('^' + row.variantName.trim() + '$', 'i'), product: product._id });
      if (!variant) {
        variant = new Variant({ name: row.variantName.trim(), product: product._id });
        await variant.save();
      }

      // 4. Create Ledger Entry
      const entryDate = row.date ? new Date(row.date) : new Date();
      const ledgerEntry = new LedgerEntry({
        date: entryDate,
        variant: variant._id,
        party: party._id,
        type: row.type.toUpperCase() === 'IN' ? 'IN' : 'OUT',
        quantity: Number(row.quantity),
        rate: Number(row.rate || 0),
        notes: row.notes || 'Imported from Excel',
        balanceAfter: 0,
        createdBy: req.user.id
      });
      await ledgerEntry.save();
      
      uniquePairs.add(`${variant._id}_${party._id}`);
      importedCount++;
    }

    for(let pair of uniquePairs) {
       const [vid, pid] = pair.split('_');
       await recalculateBalances(vid, pid);
    }

    res.json({ success: true, imported: importedCount });
  } catch (err) { 
    console.error("BULK IMPORT ERROR:", err);
    res.status(500).json({ error: err.message }); 
  }
});

router.get('/reports/financial-year', async (req, res) => {
  try {
    const year = parseInt(req.query.year);
    if (!year) return res.status(400).json({ error: 'Year is required (e.g. 2023 for 2023-2024)' });

    const startDate = new Date(`${year}-04-01T00:00:00.000Z`);
    const endDate = new Date(`${year + 1}-03-31T23:59:59.999Z`);

    const variants = await Variant.find().populate('product');
    const reportData = [];

    for (let v of variants) {
      const allEntries = await LedgerEntry.find({ variant: v._id, isReversed: { $ne: true } }).sort({ date: 1, createdAt: 1 });
      
      let openingBalance = 0;
      let totalIn = 0;
      let totalOut = 0;
      let lastRate = 0;

      allEntries.forEach(e => {
        if (e.date < startDate) {
          openingBalance += e.type === 'IN' ? e.quantity : -e.quantity;
        } else if (e.date >= startDate && e.date <= endDate) {
          if (e.type === 'IN') totalIn += e.quantity;
          if (e.type === 'OUT') totalOut += e.quantity;
        }
        if (e.rate) lastRate = e.rate;
      });

      const closingBalance = openingBalance + totalIn - totalOut;

      if (openingBalance > 0 || totalIn > 0 || totalOut > 0 || closingBalance > 0) {
        reportData.push({
          variant: v,
          openingBalance,
          totalIn,
          totalOut,
          closingBalance,
          totalValue: closingBalance * lastRate
        });
      }
    }

    res.json(reportData);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

module.exports = router;
