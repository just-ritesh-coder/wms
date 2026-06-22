import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import { LayoutDashboard, Package, Users, LogOut, PlusSquare } from 'lucide-react';

export default function AdminLayout() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col" style={{ backgroundColor: 'var(--color-primary-dark)', color: 'var(--color-bg-light)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <h1 className="text-2xl font-bold tracking-tight">StockLedger</h1>
          <p className="text-sm opacity-70 font-mono mt-1">ADMIN PORTAL</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition-colors">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/admin/products" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition-colors">
            <Package size={20} /> Products
          </Link>
          <Link to="/admin/parties" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition-colors">
            <Users size={20} /> Parties
          </Link>
          <Link to="/admin/ledger/new" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition-colors" style={{ color: 'var(--color-accent-gold)' }}>
            <PlusSquare size={20} /> New Entry
          </Link>
        </nav>
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md hover:bg-red-900/50 transition-colors text-red-300">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
