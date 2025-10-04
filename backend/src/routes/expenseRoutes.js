const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../config/multer');

/**
 * Expense Routes
 * All routes require authentication
 */

// Create new expense
router.post('/', authenticateToken, expenseController.createExpense);

// Get expenses with role-based filtering
router.get('/', authenticateToken, expenseController.getExpenses);

// Get expense by ID
router.get('/:id', authenticateToken, expenseController.getExpenseById);

// Update expense
router.put('/:id', authenticateToken, expenseController.updateExpense);

// Delete expense
router.delete('/:id', authenticateToken, expenseController.deleteExpense);

// Upload receipt
router.post('/:id/receipt', authenticateToken, upload.single('receipt'), expenseController.uploadReceipt);

module.exports = router;
