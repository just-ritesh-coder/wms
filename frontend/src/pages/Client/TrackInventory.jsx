import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { exportInventoryExcel } from '../../utils/export';

export default function TrackInventory() {
  const { id } = useParams();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    try {
      const res = await axios.get(`/api/client/track/${id}/inventory`);
      setInventory(res.data);
    } catch (err) { console.error(err); } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchInventory();
  }, [id]);

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
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Global Stock Inventory</h2>
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
    </div>
  );
}
