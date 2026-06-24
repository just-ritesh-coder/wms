import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { ExternalLink, Plus, X } from 'lucide-react';

export default function AdminParties() {
  const [parties, setParties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useContext(AuthContext);

  // Add Party Modal State
  const [showModal, setShowModal] = useState(false);
  const [newParty, setNewParty] = useState({
    name: '',
    contactInfo: '',
    roleFlag: 'Both',
    username: '',
    password: ''
  });

  const fetchParties = async () => {
    try {
      const res = await axios.get('/api/admin/parties', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setParties(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user?.token) fetchParties();
  }, [user]);

  const handleAddParty = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/parties', newParty, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setShowModal(false);
      setNewParty({ name: '', contactInfo: '', roleFlag: 'Both', username: '', password: '' });
      fetchParties();
    } catch (err) { alert(err.response?.data?.error || 'Failed to add party'); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Parties</h2>
        <div className="flex flex-wrap gap-3">
          <input 
            type="text" 
            placeholder="Search by name or contact..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-sm text-sm focus:outline-none w-full sm:w-64"
            style={{ borderColor: 'var(--color-border-main)' }}
          />
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-sm hover:opacity-90 transition-colors w-full sm:w-auto" 
            style={{ backgroundColor: 'var(--color-primary-dark)' }}
          >
            <Plus size={16} /> Add Party
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-sm shadow-sm overflow-x-auto" style={{ borderColor: 'var(--color-border-main)' }}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-sm" style={{ borderColor: 'var(--color-border-main)' }}>
              <th className="p-4 font-semibold text-gray-600">Name</th>
              <th className="p-4 font-semibold text-gray-600">Contact Info</th>
              <th className="p-4 font-semibold text-gray-600">Tracking ID</th>
              <th className="p-4 font-semibold text-gray-600">Role</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parties.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.contactInfo && p.contactInfo.toLowerCase().includes(searchTerm.toLowerCase()))).map(party => (
              <tr key={party._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <td className="p-4 font-medium">{party.name}</td>
                <td className="p-4 text-sm">{party.contactInfo}</td>
                <td className="p-4 text-sm font-mono text-gray-500 bg-gray-50 border-r border-l text-center">{party.trackingId}</td>
                <td className="p-4 text-sm">{party.roleFlag}</td>
                <td className="p-4 text-right">
                  <Link to={`/admin/parties/${party._id}`} className="inline-flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: 'var(--color-accent-gold)' }}>
                    View Ledger <ExternalLink size={14} />
                  </Link>
                </td>
              </tr>
            ))}
            {parties.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-sm opacity-70">No parties found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Party Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">Add New Party</h3>
              <button onClick={() => setShowModal(false)} className="hover:opacity-70"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddParty} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Party Name</label>
                <input type="text" required value={newParty.name} onChange={e => setNewParty({...newParty, name: e.target.value})} className="w-full p-2 border rounded-sm" placeholder="e.g. Sharma Distributors" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Info / Location</label>
                <input type="text" value={newParty.contactInfo} onChange={e => setNewParty({...newParty, contactInfo: e.target.value})} className="w-full p-2 border rounded-sm" placeholder="e.g. Mumbai" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select value={newParty.roleFlag} onChange={e => setNewParty({...newParty, roleFlag: e.target.value})} className="w-full p-2 border rounded-sm">
                  <option value="Both">Both (Supplier & Receiver)</option>
                  <option value="Receiver">Receiver Only</option>
                  <option value="Supplier">Supplier Only</option>
                </select>
              </div>
              <div className="pt-2 border-t mt-2">
                <p className="text-xs font-bold opacity-70 mb-2">LOGIN CREDENTIALS FOR PARTY</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <input type="text" required value={newParty.username} onChange={e => setNewParty({...newParty, username: e.target.value})} className="w-full p-2 border rounded-sm" placeholder="e.g. sharma_dist" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input type="text" required value={newParty.password} onChange={e => setNewParty({...newParty, password: e.target.value})} className="w-full p-2 border rounded-sm" placeholder="e.g. party123" />
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full py-2 mt-4 text-white font-medium rounded-sm" style={{ backgroundColor: 'var(--color-primary-dark)' }}>Save Party</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
