import React, { useState, useEffect } from 'react';
import userService from '../services/userService';
import './UserList.css';

const UserList = ({ onCreateUser, onEditUser, onChangeRole }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers();
      setUsers(response.data.users);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.managerName && user.managerName.toLowerCase().includes(term))
      );
    }

    // Role filter
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter) {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    setFilteredUsers(filtered);
  };

  const handleDeactivateUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to deactivate ${userName}?`)) {
      return;
    }

    try {
      await userService.deactivateUser(userId);
      await loadUsers(); // Reload the list
    } catch (err) {
      setError(err.message || 'Failed to deactivate user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userService.changeUserRole(userId, newRole);
      await loadUsers(); // Reload the list
    } catch (err) {
      setError(err.message || 'Failed to change user role');
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'role-badge role-admin';
      case 'MANAGER':
        return 'role-badge role-manager';
      case 'EMPLOYEE':
        return 'role-badge role-employee';
      default:
        return 'role-badge';
    }
  };

  const getStatusBadgeClass = (isActive) => {
    return isActive ? 'status-badge status-active' : 'status-badge status-inactive';
  };

  if (loading) {
    return (
      <div className="user-list-container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="user-list-container">
      <div className="user-list-header">
        <h2>All Users</h2>
        {onCreateUser && (
          <button className="btn btn-primary" onClick={onCreateUser}>
            Add New User
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="EMPLOYEE">Employee</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Manager</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  {users.length === 0 ? 'No users found' : 'No users match the current filters'}
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-name">
                      <strong>{user.firstName} {user.lastName}</strong>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={getRoleBadgeClass(user.role)}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.managerName || '-'}
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(user.isActive)}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {onEditUser && (
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => onEditUser(user)}
                          title="Edit User"
                        >
                          Edit
                        </button>
                      )}
                      
                      {onChangeRole && (
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => onChangeRole(user)}
                          title="Change Role"
                        >
                          Change Role
                        </button>
                      )}

                      {user.isActive && (
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeactivateUser(user.id, `${user.firstName} ${user.lastName}`)}
                          title="Deactivate User"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="users-summary">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
};

export default UserList;