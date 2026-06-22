import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function PartyLedger() {
  const { id } = useParams();
  const [ledgerGroups, setLedgerGroups] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await axios.get(`/api/admin/parties/${id}/ledger`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setLedgerGroups(res.data);
      } catch (err) { console.error(err); }
    };
    if (user?.token) fetchLedger();
  }, [user, id]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Party Ledger</h2>
        <Link to="/admin/ledger/new" className="px-4 py-2 text-white text-sm font-medium rounded-sm" style={{ backgroundColor: 'var(--color-primary-dark)' }}>
          + New Entry
        </Link>
      </div>

      <div className="space-y-8">
        {ledgerGroups.length === 0 && (
          <div className="p-8 text-center bg-white border rounded-sm" style={{ borderColor: 'var(--color-border-main)' }}>
            <p className="opacity-70">No ledger entries found for this party.</p>
          </div>
        )}
        
        {ledgerGroups.map(group => (
          <div key={group.variant._id} className="bg-white border rounded-sm shadow-sm overflow-hidden" style={{ borderColor: 'var(--color-border-main)' }}>
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center" style={{ borderColor: 'var(--color-border-main)' }}>
              <div>
                <h3 className="font-bold text-lg">{group.variant.product.name}</h3>
                <p className="text-sm opacity-70">Variant: {group.variant.name}</p>
              </div>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-xs font-mono opacity-70 bg-gray-50" style={{ borderColor: 'var(--color-border-main)' }}>
                  <th className="p-3">DATE</th>
                  <th className="p-3">TYPE</th>
                  <th className="p-3 text-right">RATE</th>
                  <th className="p-3 text-right">QTY</th>
                  <th className="p-3 text-right">BALANCE</th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                {group.entries.map(entry => (
                  <tr key={entry._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    <td className="p-3">{format(new Date(entry.date), 'dd MMM yyyy')}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-sm text-xs font-bold ${entry.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="p-3 text-right">{entry.rate ? `₹${entry.rate}` : '-'}</td>
                    <td className={`p-3 text-right font-bold ${entry.type === 'IN' ? 'text-green-700' : 'text-red-700'}`}>
                      {entry.type === 'IN' ? '+' : '-'}{entry.quantity}
                    </td>
                    <td className="p-3 text-right font-bold bg-gray-50/50">{entry.balanceAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
