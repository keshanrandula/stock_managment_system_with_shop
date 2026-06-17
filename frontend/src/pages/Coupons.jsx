import { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Plus, Trash2, X, Ticket, FileDown } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

const Coupons = () => {
  const { user } = useContext(AuthContext);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  const canManage = user?.role === 'Admin' || user?.role === 'Manager';

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await API.get('/coupons');
      if (res.data.success) {
        setCoupons(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenCreate = () => {
    setCode('');
    setDiscountPercentage('');
    setExpirationDate('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || !discountPercentage || !expirationDate) {
      alert('Please fill out all fields');
      return;
    }

    const payload = {
      code,
      discountPercentage: Number(discountPercentage),
      expirationDate: new Date(expirationDate)
    };

    try {
      const res = await API.post('/coupons', payload);
      if (res.data.success) {
        setIsModalOpen(false);
        fetchCoupons();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        const res = await API.delete(`/coupons/${id}`);
        if (res.data.success) {
          fetchCoupons();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete coupon');
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['code', 'discountPercentage', 'expirationDate', 'isActive'];
    const displayHeaders = ['Code', 'Discount (%)', 'Expiration Date', 'Active'];
    const data = coupons.map(c => ({
      code: c.code,
      discountPercentage: c.discountPercentage,
      expirationDate: new Date(c.expirationDate).toLocaleDateString(),
      isActive: c.isActive ? 'Yes' : 'No'
    }));
    exportToCSV(headers, data, 'Coupons_List.csv', displayHeaders);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Discount Coupons</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage promotional codes and storefront discount campaigns</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <FileDown size={18} />
            <span>Export CSV</span>
          </button>
          {canManage && (
            <button onClick={handleOpenCreate} className="btn btn-primary">
              <Plus size={18} />
              <span>Create Coupon</span>
            </button>
          )}
        </div>
      </div>

      {/* Coupons List Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Discount Percentage</th>
                <th>Expiration Date</th>
                <th>Status</th>
                {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading coupons...</td>
                </tr>
              ) : coupons.length > 0 ? (
                coupons.map(coupon => {
                  const isExpired = new Date(coupon.expirationDate) < new Date();
                  const statusLabel = isExpired ? 'Expired' : (coupon.isActive ? 'Active' : 'Inactive');
                  const badgeClass = isExpired ? 'badge-danger' : (coupon.isActive ? 'badge-success' : 'badge-warning');

                  return (
                    <tr key={coupon._id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Ticket size={16} style={{ color: 'var(--color-primary)' }} />
                          <span>{coupon.code}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{coupon.discountPercentage}% OFF</td>
                      <td>{new Date(coupon.expirationDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{statusLabel}</span>
                      </td>
                      {canManage && (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleDelete(coupon._id)}
                            className="btn btn-danger"
                            style={{ padding: '6px 10px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}
                            title="Delete Coupon"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    No promotional coupons found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREATE COUPON */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Discount Coupon</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Coupon Code (Uppercase)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g. SAVE20"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Discount Percentage (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="E.g. 20"
                    min="1"
                    max="100"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expiration Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Coupons;
