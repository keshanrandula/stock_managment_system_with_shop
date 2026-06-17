import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Boxes } from 'lucide-react';
import API from '../services/api';

const Login = () => {
  const { user, login, register } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      setUploadError('');
      const res = await API.post('/auth/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        setAvatarUrl(res.data.imageUrl);
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    // If already logged in, redirect
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.message);
      }
    } else {
      if (!name) {
        setError('Name is required');
        setLoading(false);
        return;
      }
      const result = await register(name, email, password, avatarUrl);
      if (!result.success) {
        setError(result.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="card auth-card glass-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Boxes size={42} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
            {isLogin ? 'Welcome back' : 'Create an Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {isLogin ? 'Log in to manage your inventory' : 'First user will register as Administrator'}
          </p>
        </div>

        {error && (
          <div className="badge badge-danger" style={{
            display: 'block',
            padding: '10px 14px',
            marginBottom: '20px',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            fontSize: '0.8rem',
            width: '100%',
            textTransform: 'none'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Profile Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  style={{ padding: '8px' }}
                  onChange={handleFileChange}
                />
                {uploading && <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Uploading profile picture...</span>}
                {uploadError && <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>{uploadError}</span>}
                {avatarUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid var(--border-color)' }}>
                      <img src={avatarUrl} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600 }}>Image uploaded successfully!</span>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="name@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0
            }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
