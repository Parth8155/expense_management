import api from './api';

const approvalService = {
  // Get pending approvals for current user
  getPendingApprovals: async () => {
    try {
      const response = await api.get('/approvals/pending');
      return response.data;
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      throw error.response?.data || error;
    }
  },

  // Approve an expense
  approveExpense: async (expenseId, comments = '') => {
    try {
      const response = await api.post(`/approvals/${expenseId}/approve`, {
        comments
      });
      return response.data;
    } catch (error) {
      console.error('Error approving expense:', error);
      throw error.response?.data || error;
    }
  },

  // Reject an expense
  rejectExpense: async (expenseId, comments) => {
    try {
      const response = await api.post(`/approvals/${expenseId}/reject`, {
        comments
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting expense:', error);
      throw error.response?.data || error;
    }
  },

  // Admin override approval
  overrideApproval: async (expenseId, comments = '') => {
    try {
      const response = await api.post(`/approvals/${expenseId}/override`, {
        comments
      });
      return response.data;
    } catch (error) {
      console.error('Error overriding approval:', error);
      throw error.response?.data || error;
    }
  }
};

export default approvalService;