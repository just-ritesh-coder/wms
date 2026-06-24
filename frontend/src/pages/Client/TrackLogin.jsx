import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search } from 'lucide-react';

export default function TrackLogin() {
  const [trackingId, setTrackingId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await axios.get(`/api/client/auth/${trackingId}`);
      if (res.data) {
        // Store tracking info in session storage or just navigate with ID in URL
        sessionStorage.setItem('client_tracking', JSON.stringify(res.data));
        navigate(`/track/${trackingId}/dashboard`);
      }
    } catch (err) {
      setError('Invalid Party ID. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-sm shadow-xl border-t-4" style={{ borderColor: 'var(--color-primary-dark)' }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-primary-dark)' }}>Track Inventory</h1>
          <p className="text-gray-500 text-sm">Enter your Party ID to view your passbook and global stock.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm border-l-4 border-red-500 rounded-r-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleTrack} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Party Tracking ID</label>
            <input 
              type="text" 
              required
              value={trackingId}
              onChange={e => setTrackingId(e.target.value.toUpperCase())}
              placeholder="e.g. PTY-1A2B3C"
              className="w-full p-3 border rounded-sm font-mono text-lg focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-border-main)', '--tw-ring-color': 'var(--color-primary-light)' }}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 text-white font-bold rounded-sm shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary-dark)' }}
          >
            {loading ? 'Searching...' : <><Search size={20} /> Track Now</>}
          </button>
        </form>
      </div>
    </div>
  );
}
