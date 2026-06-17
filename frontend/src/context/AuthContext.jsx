import { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user session exists in localStorage
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        const userData = {
          id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          avatarUrl: res.data.avatarUrl
        };
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (name, email, password, avatarUrl) => {
    try {
      const res = await API.post('/auth/register', { name, email, password, avatarUrl });
      if (res.data.success) {
        const userData = {
          id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          avatarUrl: res.data.avatarUrl
        };
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
