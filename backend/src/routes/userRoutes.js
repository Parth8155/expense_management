const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// POST /api/users - Create new user (Admin only)
router.post('/', authorizeRole('ADMIN'), userController.createUser);

// GET /api/users - List company users (Admin/Manager)
router.get('/', authorizeRole('ADMIN', 'MANAGER'), userController.getUsers);

// GET /api/users/:id - Get user details (Admin/Manager can view their team, Employee can view self)
router.get('/:id', userController.getUserById);

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', authorizeRole('ADMIN'), userController.updateUser);

// DELETE /api/users/:id - Deactivate user (Admin only)
router.delete('/:id', authorizeRole('ADMIN'), userController.deleteUser);

// PUT /api/users/:id/role - Change user role (Admin only)
router.put('/:id/role', authorizeRole('ADMIN'), userController.changeUserRole);

// PUT /api/users/:id/manager - Assign manager to user (Admin only)
router.put('/:id/manager', authorizeRole('ADMIN'), userController.assignManager);

module.exports = router;
