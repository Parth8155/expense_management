import React, { useState, useEffect } from 'react';
import userService from '../services/userService';
import './RoleAssignment.css';

const RoleAssignment = ({ userId, currentRole, userName, onRoleChanged, onCancel }) => {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const roles = [
    { value: 'EMPLOYEE', label: 'Employee', description: 'Can submit and view own expenses' },
    { value: 'MANAGER', label: 'Manager', description: 'Can approve team expenses and manage team members' },
    { value: 'FINANCE', label: 'Finance', description: 'Can review and approve expenses in the finance workflow' },
    { value: 'DIRECTOR', label: 'Director', description: 'Can provide final approval for expenses' },
    { value: 'ADMIN', label: 'Admin', description: 'Full system access including user and company management' }
  ];

  useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole]);

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    setError(null); // Clear any previous errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedRole === currentRole) {
      setError('Please select a different role to make changes');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await userService.changeUserRole(userId, selectedRole);
      
      if (onRoleChanged) {
        onRoleChanged(response.data.user);
      }
    } catch (err) {
      setError(err.message || 'Failed to change user role');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedRole(currentRole); // Reset to original role
    setError(null);
    if (onCancel) {
      onCancel();
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN':
        return '👑';
      case 'DIRECTOR':
        return '🏢';
      case 'FINANCE':
        return '💰';
      case 'MANAGER':
        return '👔';
      case 'EMPLOYEE':
        return '👤';
      default:
        return '❓';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return '#dc3545';
      case 'DIRECTOR':
        return '#3f51b5';
      case 'FINANCE':
        return '#4caf50';
      case 'MANAGER':
        return '#fd7e14';
      case 'EMPLOYEE':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="role-assignment-container">
      <div className="role-assignment-header">
        <h3>Change User Role</h3>
        <p className="user-info">
          Changing role for: <strong>{userName}</strong>
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="role-assignment-form">
        <div className="current-role-section">
          <h4>Current Role</h4>
          <div className="role-display">
            <span className="role-icon">{getRoleIcon(currentRole)}</span>
            <span 
              className="role-name"
              style={{ color: getRoleColor(currentRole) }}
            >
              {roles.find(r => r.value === currentRole)?.label}
            </span>
          </div>
        </div>

        <div className="new-role-section">
          <h4>Select New Role</h4>
          <div className="role-options">
            {roles.map(role => (
              <label key={role.value} className="role-option">
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={selectedRole === role.value}
                  onChange={handleRoleChange}
                  disabled={loading}
                />
                <div className="role-option-content">
                  <div className="role-option-header">
                    <span className="role-icon">{getRoleIcon(role.value)}</span>
                    <span 
                      className="role-name"
                      style={{ color: getRoleColor(role.value) }}
                    >
                      {role.label}
                    </span>
                    {role.value === currentRole && (
                      <span className="current-badge">Current</span>
                    )}
                  </div>
                  <p className="role-description">{role.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {selectedRole !== currentRole && (
          <div className="role-change-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <strong>Role Change Impact:</strong>
              <ul>
                <li>User permissions will be updated immediately</li>
                <li>User may need to log in again to see changes</li>
                {selectedRole === 'ADMIN' && (
                  <li>User will gain full administrative access</li>
                )}
                {currentRole === 'ADMIN' && selectedRole !== 'ADMIN' && (
                  <li>User will lose administrative privileges</li>
                )}
                {selectedRole === 'EMPLOYEE' && currentRole === 'MANAGER' && (
                  <li>User will no longer be able to approve expenses</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || selectedRole === currentRole}
          >
            {loading ? 'Changing Role...' : 'Change Role'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleAssignment;