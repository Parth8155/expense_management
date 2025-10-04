const companyService = require('../services/companyService');

/**
 * GET /api/companies/countries
 * Fetch countries and currencies from REST Countries API
 */
const getCountries = async (req, res) => {
  try {
    const countries = await companyService.fetchCountries();
    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_COUNTRIES_ERROR',
        message: 'Failed to fetch countries',
        details: error.message
      }
    });
  }
};

/**
 * GET /api/companies/:id
 * Get company details by ID
 */
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await companyService.getCompanyById(id);
    
    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    
    if (error.message === 'Company not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
          details: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_COMPANY_ERROR',
        message: 'Failed to fetch company',
        details: error.message
      }
    });
  }
};

/**
 * PUT /api/companies/:id
 * Update company settings (Admin only)
 */
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verify user is admin and belongs to the company
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only admins can update company settings'
        }
      });
    }

    // Verify user belongs to the company they're trying to update
    if (req.user.companyId.toString() !== id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update your own company'
        }
      });
    }

    const company = await companyService.updateCompanySettings(id, updates);
    
    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error updating company:', error);
    
    if (error.message === 'Company not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
          details: error.message
        }
      });
    }

    if (error.message === 'No valid fields to update') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_UPDATE',
          message: 'No valid fields to update',
          details: error.message
        }
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_COMPANY_ERROR',
        message: 'Failed to update company',
        details: error.message
      }
    });
  }
};

module.exports = {
  getCountries,
  getCompanyById,
  updateCompany
};
