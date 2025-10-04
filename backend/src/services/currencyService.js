const axios = require('axios');
const ExchangeRate = require('../models/ExchangeRate');

/**
 * Currency Service
 * Handles exchange rate fetching, caching, and currency conversion
 */

const EXCHANGE_RATE_API_BASE = 'https://api.exchangerate-api.com/v4/latest';
const CACHE_DURATION_HOURS = 24; // Cache rates for 24 hours

/**
 * Fetch exchange rates from Exchange Rate API
 * @param {string} baseCurrency - Base currency code (e.g., 'USD')
 * @returns {Promise<Object>} - Object with rates for all currencies
 */
const fetchExchangeRates = async (baseCurrency) => {
  try {
    const response = await axios.get(`${EXCHANGE_RATE_API_BASE}/${baseCurrency}`, {
      timeout: 5000 // 5 second timeout
    });

    if (!response.data || !response.data.rates) {
      throw new Error('Invalid response from Exchange Rate API');
    }

    return {
      baseCurrency: response.data.base,
      rates: response.data.rates,
      fetchedAt: new Date()
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`Exchange Rate API error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Exchange Rate API is unavailable');
    } else {
      throw new Error(`Failed to fetch exchange rates: ${error.message}`);
    }
  }
};

/**
 * Cache exchange rates in database
 * @param {string} baseCurrency - Base currency code
 * @param {Object} rates - Object with currency codes as keys and rates as values
 * @returns {Promise<number>} - Number of rates cached
 */
const cacheExchangeRates = async (baseCurrency, rates) => {
  try {
    const fetchedAt = new Date();
    const operations = [];

    // Create bulk upsert operations for all rates
    for (const [targetCurrency, rate] of Object.entries(rates)) {
      operations.push({
        updateOne: {
          filter: { baseCurrency, targetCurrency },
          update: {
            $set: {
              baseCurrency,
              targetCurrency,
              rate,
              fetchedAt
            }
          },
          upsert: true
        }
      });
    }

    if (operations.length === 0) {
      return 0;
    }

    const result = await ExchangeRate.bulkWrite(operations);
    return result.upsertedCount + result.modifiedCount;
  } catch (error) {
    throw new Error(`Failed to cache exchange rates: ${error.message}`);
  }
};

/**
 * Get cached exchange rates from database
 * @param {string} baseCurrency - Base currency code
 * @param {number} maxAgeHours - Maximum age of cached rates in hours (default: 24)
 * @returns {Promise<Object|null>} - Object with rates or null if no valid cache
 */
const getCachedRates = async (baseCurrency, maxAgeHours = CACHE_DURATION_HOURS) => {
  try {
    const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

    // Find all rates for the base currency that are recent enough
    const cachedRates = await ExchangeRate.find({
      baseCurrency,
      fetchedAt: { $gte: cutoffDate }
    }).sort({ fetchedAt: -1 });

    if (cachedRates.length === 0) {
      return null;
    }

    // Convert array to rates object
    const rates = {};
    let mostRecentFetchedAt = null;

    for (const rate of cachedRates) {
      rates[rate.targetCurrency] = rate.rate;
      if (!mostRecentFetchedAt || rate.fetchedAt > mostRecentFetchedAt) {
        mostRecentFetchedAt = rate.fetchedAt;
      }
    }

    return {
      baseCurrency,
      rates,
      fetchedAt: mostRecentFetchedAt,
      isCached: true
    };
  } catch (error) {
    throw new Error(`Failed to retrieve cached rates: ${error.message}`);
  }
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} - Converted amount rounded to 2 decimals
 */
const convertAmount = async (amount, fromCurrency, toCurrency) => {
  try {
    // If currencies are the same, no conversion needed
    if (fromCurrency === toCurrency) {
      return Math.round(amount * 100) / 100;
    }

    // Try to get cached rates first
    let ratesData = await getCachedRates(fromCurrency);

    // If no cached rates or cache is stale, fetch fresh rates
    if (!ratesData) {
      try {
        const freshRates = await fetchExchangeRates(fromCurrency);
        await cacheExchangeRates(freshRates.baseCurrency, freshRates.rates);
        ratesData = freshRates;
      } catch (apiError) {
        // If API fails, try to get any cached rates (even if old)
        ratesData = await getCachedRates(fromCurrency, 24 * 365); // Try up to 1 year old
        if (!ratesData) {
          throw new Error('Unable to fetch or retrieve cached exchange rates');
        }
      }
    }

    // Get the conversion rate
    const rate = ratesData.rates[toCurrency];
    if (!rate) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }

    // Convert and round to 2 decimal places
    const convertedAmount = amount * rate;
    return Math.round(convertedAmount * 100) / 100;
  } catch (error) {
    throw new Error(`Currency conversion failed: ${error.message}`);
  }
};

/**
 * Fetch and cache exchange rates for a given base currency
 * This is a convenience method that combines fetch and cache operations
 * @param {string} baseCurrency - Base currency code
 * @returns {Promise<Object>} - Object with rates and cache status
 */
const updateExchangeRates = async (baseCurrency) => {
  try {
    const ratesData = await fetchExchangeRates(baseCurrency);
    const cachedCount = await cacheExchangeRates(ratesData.baseCurrency, ratesData.rates);
    
    return {
      baseCurrency: ratesData.baseCurrency,
      ratesCount: Object.keys(ratesData.rates).length,
      cachedCount,
      fetchedAt: ratesData.fetchedAt
    };
  } catch (error) {
    throw new Error(`Failed to update exchange rates: ${error.message}`);
  }
};

module.exports = {
  fetchExchangeRates,
  cacheExchangeRates,
  getCachedRates,
  convertAmount,
  updateExchangeRates
};
