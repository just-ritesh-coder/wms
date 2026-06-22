import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LedgerNew() {
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  
  const [formData, setFormData] = useState({
    party: '',
    variant: '',
    type: 'IN',
    quantity: '',
    rate: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partiesRes, productsRes] = await Promise.all([
          axios.get('/api/admin/parties', { headers: { Authorization: `Bearer ${user.token}` } }),
          axios.get('/api/admin/products', { headers: { Authorization: `Bearer ${user.token}` } })
        ]);
        setParties(partiesRes.data);
        setProducts(productsRes.data);
      } catch (err) { console.error(err); }
    };
    if (user?.token) fetchData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/ledger', formData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      navigate(`/admin/parties/${formData.party}`);
    } catch (err) {
      console.error(err);
      alert('Failed to save entry');
    }
  };

  const productObj = products.find(p => p._id === selectedProduct);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-primary-dark)' }}>New Ledger Entry</h2>
      
      <form onSubmit={handleSubmit} className="bg-white border p-8 rounded-sm shadow-sm space-y-6" style={{ borderColor: 'var(--color-border-main)' }}>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Party</label>
            <select 
              required
              className="w-full p-2.5 border rounded-sm focus:outline-none" style={{ borderColor: 'var(--color-border-subtle)' }}
              value={formData.party} onChange={e => setFormData({...formData, party: e.target.value})}
            >
              <option value="">Select Party...</option>
              {parties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input 
              type="date" required
              className="w-full p-2.5 border rounded-sm focus:outline-none font-mono" style={{ borderColor: 'var(--color-border-subtle)' }}
              value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Product</label>
            <select 
              required
              className="w-full p-2.5 border rounded-sm focus:outline-none" style={{ borderColor: 'var(--color-border-subtle)' }}
              value={selectedProduct} onChange={e => { setSelectedProduct(e.target.value); setFormData({...formData, variant: ''}); }}
            >
              <option value="">Select Product...</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Variant</label>
            <select 
              required disabled={!selectedProduct}
              className="w-full p-2.5 border rounded-sm focus:outline-none disabled:bg-gray-50" style={{ borderColor: 'var(--color-border-subtle)' }}
              value={formData.variant} onChange={e => setFormData({...formData, variant: e.target.value})}
            >
              <option value="">Select Variant...</option>
              {productObj?.variants?.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select 
              required
              className="w-full p-2.5 border rounded-sm focus:outline-none font-bold" style={{ borderColor: 'var(--color-border-subtle)' }}
              value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
            >
              <option value="IN">IN (+)</option>
              <option value="OUT">OUT (-)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input 
              type="number" required min="1"
              className="w-full p-2.5 border rounded-sm focus:outline-none font-mono" style={{ borderColor: 'var(--color-border-subtle)' }}
              value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rate (Optional)</label>
            <input 
              type="number" min="0" step="0.01"
              className="w-full p-2.5 border rounded-sm focus:outline-none font-mono" style={{ borderColor: 'var(--color-border-subtle)' }}
              value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <input 
            type="text"
            className="w-full p-2.5 border rounded-sm focus:outline-none" style={{ borderColor: 'var(--color-border-subtle)' }}
            value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
          />
        </div>

        <button type="submit" className="w-full py-3 mt-4 text-white font-medium rounded-sm transition-colors hover:opacity-90" style={{ backgroundColor: 'var(--color-primary-dark)' }}>
          Save Entry
        </button>
      </form>
    </div>
  );
}
