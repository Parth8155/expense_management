import api from './api';

const expenseService = {
  // Create new expense
  createExpense: async (expenseData) => {
    try {
      const response = await api.post('/expenses', expenseData);
      console.log('Create expense API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  },

  // Get expenses (filtered by role)
  getExpenses: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await api.get(`/expenses?${params.toString()}`);
      
      console.log('Expense service API response:', response.data);
      
      // Handle different response formats
      let expenses = [];
      let totalCount = 0;
      
      if (response.data) {
        // Check if response has success flag
        if (response.data.success !== false) {
          // The backend returns { success: true, data: [expenses array] }
          if (response.data.data && Array.isArray(response.data.data)) {
            expenses = response.data.data;
            totalCount = expenses.length; // Backend doesn't provide totalCount for pagination yet
          } else if (Array.isArray(response.data)) {
            expenses = response.data;
            totalCount = expenses.length;
          } else {
            console.warn('Unexpected response format:', response.data);
          }
        } else {
          console.error('API returned error:', response.data);
        }
      }
      
      // Ensure expenses is an array
      if (!Array.isArray(expenses)) {
        console.error('Expenses data is not an array:', expenses);
        expenses = [];
      }
      
      return {
        success: true,
        data: {
          expenses,
          totalCount
        }
      };
    } catch (error) {
      console.error('Error in getExpenses:', error);
      throw error;
    }
  },

  // Get single expense details
  getExpenseById: async (expenseId) => {
    try {
      const response = await api.get(`/expenses/${expenseId}`);
      console.log('Get expense by ID API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting expense by ID:', error);
      throw error;
    }
  },

  // Update expense (only for pending expenses)
  updateExpense: async (expenseId, expenseData) => {
    const response = await api.put(`/expenses/${expenseId}`, expenseData);
    return response.data;
  },

  // Delete expense (only for pending expenses)
  deleteExpense: async (expenseId) => {
    const response = await api.delete(`/expenses/${expenseId}`);
    return response.data;
  },

  // Upload receipt
  uploadReceipt: async (expenseId, file) => {
    const formData = new FormData();
    formData.append('receipt', file);
    
    const response = await api.post(`/expenses/${expenseId}/receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get available currencies (for dropdown)
  getCurrencies: async () => {
    const response = await api.get('/currencies/rates');
    return response.data;
  }
};

export default expenseService;