import api from './api';

const approvalRuleService = {
  // Get all approval rules for the company
  getApprovalRules: async () => {
    try {
      const response = await api.get('/approval-rules');
      return response.data;
    } catch (error) {
      console.error('Error getting approval rules:', error);
      throw error.response?.data || error;
    }
  },

  // Get a single approval rule by ID
  getApprovalRuleById: async (id) => {
    try {
      const response = await api.get(`/approval-rules/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting approval rule by ID:', error);
      throw error.response?.data || error;
    }
  },

  // Create a new approval rule
  createApprovalRule: async (ruleData) => {
    try {
      const response = await api.post('/approval-rules', ruleData);
      return response.data;
    } catch (error) {
      console.error('Error creating approval rule:', error);
      throw error.response?.data || error;
    }
  },

  // Update an existing approval rule
  updateApprovalRule: async (id, ruleData) => {
    try {
      const response = await api.put(`/approval-rules/${id}`, ruleData);
      return response.data;
    } catch (error) {
      console.error('Error updating approval rule:', error);
      throw error.response?.data || error;
    }
  },

  // Delete an approval rule
  deleteApprovalRule: async (id) => {
    try {
      const response = await api.delete(`/approval-rules/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting approval rule:', error);
      throw error.response?.data || error;
    }
  }
};

export default approvalRuleService;