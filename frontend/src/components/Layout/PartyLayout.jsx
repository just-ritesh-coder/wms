import { Outlet, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import { LogOut, BookOpen } from 'lucide-react';

export default function PartyLayout() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="px-6 py-4 flex justify-between items-center" style={{ backgroundColor: 'var(--color-primary-dark)', color: 'var(--color-bg-light)' }}>
        <div className="flex items-center gap-3">
          <BookOpen size={24} style={{ color: 'var(--color-accent-gold)' }} />
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">StockLedger</h1>
            <p className="text-xs opacity-70 font-mono mt-1">PARTY PASSBOOK</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 hover:text-white transition-colors text-sm">
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
