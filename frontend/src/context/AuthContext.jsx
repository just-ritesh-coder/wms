import { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const getInitialUser = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const partyId = localStorage.getItem('partyId');
  if (token && role) {
    return { token, role, partyId };
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getInitialUser());

  // Optional: Listen to storage events if needed, but not required for simple refresh


  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('role', userData.role);
    if (userData.partyId) localStorage.setItem('partyId', userData.partyId);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('partyId');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
