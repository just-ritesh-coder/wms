import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      login(res.data);
      if (res.data.role === 'Admin') navigate('/admin/dashboard');
      else navigate('/party/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-sm border" style={{ borderColor: 'var(--color-border-main)' }}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-primary-dark)' }}>StockLedger</h1>
          <p className="font-mono text-sm" style={{ color: 'var(--color-muted-text)' }}>SECURE LOGIN</p>
        </div>
        
        {error && <div className="p-3 mb-6 bg-red-50 text-red-800 text-sm rounded-sm border border-red-200">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-primary-dark)' }}>Username</label>
            <input 
              type="text" 
              className="w-full p-2.5 border rounded-sm focus:outline-none focus:ring-1" 
              style={{ borderColor: 'var(--color-border-subtle)' }}
              value={username} onChange={(e) => setUsername(e.target.value)} required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-primary-dark)' }}>Password</label>
            <input 
              type="password" 
              className="w-full p-2.5 border rounded-sm focus:outline-none focus:ring-1" 
              style={{ borderColor: 'var(--color-border-subtle)' }}
              value={password} onChange={(e) => setPassword(e.target.value)} required 
            />
          </div>
          <button type="submit" className="w-full py-3 mt-4 text-white font-medium rounded-sm transition-colors hover:opacity-90" style={{ backgroundColor: 'var(--color-primary-dark)' }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
