import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { exportToPDF, exportToExcel } from '../../utils/export';
import { Trash2, Edit2, X } from 'lucide-react';

export default function PartyLedger() {
  const { id } = useParams();
  const [ledgerGroups, setLedgerGroups] = useState([]);
  const [partyName, setPartyName] = useState('');
  const { user } = useContext(AuthContext);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  
  const [editModal, setEditModal] = useState(null);

  const fetchLedger = async () => {
    try {
      const res = await axios.get(`/api/admin/parties/${id}/ledger`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setLedgerGroups(res.data);
      // Hack to get party name from first entry
      if (res.data.length > 0 && res.data[0].entries.length > 0) {
        // Populated party not available in entries directly, just fetching data
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user?.token) fetchLedger();
  }, [user, id]);

  const flatEntries = [];
  const variantOptions = new Map();
  const productOptions = new Map();

  ledgerGroups.forEach(group => {
    productOptions.set(group.variant.product._id, group.variant.product.name);
    variantOptions.set(group.variant._id, `${group.variant.product.name} - ${group.variant.name}`);
    group.entries.forEach(entry => {
      flatEntries.push({ ...entry, product: group.variant.product, variant: group.variant });
    });
  });
  flatEntries.sort((a, b) => {
    // 1. Group by Item Name
    const nameA = a.product.name + a.variant.name;
    const nameB = b.product.name + b.variant.name;
    if (nameA !== nameB) return nameA.localeCompare(nameB);
    
    // 2. Sort by Date (Descending - newest first)
    const dDiff = new Date(b.date) - new Date(a.date);
    if (dDiff !== 0) return dDiff;
    
    // 3. Fallback to CreatedAt (Descending)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const filteredEntries = flatEntries.filter(entry => {
    if (fromDate && new Date(entry.date) < new Date(fromDate)) return false;
    if (toDate && new Date(entry.date) > new Date(toDate)) return false;
    if (selectedProduct && entry.product._id !== selectedProduct) return false;
    if (selectedVariant && entry.variant._id !== selectedVariant) return false;
    if (typeFilter !== 'ALL' && entry.type !== typeFilter) return false;
    return true;
  });

  const handleEditEntry = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/ledger/${editModal._id}`, {
        quantity: editModal.quantity,
        type: editModal.type,
        notes: editModal.notes
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setEditModal(null);
      fetchLedger();
    } catch (err) {
      alert(err.response?.data?.error || 'Error editing entry');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Are you sure you want to permanently delete this entry? This will recalculate all subsequent balances.")) return;
    try {
      await axios.delete(`/api/admin/ledger/${entryId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchLedger(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting entry');
    }
  };

  const totalTransactions = filteredEntries.length;
  const lastTransaction = filteredEntries.length > 0 ? format(new Date(filteredEntries[0].date), 'dd/MM/yyyy') : 'N/A';

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 print:hidden">
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Party Ledger</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => exportToPDF(filteredEntries, "Party Ledger")} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border rounded-sm text-sm font-medium transition-colors w-full sm:w-auto" style={{ borderColor: 'var(--color-border-main)' }}>
            Export PDF
          </button>
          <button onClick={() => exportToExcel(filteredEntries, "Party Ledger")} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border rounded-sm text-sm font-medium transition-colors w-full sm:w-auto" style={{ borderColor: 'var(--color-border-main)' }}>
            Export Excel
          </button>
          <Link to="/admin/ledger/new" className="px-4 py-2 text-white text-sm font-medium rounded-sm hover:opacity-90 transition-colors w-full sm:w-auto text-center" style={{ backgroundColor: 'var(--color-primary-dark)' }}>
            + New Entry
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:hidden">
        <div className="bg-white border p-4 rounded-sm" style={{ borderColor: 'var(--color-border-main)' }}>
          <p className="text-xs font-bold opacity-70 mb-1">TOTAL TRANSACTIONS (FILTERED)</p>
          <p className="text-2xl font-mono font-bold">{totalTransactions}</p>
        </div>
        <div className="bg-white border p-4 rounded-sm" style={{ borderColor: 'var(--color-border-main)' }}>
          <p className="text-xs font-bold opacity-70 mb-1">LAST TRANSACTION</p>
          <p className="text-2xl font-mono font-bold">{lastTransaction}</p>
        </div>
        <div className="bg-white border p-4 rounded-sm" style={{ borderColor: 'var(--color-border-main)' }}>
          <p className="text-xs font-bold opacity-70 mb-1">UNIQUE ITEMS</p>
          <p className="text-2xl font-mono font-bold">{variantOptions.size}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border p-4 mb-6 rounded-sm print:hidden flex flex-wrap gap-4 items-end" style={{ borderColor: 'var(--color-border-main)' }}>
        <div>
          <label className="block text-xs font-bold mb-1 opacity-70">From Date</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border p-2 rounded-sm text-sm" style={{ borderColor: 'var(--color-border-main)' }} />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 opacity-70">To Date</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border p-2 rounded-sm text-sm" style={{ borderColor: 'var(--color-border-main)' }} />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 opacity-70">Product</label>
          <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="border p-2 rounded-sm text-sm" style={{ borderColor: 'var(--color-border-main)' }}>
            <option value="">All Products</option>
            {Array.from(productOptions.entries()).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 opacity-70">Variant</label>
          <select value={selectedVariant} onChange={e => setSelectedVariant(e.target.value)} className="border p-2 rounded-sm text-sm" style={{ borderColor: 'var(--color-border-main)' }}>
            <option value="">All Variants</option>
            {Array.from(variantOptions.entries()).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 opacity-70">Type</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border p-2 rounded-sm text-sm" style={{ borderColor: 'var(--color-border-main)' }}>
            <option value="ALL">All Types</option>
            <option value="IN">IN Only</option>
            <option value="OUT">OUT Only</option>
          </select>
        </div>
        {(fromDate || toDate || selectedProduct || selectedVariant || typeFilter !== 'ALL') && (
          <button onClick={() => { setFromDate(''); setToDate(''); setSelectedProduct(''); setSelectedVariant(''); setTypeFilter('ALL'); }} className="text-sm font-medium text-red-600 hover:underline">
            Clear Filters
          </button>
        )}
      </div>

      <div className="bg-white border p-4 shadow-sm overflow-x-auto" style={{ borderColor: 'var(--color-border-main)' }}>
        <table className="w-full text-left border-collapse border" style={{ borderColor: 'var(--color-border-main)' }}>
          <thead>
            <tr className="bg-gray-100 border-b text-sm font-bold uppercase tracking-wider" style={{ borderColor: 'var(--color-border-main)' }}>
              <th className="p-3 border-r" style={{ borderColor: 'var(--color-border-main)' }}>Item Name</th>
              <th className="p-3 border-r" style={{ borderColor: 'var(--color-border-main)' }}>Date</th>
              <th className="p-3 border-r text-center text-green-800 bg-green-100/50" style={{ borderColor: 'var(--color-border-main)' }}>IN (Qty)</th>
              <th className="p-3 border-r text-center text-red-800 bg-red-100/50" style={{ borderColor: 'var(--color-border-main)' }}>OUT (Qty)</th>
              <th className="p-3 border-r text-right bg-gray-50">Balance (Left)</th>
              <th className="p-3 text-center print:hidden">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredEntries.map((entry) => {
              const isLowStock = entry.balanceAfter <= (entry.variant.reorderLevel !== undefined ? entry.variant.reorderLevel : 10);
              const isReversed = entry.isReversed;
              const isCorrection = !!entry.reversalOf;
              
              return (
                <tr key={entry._id} className={`border-b transition-colors ${isReversed ? 'bg-gray-50 opacity-60 line-through' : 'hover:bg-gray-50'} ${!isReversed && isLowStock ? 'border-l-4 border-l-red-500' : ''}`} style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <td className="p-3 border-r font-medium" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    {entry.product.name} - {entry.variant.name}
                    {isReversed && <span className="ml-2 text-xs bg-red-100 text-red-800 px-1 rounded not-italic no-underline inline-block">Reversed</span>}
                    {isCorrection && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded not-italic no-underline inline-block" title={entry.notes}>Correction</span>}
                  </td>
                  <td className="p-3 border-r font-mono" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    {format(new Date(entry.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="p-3 border-r text-center font-mono font-bold text-green-700 bg-green-50/30" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    {entry.type === 'IN' ? entry.quantity : ''}
                  </td>
                  <td className="p-3 border-r text-center font-mono font-bold text-red-700 bg-red-50/30" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    {entry.type === 'OUT' ? entry.quantity : ''}
                  </td>
                  <td className="p-3 border-r text-right font-mono font-bold bg-gray-50/50">
                    {entry.balanceAfter}
                  </td>
                  <td className="p-3 text-center print:hidden">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setEditModal(entry)} className="text-blue-600 hover:text-blue-800" title="Edit Entry">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteEntry(entry._id)} className="text-red-500 hover:text-red-700" title="Delete Entry Permanently">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center font-medium opacity-70">Koi entry nahi mili. Nayi entry shuru karein.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Entry Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-sm">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">Edit Transaction</h3>
              <button onClick={() => setEditModal(null)} className="hover:opacity-70"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditEntry} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select value={editModal.type} onChange={e => setEditModal({...editModal, type: e.target.value})} className="w-full p-2 border rounded-sm font-mono text-sm">
                  <option value="IN">IN (Stock Added)</option>
                  <option value="OUT">OUT (Stock Removed)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input type="number" required min="1" value={editModal.quantity} onChange={e => setEditModal({...editModal, quantity: Number(e.target.value)})} className="w-full p-2 border rounded-sm font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes / Reason for Edit</label>
                <input type="text" value={editModal.notes || ''} onChange={e => setEditModal({...editModal, notes: e.target.value})} className="w-full p-2 border rounded-sm text-sm" placeholder="e.g., corrected typo in quantity" />
              </div>
              <p className="text-xs opacity-70 italic text-red-600">
                Warning: Editing this will automatically recalculate all following balances.
              </p>
              <button type="submit" className="w-full py-2 mt-4 text-white font-medium rounded-sm" style={{ backgroundColor: 'var(--color-primary-dark)' }}>Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
