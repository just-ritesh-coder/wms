import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { LayoutDashboard, Package, Users, LogOut, PlusSquare, Database, Search, PieChart } from 'lucide-react';

export default function AdminLayout() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/admin/search?q=${searchQuery}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSearchResults(res.data);
      } catch (err) { console.error(err); }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user]);

  const handleSelectResult = (path) => {
    setSearchQuery('');
    setSearchResults(null);
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex flex-col md:sticky md:top-0 md:h-screen flex-shrink-0" style={{ backgroundColor: 'var(--color-primary-dark)', color: 'var(--color-bg-light)' }}>
        <div className="p-4 md:p-6 border-b flex justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">StockLedger</h1>
            <p className="text-xs md:text-sm opacity-70 font-mono mt-1">ADMIN PORTAL</p>
          </div>
          <button onClick={handleLogout} className="md:hidden flex items-center gap-2 p-2 rounded-md hover:bg-white/10 transition-colors text-red-300">
            <LogOut size={20} />
          </button>
        </div>
        <nav className="p-4 flex gap-2 overflow-x-auto md:flex-col md:flex-1 md:space-y-2 md:gap-0 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Link to="/admin/dashboard" className="flex items-center gap-2 px-3 py-2 whitespace-nowrap rounded-md hover:bg-white/10 transition-colors">
            <LayoutDashboard size={20} /> <span className="md:inline">Dashboard</span>
          </Link>
          <Link to="/admin/inventory" className="flex items-center gap-2 px-3 py-2 whitespace-nowrap rounded-md hover:bg-white/10 transition-colors">
            <Database size={20} /> <span className="md:inline">Inventory Stock</span>
          </Link>
          <Link to="/admin/reports/financial-year" className="flex items-center gap-2 px-3 py-2 whitespace-nowrap rounded-md hover:bg-white/10 transition-colors">
            <PieChart size={20} /> <span className="md:inline">Financial Report</span>
          </Link>
          <Link to="/admin/products" className="flex items-center gap-2 px-3 py-2 whitespace-nowrap rounded-md hover:bg-white/10 transition-colors">
            <Package size={20} /> <span className="md:inline">Products</span>
          </Link>
          <Link to="/admin/parties" className="flex items-center gap-2 px-3 py-2 whitespace-nowrap rounded-md hover:bg-white/10 transition-colors">
            <Users size={20} /> <span className="md:inline">Parties</span>
          </Link>
          <Link to="/admin/ledger/new" className="flex items-center gap-2 px-3 py-2 whitespace-nowrap rounded-md hover:bg-white/10 transition-colors" style={{ color: 'var(--color-accent-gold)' }}>
            <PlusSquare size={20} /> <span className="md:inline">New Entry</span>
          </Link>
        </nav>
        <div className="p-4 border-t hidden md:block" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md hover:bg-red-900/50 transition-colors text-red-300">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
