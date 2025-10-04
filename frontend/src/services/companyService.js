import api from './api';

class CompanyService {
  /**
   * Get company details by ID
   * @param {string} companyId - Company ID
   * @returns {Promise} API response with company data
   */
  async getCompanyById(companyId) {
    try {
      const response = await api.get(`/companies/${companyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  }

  /**
   * Update company settings
   * @param {string} companyId - Company ID
   * @param {Object} updates - Fields to update
   * @returns {Promise} API response with updated company data
   */
  async updateCompany(companyId, updates) {
    try {
      const response = await api.put(`/companies/${companyId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  /**
   * Get countries and currencies
   * @returns {Promise} API response with countries data
   */
  async getCountries() {
    try {
      const response = await api.get('/companies/countries');
      return response.data;
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }

  /**
   * Get exchange rates for a base currency
   * @param {string} baseCurrency - Base currency code
   * @returns {Promise} API response with exchange rates
   */
  async getExchangeRates(baseCurrency) {
    try {
      const response = await api.get(`/currencies/rates?base=${baseCurrency}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      throw error;
    }
  }

  /**
   * Manually trigger exchange rate update
   * @param {string} baseCurrency - Base currency code
   * @returns {Promise} API response with update status
   */
  async updateExchangeRates(baseCurrency) {
    try {
      const response = await api.post('/currencies/update-rates', { baseCurrency });
      return response.data;
    } catch (error) {
      console.error('Error updating exchange rates:', error);
      throw error;
    }
  }
}

export default new CompanyService();