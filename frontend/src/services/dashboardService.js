import api from './api';

export const dashboardService = {
  // Get employee dashboard data
  getEmployeeDashboard: async () => {
    try {
      const response = await api.get('/expenses?limit=5&sort=-createdAt');
      const expensesResponse = await api.get('/expenses');
      
      console.log('Employee dashboard API responses:', { response: response.data, expensesResponse: expensesResponse.data });
      
      if (response.data.success && expensesResponse.data.success) {
        const recentExpenses = response.data.data || [];
        const allExpenses = expensesResponse.data.data || [];
        
        // Ensure arrays
        if (!Array.isArray(recentExpenses) || !Array.isArray(allExpenses)) {
          console.error('Invalid data format:', { recentExpenses, allExpenses });
          return { 
            success: false, 
            error: 'Invalid data format received from server' 
          };
        }
        
        // Calculate summary statistics using converted amounts
        const summary = {
          total: allExpenses.length,
          pending: allExpenses.filter(e => e.status === 'PENDING').length,
          approved: allExpenses.filter(e => e.status === 'APPROVED').length,
          rejected: allExpenses.filter(e => e.status === 'REJECTED').length,
          totalAmount: allExpenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount || 0), 0)
        };
        
        return {
          success: true,
          summary,
          recentExpenses
        };
      }
      
      return { success: false, error: 'Failed to fetch dashboard data' };
    } catch (error) {
      console.error('Dashboard service error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to fetch dashboard data'
      };
    }
  },

  // Get manager dashboard data
  getManagerDashboard: async () => {
    try {
      const [expensesResponse] = await Promise.all([
        api.get('/expenses?limit=5&sort=-createdAt')
      ]);
      
      if (expensesResponse.data.success) {
        const recentExpenses = expensesResponse.data.data || [];
        
        // Get all team expenses for summary
        const allExpensesResponse = await api.get('/expenses');
        const allExpenses = allExpensesResponse.data.data || [];
        
        // Ensure arrays
        if (!Array.isArray(recentExpenses) || !Array.isArray(allExpenses)) {
          console.error('Invalid data format:', { recentExpenses, allExpenses });
          return { 
            success: false, 
            error: 'Invalid data format received from server' 
          };
        }
        
        const summary = {
          total: allExpenses.length,
          pending: allExpenses.filter(e => e.status === 'PENDING').length,
          approved: allExpenses.filter(e => e.status === 'APPROVED').length,
          rejected: allExpenses.filter(e => e.status === 'REJECTED').length,
          pendingApprovals: allExpenses.filter(e => e.status === 'PENDING').length, // For display purposes
          totalAmount: allExpenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount || 0), 0)
        };
        
        return {
          success: true,
          summary,
          recentExpenses
        };
      }
      
      return { success: false, error: 'Failed to fetch dashboard data' };
    } catch (error) {
      console.error('Manager dashboard service error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to fetch dashboard data'
      };
    }
  },

  // Get admin dashboard data
  getAdminDashboard: async () => {
    try {
      // Make API calls with individual error handling
      let expensesResponse, usersResponse;
      
      try {
        expensesResponse = await api.get('/expenses?limit=5&sort=-createdAt');
      } catch (expenseError) {
        console.error('Failed to fetch expenses:', expenseError);
        expensesResponse = { data: { success: false, data: [] } };
      }
      
      try {
        usersResponse = await api.get('/users');
      } catch (userError) {
        console.error('Failed to fetch users:', userError);
        usersResponse = { data: { success: false, data: [] } };
      }
      
      console.log('Admin dashboard API responses:', { 
        expensesResponse: expensesResponse.data, 
        usersResponse: usersResponse.data 
      });
      
      // Handle different response formats
      const expensesSuccess = expensesResponse.data.success !== false;
      const usersSuccess = usersResponse.data.success !== false;
      
      // Extract data with fallbacks
      const recentExpenses = Array.isArray(expensesResponse.data.data) 
        ? expensesResponse.data.data 
        : Array.isArray(expensesResponse.data) 
        ? expensesResponse.data 
        : [];
        
      let users = usersResponse.data.data || usersResponse.data || [];
      
      // Handle case where users might be wrapped in another object
      if (users && typeof users === 'object' && !Array.isArray(users)) {
        if (users.users && Array.isArray(users.users)) {
          users = users.users;
        } else if (users.data && Array.isArray(users.data)) {
          users = users.data;
        } else {
          users = [];
        }
      }
      
      // Ensure users is an array
      if (!Array.isArray(users)) {
        console.error('Users data is not an array, using empty array:', users);
        users = [];
      }
      
      // Get all expenses for summary with error handling
      let allExpenses = [];
      try {
        const allExpensesResponse = await api.get('/expenses');
        allExpenses = Array.isArray(allExpensesResponse.data.data) 
          ? allExpensesResponse.data.data 
          : Array.isArray(allExpensesResponse.data) 
          ? allExpensesResponse.data 
          : [];
      } catch (allExpensesError) {
        console.error('Failed to fetch all expenses:', allExpensesError);
        allExpenses = recentExpenses; // Use recent expenses as fallback
      }
      
      const expenseSummary = {
        total: allExpenses.length,
        pending: allExpenses.filter(e => e && e.status === 'PENDING').length,
        approved: allExpenses.filter(e => e && e.status === 'APPROVED').length,
        rejected: allExpenses.filter(e => e && e.status === 'REJECTED').length,
        totalAmount: allExpenses.reduce((sum, e) => sum + (e && (e.convertedAmount || e.amount) ? (e.convertedAmount || e.amount) : 0), 0)
      };
      
      const userSummary = {
        total: users.length,
        admins: users.filter(u => u && u.role === 'ADMIN').length,
        managers: users.filter(u => u && u.role === 'MANAGER').length,
        finance: users.filter(u => u && u.role === 'FINANCE').length,
        directors: users.filter(u => u && u.role === 'DIRECTOR').length,
        employees: users.filter(u => u && u.role === 'EMPLOYEE').length,
        active: users.filter(u => u && u.isActive).length
      };
      
      return {
        success: true,
        expenseSummary,
        userSummary,
        recentExpenses
      };
      
    } catch (error) {
      console.error('Admin dashboard service error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Failed to fetch dashboard data'
      };
    }
  }
};

export default dashboardService;