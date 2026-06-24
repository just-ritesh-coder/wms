const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const path = require('path');
const User = require('./models/User');
const Party = require('./models/Party');
const Product = require('./models/Product');
const Variant = require('./models/Variant');
const LedgerEntry = require('./models/LedgerEntry');

const seedDB = async () => {
  try {
    await User.deleteMany({});
    await Party.deleteMany({});
    await Product.deleteMany({});
    await Variant.deleteMany({});
    await LedgerEntry.deleteMany({});

    const adminHash = await bcrypt.hash('admin123', 10);
    const adminUser = new User({ username: 'admin', password: adminHash, role: 'Admin' });
    await adminUser.save();

    const party1Hash = await bcrypt.hash('party123', 10);
    const userP1 = new User({ username: 'shreeji_overseas', password: party1Hash, role: 'Party' });
    await userP1.save();
    
    const party2Hash = await bcrypt.hash('party123', 10);
    const userP2 = new User({ username: 'sharma_distributors', password: party2Hash, role: 'Party' });
    await userP2.save();

    const generateId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

    const party1 = new Party({ name: 'Shreeji Overseas', contactInfo: 'Mumbai', roleFlag: 'Both', trackingId: 'PTY-' + generateId(), user: userP1._id });
    await party1.save();

    const party2 = new Party({ name: 'Sharma Distributors', contactInfo: 'Delhi', roleFlag: 'Receiver', trackingId: 'PTY-' + generateId(), user: userP2._id });
    await party2.save();

    // Read Excel Data
    const workbook = xlsx.readFile(path.join(__dirname, '../Shreeji Overseas Stock.xlsx'), { cellStyles: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const range = xlsx.utils.decode_range(worksheet['!ref']);
    let products = [];
    let currentProduct = null;

    for(let R = range.s.r; R <= range.e.r; ++R) {
      // Skip header row
      if (R === 0) continue;

      const cellB_ref = xlsx.utils.encode_cell({c: 1, r: R});
      const cellC_ref = xlsx.utils.encode_cell({c: 2, r: R});
      
      const cellB = worksheet[cellB_ref];
      const cellC = worksheet[cellC_ref];
      
      if (!cellB || !cellB.v) continue;
      
      let name = String(cellB.v).trim();
      const stock = cellC && typeof cellC.v === 'number' ? cellC.v : 0;
      
      // Check if it's highlighted yellow (product)
      const isYellow = cellB.s && cellB.s.fgColor && (cellB.s.fgColor.rgb === 'FFC000' || cellB.s.fgColor.theme === 7);
      
      // Clean up specific requested names
      if (isYellow) {
        name = name.replace(/\(old manish\)/i, '').trim();
        currentProduct = { name: name, unit: 'pcs', variants: [] };
        // If a product also has stock on the same line, add it as 'Original' variant
        if (stock > 0) {
          currentProduct.variants.push({ name: 'Original', stock: stock });
        }
        products.push(currentProduct);
      } else {
        if (currentProduct) {
          currentProduct.variants.push({ name: name, stock: stock });
        }
      }
    }

    const entries = [];
    
    for (const pData of products) {
      if (pData.name === 'undefined' && pData.variants.length === 0) continue;

      // Consolidate duplicate products
      let product = await Product.findOne({ name: pData.name });
      if (!product) {
        product = new Product({ name: pData.name, unit: pData.unit });
        await product.save();
      }

      for (const vData of pData.variants) {
        // Consolidate duplicate variants
        let variant = await Variant.findOne({ name: vData.name, product: product._id });
        if (!variant) {
          variant = new Variant({ name: vData.name, product: product._id });
          await variant.save();
        }
        
        if (vData.stock > 0) {
          const entry = new LedgerEntry({
              date: new Date('2026-06-08T00:00:00Z'),
              variant: variant._id,
              party: party1._id, // Adding stock under Shreeji Overseas
              type: 'IN',
              quantity: vData.stock,
              balanceAfter: vData.stock,
              rate: 0,
              notes: 'Opening Stock from Excel',
              createdBy: adminUser._id
          });
          entries.push(entry);
        }
      }
    }

    if (entries.length > 0) {
      await LedgerEntry.insertMany(entries);
    }

    console.log('Seed updated with Excel Data.');

  } catch (err) {
    console.error('Error seeding DB:', err);
  }
};

module.exports = seedDB;
