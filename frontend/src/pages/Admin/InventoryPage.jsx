import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { Edit2, X } from 'lucide-react';
import { exportInventoryExcel } from '../../utils/export';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  
  const [adjustModal, setAdjustModal] = useState(null);

  const fetchInventory = async () => {
    try {
      const res = await axios.get('/api/admin/inventory', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setInventory(res.data);
    } catch (err) { console.error(err); } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchInventory();
  }, [user]);

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/inventory/adjust', {
        variantId: adjustModal.variantId,
        currentStock: adjustModal.currentStock,
        desiredStock: adjustModal.desiredStock
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      setAdjustModal(null);
      fetchInventory();
    } catch (err) { alert(err.response?.data?.error || 'Failed to adjust stock'); }
  };

  // Group by Product
  const groupedInventory = inventory.reduce((acc, curr) => {
    const prodId = curr.variant.product._id;
    if (!acc[prodId]) {
      acc[prodId] = {
        product: curr.variant.product,
        variants: []
      };
    }
    acc[prodId].variants.push(curr);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Current Stock Inventory</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => window.print()} className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 border rounded-sm text-sm font-medium transition-colors" style={{ borderColor: 'var(--color-border-main)' }}>
            Print PDF
          </button>
          <button onClick={() => exportInventoryExcel(groupedInventory)} className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 border rounded-sm text-sm font-medium transition-colors text-green-700" style={{ borderColor: 'var(--color-border-main)' }}>
            Export Excel
          </button>
        </div>
      </div>

      {loading ? (
        <p className="opacity-70">Loading inventory...</p>
      ) : (
        <div className="space-y-8 print:space-y-4">
          {Object.values(groupedInventory).map(group => (
            <div key={group.product._id} className="bg-white border rounded-sm shadow-sm overflow-hidden" style={{ borderColor: 'var(--color-border-main)' }}>
              <div className="p-4 border-b bg-gray-50" style={{ borderColor: 'var(--color-border-main)' }}>
                <h3 className="font-bold text-lg">{group.product.name}</h3>
                <p className="text-xs font-mono opacity-70 mt-1">UNIT: {group.product.unit}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                  <tr className="border-b text-xs font-mono opacity-70 bg-gray-50" style={{ borderColor: 'var(--color-border-main)' }}>
                    <th className="p-3">VARIANT</th>
                    <th className="p-3 text-right">CURRENT STOCK</th>
                    <th className="p-3 text-right">EST. VALUE</th>
                    <th className="p-3 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {group.variants.map(v => (
                    <tr key={v.variant._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--color-border-subtle)' }}>
                      <td className="p-3 font-medium">{v.variant.name}</td>
                      <td className="p-3 text-right font-mono font-bold text-lg">
                        <span className={v.currentStock < 10 ? 'text-red-600' : 'text-green-700'}>
                          {v.currentStock}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">₹{v.totalValue?.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => setAdjustModal({ variantId: v.variant._id, name: v.variant.name, currentStock: v.currentStock, desiredStock: v.currentStock })} className="text-blue-600 hover:text-blue-800 text-xs flex items-center justify-center gap-1 mx-auto border px-2 py-1 rounded-sm">
                          <Edit2 size={12} /> Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50/50 font-bold border-t" style={{ borderColor: 'var(--color-border-main)' }}>
                    <td className="p-3 text-right">TOTAL FOR PRODUCT:</td>
                    <td className="p-3 text-right font-mono text-lg">
                      {group.variants.reduce((sum, v) => sum + v.currentStock, 0)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      ₹{group.variants.reduce((sum, v) => sum + v.totalValue, 0).toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {Object.keys(groupedInventory).length === 0 && (
            <div className="p-8 text-center bg-white border rounded-sm" style={{ borderColor: 'var(--color-border-main)' }}>
              <p className="opacity-70">No products found in inventory.</p>
            </div>
          )}
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-sm">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">Adjust Stock</h3>
              <button onClick={() => setAdjustModal(null)} className="hover:opacity-70"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdjustStock} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Variant</label>
                <div className="font-bold">{adjustModal.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-70">Current Stock</label>
                  <div className="p-2 bg-gray-100 rounded-sm font-mono">{adjustModal.currentStock}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">New Stock</label>
                  <input type="number" required value={adjustModal.desiredStock} onChange={e => setAdjustModal({...adjustModal, desiredStock: Number(e.target.value)})} className="w-full p-2 border rounded-sm font-mono" />
                </div>
              </div>
              <p className="text-xs opacity-70 italic">
                A ledger transaction will be automatically created to balance the stock to this new number.
              </p>
              <button type="submit" className="w-full py-2 mt-4 text-white font-medium rounded-sm" style={{ backgroundColor: 'var(--color-primary-dark)' }}>Confirm Adjustment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
