import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ApprovalManagement from '../components/ApprovalManagement';

const ApprovalManagementPage = () => {
  const { user } = useAuth();

  // Only managers and admins can access approval management
  if (!user || !['MANAGER', 'ADMIN'].includes(user.role)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h2>Access Denied</h2>
        <p>Only managers and administrators can manage approvals.</p>
      </div>
    );
  }

  return <ApprovalManagement />;
};

export default ApprovalManagementPage;