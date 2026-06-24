import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LayoutDashboard, Package, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ClientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [partyInfo, setPartyInfo] = useState(null);

  useEffect(() => {
    const data = sessionStorage.getItem('client_tracking');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.trackingId === id) {
        setPartyInfo(parsed);
      }
    }
  }, [id]);

  const handleExit = () => {
    sessionStorage.removeItem('client_tracking');
    navigate('/track');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 text-white flex flex-col shadow-xl z-10" style={{ backgroundColor: 'var(--color-primary-dark)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-accent-gold)' }}>Stock<span className="text-white">Ledger</span></h1>
          {partyInfo && (
            <div className="mt-4">
              <p className="text-xs opacity-70 uppercase tracking-wider font-semibold">Tracking For</p>
              <p className="font-bold text-lg leading-tight">{partyInfo.name}</p>
              <p className="text-xs opacity-70 font-mono mt-1">ID: {partyInfo.trackingId}</p>
            </div>
          )}
        </div>
        <nav className="p-4 flex gap-2 overflow-x-auto md:flex-col md:flex-1 md:space-y-2 md:gap-0 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Link to={`/track/${id}/dashboard`} className={`flex items-center gap-2 px-3 py-2 whitespace-nowrap rounded-md transition-colors ${location.pathname.includes('/dashboard') ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-gray-300'}`}>
             <LayoutDashboard size={20} /> <span className="md:inline">Passbook</span>
          </Link>
          <Link to={`/track/${id}/inventory`} className={`flex items-center gap-2 px-3 py-2 whitespace-nowrap rounded-md transition-colors ${location.pathname.includes('/inventory') ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-gray-300'}`}>
             <Package size={20} /> <span className="md:inline">Global Stock</span>
          </Link>
        </nav>
        <div className="p-4 border-t hidden md:block" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button onClick={handleExit} className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md hover:bg-red-900/50 transition-colors text-red-300">
            <LogOut size={20} /> Exit Tracking
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
