const bcrypt = require('bcryptjs');
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
    const userP1 = new User({ username: 'sharma_distributors', password: party1Hash, role: 'Party' });
    await userP1.save();
    
    const party2Hash = await bcrypt.hash('party123', 10);
    const userP2 = new User({ username: 'verma_retail', password: party2Hash, role: 'Party' });
    await userP2.save();

    const party1 = new Party({ name: 'Sharma Distributors', contactInfo: 'Delhi', roleFlag: 'Both', user: userP1._id });
    await party1.save();

    const party2 = new Party({ name: 'Verma Retail', contactInfo: 'Mumbai', roleFlag: 'Receiver', user: userP2._id });
    await party2.save();
    
    const product1 = new Product({ name: 'Tastino Basil Seeds 360ml', unit: 'pcs' });
    await product1.save();

    const v1_1 = new Variant({ name: 'Orange', product: product1._id });
    const v1_2 = new Variant({ name: 'Mango', product: product1._id });
    const v1_3 = new Variant({ name: 'Lychee', product: product1._id });
    await Variant.insertMany([v1_1, v1_2, v1_3]);

    const product2 = new Product({ name: 'Premium Almonds', unit: 'kg' });
    await product2.save();
    
    const v2_1 = new Variant({ name: '500g Pack', product: product2._id });
    const v2_2 = new Variant({ name: '1kg Pack', product: product2._id });
    await Variant.insertMany([v2_1, v2_2]);

    // Entries for Party 1 (Sharma)
    const e1 = new LedgerEntry({
      date: new Date('2023-10-01'), variant: v1_1._id, party: party1._id,
      type: 'IN', quantity: 100, balanceAfter: 100, rate: 20, createdBy: adminUser._id
    });
    const e2 = new LedgerEntry({
      date: new Date('2023-10-05'), variant: v1_1._id, party: party1._id,
      type: 'OUT', quantity: 30, balanceAfter: 70, rate: 25, createdBy: adminUser._id
    });
    const e3 = new LedgerEntry({
      date: new Date('2023-10-02'), variant: v1_2._id, party: party1._id,
      type: 'IN', quantity: 50, balanceAfter: 50, rate: 20, createdBy: adminUser._id
    });
    
    await LedgerEntry.insertMany([e1, e2, e3]);

  } catch (err) {
    console.error('Error seeding DB:', err);
  }
};

module.exports = seedDB;
