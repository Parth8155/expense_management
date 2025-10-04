import React, { useState } from 'react';
import UserList from './UserList';
import UserForm from './UserForm';
import RoleAssignment from './RoleAssignment';
import './UserManagement.css';

const UserManagement = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit', 'role'
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setCurrentView('create');
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setCurrentView('edit');
  };

  const handleChangeRole = (user) => {
    setSelectedUser(user);
    setCurrentView('role');
  };

  const handleUserSaved = (user) => {
    setCurrentView('list');
    setSelectedUser(null);
    // Trigger refresh of user list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRoleChanged = (user) => {
    setCurrentView('list');
    setSelectedUser(null);
    // Trigger refresh of user list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedUser(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'create':
        return (
          <UserForm
            onSave={handleUserSaved}
            onCancel={handleCancel}
          />
        );
      
      case 'edit':
        return (
          <UserForm
            userId={selectedUser?.id}
            onSave={handleUserSaved}
            onCancel={handleCancel}
          />
        );
      
      case 'role':
        return (
          <RoleAssignment
            userId={selectedUser?.id}
            currentRole={selectedUser?.role}
            userName={`${selectedUser?.firstName} ${selectedUser?.lastName}`}
            onRoleChanged={handleRoleChanged}
            onCancel={handleCancel}
          />
        );
      
      default:
        return (
          <UserList
            key={refreshTrigger} // Force re-render when refreshTrigger changes
            onCreateUser={handleCreateUser}
            onEditUser={handleEditUser}
            onChangeRole={handleChangeRole}
          />
        );
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'create':
        return 'Create New User';
      case 'edit':
        return 'Edit User';
      case 'role':
        return 'Change User Role';
      default:
        return 'User Management';
    }
  };

  const showBackButton = currentView !== 'list';

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div className="header-content">
          {showBackButton && (
            <button
              onClick={handleCancel}
              className="back-button"
              title="Back to User List"
            >
              ← Back
            </button>
          )}
          <h1>{getPageTitle()}</h1>
        </div>
        
        {currentView === 'list' && (
          <button
            onClick={handleCreateUser}
            className="btn btn-primary"
          >
            Add New User
          </button>
        )}
      </div>

      <div className="user-management-content">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default UserManagement;