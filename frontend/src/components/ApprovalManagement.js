import React, { useState } from 'react';
import PendingApprovals from './PendingApprovals';
import ApprovalAction from './ApprovalAction';
import './ApprovalManagement.css';

const ApprovalManagement = () => {
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleApprovalAction = (expense, action) => {
    setSelectedExpense(expense);
    setActionType(action);
  };

  const handleActionClose = () => {
    setSelectedExpense(null);
    setActionType(null);
  };

  const handleActionSuccess = (result, action) => {
    // Refresh the pending approvals list
    setRefreshKey(prev => prev + 1);
    
    // Show success message (you could use a toast notification here)
    console.log(`Expense ${action}d successfully:`, result);
  };

  return (
    <div className="approval-management">
      <div className="approval-management-header">
        <h1>Approval Management</h1>
        <p>Review and approve pending expense submissions</p>
      </div>

      <PendingApprovals 
        key={refreshKey}
        onApprovalAction={handleApprovalAction}
      />

      {selectedExpense && actionType && (
        <ApprovalAction
          expense={selectedExpense}
          action={actionType}
          onClose={handleActionClose}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
};

export default ApprovalManagement;