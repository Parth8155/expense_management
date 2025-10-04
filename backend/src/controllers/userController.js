const userService = require('../services/userService');

/**
 * Create a new user (Admin only)
 * POST /api/users
 */
const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, managerId } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: email, password, firstName, lastName, role'
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

    // Create user with requesting user's company
    const userData = {
      email,
      password,
      firstName,
      lastName,
      role,
      companyId: req.user.companyId,
      managerId: managerId || null
    };

    const user = await userService.createUser(userData, req.user.userId);

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
          managerId: user.managerId,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create user error:', error);

    if (error.code === 'USER_EXISTS') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: error.message
        }
      });
    }

    if (error.message.includes('not found') || error.message.includes('Invalid')) {
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
        code: 'CREATE_USER_ERROR',
        message: 'Failed to create user'
      }
    });
  }
};

/**
 * Get all users in company (Admin/Manager)
 * GET /api/users
 */
const getUsers = async (req, res) => {
  try {
    const users = await userService.getUsersByCompany(req.user.companyId, req.user.userId);

    return res.status(200).json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          companyId: user.companyId._id,
          companyName: user.companyId.name,
          managerId: user.managerId ? user.managerId._id : null,
          managerName: user.managerId ? `${user.managerId.firstName} ${user.managerId.lastName}` : null,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'GET_USERS_ERROR',
        message: 'Failed to retrieve users'
      }
    });
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userService.getUserById(id, req.user.userId);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          companyId: user.companyId._id,
          companyName: user.companyId.name,
          companyCountry: user.companyId.country,
          defaultCurrency: user.companyId.defaultCurrency,
          managerId: user.managerId ? user.managerId._id : null,
          managerName: user.managerId ? `${user.managerId.firstName} ${user.managerId.lastName}` : null,
          managerEmail: user.managerId ? user.managerId.email : null,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error.message.includes('Cannot view')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: error.message
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'GET_USER_ERROR',
        message: 'Failed to retrieve user'
      }
    });
  }
};

/**
 * Update user (Admin only)
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent password updates through this endpoint
    if (updates.password || updates.passwordHash) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password cannot be updated through this endpoint'
        }
      });
    }

    const user = await userService.updateUser(id, updates, req.user.userId);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          companyId: user.companyId._id,
          companyName: user.companyId.name,
          managerId: user.managerId ? user.managerId._id : null,
          managerName: user.managerId ? `${user.managerId.firstName} ${user.managerId.lastName}` : null,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update user error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error.code === 'USER_EXISTS') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: error.message
        }
      });
    }

    if (error.message.includes('Invalid') || error.message.includes('Cannot')) {
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
        code: 'UPDATE_USER_ERROR',
        message: 'Failed to update user'
      }
    });
  }
};

/**
 * Deactivate user (Admin only)
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userService.deactivateUser(id, req.user.userId);

    return res.status(200).json({
      success: true,
      data: {
        message: 'User deactivated successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error.message.includes('Cannot')) {
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
        code: 'DELETE_USER_ERROR',
        message: 'Failed to deactivate user'
      }
    });
  }
};

/**
 * Change user role (Admin only)
 * PUT /api/users/:id/role
 */
const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role is provided
    if (!role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role is required'
        }
      });
    }

    // Validate role value
    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid role. Must be ADMIN, MANAGER, or EMPLOYEE'
        }
      });
    }

    const user = await userService.changeRole(id, role, req.user.userId);

    return res.status(200).json({
      success: true,
      data: {
        message: 'User role updated successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          companyId: user.companyId._id,
          companyName: user.companyId.name,
          managerId: user.managerId ? user.managerId._id : null,
          managerName: user.managerId ? `${user.managerId.firstName} ${user.managerId.lastName}` : null,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Change user role error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error.message.includes('Invalid') || error.message.includes('Cannot')) {
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
        code: 'CHANGE_ROLE_ERROR',
        message: 'Failed to change user role'
      }
    });
  }
};

/**
 * Assign manager to user (Admin only)
 * PUT /api/users/:id/manager
 */
const assignManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { managerId } = req.body;

    // Validate managerId is provided
    if (!managerId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Manager ID is required'
        }
      });
    }

    const user = await userService.assignManager(id, managerId, req.user.userId);

    return res.status(200).json({
      success: true,
      data: {
        message: 'Manager assigned successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          companyId: user.companyId._id,
          companyName: user.companyId.name,
          managerId: user.managerId ? user.managerId._id : null,
          managerName: user.managerId ? `${user.managerId.firstName} ${user.managerId.lastName}` : null,
          managerEmail: user.managerId ? user.managerId.email : null,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Assign manager error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error.message.includes('Invalid') || error.message.includes('must')) {
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
        code: 'ASSIGN_MANAGER_ERROR',
        message: 'Failed to assign manager'
      }
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  changeUserRole,
  assignManager
};
