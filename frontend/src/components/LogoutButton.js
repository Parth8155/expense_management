import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Standalone logout button component that can be used anywhere in the app
 * This is useful for pages that don't use the main Layout component
 */
const LogoutButton = ({ className = '', style = {}, children = 'Logout' }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const defaultStyle = {
    background: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    ...style
  };

  return (
    <button
      onClick={handleLogout}
      className={className}
      style={defaultStyle}
      onMouseOver={(e) => {
        e.target.style.background = '#b91c1c';
        e.target.style.transform = 'translateY(-1px)';
      }}
      onMouseOut={(e) => {
        e.target.style.background = '#dc2626';
        e.target.style.transform = 'translateY(0)';
      }}
    >
      {children}
    </button>
  );
};

export default LogoutButton;