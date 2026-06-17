import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import Sales from './pages/Sales';
import Login from './pages/Login';
import Users from './pages/Users';
import Shop from './pages/Shop';
import CustomerOrders from './pages/CustomerOrders';
import ManageOrders from './pages/ManageOrders';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import Coupons from './pages/Coupons';
import StockLogs from './pages/StockLogs';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Customer Storefront Routes */}
          <Route path="/shop" element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff', 'Customer']}>
              <Shop />
            </ProtectedRoute>
          } />
          <Route path="/shop/orders" element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff', 'Customer']}>
              <CustomerOrders />
            </ProtectedRoute>
          } />
          <Route path="/shop/about" element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff', 'Customer']}>
              <AboutUs />
            </ProtectedRoute>
          } />
          <Route path="/shop/contact" element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff', 'Customer']}>
              <ContactUs />
            </ProtectedRoute>
          } />

          {/* Secure Routes */}
          <Route path="/" element={<DashboardLayout />}>
            {/* Dashboard Analytics restricted to Admins/Managers */}
            <Route index element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            {/* Inventory catalog accessible to Admins, Managers, and Staff */}
            <Route path="inventory" element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff']}>
                <Inventory />
              </ProtectedRoute>
            } />
            {/* Suppliers restricted to Admins/Managers */}
            <Route path="suppliers" element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <Suppliers />
              </ProtectedRoute>
            } />
            {/* Purchase Orders restricted to Admins/Managers */}
            <Route path="purchase-orders" element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <PurchaseOrders />
              </ProtectedRoute>
            } />
            {/* Sales (POS) accessible to Admins, Managers, and Staff */}
            <Route path="sales" element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff']}>
                <Sales />
              </ProtectedRoute>
            } />
            {/* Coupons restricted to Admins/Managers */}
            <Route path="coupons" element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <Coupons />
              </ProtectedRoute>
            } />
            {/* Stock Activity Logs restricted to Admins/Managers */}
            <Route path="stock-logs" element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <StockLogs />
              </ProtectedRoute>
            } />
            {/* Manage Customer Orders restricted to Admins/Managers */}
            <Route path="orders" element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <ManageOrders />
              </ProtectedRoute>
            } />
            {/* User Management restricted to Admins */}
            <Route path="users" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <Users />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
