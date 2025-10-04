const bcrypt = require('bcrypt');
const axios = require('axios');
const User = require('../models/User');
const Company = require('../models/Company');
const { generateToken } = require('../middleware/auth');

/**
 * Fetch countries and currencies from REST Countries API
 */
const getCountries = async (req, res) => {
  try {
    const apiUrl = process.env.REST_COUNTRIES_API || 'https://restcountries.com/v3.1/all?fields=name,currencies';
    
    try {
      const response = await axios.get(apiUrl, { timeout: 5000 });
      const countries = response.data.map(country => ({
        name: country.name.common,
        currencies: country.currencies ? Object.keys(country.currencies).map(code => ({
          code,
          name: country.currencies[code].name,
          symbol: country.currencies[code].symbol
        })) : []
      })).filter(country => country.currencies.length > 0);

      return res.json({
        success: true,
        data: countries
      });
    } catch (apiError) {
      // Fallback to common countries if API fails
      const fallbackCountries = [
        { name: 'United States', currencies: [{ code: 'USD', name: 'United States Dollar', symbol: '$' }] },
        { name: 'United Kingdom', currencies: [{ code: 'GBP', name: 'British Pound', symbol: '£' }] },
        { name: 'Canada', currencies: [{ code: 'CAD', name: 'Canadian Dollar', symbol: '$' }] },
        { name: 'Australia', currencies: [{ code: 'AUD', name: 'Australian Dollar', symbol: '$' }] },
        { name: 'Germany', currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }] },
        { name: 'France', currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }] },
        { name: 'Japan', currencies: [{ code: 'JPY', name: 'Japanese Yen', symbol: '¥' }] },
        { name: 'India', currencies: [{ code: 'INR', name: 'Indian Rupee', symbol: '₹' }] }
      ];

      return res.json({
        success: true,
        data: fallbackCountries,
        warning: 'Using fallback country list'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'COUNTRIES_FETCH_ERROR',
        message: 'Failed to fetch countries'
      }
    });
  }
};

/**
 * Signup - Create company and admin user
 */
const signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName, country, currency } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !companyName || !country || !currency) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required: email, password, firstName, lastName, companyName, country, currency'
        }
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long'
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create company
    const company = await Company.create({
      name: companyName,
      country,
      defaultCurrency: currency.toUpperCase()
    });

    // Create admin user
    const user = await User.create({
      companyId: company._id,
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role: 'ADMIN',
      isActive: true
    });

    // Generate JWT token
    const token = generateToken(user);

    // Return success response
    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
          companyName: company.name,
          defaultCurrency: company.defaultCurrency,
          companyCountry: company.country
        }
      }
    });
  } catch (error) {
    console.error('Signup error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'User with this email already exists'
        }
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'SIGNUP_ERROR',
        message: 'Failed to create account'
      }
    });
  }
};

/**
 * Login - Authenticate user and return JWT token
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).populate('companyId');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Check if company exists
    if (!user.companyId) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'User company not found'
        }
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Your account has been deactivated'
        }
      });
    }

    // Validate password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate JWT token
    // Create a plain object for token generation since user.companyId is populated
    const tokenPayload = {
      _id: user._id,
      email: user.email,
      role: user.role,
      companyId: user.companyId._id
    };
    const token = generateToken(tokenPayload);

    // Return success response with token and user info
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId._id,
          companyName: user.companyId.name,
          defaultCurrency: user.companyId.defaultCurrency,
          companyCountry: user.companyId.country,
          managerId: user.managerId
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'Failed to login'
      }
    });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    // User info is already attached to req by authenticateToken middleware
    const user = await User.findById(req.user.userId)
      .select('-passwordHash')
      .populate('companyId', 'name country defaultCurrency')
      .populate('managerId', 'firstName lastName email');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Your account has been deactivated'
        }
      });
    }

    // Return user profile
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          companyId: user.companyId._id,
          companyName: user.companyId.name,
          companyCountry: user.companyId.country,
          defaultCurrency: user.companyId.defaultCurrency,
          managerId: user.managerId ? user.managerId._id : null,
          managerName: user.managerId ? `${user.managerId.firstName} ${user.managerId.lastName}` : null,
          managerEmail: user.managerId ? user.managerId.email : null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_ERROR',
        message: 'Failed to retrieve user profile'
      }
    });
  }
};

module.exports = {
  getCountries,
  signup,
  login,
  getProfile
};
