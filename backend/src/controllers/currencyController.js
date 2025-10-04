const currencyService = require('../services/currencyService');

/**
 * Get current exchange rates for a base currency
 * GET /api/currencies/rates?base=USD
 */
const getExchangeRates = async (req, res) => {
  try {
    const { base } = req.query;

    if (!base) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_BASE_CURRENCY',
          message: 'Base currency is required'
        }
      });
    }

    // Validate currency code format
    if (!/^[A-Z]{3}$/.test(base.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CURRENCY_CODE',
          message: 'Currency code must be 3 uppercase letters'
        }
      });
    }

    const baseCurrency = base.toUpperCase();

    // Try to get cached rates first
    let ratesData = await currencyService.getCachedRates(baseCurrency);
    let isFresh = false;

    // If no cached rates, fetch fresh ones
    if (!ratesData) {
      try {
        const freshRates = await currencyService.fetchExchangeRates(baseCurrency);
        await currencyService.cacheExchangeRates(freshRates.baseCurrency, freshRates.rates);
        ratesData = freshRates;
        isFresh = true;
      } catch (error) {
        return res.status(502).json({
          success: false,
          error: {
            code: 'EXCHANGE_RATE_API_ERROR',
            message: 'Unable to fetch exchange rates',
            details: error.message
          }
        });
      }
    }

    res.json({
      success: true,
      data: {
        baseCurrency: ratesData.baseCurrency,
        rates: ratesData.rates,
        fetchedAt: ratesData.fetchedAt,
        isCached: ratesData.isCached || false,
        isFresh
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve exchange rates',
        details: error.message
      }
    });
  }
};

/**
 * Manually trigger exchange rate update
 * POST /api/currencies/update-rates
 */
const updateExchangeRates = async (req, res) => {
  try {
    // Only admins can trigger manual rate updates
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only admins can trigger exchange rate updates'
        }
      });
    }

    const { baseCurrency } = req.body;

    if (!baseCurrency) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_BASE_CURRENCY',
          message: 'Base currency is required'
        }
      });
    }

    // Validate currency code format
    if (!/^[A-Z]{3}$/.test(baseCurrency.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CURRENCY_CODE',
          message: 'Currency code must be 3 uppercase letters'
        }
      });
    }

    const result = await currencyService.updateExchangeRates(baseCurrency.toUpperCase());

    res.json({
      success: true,
      data: {
        message: 'Exchange rates updated successfully',
        baseCurrency: result.baseCurrency,
        ratesCount: result.ratesCount,
        cachedCount: result.cachedCount,
        updatedAt: result.fetchedAt
      }
    });
  } catch (error) {
    console.error('Error updating exchange rates:', error);
    
    if (error.message.includes('Exchange Rate API')) {
      return res.status(502).json({
        success: false,
        error: {
          code: 'EXCHANGE_RATE_API_ERROR',
          message: 'Unable to fetch fresh exchange rates',
          details: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_RATES_ERROR',
        message: 'Failed to update exchange rates',
        details: error.message
      }
    });
  }
};

/**
 * Convert amount between currencies
 * GET /api/currencies/convert?amount=100&from=USD&to=EUR
 */
const convertCurrency = async (req, res) => {
  try {
    const { amount, from, to } = req.query;

    // Validate required parameters
    if (!amount || !from || !to) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Amount, from currency, and to currency are required'
        }
      });
    }

    // Validate amount is a number
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Amount must be a positive number'
        }
      });
    }

    // Validate currency codes
    const fromCurrency = from.toUpperCase();
    const toCurrency = to.toUpperCase();

    if (!/^[A-Z]{3}$/.test(fromCurrency) || !/^[A-Z]{3}$/.test(toCurrency)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CURRENCY_CODE',
          message: 'Currency codes must be 3 uppercase letters'
        }
      });
    }

    // Perform conversion
    const convertedAmount = await currencyService.convertAmount(
      numAmount,
      fromCurrency,
      toCurrency
    );

    res.json({
      success: true,
      data: {
        originalAmount: numAmount,
        originalCurrency: fromCurrency,
        convertedAmount,
        targetCurrency: toCurrency,
        timestamp: new Date()
      }
    });
  } catch (error) {
    // Check if it's a conversion-specific error
    if (error.message.includes('Exchange rate not available')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RATE_NOT_AVAILABLE',
          message: error.message
        }
      });
    }

    if (error.message.includes('Unable to fetch or retrieve cached exchange rates')) {
      return res.status(502).json({
        success: false,
        error: {
          code: 'EXCHANGE_RATE_UNAVAILABLE',
          message: 'Exchange rates are currently unavailable'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'CONVERSION_ERROR',
        message: 'Failed to convert currency',
        details: error.message
      }
    });
  }
};

module.exports = {
  getExchangeRates,
  convertCurrency,
  updateExchangeRates
};
