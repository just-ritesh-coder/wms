import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { exportToPDF, exportLedgerExcel } from '../../utils/export';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function TrackDashboard() {
  const { id } = useParams();
  const [ledgerGroups, setLedgerGroups] = useState([]);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Hierarchy Expansion States
  const [expandedProducts, setExpandedProducts] = useState({});
  const [expandedVariants, setExpandedVariants] = useState({});

  const toggleProduct = (pId) => setExpandedProducts(prev => ({ ...prev, [pId]: !prev[pId] }));
  const toggleVariant = (vId) => setExpandedVariants(prev => ({ ...prev, [vId]: !prev[vId] }));

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await axios.get(`/api/client/track/${id}/ledger`);
        setLedgerGroups(res.data);
      } catch (err) { console.error(err); }
    };
    if (id) fetchLedger();
  }, [id]);

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

  const totalTransactions = filteredEntries.length;
  const lastTransaction = filteredEntries.length > 0 ? format(new Date(filteredEntries[0].date), 'dd/MM/yyyy') : 'N/A';

  const groupedHierarchy = {};
  filteredEntries.forEach(entry => {
    const pId = entry.product._id;
    const pName = entry.product.name;
    const vId = entry.variant._id;
    const vName = entry.variant.name;

    if (!groupedHierarchy[pId]) {
      groupedHierarchy[pId] = { id: pId, name: pName, totalStock: 0, variants: {} };
    }
    
    if (!groupedHierarchy[pId].variants[vId]) {
      groupedHierarchy[pId].variants[vId] = { id: vId, name: vName, stock: entry.balanceAfter, entries: [] };
      groupedHierarchy[pId].totalStock += entry.balanceAfter;
    }
    
    groupedHierarchy[pId].variants[vId].entries.push(entry);
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 print:hidden">
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Your Passbook</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => exportToPDF(filteredEntries, "My Passbook")} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border rounded-sm text-sm font-medium transition-colors w-full sm:w-auto" style={{ borderColor: 'var(--color-border-main)' }}>
            Export PDF
          </button>
          <button onClick={() => exportLedgerExcel(filteredEntries, "My Passbook")} className="px-4 py-2 text-white text-sm font-medium rounded-sm hover:opacity-90 transition-colors w-full sm:w-auto text-center" style={{ backgroundColor: 'var(--color-primary-dark)' }}>
            Export Excel
          </button>
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
          <select value={selectedProduct} onChange={e => { setSelectedProduct(e.target.value); setSelectedVariant(''); }} className="border p-2 rounded-sm text-sm" style={{ borderColor: 'var(--color-border-main)' }}>
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
            {Array.from(variantOptions.entries())
              .filter(([id, name]) => !selectedProduct || name.startsWith(productOptions.get(selectedProduct) + ' -'))
              .map(([id, name]) => (
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
              <th className="p-3 text-right bg-gray-50">Balance (Left)</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {Object.values(groupedHierarchy).map(product => (
              <React.Fragment key={product.id}>
                {/* Product Row */}
                <tr className="bg-yellow-50/50 cursor-pointer hover:bg-yellow-100/50 transition-colors border-b" style={{ borderColor: 'var(--color-border-main)' }} onClick={() => toggleProduct(product.id)}>
                  <td className="p-3 border-r font-bold flex items-center gap-2" style={{ borderColor: 'var(--color-border-main)', color: 'var(--color-primary-dark)' }}>
                    {expandedProducts[product.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    {product.name}
                  </td>
                  <td className="p-3 border-r" style={{ borderColor: 'var(--color-border-main)' }}></td>
                  <td className="p-3 border-r" style={{ borderColor: 'var(--color-border-main)' }}></td>
                  <td className="p-3 border-r" style={{ borderColor: 'var(--color-border-main)' }}></td>
                  <td className="p-3 text-right font-bold text-base" style={{ color: 'var(--color-primary-dark)' }}>{product.totalStock}</td>
                </tr>

                {/* Variant Rows */}
                {expandedProducts[product.id] && Object.values(product.variants).map(variant => (
                  <React.Fragment key={variant.id}>
                    <tr className="bg-yellow-50/20 cursor-pointer hover:bg-yellow-50/40 transition-colors border-b" style={{ borderColor: 'var(--color-border-subtle)' }} onClick={() => toggleVariant(variant.id)}>
                      <td className="p-3 pl-10 border-r font-semibold flex items-center gap-2" style={{ borderColor: 'var(--color-border-subtle)' }}>
                        {expandedVariants[variant.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        {variant.name}
                      </td>
                      <td className="p-3 border-r" style={{ borderColor: 'var(--color-border-subtle)' }}></td>
                      <td className="p-3 border-r" style={{ borderColor: 'var(--color-border-subtle)' }}></td>
                      <td className="p-3 border-r" style={{ borderColor: 'var(--color-border-subtle)' }}></td>
                      <td className="p-3 text-right font-bold">{variant.stock}</td>
                    </tr>

                    {/* Transaction Rows */}
                    {expandedVariants[variant.id] && variant.entries.map(entry => {
                      const isReversed = entry.isReversed;
                      const isCorrection = !!entry.reversalOf;
                      return (
                        <tr key={entry._id} className={`border-b transition-colors ${isReversed ? 'bg-gray-50 opacity-60 line-through' : 'hover:bg-gray-50'}`} style={{ borderColor: 'var(--color-border-subtle)' }}>
                          <td className="p-3 pl-16 border-r text-xs opacity-80" style={{ borderColor: 'var(--color-border-subtle)' }}>
                            {isReversed && <span className="mr-2 bg-red-100 text-red-800 px-1 rounded not-italic no-underline inline-block">Reversed</span>}
                            {isCorrection && <span className="mr-2 bg-blue-100 text-blue-800 px-1 rounded not-italic no-underline inline-block" title={entry.notes}>Correction</span>}
                            {entry.notes || 'Ledger Entry'}
                          </td>
                          <td className="p-3 border-r font-mono opacity-80" style={{ borderColor: 'var(--color-border-subtle)' }}>
                            {format(new Date(entry.date), 'dd/MM/yyyy')}
                          </td>
                          <td className="p-3 border-r text-center font-mono font-bold text-green-700 bg-green-50/30" style={{ borderColor: 'var(--color-border-subtle)' }}>
                            {entry.type === 'IN' ? entry.quantity : ''}
                          </td>
                          <td className="p-3 border-r text-center font-mono font-bold text-red-700 bg-red-50/30" style={{ borderColor: 'var(--color-border-subtle)' }}>
                            {entry.type === 'OUT' ? entry.quantity : ''}
                          </td>
                          <td className="p-3 text-right font-mono font-bold bg-gray-50/50">
                            {entry.balanceAfter}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center font-medium opacity-70">Koi entry nahi mili.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
