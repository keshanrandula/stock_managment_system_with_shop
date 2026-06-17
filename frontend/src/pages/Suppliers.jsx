import { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X, Users, Mail, Phone, MapPin } from 'lucide-react';

const Suppliers = () => {
  const { user } = useContext(AuthContext);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const canManage = user?.role === 'Admin' || user?.role === 'Manager';
  const canDelete = user?.role === 'Admin';

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/suppliers');
      if (res.data.success) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAddress('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setSelectedSupplier(sup);
    setName(sup.name);
    setContactPerson(sup.contactPerson || '');
    setEmail(sup.email || '');
    setPhone(sup.phone || '');
    setAddress(sup.address || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { name, contactPerson, email, phone, address };

    try {
      if (selectedSupplier) {
        // Edit Mode
        const res = await API.put(`/suppliers/${selectedSupplier._id}`, payload);
        if (res.data.success) {
          setIsModalOpen(false);
          fetchSuppliers();
        }
      } else {
        // Create Mode
        const res = await API.post('/suppliers', payload);
        if (res.data.success) {
          setIsModalOpen(false);
          fetchSuppliers();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save supplier profile');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier profile?')) {
      try {
        const res = await API.delete(`/suppliers/${id}`);
        if (res.data.success) {
          fetchSuppliers();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete supplier');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Active Suppliers</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Directory of wholesaling partnerships and contact terms</p>
        </div>

        {canManage && (
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <Plus size={18} />
            <span>Add Supplier</span>
          </button>
        )}
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading supplier files...</div>
      ) : suppliers.length > 0 ? (
        <div className="grid-3">
          {suppliers.map(sup => (
            <div key={sup._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--color-primary)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <Users size={22} />
                </div>
                {canManage && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenEdit(sup)}
                      className="btn btn-secondary"
                      style={{ padding: '6px' }}
                      title="Edit Supplier"
                    >
                      <Edit2 size={14} />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(sup._id)}
                        className="btn btn-danger"
                        style={{ padding: '6px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}
                        title="Delete Supplier"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sup.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Contact: <strong>{sup.contactPerson || 'None listed'}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span>{sup.email || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span>{sup.phone || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sup.address || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <p>No wholesale suppliers registered yet. Click "Add Supplier" to get started.</p>
        </div>
      )}

      {/* MODAL: ADD/EDIT SUPPLIER */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedSupplier ? 'Update Supplier Profile' : 'Register New Supplier'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Supplier Name / Company</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g. Logistics Corp"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Person Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g. Jane Smith"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="sales@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Physical Address</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="123 Warehouse St, Suite A"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Suppliers;
