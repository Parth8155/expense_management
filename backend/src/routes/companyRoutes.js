const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticateToken } = require('../middleware/auth');

// GET /api/companies/countries - Fetch countries and currencies (no auth required for signup)
router.get('/countries', companyController.getCountries);

// GET /api/companies/:id - Get company details (authenticated users)
router.get('/:id', authenticateToken, companyController.getCompanyById);

// PUT /api/companies/:id - Update company settings (Admin only, auth checked in controller)
router.put('/:id', authenticateToken, companyController.updateCompany);

module.exports = router;
