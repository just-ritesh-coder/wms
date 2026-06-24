import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { UploadCloud, Download } from 'lucide-react';

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
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchBaseData = async () => {
    try {
      const [partiesRes, productsRes] = await Promise.all([
        axios.get('/api/admin/parties', { headers: { Authorization: `Bearer ${user.token}` } }),
        axios.get('/api/admin/products', { headers: { Authorization: `Bearer ${user.token}` } })
      ]);
      setParties(partiesRes.data);
      setProducts(productsRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user?.token) fetchBaseData();
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

  const downloadTemplate = () => {
    const worksheetData = [{
      "Date": "2024-04-01",
      "Party Name": "Example Party",
      "Product Name": "Tastino Basil seeds 360ml",
      "Variant Name": "Orange",
      "Type": "IN",
      "Quantity": 100,
      "Rate": 50,
      "Notes": "Initial stock"
    }];
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Bulk_Import_Template.xlsx");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) throw new Error("Empty Excel file");

        // SMART MAPPING ALGORITHM
        // We look at all column headers and find the best match for our required fields.
        const headers = Object.keys(data[0]);
        
        const findBestKey = (aliases) => {
          // 1. Exact match (case insensitive)
          for (let alias of aliases) {
            const exactMatch = headers.find(h => h.toLowerCase().trim() === alias.toLowerCase());
            if (exactMatch) return exactMatch;
          }
          // 2. Contains match (case insensitive)
          for (let alias of aliases) {
            const partialMatch = headers.find(h => h.toLowerCase().includes(alias.toLowerCase()));
            if (partialMatch) return partialMatch;
          }
          return null;
        };

        const dateKey = findBestKey(['date', 'time', 'created']);
        let partyKey = findBestKey(['party', 'customer', 'supplier', 'client', 'vendor', 'account', 'name']);
        let productKey = findBestKey(['product', 'item', 'article', 'material', 'commodity', 'goods']);
        const variantKey = findBestKey(['variant', 'size', 'color', 'flavor', 'category', 'brand']);
        const typeKey = findBestKey(['in/out', 'type', 'direction', 'action', 'status', 'transaction']);
        const qtyKey = findBestKey(['qty', 'quantity', 'count', 'amount', 'pcs', 'pieces']);
        const rateKey = findBestKey(['rate', 'price', 'cost', 'value']);
        const noteKey = findBestKey(['note', 'remark', 'desc', 'comment', 'detail', 'particular']);

        // Fallback for "Name" if party and product are indistinguishable
        if (partyKey === productKey && partyKey !== null) {
           // Both matched "name". Usually "Party" is named "Customer Name", but if it's just "Name", we'll assume it's Party and look for Item elsewhere
           productKey = findBestKey(['item', 'product']) || productKey;
        }

        const formattedData = data.map(row => {
           let rawDate = dateKey ? row[dateKey] : new Date();
           let parsedDate = new Date(); // Default to today

           if (typeof rawDate === 'number') {
             parsedDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
           } else if (typeof rawDate === 'string') {
             // Attempt to handle DD-MM-YYYY or DD/MM/YYYY
             const parts = rawDate.split(/[-/]/);
             if (parts.length === 3 && parts[2].length === 4) {
                // Assuming DD-MM-YYYY
                parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
             } else {
                parsedDate = new Date(rawDate);
             }
           } else if (rawDate instanceof Date) {
             parsedDate = rawDate;
           }

           // Final check: if the date is invalid, fallback to today
           if (isNaN(parsedDate.getTime())) {
             parsedDate = new Date();
           }

           let rawType = typeKey ? String(row[typeKey]).toUpperCase() : '';
           let rawQty = qtyKey ? parseFloat(row[qtyKey]) : 0;
           
           let finalType = 'IN';
           if (rawType.includes('OUT') || rawType.includes('SALE') || rawType.includes('ISSUE')) {
             finalType = 'OUT';
           } else if (rawQty < 0) {
             finalType = 'OUT';
             rawQty = Math.abs(rawQty);
           }

           return {
             date: parsedDate,
             partyName: partyKey ? String(row[partyKey]).trim() : 'Unknown Party',
             productName: productKey ? String(row[productKey]).trim() : 'Unknown Product',
             variantName: variantKey ? String(row[variantKey]).trim() : 'Default',
             type: finalType,
             quantity: Math.abs(rawQty) || 1, // Default to 1 if missing but row is valid
             rate: rateKey ? parseFloat(row[rateKey]) : 0,
             notes: noteKey ? String(row[noteKey]) : ''
           };
        });

        // Only keep rows that have some sort of meaningful text to avoid blank rows
        const validRows = formattedData.filter(r => r.partyName !== 'Unknown Party' || r.productName !== 'Unknown Product' || r.quantity > 0);
        
        if (validRows.length === 0) {
          alert('Could not extract any meaningful data. Please ensure your Excel file has headers like Party, Product, Quantity.');
          fileInputRef.current.value = '';
          setIsUploading(false);
          return;
        }

        const res = await axios.post('/api/admin/ledger/bulk', validRows, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        alert(`Successfully imported ${res.data.imported} entries using Smart Extraction!`);
        fetchBaseData(); 
        fileInputRef.current.value = ''; 
      } catch (err) {
        console.error(err);
        alert('Error importing file.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const productObj = products.find(p => p._id === selectedProduct);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>New Ledger Entry</h2>
        
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 border rounded-sm transition-colors hover:bg-gray-50 text-sm font-medium"
            style={{ borderColor: 'var(--color-border-main)' }}
          >
            <Download size={16} /> Template
          </button>
          
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 border rounded-sm transition-colors hover:bg-gray-50 text-sm font-medium"
            style={{ borderColor: 'var(--color-border-main)', color: 'var(--color-primary-dark)' }}
          >
            <UploadCloud size={16} />
            {isUploading ? 'Importing...' : 'Bulk Import from Excel'}
          </button>
        </div>
      </div>
      
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
