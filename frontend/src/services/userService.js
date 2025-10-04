import api from './api';

/**
 * User management service for API calls
 */
class UserService {
  /**
   * Get all users in the company
   * @returns {Promise} API response with users list
   */
  async getUsers() {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise} API response with user details
   */
  async getUserById(userId) {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise} API response with created user
   */
  async createUser(userData) {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user details
   * @param {string} userId - User ID
   * @param {Object} updates - User updates
   * @returns {Promise} API response with updated user
   */
  async updateUser(userId, updates) {
    try {
      const response = await api.put(`/users/${userId}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Deactivate user
   * @param {string} userId - User ID
   * @returns {Promise} API response
   */
  async deactivateUser(userId) {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Change user role
   * @param {string} userId - User ID
   * @param {string} role - New role
   * @returns {Promise} API response with updated user
   */
  async changeUserRole(userId, role) {
    try {
      const response = await api.put(`/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Assign manager to user
   * @param {string} userId - User ID
   * @param {string} managerId - Manager ID
   * @returns {Promise} API response with updated user
   */
  async assignManager(userId, managerId) {
    try {
      const response = await api.put(`/users/${userId}/manager`, { managerId });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   * @param {Error} error - API error
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response?.data?.error) {
      const apiError = new Error(error.response.data.error.message);
      apiError.code = error.response.data.error.code;
      apiError.status = error.response.status;
      return apiError;
    }
    return error;
  }
}

export default new UserService();