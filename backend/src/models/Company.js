const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    minlength: [2, 'Company name must be at least 2 characters long'],
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  defaultCurrency: {
    type: String,
    required: [true, 'Default currency is required'],
    trim: true,
    uppercase: true,
    minlength: [3, 'Currency code must be 3 characters'],
    maxlength: [3, 'Currency code must be 3 characters']
  }
}, {
  timestamps: true
});

// Index for faster queries
companySchema.index({ name: 1 });

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
