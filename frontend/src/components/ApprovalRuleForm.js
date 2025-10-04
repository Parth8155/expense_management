import React, { useState, useEffect } from 'react';
import approvalRuleService from '../services/approvalRuleService';
import userService from '../services/userService';
import ApproverSequenceBuilder from './ApproverSequenceBuilder';
import ConditionalRuleConfig from './ConditionalRuleConfig';
import './ApprovalRuleForm.css';

const ApprovalRuleForm = ({ rule, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    ruleType: 'SEQUENTIAL',
    percentageThreshold: '',
    isManagerApprover: false,
    approvalSteps: [
      {
        sequenceOrder: 1,
        approvers: []
      }
    ]
  });
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchUsers();
    if (rule) {
      setFormData({
        name: rule.name || '',
        ruleType: rule.ruleType || 'SEQUENTIAL',
        percentageThreshold: rule.percentageThreshold || '',
        isManagerApprover: rule.isManagerApprover || false,
        approvalSteps: rule.approvalSteps || [
          {
            sequenceOrder: 1,
            approvers: []
          }
        ]
      });
    }
  }, [rule]);

  const fetchUsers = async () => {
    try {
      const response = await userService.getUsers();
      setUsers(response.data || []);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Rule name is required';
    }

    if (formData.ruleType === 'CONDITIONAL' && !formData.percentageThreshold) {
      errors.percentageThreshold = 'Percentage threshold is required for conditional rules';
    }

    if (formData.percentageThreshold && (formData.percentageThreshold < 0 || formData.percentageThreshold > 100)) {
      errors.percentageThreshold = 'Percentage threshold must be between 0 and 100';
    }

    if (!formData.approvalSteps.length) {
      errors.approvalSteps = 'At least one approval step is required';
    }

    formData.approvalSteps.forEach((step, stepIndex) => {
      if (!step.approvers.length) {
        errors[`step_${stepIndex}_approvers`] = `Step ${stepIndex + 1} must have at least one approver`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        percentageThreshold: formData.percentageThreshold ? Number(formData.percentageThreshold) : null
      };

      let response;
      if (rule?._id) {
        response = await approvalRuleService.updateApprovalRule(rule._id, submitData);
      } else {
        response = await approvalRuleService.createApprovalRule(submitData);
      }

      if (onSave) {
        onSave(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to save approval rule');
    } finally {
      setLoading(false);
    }
  };

  const getRuleTypeDescription = (type) => {
    switch (type) {
      case 'SEQUENTIAL':
        return 'Approvers must approve in sequence, one after another';
      case 'CONDITIONAL':
        return 'Auto-approve when percentage threshold or specific approvers approve';
      case 'COMBINED':
        return 'Combination of sequential and conditional rules';
      default:
        return '';
    }
  };

  const shouldShowPercentageThreshold = () => {
    return formData.ruleType === 'CONDITIONAL' || formData.ruleType === 'COMBINED';
  };

  const handleApprovalStepsChange = (newSteps) => {
    setFormData(prev => ({
      ...prev,
      approvalSteps: newSteps
    }));
  };

  const handlePercentageThresholdChange = (value) => {
    setFormData(prev => ({
      ...prev,
      percentageThreshold: value
    }));
    
    // Clear validation error
    if (validationErrors.percentageThreshold) {
      setValidationErrors(prev => ({
        ...prev,
        percentageThreshold: null
      }));
    }
  };

  return (
    <div className="approval-rule-form">
      <div className="form-header">
        <h2>{rule ? 'Edit Approval Rule' : 'Create New Approval Rule'}</h2>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="name">Rule Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={validationErrors.name ? 'error' : ''}
              placeholder="Enter rule name"
            />
            {validationErrors.name && (
              <span className="error-text">{validationErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="ruleType">Rule Type *</label>
            <select
              id="ruleType"
              name="ruleType"
              value={formData.ruleType}
              onChange={handleInputChange}
            >
              <option value="SEQUENTIAL">Sequential</option>
              <option value="CONDITIONAL">Conditional</option>
              <option value="COMBINED">Combined</option>
            </select>
            <div className="field-description">
              {getRuleTypeDescription(formData.ruleType)}
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isManagerApprover"
                checked={formData.isManagerApprover}
                onChange={handleInputChange}
              />
              <span className="checkmark"></span>
              Require manager approval first
            </label>
            <div className="field-description">
              If enabled, the expense will first go to the submitter's manager before following the approval rule
            </div>
          </div>
        </div>

        <div className="form-section">
          <ApproverSequenceBuilder
            approvalSteps={formData.approvalSteps}
            onChange={handleApprovalStepsChange}
            ruleType={formData.ruleType}
            validationErrors={validationErrors}
          />
        </div>

        <ConditionalRuleConfig
          ruleType={formData.ruleType}
          percentageThreshold={formData.percentageThreshold}
          onPercentageChange={handlePercentageThresholdChange}
          approvalSteps={formData.approvalSteps}
          validationErrors={validationErrors}
        />

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (rule ? 'Update Rule' : 'Create Rule')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApprovalRuleForm;