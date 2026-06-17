import { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Printer, X, Package, ShoppingBag, History, Eye, Globe, MessageSquare } from 'lucide-react';

const CustomerOrders = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Receipt Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await API.get('/orders/my-orders');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewReceipt = (order) => {
    setSelectedOrder(order);
    setIsReceiptOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      
      {/* Top Header */}
      <header className="navbar" style={{ position: 'sticky', top: 0, zIndex: 900, boxShadow: 'var(--shadow-sm)', padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShoppingBag size={26} style={{ color: 'var(--color-primary)' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>ApexStock Shop</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <nav style={{ display: 'flex', gap: '20px' }}>
            <Link to="/shop" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Catalog</Link>
            <Link to="/shop/orders" style={{ textDecoration: 'none', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={16} />
              <span>My Orders</span>
            </Link>
            <Link to="/shop/about" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>About Us</Link>
            <Link to="/shop/contact" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Contact Us</Link>
            {user.role.toLowerCase() !== 'customer' && (
              <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Go to Admin Dashboard</Link>
            )}
          </nav>

          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-color)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user.role}</span>
            </div>
          </div>

          <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '8px 12px' }} title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main orders history view */}
      <main className="page-container" style={{ padding: '40px 60px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Section Title */}
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Purchase Order History</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Track your self-checkout order statuses and print invoice records</p>
        </div>

        {/* Orders Table Catalog */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Order Date</th>
                  <th>Payment Type</th>
                  <th>Total Price</th>
                  <th>Fulfillment Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading your orders list...</td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map(order => {
                    const statusClass = order.status === 'Completed' 
                      ? 'badge-success' 
                      : order.status === 'Cancelled' 
                        ? 'badge-danger' 
                        : 'badge-warning';

                    return (
                      <tr key={order._id}>
                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{order.invoiceNumber}</td>
                        <td>{new Date(order.createdAt).toLocaleString()}</td>
                        <td>
                          <span className="badge badge-info">{order.paymentMethod}</span>
                        </td>
                        <td style={{ fontWeight: 700 }}>${order.totalAmount.toFixed(2)}</td>
                        <td>
                          <span className={`badge ${statusClass}`}>{order.status || 'Pending'}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => handleViewReceipt(order)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            title="View Receipt"
                          >
                            <Eye size={14} />
                            <span>Invoice</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '45px', color: 'var(--text-tertiary)' }}>
                      <History size={40} style={{ opacity: 0.5, marginBottom: '8px' }} />
                      <p>You haven't placed any storefront orders yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Invoice receipt details modal overlay */}
      {isReceiptOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '10px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h3 className="modal-title" style={{ width: '100%', textAlign: 'center' }}>Order Invoice</h3>
              <button className="modal-close" onClick={() => setIsReceiptOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body print-area" style={{ textAlign: 'left', padding: '10px 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>APEXSTOCK LTD</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Customer Self-Checkout Invoice</p>
                <div style={{ marginTop: '8px' }}>
                  <span className={`badge ${selectedOrder.status === 'Completed' ? 'badge-success' : selectedOrder.status === 'Cancelled' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                    Order Status: {selectedOrder.status || 'Pending'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', borderBottom: '1px dashed var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Invoice No:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedOrder.invoiceNumber}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Customer:</span>
                  <strong>{selectedOrder.customerName || 'Self Checkout'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Date/Time:</span>
                  <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Method:</span>
                  <span>{selectedOrder.paymentMethod}</span>
                </div>
              </div>

              {/* Items listing */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600 }}>{item.product?.name || 'Unknown Product'}</p>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{item.quantity} x ${item.sellingPrice.toFixed(2)}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>${(item.quantity * item.sellingPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', borderTop: '1px dashed var(--border-color)', paddingTop: '12px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                  <span>Grand Total:</span>
                  <span style={{ color: 'var(--color-primary)' }}>${selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <p>Thank you for shopping with us!</p>
                <p style={{ marginTop: '2px' }}>ApexStock - Intelligent Management Suite</p>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: 'none', background: 'none' }}>
              <button onClick={handlePrint} className="btn btn-primary" style={{ width: '100%' }}>
                <Printer size={16} />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printing rules */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .modal-close, .modal-footer {
            display: none !important;
          }
        }
      `}</style>

      {/* Footer */}
      <footer style={{ 
        backgroundColor: '#F8FAFC', 
        borderTop: '1px solid #E2E8F0', 
        padding: '32px 60px',
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={20} style={{ color: '#d97706' }} />
          <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '1.1rem' }}>ApexStock</span>
          <span style={{ color: '#64748B', fontSize: '0.85rem', marginLeft: '12px' }}>
            © 2024 ApexStock Shop. All rights reserved.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <Link to="/shop/about" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>About Us</Link>
          <Link to="/shop/contact" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Contact Us</Link>
          <a href="#" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Privacy Policy</a>
          <a href="#" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Terms of Service</a>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Globe size={18} style={{ color: '#64748B' }} />
          <MessageSquare size={18} style={{ color: '#64748B' }} />
        </div>
      </footer>

    </div>
  );
};

export default CustomerOrders;
