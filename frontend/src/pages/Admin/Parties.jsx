import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

export default function AdminParties() {
  const [parties, setParties] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await axios.get('/api/admin/parties', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setParties(res.data);
      } catch (err) { console.error(err); }
    };
    if (user?.token) fetchParties();
  }, [user]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Parties</h2>
      </div>

      <div className="bg-white border rounded-sm shadow-sm overflow-hidden" style={{ borderColor: 'var(--color-border-main)' }}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-sm" style={{ borderColor: 'var(--color-border-main)' }}>
              <th className="p-4 font-semibold text-gray-600">Name</th>
              <th className="p-4 font-semibold text-gray-600">Contact Info</th>
              <th className="p-4 font-semibold text-gray-600">Role</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parties.map(party => (
              <tr key={party._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <td className="p-4 font-medium">{party.name}</td>
                <td className="p-4 text-sm">{party.contactInfo}</td>
                <td className="p-4 text-sm">{party.roleFlag}</td>
                <td className="p-4 text-right">
                  <Link to={`/admin/parties/${party._id}`} className="inline-flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: 'var(--color-accent-gold)' }}>
                    View Ledger <ExternalLink size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
