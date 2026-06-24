// no axios

async function test() {
    try {
        // Find admin user to login
        const mongoose = require('mongoose');
        await mongoose.connect('mongodb://127.0.0.1:27017/stockledger?directConnection=true&serverSelectionTimeoutMS=2000');
        const User = mongoose.model('User', new mongoose.Schema({ username: String, role: String }));
        const admin = await User.findOne({ role: 'Admin' });
        
        // Let's just query LedgerEntry directly from DB to see exactly what is stored!
        const LedgerEntry = mongoose.model('LedgerEntry', new mongoose.Schema({
            date: Date, type: String, quantity: Number, balanceAfter: Number, variant: mongoose.Schema.Types.ObjectId, party: mongoose.Schema.Types.ObjectId, createdAt: Date
        }, { timestamps: true }));
        
        const Variant = mongoose.model('Variant', new mongoose.Schema({ name: String }));
        const Party = mongoose.model('Party', new mongoose.Schema({ name: String }));
        
        const entries = await LedgerEntry.find().sort({ date: 1, createdAt: 1 });
        
        for(let e of entries) {
            const v = await Variant.findById(e.variant);
            const p = await Party.findById(e.party);
            console.log(`${e.date.toISOString().split('T')[0]} | Party: ${p?.name} | Var: ${v?.name} | Type: ${e.type} | Qty: ${e.quantity} | Bal: ${e.balanceAfter}`);
        }
        
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
test();
