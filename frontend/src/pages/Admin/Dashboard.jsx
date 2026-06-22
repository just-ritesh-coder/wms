import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { format } from 'date-fns';

export default function Dashboard() {
  const [data, setData] = useState({ stats: {}, alerts: [], recentActivity: [] });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.token) fetchDashboard();
  }, [user]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-primary-dark)' }}>Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 border rounded-sm shadow-sm" style={{ borderColor: 'var(--color-border-main)' }}>
          <p className="text-sm font-mono opacity-70 mb-2">TOTAL PRODUCTS</p>
          <p className="text-4xl font-bold">{data.stats.productCount || 0}</p>
        </div>
        <div className="bg-white p-6 border rounded-sm shadow-sm" style={{ borderColor: 'var(--color-border-main)' }}>
          <p className="text-sm font-mono opacity-70 mb-2">TOTAL PARTIES</p>
          <p className="text-4xl font-bold">{data.stats.partyCount || 0}</p>
        </div>
        <div className="bg-white p-6 border rounded-sm shadow-sm" style={{ borderColor: 'var(--color-border-main)' }}>
          <p className="text-sm font-mono opacity-70 mb-2 text-yellow-600" style={{ color: 'var(--color-accent-gold)' }}>ESTIMATED STOCK VALUE</p>
          <p className="text-4xl font-bold">₹{data.stats.totalStockValue?.toLocaleString() || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 border rounded-sm shadow-sm" style={{ borderColor: 'var(--color-border-main)' }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            Low Stock Alerts <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">{data.alerts.length}</span>
          </h3>
          {data.alerts.length === 0 ? (
            <p className="text-sm opacity-70 italic">All stocks are sufficient.</p>
          ) : (
            <div className="space-y-3">
              {data.alerts.map((alert, i) => (
                <div key={i} className="flex justify-between items-center p-3 border rounded-sm bg-red-50/30" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <div>
                    <p className="font-semibold">{alert.variant.product.name}</p>
                    <p className="text-sm opacity-70">{alert.variant.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xl font-bold text-red-700">{alert.balance}</p>
                    <p className="text-xs opacity-70">Remaining</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 border rounded-sm shadow-sm" style={{ borderColor: 'var(--color-border-main)' }}>
          <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {data.recentActivity.map(entry => (
              <div key={entry._id} className="flex items-center gap-4 p-3 border-b last:border-0" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <div className={`w-2 h-10 rounded-full ${entry.type === 'IN' ? 'bg-green-700' : 'bg-red-700'}`}></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{entry.party?.name}</p>
                  <p className="text-xs opacity-70">{format(new Date(entry.date), 'dd MMM yyyy')}</p>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-bold ${entry.type === 'IN' ? 'text-green-700' : 'text-red-700'}`}>
                    {entry.type === 'IN' ? '+' : '-'}{entry.quantity}
                  </p>
                </div>
              </div>
            ))}
            {data.recentActivity.length === 0 && <p className="text-sm opacity-70 italic">No recent activity.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
