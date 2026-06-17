import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

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
          <h3>Verifying credentials...</h3>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.map(r => r.toLowerCase()).includes(user.role.toLowerCase())) {
    // If the role is unauthorized, redirect to the dashboard (which handles nested redirects)
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
