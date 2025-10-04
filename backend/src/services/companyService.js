const axios = require('axios');
const Company = require('../models/Company');

// Fallback list of common countries and currencies
const FALLBACK_COUNTRIES = [
  { cca2: 'US', name: { common: 'United States' }, currencies: { USD: { name: 'United States dollar', symbol: '$' } } },
  { cca2: 'GB', name: { common: 'United Kingdom' }, currencies: { GBP: { name: 'British pound', symbol: '£' } } },
  { cca2: 'CA', name: { common: 'Canada' }, currencies: { CAD: { name: 'Canadian dollar', symbol: '$' } } },
  { cca2: 'AU', name: { common: 'Australia' }, currencies: { AUD: { name: 'Australian dollar', symbol: '$' } } },
  { cca2: 'DE', name: { common: 'Germany' }, currencies: { EUR: { name: 'Euro', symbol: '€' } } },
  { cca2: 'FR', name: { common: 'France' }, currencies: { EUR: { name: 'Euro', symbol: '€' } } },
  { cca2: 'JP', name: { common: 'Japan' }, currencies: { JPY: { name: 'Japanese yen', symbol: '¥' } } },
  { cca2: 'CN', name: { common: 'China' }, currencies: { CNY: { name: 'Chinese yuan', symbol: '¥' } } },
  { cca2: 'IN', name: { common: 'India' }, currencies: { INR: { name: 'Indian rupee', symbol: '₹' } } },
  { cca2: 'BR', name: { common: 'Brazil' }, currencies: { BRL: { name: 'Brazilian real', symbol: 'R$' } } },
  { cca2: 'MX', name: { common: 'Mexico' }, currencies: { MXN: { name: 'Mexican peso', symbol: '$' } } },
  { cca2: 'ZA', name: { common: 'South Africa' }, currencies: { ZAR: { name: 'South African rand', symbol: 'R' } } },
  { cca2: 'SG', name: { common: 'Singapore' }, currencies: { SGD: { name: 'Singapore dollar', symbol: '$' } } },
  { cca2: 'CH', name: { common: 'Switzerland' }, currencies: { CHF: { name: 'Swiss franc', symbol: 'Fr' } } },
  { cca2: 'SE', name: { common: 'Sweden' }, currencies: { SEK: { name: 'Swedish krona', symbol: 'kr' } } }
];

/**
 * Fetch countries and their currencies from REST Countries API
 * Falls back to hardcoded list if API is unavailable
 * @returns {Promise<Array>} Array of country objects with name and currencies
 */
const fetchCountries = async () => {
  try {
    const response = await axios.get(
      'https://restcountries.com/v3.1/all?fields=name,currencies,cca2',
      { timeout: 5000 }
    );

    // Transform the API response to a consistent format
    const countries = response.data
      .filter(country => country.currencies && country.cca2) // Only include countries with currencies and country code
      .map(country => ({
        cca2: country.cca2,
        name: { common: country.name.common },
        currencies: country.currencies
      }))
      .sort((a, b) => a.name.common.localeCompare(b.name.common)); // Sort alphabetically

    return countries;
  } catch (error) {
    console.error('Failed to fetch countries from REST Countries API:', error.message);
    console.log('Using fallback country list');
    return FALLBACK_COUNTRIES;
  }
};

/**
 * Update company settings
 * @param {string} companyId - Company ID
 * @param {Object} updates - Fields to update (name only for now)
 * @returns {Promise<Object>} Updated company object
 */
const updateCompanySettings = async (companyId, updates) => {
  // Only allow updating specific fields
  const allowedUpdates = ['name'];
  const filteredUpdates = {};

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  if (Object.keys(filteredUpdates).length === 0) {
    throw new Error('No valid fields to update');
  }

  const company = await Company.findByIdAndUpdate(
    companyId,
    filteredUpdates,
    { new: true, runValidators: true }
  );

  if (!company) {
    throw new Error('Company not found');
  }

  return company;
};

/**
 * Get company by ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Company object
 */
const getCompanyById = async (companyId) => {
  const company = await Company.findById(companyId);
  
  if (!company) {
    throw new Error('Company not found');
  }

  return company;
};

module.exports = {
  fetchCountries,
  updateCompanySettings,
  getCompanyById
};
