import { useContext, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Sun, Moon, Bell } from 'lucide-react';
import API from '../services/api';

const DashboardLayout = () => {
  const { user, loading } = useContext(AuthContext);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

  const fetchLowStock = async () => {
    try {
      const res = await API.get('/products/alerts/low-stock');
      if (res.data.success) {
        setLowStockProducts(res.data.data);
        setLowStockCount(res.data.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch low stock alerts', err);
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user && (user.role === 'Admin' || user.role === 'Manager')) {
      fetchLowStock();
      const interval = setInterval(fetchLowStock, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <h3>Loading ApexStock...</h3>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect Customer away from any dashboard wrapper route to storefront /shop
  if (user.role.toLowerCase() === 'customer') {
    return <Navigate to="/shop" replace />;
  }

  // Redirect Staff to /inventory if they access the root route '/'
  if (user.role.toLowerCase() === 'staff' && location.pathname === '/') {
    return <Navigate to="/inventory" replace />;
  }

  // Get current page header title
  const getHeaderTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'System Performance Overview';
      case '/inventory':
        return 'Inventory & Stock Catalog';
      case '/suppliers':
        return 'Supplier Management Directory';
      case '/purchase-orders':
        return 'Purchase Orders & Restocking';
      case '/sales':
        return 'Sales Checkout (POS)';
      case '/coupons':
        return 'Discount Coupons Dashboard';
      case '/stock-logs':
        return 'Audit Trail & Stock Logs';
      case '/orders':
        return 'Sales & Orders Management';
      case '/users':
        return 'User Administration Panel';
      default:
        return 'Management Dashboard';
    }
  };

  return (
    <div className="app-container">
      <div className="main-layout">
        <Sidebar />
        <div className="content-wrapper">
          <header className="navbar">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{getHeaderTitle()}</h2>
             <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              
              {(user?.role === 'Admin' || user?.role === 'Manager') && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                      padding: '4px'
                    }}
                    title="Low Stock Alerts"
                  >
                    <Bell size={20} />
                    {lowStockCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        backgroundColor: 'var(--color-danger)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {lowStockCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="card" style={{
                      position: 'absolute',
                      top: '40px',
                      right: '0',
                      width: '300px',
                      maxHeight: '350px',
                      overflowY: 'auto',
                      zIndex: 200,
                      padding: '16px',
                      boxShadow: 'var(--shadow-xl)',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      textAlign: 'left'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Low Stock Alerts</span>
                        <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>{lowStockCount} Items</span>
                      </div>
                      
                      {lowStockProducts.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {lowStockProducts.map(prod => (
                            <div key={prod._id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '8px', borderBottom: '1px dotted var(--border-color)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{prod.name}</span>
                                <span style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.75rem' }}>{prod.quantity} units</span>
                              </div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>SKU: {prod.sku} (Threshold: {prod.lowStockThreshold})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '12px 0' }}>All stock levels healthy!</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
          </header>

          <main className="page-container">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
