import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ApprovalRulesManagement from '../components/ApprovalRulesManagement';

const ApprovalRulesPage = () => {
  const { user } = useAuth();

  // Only admins can access approval rules management
  if (!user || user.role !== 'ADMIN') {
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
        <p>Only administrators can manage approval rules.</p>
      </div>
    );
  }

  return <ApprovalRulesManagement />;
};

export default ApprovalRulesPage;