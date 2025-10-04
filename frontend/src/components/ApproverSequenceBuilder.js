import React, { useState, useEffect } from 'react';
import userService from '../services/userService';
import './ApproverSequenceBuilder.css';

const ApproverSequenceBuilder = ({ 
  approvalSteps, 
  onChange, 
  ruleType, 
  validationErrors = {} 
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userService.getUsers();
      // Filter out inactive users and sort by name
      const activeUsers = (response.data || [])
        .filter(user => user.isActive)
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
      setUsers(activeUsers);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const addApprovalStep = () => {
    const newStep = {
      sequenceOrder: approvalSteps.length + 1,
      approvers: []
    };
    onChange([...approvalSteps, newStep]);
  };

  const removeApprovalStep = (stepIndex) => {
    if (approvalSteps.length <= 1) return; // Don't allow removing the last step
    
    const updatedSteps = approvalSteps
      .filter((_, index) => index !== stepIndex)
      .map((step, index) => ({
        ...step,
        sequenceOrder: index + 1
      }));
    onChange(updatedSteps);
  };

  const addApproverToStep = (stepIndex, userId) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    const updatedSteps = [...approvalSteps];
    const existingApprover = updatedSteps[stepIndex].approvers.find(a => a.userId === userId);
    
    if (!existingApprover) {
      updatedSteps[stepIndex].approvers.push({
        userId: userId,
        isSpecificApprover: false
      });
      onChange(updatedSteps);
    }
  };

  const removeApproverFromStep = (stepIndex, approverIndex) => {
    const updatedSteps = [...approvalSteps];
    updatedSteps[stepIndex].approvers.splice(approverIndex, 1);
    onChange(updatedSteps);
  };

  const toggleSpecificApprover = (stepIndex, approverIndex) => {
    const updatedSteps = [...approvalSteps];
    updatedSteps[stepIndex].approvers[approverIndex].isSpecificApprover = 
      !updatedSteps[stepIndex].approvers[approverIndex].isSpecificApprover;
    onChange(updatedSteps);
  };

  const moveStep = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    const updatedSteps = [...approvalSteps];
    const [movedStep] = updatedSteps.splice(fromIndex, 1);
    updatedSteps.splice(toIndex, 0, movedStep);
    
    // Update sequence orders
    const reorderedSteps = updatedSteps.map((step, index) => ({
      ...step,
      sequenceOrder: index + 1
    }));
    
    onChange(reorderedSteps);
  };

  const handleDragStart = (e, stepIndex) => {
    setDraggedItem(stepIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem !== null && draggedItem !== dropIndex) {
      moveStep(draggedItem, dropIndex);
    }
    setDraggedItem(null);
  };

  const getUserName = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };

  const getUserRole = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? user.role : '';
  };

  const getAvailableUsers = (stepIndex) => {
    const currentStepApprovers = approvalSteps[stepIndex].approvers.map(a => a.userId);
    return users.filter(user => !currentStepApprovers.includes(user._id));
  };

  if (loading) {
    return <div className="sequence-builder-loading">Loading users...</div>;
  }

  return (
    <div className="approver-sequence-builder">
      <div className="sequence-header">
        <h3>Approval Steps</h3>
        <button
          type="button"
          onClick={addApprovalStep}
          className="btn btn-sm btn-secondary"
        >
          Add Step
        </button>
      </div>

      <div className="sequence-description">
        {ruleType === 'SEQUENTIAL' && (
          <p>Approvers must approve in sequence, one step after another.</p>
        )}
        {ruleType === 'CONDITIONAL' && (
          <p>Mark specific approvers whose approval can trigger auto-approval.</p>
        )}
        {ruleType === 'COMBINED' && (
          <p>Combines sequential flow with conditional auto-approval rules.</p>
        )}
      </div>

      <div className="approval-steps">
        {approvalSteps.map((step, stepIndex) => (
          <div
            key={stepIndex}
            className={`approval-step ${draggedItem === stepIndex ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, stepIndex)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stepIndex)}
          >
            <div className="step-header">
              <div className="step-info">
                <span className="step-number">Step {step.sequenceOrder}</span>
                <span className="drag-handle">⋮⋮</span>
              </div>
              <div className="step-actions">
                {approvalSteps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeApprovalStep(stepIndex)}
                    className="btn btn-sm btn-danger"
                    title="Remove step"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="step-content">
              <div className="approvers-section">
                <div className="section-header">
                  <span>Approvers</span>
                  {validationErrors[`step_${stepIndex}_approvers`] && (
                    <span className="error-text">
                      {validationErrors[`step_${stepIndex}_approvers`]}
                    </span>
                  )}
                </div>

                <div className="approvers-list">
                  {step.approvers.map((approver, approverIndex) => (
                    <div key={approverIndex} className="approver-item">
                      <div className="approver-info">
                        <span className="approver-name">
                          {getUserName(approver.userId)}
                        </span>
                        <span className="approver-role">
                          {getUserRole(approver.userId)}
                        </span>
                      </div>
                      
                      {(ruleType === 'CONDITIONAL' || ruleType === 'COMBINED') && (
                        <label className="specific-approver-checkbox">
                          <input
                            type="checkbox"
                            checked={approver.isSpecificApprover}
                            onChange={() => toggleSpecificApprover(stepIndex, approverIndex)}
                          />
                          <span className="checkbox-label">Key Approver</span>
                        </label>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => removeApproverFromStep(stepIndex, approverIndex)}
                        className="btn btn-sm btn-danger"
                        title="Remove approver"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="add-approver">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addApproverToStep(stepIndex, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="approver-select"
                  >
                    <option value="">Select an approver...</option>
                    {getAvailableUsers(stepIndex).map(user => (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(ruleType === 'CONDITIONAL' || ruleType === 'COMBINED') && (
        <div className="conditional-info">
          <h4>Key Approvers</h4>
          <p>
            Mark approvers as "Key Approvers" if their approval alone can trigger auto-approval 
            for conditional rules. This works in combination with percentage thresholds.
          </p>
        </div>
      )}
    </div>
  );
};

export default ApproverSequenceBuilder;