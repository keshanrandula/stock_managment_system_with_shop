import { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Boxes,
  UserCog,
  ShoppingBag,
  Ticket,
  History
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Staff'] },
    { name: 'Inventory', path: '/inventory', icon: Package, roles: ['Admin', 'Manager', 'Staff'] },
    { name: 'Suppliers', path: '/suppliers', icon: Users, roles: ['Admin', 'Manager'] },
    { name: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart, roles: ['Admin', 'Manager'] },
    { name: 'Sales (POS)', path: '/sales', icon: TrendingUp, roles: ['Admin', 'Manager', 'Staff'] },
    { name: 'Coupons', path: '/coupons', icon: Ticket, roles: ['Admin', 'Manager'] },
    { name: 'Stock Logs', path: '/stock-logs', icon: History, roles: ['Admin', 'Manager'] },
    { name: 'Manage Orders', path: '/orders', icon: ShoppingBag, roles: ['Admin', 'Manager'] },
    { name: 'User Management', path: '/users', icon: UserCog, roles: ['Admin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <Boxes size={28} />
        {!collapsed && <span>ApexStock</span>}
      </div>

      <ul className="sidebar-menu">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.name : ''}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        {user && !collapsed && (
          <div className="user-profile">
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="sidebar-item"
          style={{ width: '100%', border: 'none', background: 'none', marginTop: '12px' }}
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-item"
          style={{
            width: '100%',
            border: 'none',
            background: 'none',
            justifyContent: 'center',
            marginTop: '8px',
            color: 'var(--text-tertiary)'
          }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
