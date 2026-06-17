import { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Plus, ToggleLeft, ToggleRight, Trash2, Edit2, Shield, X, Check } from 'lucide-react';

const Users = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('Staff');
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/auth/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await API.post('/auth/register', {
        name: formName,
        email: formEmail,
        password: formPassword,
        role: formRole
      });
      if (res.data.success) {
        setIsAddModalOpen(false);
        // Clear fields
        setFormName('');
        setFormEmail('');
        setFormPassword('');
        setFormRole('Staff');
        fetchUsers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register new user');
    }
  };

  const handleToggleStatus = async (user) => {
    if (user._id === currentUser.id) {
      alert('You cannot deactivate your own account.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to ${user.isActive ? 'deactivate' : 'reactivate'} ${user.name}'s account?`)) {
      try {
        const res = await API.patch(`/auth/users/${user._id}/status`);
        if (res.data.success) {
          fetchUsers();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to update user status');
      }
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await API.put(`/auth/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user._id === currentUser.id) {
      alert('You cannot delete your own account.');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete user ${user.name}? This action is irreversible.`)) {
      try {
        const res = await API.delete(`/auth/users/${user._id}`);
        if (res.data.success) {
          fetchUsers();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Registered User Accounts</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage permissions, deactivate accounts, and update system roles</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>Add System User</span>
        </button>
      </div>

      {/* Users Catalog Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User Account</th>
                <th>Email Address</th>
                <th>Role Setting</th>
                <th>Account Status</th>
                <th>Registered Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading registered users...</td>
                </tr>
              ) : users.length > 0 ? (
                users.map(u => {
                  const isSelf = u._id === currentUser.id;
                  return (
                    <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                            {isSelf && <span style={{ marginLeft: '8px', fontSize: '0.65rem', padding: '2px 6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', fontWeight: 700 }}>YOU</span>}
                          </div>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        {isSelf ? (
                          <span className="badge badge-info">{u.role}</span>
                        ) : (
                          <select
                            className="form-control"
                            style={{ width: '130px', padding: '6px 10px', fontSize: '0.85rem' }}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          >
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Staff">Staff</option>
                            <option value="Customer">Customer</option>
                          </select>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          
                          {/* Toggle Status Button */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px' }}
                            disabled={isSelf}
                            title={u.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                          >
                            {u.isActive ? <ToggleRight size={18} style={{ color: 'var(--color-success)' }} /> : <ToggleLeft size={18} style={{ color: 'var(--text-tertiary)' }} />}
                          </button>

                          {/* Delete User Button */}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="btn btn-danger"
                            style={{ padding: '6px 10px' }}
                            disabled={isSelf}
                            title="Delete Account"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No registered users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW USER MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create User Account</h3>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                {error && <div className="badge badge-danger" style={{ display: 'block', padding: '10px', marginBottom: '16px', borderRadius: '4px', textTransform: 'none', textAlign: 'center' }}>{error}</div>}

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g. Samantha Perera"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="email@company.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">System Role</label>
                  <select className="form-control" value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                    <option value="Customer">Customer / Public Client</option>
                    <option value="Staff">Staff / Cashier</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Users;
