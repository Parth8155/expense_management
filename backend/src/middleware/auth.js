const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for a user
 * @param {Object} user - User object with _id, email, role, companyId
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    companyId: user.companyId.toString()
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * Middleware to verify JWT token and attach user info to request
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_MISSING',
          message: 'Authentication token is required'
        }
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Authentication token has expired'
            }
          });
        }

        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        });
      }

      // Attach user info to request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        companyId: decoded.companyId
      };

      next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error occurred'
      }
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 * @param {string|string[]} roles - Required role(s) (ADMIN, MANAGER, EMPLOYEE, FINANCE, DIRECTOR)
 */
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      // Check if user has required role
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to access this resource'
          }
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Authorization error occurred'
        }
      });
    }
  };
};

/**
 * Helper function to check if user has specific permission
 * @param {Object} user - User object from request
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
const checkPermission = (user, permission) => {
  if (!user || !user.role) {
    return false;
  }

  const permissions = {
    ADMIN: [
      'manage_users',
      'manage_company',
      'manage_approval_rules',
      'view_all_expenses',
      'approve_expense',
      'reject_expense',
      'override_approval',
      'submit_expense',
      'view_own_expenses'
    ],
    MANAGER: [
      'approve_expense',
      'reject_expense',
      'view_team_expenses',
      'submit_expense',
      'view_own_expenses'
    ],
    FINANCE: [
      'approve_expense',
      'reject_expense',
      'view_team_expenses',
      'submit_expense',
      'view_own_expenses'
    ],
    DIRECTOR: [
      'approve_expense',
      'reject_expense',
      'view_team_expenses',
      'submit_expense',
      'view_own_expenses'
    ],
    EMPLOYEE: [
      'submit_expense',
      'view_own_expenses',
      'delete_own_expense'
    ]
  };

  const userPermissions = permissions[user.role] || [];
  return userPermissions.includes(permission);
};

module.exports = {
  generateToken,
  authenticateToken,
  authorizeRole,
  checkPermission
};
