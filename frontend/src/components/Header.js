import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigationItems = () => {
    if (!user) return [];

    const items = [
      { path: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
      { path: '/expenses', label: 'Expenses', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    ];

    // Add role-specific navigation items
    if (user.role === 'ADMIN') {
      items.push(
        { path: '/users', label: 'Users', roles: ['ADMIN'] },
        { path: '/approval-rules', label: 'Approval Rules', roles: ['ADMIN'] }
      );
    }

    return items.filter(item => item.roles.includes(user.role));
  };

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  if (!user) {
    return null; // Don't show header on login/signup pages
  }

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo">
            <h1>ExpenseTracker</h1>
          </div>
          <nav className="main-nav">
            {getNavigationItems().map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`nav-item ${isActivePath(item.path) ? 'active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">
              {user.firstName} {user.lastName}
            </span>
            <span className="user-role">
              {user.role}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="logout-btn"
            title="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;