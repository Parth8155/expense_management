import React, { useState, useEffect } from 'react';
import approvalRuleService from '../services/approvalRuleService';
import './ApprovalRulesList.css';

const ApprovalRulesList = ({ onEdit, onDelete, onAdd }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApprovalRules();
  }, []);

  const fetchApprovalRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await approvalRuleService.getApprovalRules();
      setRules(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch approval rules');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ruleId, ruleName) => {
    if (window.confirm(`Are you sure you want to delete the approval rule "${ruleName}"?`)) {
      try {
        await approvalRuleService.deleteApprovalRule(ruleId);
        setRules(rules.filter(rule => rule._id !== ruleId));
        if (onDelete) onDelete(ruleId);
      } catch (err) {
        setError(err.message || 'Failed to delete approval rule');
      }
    }
  };

  const getRuleTypeDisplay = (ruleType) => {
    switch (ruleType) {
      case 'SEQUENTIAL':
        return 'Sequential';
      case 'CONDITIONAL':
        return 'Conditional';
      case 'COMBINED':
        return 'Combined';
      default:
        return ruleType;
    }
  };

  const getThresholdDisplay = (rule) => {
    if (rule.ruleType === 'CONDITIONAL' && rule.percentageThreshold !== null) {
      return `${rule.percentageThreshold}%`;
    }
    return '-';
  };

  if (loading) {
    return (
      <div className="approval-rules-list">
        <div className="loading">Loading approval rules...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="approval-rules-list">
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={fetchApprovalRules} className="btn btn-secondary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="approval-rules-list">
      <div className="rules-header">
        <h2>Approval Rules</h2>
        <button onClick={onAdd} className="btn btn-primary">
          Add New Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="no-rules">
          <p>No approval rules configured yet.</p>
          <button onClick={onAdd} className="btn btn-primary">
            Create First Rule
          </button>
        </div>
      ) : (
        <div className="rules-table-container">
          <table className="rules-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Type</th>
                <th>Threshold</th>
                <th>Manager Approver</th>
                <th>Steps</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule._id}>
                  <td className="rule-name">{rule.name}</td>
                  <td className="rule-type">
                    <span className={`type-badge type-${rule.ruleType.toLowerCase()}`}>
                      {getRuleTypeDisplay(rule.ruleType)}
                    </span>
                  </td>
                  <td className="threshold">{getThresholdDisplay(rule)}</td>
                  <td className="manager-approver">
                    <span className={`status-badge ${rule.isManagerApprover ? 'enabled' : 'disabled'}`}>
                      {rule.isManagerApprover ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="steps-count">
                    {rule.approvalSteps?.length || 0} step{rule.approvalSteps?.length !== 1 ? 's' : ''}
                  </td>
                  <td className="actions">
                    <button
                      onClick={() => onEdit && onEdit(rule)}
                      className="btn btn-sm btn-secondary"
                      title="Edit rule"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rule._id, rule.name)}
                      className="btn btn-sm btn-danger"
                      title="Delete rule"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApprovalRulesList;