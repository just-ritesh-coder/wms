import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import { LogOut, BookOpen, LayoutDashboard, Package } from 'lucide-react';

export default function PartyLayout() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex flex-col md:sticky md:top-0 md:h-screen flex-shrink-0" style={{ backgroundColor: 'var(--color-primary-dark)', color: 'var(--color-bg-light)' }}>
        <div className="p-4 md:p-6 border-b flex justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3">
             <BookOpen size={24} style={{ color: 'var(--color-accent-gold)' }} />
             <div>
               <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-none">StockLedger</h1>
               <p className="text-xs md:text-sm opacity-70 font-mono mt-1">PARTY PASSBOOK</p>
             </div>
          </div>
          <button onClick={handleLogout} className="md:hidden flex items-center gap-2 p-2 rounded-md hover:bg-white/10 transition-colors text-red-300">
            <LogOut size={20} />
          </button>
        </div>
        <nav className="p-4 flex gap-2 overflow-x-auto md:flex-col md:flex-1 md:space-y-2 md:gap-0 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Link to="/party/dashboard" className={`flex items-center gap-2 px-3 py-2 whitespace-nowrap rounded-md transition-colors ${location.pathname.includes('/dashboard') ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-gray-300'}`}>
             <LayoutDashboard size={20} /> <span className="md:inline">Dashboard</span>
          </Link>
          <Link to="/party/inventory" className={`flex items-center gap-2 px-3 py-2 whitespace-nowrap rounded-md transition-colors ${location.pathname.includes('/inventory') ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-gray-300'}`}>
             <Package size={20} /> <span className="md:inline">Global Stock</span>
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
