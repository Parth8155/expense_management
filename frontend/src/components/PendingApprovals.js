import React, { useState, useEffect } from 'react';
import approvalService from '../services/approvalService';
import './PendingApprovals.css';

const PendingApprovals = ({ onApprovalAction }) => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await approvalService.getPendingApprovals();
      setPendingApprovals(data.expenses || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (expense) => {
    if (onApprovalAction) {
      onApprovalAction(expense, 'approve');
    }
  };

  const handleReject = (expense) => {
    if (onApprovalAction) {
      onApprovalAction(expense, 'reject');
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="pending-approvals-loading">Loading pending approvals...</div>;
  }

  if (error) {
    return (
      <div className="pending-approvals-error">
        <p>Error: {error}</p>
        <button onClick={fetchPendingApprovals} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (pendingApprovals.length === 0) {
    return (
      <div className="pending-approvals-empty">
        <p>No pending approvals at this time.</p>
      </div>
    );
  }

  return (
    <div className="pending-approvals">
      <h2>Pending Approvals</h2>
      <div className="approvals-table-container">
        <table className="approvals-table">
          <thead>
            <tr>
              <th>Submitter</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Date</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingApprovals.map((expense) => (
              <tr key={expense._id}>
                <td className="submitter-cell">
                  {expense.submitter ? 
                    `${expense.submitter.firstName} ${expense.submitter.lastName}` : 
                    'Unknown'
                  }
                </td>
                <td className="amount-cell">
                  <div className="amount-display">
                    {formatCurrency(expense.convertedAmount || expense.amount, expense.companyCurrency || expense.currency)}
                    {expense.convertedAmount && expense.currency !== (expense.companyCurrency || expense.currency) && (
                      <div className="original-amount">
                        Original: {formatCurrency(expense.amount, expense.currency)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="category-cell">{expense.category}</td>
                <td className="date-cell">{formatDate(expense.expenseDate)}</td>
                <td className="description-cell" title={expense.description}>
                  {expense.description.length > 50 
                    ? `${expense.description.substring(0, 50)}...` 
                    : expense.description
                  }
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button 
                      className="approve-button"
                      onClick={() => handleApprove(expense)}
                      title="Approve expense"
                    >
                      Approve
                    </button>
                    <button 
                      className="reject-button"
                      onClick={() => handleReject(expense)}
                      title="Reject expense"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="approvals-summary">
        <p>{pendingApprovals.length} expense{pendingApprovals.length !== 1 ? 's' : ''} awaiting your approval</p>
      </div>
    </div>
  );
};

export default PendingApprovals;