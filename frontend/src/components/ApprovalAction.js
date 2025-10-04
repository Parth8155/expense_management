import React, { useState } from 'react';
import approvalService from '../services/approvalService';
import './ApprovalAction.css';

const ApprovalAction = ({ expense, action, onClose, onSuccess }) => {
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isReject = action === 'reject';
  const isApprove = action === 'approve';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isReject && !comments.trim()) {
      setError('Comments are required when rejecting an expense');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let result;
      if (isApprove) {
        result = await approvalService.approveExpense(expense._id, comments);
      } else if (isReject) {
        result = await approvalService.rejectExpense(expense._id, comments);
      }

      if (onSuccess) {
        onSuccess(result, action);
      }
      
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError(err.message || `Failed to ${action} expense`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
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

  return (
    <div className="approval-action-overlay">
      <div className="approval-action-modal">
        <div className="approval-action-header">
          <h3>
            {isApprove ? 'Approve' : 'Reject'} Expense
          </h3>
          <button 
            className="close-button"
            onClick={handleCancel}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="approval-action-content">
          {/* Expense Details */}
          <div className="expense-details-section">
            <h4>Expense Details</h4>
            <div className="expense-details-grid">
              <div className="detail-item">
                <label>Submitter:</label>
                <span>
                  {expense.submitter ? 
                    `${expense.submitter.firstName} ${expense.submitter.lastName}` : 
                    'Unknown'
                  }
                </span>
              </div>
              <div className="detail-item">
                <label>Amount:</label>
                <span className="amount-display">
                  {formatCurrency(expense.convertedAmount || expense.amount, expense.companyCurrency || expense.currency)}
                  {expense.convertedAmount && expense.currency !== (expense.companyCurrency || expense.currency) && (
                    <div className="original-amount">
                      Original: {formatCurrency(expense.amount, expense.currency)}
                    </div>
                  )}
                </span>
              </div>
              <div className="detail-item">
                <label>Category:</label>
                <span>{expense.category}</span>
              </div>
              <div className="detail-item">
                <label>Date:</label>
                <span>{formatDate(expense.expenseDate)}</span>
              </div>
              <div className="detail-item full-width">
                <label>Description:</label>
                <span>{expense.description}</span>
              </div>
              {expense.receiptUrl && (
                <div className="detail-item full-width">
                  <label>Receipt:</label>
                  <a 
                    href={expense.receiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="receipt-link"
                  >
                    View Receipt
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Action Form */}
          <form onSubmit={handleSubmit} className="approval-action-form">
            <div className="comments-section">
              <label htmlFor="comments" className="comments-label">
                Comments {isReject && <span className="required">*</span>}
              </label>
              <textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  isReject 
                    ? "Please provide a reason for rejection..." 
                    : "Add any comments (optional)..."
                }
                className="comments-textarea"
                rows={4}
                disabled={loading}
                required={isReject}
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="action-buttons">
              <button
                type="button"
                onClick={handleCancel}
                className="cancel-button"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`submit-button ${isApprove ? 'approve' : 'reject'}`}
                disabled={loading}
              >
                {loading ? 'Processing...' : (isApprove ? 'Approve' : 'Reject')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApprovalAction;