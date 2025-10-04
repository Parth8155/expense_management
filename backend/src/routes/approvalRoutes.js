const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getPendingApprovalsHandler,
  approveExpense,
  rejectExpense,
  overrideApproval
} = require('../controllers/approvalController');

// Get pending approvals for current user (Manager, Admin)
router.get('/pending', authenticateToken, authorizeRole('MANAGER', 'ADMIN'), getPendingApprovalsHandler);

// Approve an expense (Manager, Admin)
router.post('/:expenseId/approve', authenticateToken, authorizeRole('MANAGER', 'ADMIN'), approveExpense);

// Reject an expense (Manager, Admin)
router.post('/:expenseId/reject', authenticateToken, authorizeRole('MANAGER', 'ADMIN'), rejectExpense);

// Admin override (Admin only)
router.post('/:expenseId/override', authenticateToken, authorizeRole('ADMIN'), overrideApproval);

module.exports = router;
