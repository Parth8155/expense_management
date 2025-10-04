import React from 'react';
import './ConditionalRuleConfig.css';

const ConditionalRuleConfig = ({ 
  ruleType, 
  percentageThreshold, 
  onPercentageChange, 
  approvalSteps,
  validationErrors = {} 
}) => {
  const handlePercentageChange = (e) => {
    const value = e.target.value;
    onPercentageChange(value === '' ? '' : Number(value));
  };

  const getSpecificApprovers = () => {
    const specificApprovers = [];
    approvalSteps.forEach((step, stepIndex) => {
      step.approvers.forEach(approver => {
        if (approver.isSpecificApprover) {
          specificApprovers.push({
            stepIndex,
            approver
          });
        }
      });
    });
    return specificApprovers;
  };

  const shouldShowConditionalConfig = () => {
    return ruleType === 'CONDITIONAL' || ruleType === 'COMBINED';
  };

  if (!shouldShowConditionalConfig()) {
    return null;
  }

  const specificApprovers = getSpecificApprovers();

  return (
    <div className="conditional-rule-config">
      <div className="config-section">
        <h3>Conditional Approval Settings</h3>
        <p className="section-description">
          Configure when expenses should be auto-approved based on percentage thresholds 
          or specific key approvers.
        </p>
      </div>

      <div className="config-options">
        <div className="config-option">
          <div className="option-header">
            <h4>Percentage Threshold</h4>
            <div className="option-description">
              Auto-approve when this percentage of approvers in any step have approved
            </div>
          </div>
          
          <div className="percentage-input-group">
            <div className="input-with-suffix">
              <input
                type="number"
                value={percentageThreshold || ''}
                onChange={handlePercentageChange}
                className={validationErrors.percentageThreshold ? 'error' : ''}
                placeholder="50"
                min="0"
                max="100"
                step="1"
              />
              <span className="input-suffix">%</span>
            </div>
            {validationErrors.percentageThreshold && (
              <span className="error-text">{validationErrors.percentageThreshold}</span>
            )}
          </div>

          <div className="percentage-examples">
            <div className="example-item">
              <strong>50%:</strong> Auto-approve when half of the approvers in a step approve
            </div>
            <div className="example-item">
              <strong>100%:</strong> Require all approvers in a step to approve
            </div>
            <div className="example-item">
              <strong>0%:</strong> Auto-approve immediately (not recommended)
            </div>
          </div>
        </div>

        <div className="config-option">
          <div className="option-header">
            <h4>Key Approvers</h4>
            <div className="option-description">
              Specific approvers whose approval alone can trigger auto-approval
            </div>
          </div>

          {specificApprovers.length > 0 ? (
            <div className="key-approvers-list">
              {specificApprovers.map((item, index) => (
                <div key={index} className="key-approver-item">
                  <div className="approver-badge">
                    <span className="step-indicator">Step {item.stepIndex + 1}</span>
                    <span className="approver-name">Key Approver</span>
                  </div>
                  <div className="approver-description">
                    When this approver approves, the expense will be auto-approved 
                    regardless of other approvers in the step.
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-key-approvers">
              <p>No key approvers configured yet.</p>
              <p className="help-text">
                Mark approvers as "Key Approvers" in the approval steps above to enable 
                specific approver auto-approval.
              </p>
            </div>
          )}
        </div>

        {ruleType === 'COMBINED' && (
          <div className="config-option">
            <div className="option-header">
              <h4>Combined Rule Logic</h4>
              <div className="option-description">
                How percentage and key approver rules work together
              </div>
            </div>

            <div className="combined-logic-explanation">
              <div className="logic-item">
                <div className="logic-icon">OR</div>
                <div className="logic-text">
                  <strong>Either condition triggers auto-approval:</strong>
                  <ul>
                    <li>Percentage threshold is met in any step, OR</li>
                    <li>Any key approver approves</li>
                  </ul>
                </div>
              </div>
              
              <div className="logic-flow">
                <div className="flow-step">
                  <span className="flow-number">1</span>
                  <span className="flow-text">Expense enters approval step</span>
                </div>
                <div className="flow-arrow">↓</div>
                <div className="flow-step">
                  <span className="flow-number">2</span>
                  <span className="flow-text">Check if key approver approved</span>
                </div>
                <div className="flow-arrow">↓</div>
                <div className="flow-step">
                  <span className="flow-number">3</span>
                  <span className="flow-text">Check if percentage threshold met</span>
                </div>
                <div className="flow-arrow">↓</div>
                <div className="flow-step">
                  <span className="flow-number">4</span>
                  <span className="flow-text">Auto-approve or continue to next step</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="config-summary">
        <h4>Current Configuration Summary</h4>
        <div className="summary-items">
          {percentageThreshold && (
            <div className="summary-item">
              <span className="summary-label">Percentage Threshold:</span>
              <span className="summary-value">{percentageThreshold}%</span>
            </div>
          )}
          <div className="summary-item">
            <span className="summary-label">Key Approvers:</span>
            <span className="summary-value">
              {specificApprovers.length} configured
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Rule Type:</span>
            <span className="summary-value">{ruleType}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConditionalRuleConfig;