import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProducts from './pages/Admin/Products';
import AdminParties from './pages/Admin/Parties';
import AdminPartyLedger from './pages/Admin/PartyLedger';
import AdminLedgerNew from './pages/Admin/LedgerNew';
import PartyDashboard from './pages/Party/Dashboard';
import AdminLayout from './components/Layout/AdminLayout';
import PartyLayout from './components/Layout/PartyLayout';
import AuthContext, { AuthProvider } from './context/AuthContext';
import { useContext } from 'react';

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useContext(AuthContext);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={
            <ProtectedRoute roles={['Admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="parties" element={<AdminParties />} />
            <Route path="parties/:id" element={<AdminPartyLedger />} />
            <Route path="ledger/new" element={<AdminLedgerNew />} />
          </Route>

          <Route path="/party" element={
            <ProtectedRoute roles={['Party']}>
              <PartyLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<PartyDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
