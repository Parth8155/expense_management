import React, { useState } from 'react';
import ApprovalRulesList from './ApprovalRulesList';
import ApprovalRuleForm from './ApprovalRuleForm';
import './ApprovalRulesManagement.css';

const ApprovalRulesManagement = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit'
  const [selectedRule, setSelectedRule] = useState(null);

  const handleAddRule = () => {
    setSelectedRule(null);
    setCurrentView('create');
  };

  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    setCurrentView('edit');
  };

  const handleDeleteRule = (ruleId) => {
    // Rule deletion is handled in the ApprovalRulesList component
    // This callback can be used for additional cleanup if needed
    console.log('Rule deleted:', ruleId);
  };

  const handleSaveRule = (savedRule) => {
    // Rule saved successfully, return to list view
    setCurrentView('list');
    setSelectedRule(null);
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedRule(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'create':
      case 'edit':
        return (
          <ApprovalRuleForm
            rule={selectedRule}
            onSave={handleSaveRule}
            onCancel={handleCancel}
          />
        );
      case 'list':
      default:
        return (
          <ApprovalRulesList
            onAdd={handleAddRule}
            onEdit={handleEditRule}
            onDelete={handleDeleteRule}
          />
        );
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'create':
        return 'Create New Approval Rule';
      case 'edit':
        return 'Edit Approval Rule';
      case 'list':
      default:
        return 'Approval Rules Management';
    }
  };

  return (
    <div className="approval-rules-management">
      <div className="management-header">
        <div className="breadcrumb">
          <span 
            className={`breadcrumb-item ${currentView === 'list' ? 'active' : 'clickable'}`}
            onClick={() => currentView !== 'list' && handleCancel()}
          >
            Approval Rules
          </span>
          {currentView !== 'list' && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item active">
                {currentView === 'create' ? 'New Rule' : 'Edit Rule'}
              </span>
            </>
          )}
        </div>
        <h1>{getPageTitle()}</h1>
      </div>

      <div className="management-content">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default ApprovalRulesManagement;