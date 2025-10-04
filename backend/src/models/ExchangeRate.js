const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  baseCurrency: {
    type: String,
    required: [true, 'Base currency is required'],
    trim: true,
    uppercase: true,
    minlength: [3, 'Currency code must be 3 characters'],
    maxlength: [3, 'Currency code must be 3 characters']
  },
  targetCurrency: {
    type: String,
    required: [true, 'Target currency is required'],
    trim: true,
    uppercase: true,
    minlength: [3, 'Currency code must be 3 characters'],
    maxlength: [3, 'Currency code must be 3 characters']
  },
  rate: {
    type: Number,
    required: [true, 'Exchange rate is required'],
    min: [0, 'Exchange rate must be positive']
  },
  fetchedAt: {
    type: Date,
    default: Date.now,
    required: [true, 'Fetched date is required']
  }
}, {
  timestamps: true
});

// Compound index on baseCurrency and targetCurrency for efficient lookups
exchangeRateSchema.index({ baseCurrency: 1, targetCurrency: 1 });

// Index for fetched date to find most recent rates
exchangeRateSchema.index({ fetchedAt: -1 });

const ExchangeRate = mongoose.model('ExchangeRate', exchangeRateSchema);

module.exports = ExchangeRate;
