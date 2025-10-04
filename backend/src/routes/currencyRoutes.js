const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');
const { authenticateToken } = require('../middleware/auth');

// All currency routes require authentication
router.use(authenticateToken);

// GET /api/currencies/rates - Get current exchange rates
router.get('/rates', currencyController.getExchangeRates);

// GET /api/currencies/convert - Convert amount between currencies
router.get('/convert', currencyController.convertCurrency);

// POST /api/currencies/update-rates - Manually trigger exchange rate update (Admin only)
router.post('/update-rates', currencyController.updateExchangeRates);

module.exports = router;
