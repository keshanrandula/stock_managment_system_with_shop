import { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Plus, X, ShoppingBag, Eye, Trash2, CheckCircle2 } from 'lucide-react';

const PurchaseOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form state
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [cartItems, setCartItems] = useState([{ product: '', quantity: 1, costPrice: 0 }]);

  const canManage = user?.role === 'Admin' || user?.role === 'Manager';

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await API.get('/orders/purchases');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliersAndProducts = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        API.get('/suppliers'),
        API.get('/products')
      ]);
      if (supRes.data.success) setSuppliers(supRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSuppliersAndProducts();
  }, []);

  const handleOpenCreate = () => {
    setSelectedSupplier(suppliers[0]?._id || '');
    setCartItems([{ product: products[0]?._id || '', quantity: 1, costPrice: products[0]?.costPrice || 0 }]);
    setIsCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    const defaultProduct = products[0];
    setCartItems([...cartItems, {
      product: defaultProduct?._id || '',
      quantity: 1,
      costPrice: defaultProduct?.costPrice || 0
    }]);
  };

  const handleRemoveItemRow = (idx) => {
    if (cartItems.length === 1) return;
    setCartItems(cartItems.filter((_, i) => i !== idx));
  };

  const handleItemFieldChange = (idx, field, value) => {
    const updated = [...cartItems];
    updated[idx][field] = value;
    
    // Auto-fill cost price if product is changed
    if (field === 'product') {
      const prodObj = products.find(p => p._id === value);
      if (prodObj) {
        updated[idx].costPrice = prodObj.costPrice;
      }
    }
    setCartItems(updated);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) {
      alert('Please select a supplier');
      return;
    }

    try {
      const res = await API.post('/orders/purchases', {
        supplier: selectedSupplier,
        items: cartItems
      });
      if (res.data.success) {
        setIsCreateModalOpen(false);
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit Purchase Order');
    }
  };

  const handleReceiveOrder = async (id) => {
    if (window.confirm('Are you sure you want to mark this order as RECEIVED? This will permanently increment your warehouse stock levels.')) {
      try {
        const res = await API.patch(`/orders/purchases/${id}/receive`);
        if (res.data.success) {
          fetchOrders();
          if (selectedOrder?._id === id) {
            setIsDetailModalOpen(false);
          }
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Receiving order failed');
      }
    }
  };

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  // Get status color coding badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Received':
        return <span className="badge badge-success">Received</span>;
      case 'Ordered':
        return <span className="badge badge-warning">Ordered</span>;
      case 'Cancelled':
        return <span className="badge badge-danger">Cancelled</span>;
      default:
        return <span className="badge badge-info">Draft</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Purchase Orders</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Replenish inventory stocks by ordering from suppliers</p>
        </div>

        {canManage && (
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <Plus size={18} />
            <span>Create Purchase Order</span>
          </button>
        )}
      </div>

      {/* Orders Directory Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier Partner</th>
                <th>Items Count</th>
                <th>Total Cost</th>
                <th>Status</th>
                <th>Order Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Loading purchase logs...</td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map(order => (
                  <tr key={order._id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{order.poNumber}</td>
                    <td style={{ fontWeight: 500 }}>{order.supplier?.name}</td>
                    <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)} units</td>
                    <td>${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenDetail(order)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px' }}
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        {canManage && order.status !== 'Received' && (
                          <button
                            onClick={() => handleReceiveOrder(order._id)}
                            className="btn btn-primary"
                            style={{ padding: '6px 10px', backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                            title="Mark Received"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No restocking records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CREATE PURCHASE ORDER */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">New Purchase Order</h3>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitOrder}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Supplier</label>
                  <select
                    className="form-control"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    required
                  >
                    <option value="" disabled>Choose partner</option>
                    {suppliers.map(sup => (
                      <option key={sup._id} value={sup._id}>{sup.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Order Line Items</span>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={handleAddItemRow}>
                      <Plus size={14} /> Add Row
                    </button>
                  </div>

                  {cartItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '12px' }}>
                      <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Product</label>
                        <select
                          className="form-control"
                          value={item.product}
                          onChange={(e) => handleItemFieldChange(idx, 'product', e.target.value)}
                          required
                        >
                          <option value="" disabled>Select item</option>
                          {products.map(prod => (
                            <option key={prod._id} value={prod._id}>{prod.name} ({prod.sku})</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Quantity</label>
                        <input
                          type="number"
                          className="form-control"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ flex: 1.2, marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Unit Cost ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          min="0"
                          value={item.costPrice}
                          onChange={(e) => handleItemFieldChange(idx, 'costPrice', e.target.value)}
                          required
                        />
                      </div>

                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '10px', height: '40px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={cartItems.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'right' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Calculated Total Sum:</p>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
                    ${cartItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.costPrice || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save & Submit Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW PURCHASE ORDER DETAIL */}
      {isDetailModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Order Sheet: {selectedOrder.poNumber}</h3>
              <button className="modal-close" onClick={() => setIsDetailModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.9rem' }}>
                <div>
                  <p style={{ color: 'var(--text-secondary)' }}>Supplier Partner:</p>
                  <h4 style={{ fontWeight: 700, marginTop: '2px' }}>{selectedOrder.supplier?.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{selectedOrder.supplier?.email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>Status:</p>
                  <div style={{ marginTop: '4px' }}>{getStatusBadge(selectedOrder.status)}</div>
                </div>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Cost</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{item.product?.name || 'Deleted Product'}</td>
                        <td>{item.quantity}</td>
                        <td>${item.costPrice.toFixed(2)}</td>
                        <td>${(item.quantity * item.costPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Order Total:</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>${selectedOrder.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              </div>
            </div>
            <div className="modal-footer">
              {canManage && selectedOrder.status !== 'Received' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                  onClick={() => handleReceiveOrder(selectedOrder._id)}
                >
                  Confirm Received (Add Stock)
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PurchaseOrders;
