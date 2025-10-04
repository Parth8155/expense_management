import React from 'react';
import './ApprovalHistory.css';

const ApprovalHistory = ({ expense, approvalActions = [], currentStep = 0 }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStepStatus = (stepNumber) => {
    const action = approvalActions.find(action => action.stepNumber === stepNumber);
    if (action) {
      return action.action.toLowerCase(); // 'approved' or 'rejected'
    }
    if (stepNumber === currentStep) {
      return 'current';
    }
    if (stepNumber < currentStep) {
      return 'completed';
    }
    return 'pending';
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'approved':
        return '✓';
      case 'rejected':
        return '✗';
      case 'current':
        return '●';
      case 'completed':
        return '✓';
      default:
        return '○';
    }
  };

  const getStepClass = (status) => {
    return `timeline-step ${status}`;
  };

  // Get approval rule steps if available
  const approvalSteps = expense?.approvalRule?.approvalSteps || [];
  
  // If no approval rule, create a simple timeline based on actions
  const timelineSteps = approvalSteps.length > 0 
    ? approvalSteps.map((step, index) => ({
        stepNumber: step.sequenceOrder || index + 1,
        approvers: step.approvers || [],
        isRuleStep: true
      }))
    : approvalActions.map((action, index) => ({
        stepNumber: action.stepNumber || index + 1,
        approvers: [{ userId: action.approverId }],
        isRuleStep: false
      }));

  // Add manager approval step if applicable
  if (expense?.approvalRule?.isManagerApprover && expense?.submitter?.managerId) {
    timelineSteps.unshift({
      stepNumber: 0,
      approvers: [{ userId: expense.submitter.managerId }],
      isManagerStep: true
    });
  }

  return (
    <div className="approval-history">
      <h4>Approval History</h4>
      
      {approvalActions.length === 0 && currentStep === 0 ? (
        <div className="no-history">
          <p>No approval actions yet. Expense is pending initial review.</p>
        </div>
      ) : (
        <div className="timeline">
          {timelineSteps.map((step, index) => {
            const status = getStepStatus(step.stepNumber);
            const action = approvalActions.find(a => a.stepNumber === step.stepNumber);
            
            return (
              <div key={`step-${step.stepNumber}`} className={getStepClass(status)}>
                <div className="timeline-marker">
                  <span className="step-icon">{getStepIcon(status)}</span>
                </div>
                
                <div className="timeline-content">
                  <div className="step-header">
                    <h5>
                      {step.isManagerStep ? 'Manager Approval' : `Step ${step.stepNumber}`}
                      {status === 'current' && <span className="current-indicator">(Current)</span>}
                    </h5>
                    <span className={`status-badge ${status}`}>
                      {status === 'current' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="step-details">
                    {step.approvers.length > 0 && (
                      <div className="approvers-list">
                        <strong>Approver(s):</strong>
                        <ul>
                          {step.approvers.map((approver, approverIndex) => (
                            <li key={approverIndex}>
                              {approver.user ? 
                                `${approver.user.firstName} ${approver.user.lastName}` :
                                approver.userId || 'Unknown Approver'
                              }
                              {approver.isSpecificApprover && (
                                <span className="specific-approver-badge">Key Approver</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {action && (
                      <div className="action-details">
                        <div className="action-info">
                          <strong>Action by:</strong> 
                          {action.approver ? 
                            ` ${action.approver.firstName} ${action.approver.lastName}` :
                            ' Unknown'
                          }
                        </div>
                        <div className="action-date">
                          <strong>Date:</strong> {formatDate(action.actionDate)}
                        </div>
                        {action.comments && (
                          <div className="action-comments">
                            <strong>Comments:</strong>
                            <p>{action.comments}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {status === 'pending' && (
                      <div className="pending-info">
                        <em>Awaiting approval from designated approver(s)</em>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Overall Status */}
      <div className="overall-status">
        <div className={`status-summary ${expense?.status?.toLowerCase()}`}>
          <strong>Overall Status:</strong> 
          <span className="status-text">
            {expense?.status || 'PENDING'}
          </span>
        </div>
        
        {expense?.status === 'PENDING' && (
          <div className="next-step-info">
            <em>
              {currentStep === 0 
                ? 'Waiting for initial approval' 
                : `Currently at step ${currentStep}`
              }
            </em>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalHistory;