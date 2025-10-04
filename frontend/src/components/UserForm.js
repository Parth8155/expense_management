import React, { useState, useEffect } from 'react';
import userService from '../services/userService';
import './UserForm.css';

const UserForm = ({ userId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    managerId: ''
  });
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    loadManagers();
    if (userId) {
      setIsEditMode(true);
      loadUser(userId);
    }
  }, [userId]);

  const loadManagers = async () => {
    try {
      const response = await userService.getUsers();
      // Filter to get only managers and admins who can be assigned as managers
      const availableManagers = response.data.users.filter(
        user => (user.role === 'MANAGER' || user.role === 'ADMIN') && user.isActive
      );
      setManagers(availableManagers);
    } catch (err) {
      console.error('Failed to load managers:', err);
    }
  };

  const loadUser = async (id) => {
    try {
      setLoading(true);
      const response = await userService.getUserById(id);
      const user = response.data.user;
      
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '', // Don't populate password for security
        role: user.role,
        managerId: user.managerId || ''
      });
    } catch (err) {
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!isEditMode && !formData.password) {
      errors.password = 'Password is required';
    } else if (!isEditMode && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
    }

    // Validate manager assignment for employees
    if (formData.role === 'EMPLOYEE' && !formData.managerId) {
      errors.managerId = 'Manager is required for employees';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        role: formData.role,
        managerId: formData.managerId || null
      };

      // Only include password for new users
      if (!isEditMode && formData.password) {
        userData.password = formData.password;
      }

      let response;
      if (isEditMode) {
        response = await userService.updateUser(userId, userData);
      } else {
        response = await userService.createUser(userData);
      }

      if (onSave) {
        onSave(response.data.user);
      }
    } catch (err) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="user-form-container">
        <div className="loading">Loading user...</div>
      </div>
    );
  }

  return (
    <div className="user-form-container">
      <div className="user-form-header">
        <h3>{isEditMode ? 'Edit User' : 'Create New User'}</h3>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={validationErrors.firstName ? 'error' : ''}
              disabled={loading}
            />
            {validationErrors.firstName && (
              <span className="error-text">{validationErrors.firstName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name *</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={validationErrors.lastName ? 'error' : ''}
              disabled={loading}
            />
            {validationErrors.lastName && (
              <span className="error-text">{validationErrors.lastName}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={validationErrors.email ? 'error' : ''}
            disabled={loading}
          />
          {validationErrors.email && (
            <span className="error-text">{validationErrors.email}</span>
          )}
        </div>

        {!isEditMode && (
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={validationErrors.password ? 'error' : ''}
              disabled={loading}
              placeholder="Minimum 8 characters"
            />
            {validationErrors.password && (
              <span className="error-text">{validationErrors.password}</span>
            )}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className={validationErrors.role ? 'error' : ''}
              disabled={loading}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
            {validationErrors.role && (
              <span className="error-text">{validationErrors.role}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="managerId">
              Manager {formData.role === 'EMPLOYEE' ? '*' : '(Optional)'}
            </label>
            <select
              id="managerId"
              name="managerId"
              value={formData.managerId}
              onChange={handleInputChange}
              className={validationErrors.managerId ? 'error' : ''}
              disabled={loading}
            >
              <option value="">Select Manager</option>
              {managers.map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.firstName} {manager.lastName} ({manager.role})
                </option>
              ))}
            </select>
            {validationErrors.managerId && (
              <span className="error-text">{validationErrors.managerId}</span>
            )}
          </div>
        </div>

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
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;