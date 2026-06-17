import { useEffect, useState } from 'react';
import API from '../services/api';
import { Search, Eye, X, Check, Trash2, Printer, ShoppingBag, Calendar, CreditCard, User } from 'lucide-react';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Selected Order for details modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await API.get('/orders/sales');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    const confirmMsg = newStatus === 'Cancelled'
      ? 'Are you sure you want to cancel this order? This will restore product quantities back to the stock catalog.'
      : 'Are you sure you want to approve and complete this order?';

    if (window.confirm(confirmMsg)) {
      try {
        const res = await API.put(`/orders/sales/${orderId}/status`, { status: newStatus });
        if (res.data.success) {
          alert(`Order successfully updated to ${newStatus}`);
          // Close modal and refresh list
          setIsModalOpen(false);
          setSelectedOrder(null);
          fetchOrders();
        }
      } catch (err) {
        alert(err.response?.data?.message || `Failed to update status to ${newStatus}`);
      }
    }
  };

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter orders by search query and status filter
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Overview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Sales Order Management</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Review client self-checkout orders, modify fulfillment status, and revert transactions</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '450px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search orders by Invoice No or Client..."
            style={{ paddingLeft: '38px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Tab Buttons */}
        <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          {['All', 'Pending', 'Completed', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.75rem',
                backgroundColor: statusFilter === status ? 'var(--bg-secondary)' : 'transparent',
                color: statusFilter === status ? 'var(--color-primary)' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table list */}
      <div className="card" style={{ padding: '24px' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Order Date</th>
                <th>Customer Name</th>
                <th>Payment Method</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Loading client transactions backlog...</td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map(order => {
                  const statusClass = order.status === 'Completed'
                    ? 'badge-success'
                    : order.status === 'Cancelled'
                      ? 'badge-danger'
                      : 'badge-warning';

                  return (
                    <tr key={order._id}>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{order.invoiceNumber}</td>
                      <td>{new Date(order.createdAt).toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>{order.customerName}</td>
                      <td>
                        <span className="badge badge-info">{order.paymentMethod}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>${order.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${statusClass}`}>{order.status || 'Pending'}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenDetails(order)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Eye size={14} />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    No matching sales orders found in catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER REVIEW & FULFILLMENT MODAL */}
      {isModalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 className="modal-title" style={{ margin: 0 }}>Review Invoice Receipt</h3>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body print-area" style={{ padding: '24px', textAlign: 'left' }}>
              
              {/* Receipt Header details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 4px 0' }}>APEXSTOCK LTD</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Order Status & Details Panel</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
                    <span className={`badge ${
                      selectedOrder.status === 'Completed'
                        ? 'badge-success'
                        : selectedOrder.status === 'Cancelled'
                          ? 'badge-danger'
                          : 'badge-warning'
                    }`} style={{ fontSize: '0.7rem' }}>
                      {selectedOrder.status || 'Pending'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', textAlign: 'right', alignItems: 'flex-end' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Invoice No: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedOrder.invoiceNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} style={{ color: 'var(--text-tertiary)' }} />
                    <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CreditCard size={13} style={{ color: 'var(--text-tertiary)' }} />
                    <span>Payment: {selectedOrder.paymentMethod}</span>
                  </div>
                  {selectedOrder.recordedBy && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={13} style={{ color: 'var(--text-tertiary)' }} />
                      <span style={{ fontSize: '0.75rem' }}>Authorized by: {selectedOrder.recordedBy?.name || 'Customer Port'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Client information box */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CLIENT ACCOUNT NAME</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedOrder.customerName}</p>
              </div>

              {/* Items listing table */}
              <h5 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>ITEMS PURCHASED</h5>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Product Name / SKU</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Qty</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Price</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600 }}>{item.product?.name || 'Unknown Item'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{item.product?.sku}</div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>${item.sellingPrice.toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>${(item.quantity * item.sellingPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary prices info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', borderTop: '1px dashed var(--border-color)', paddingTop: '12px', marginTop: '16px', alignItems: 'flex-end' }}>
                <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tax Charges:</span>
                    <span>+${selectedOrder.taxAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Discount Applied:</span>
                    <span>-${selectedOrder.discountAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                    <span>Grand Total:</span>
                    <span style={{ color: 'var(--color-primary)' }}>${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal actions footer */}
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedOrder.status === 'Pending' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Completed')}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Check size={16} />
                    <span>Approve & Fulfill</span>
                  </button>
                )}
                {selectedOrder.status !== 'Cancelled' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Cancelled')}
                    className="btn btn-danger"
                    style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Trash2 size={16} />
                    <span>Cancel Order</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handlePrint}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={16} />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printing style rules */}
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
          .modal-close, .modal-footer, header, .sidebar, .btn {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
};

export default ManageOrders;
