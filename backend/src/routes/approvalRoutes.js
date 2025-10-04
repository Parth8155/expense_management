const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getPendingApprovalsHandler,
  approveExpense,
  rejectExpense,
  overrideApproval
} = require('../controllers/approvalController');

// Get pending approvals for current user (Manager, Finance, Director, Admin)
router.get('/pending', authenticateToken, authorizeRole('MANAGER', 'FINANCE', 'DIRECTOR', 'ADMIN'), getPendingApprovalsHandler);

// Approve an expense (Manager, Finance, Director, Admin)
router.post('/:expenseId/approve', authenticateToken, authorizeRole('MANAGER', 'FINANCE', 'DIRECTOR', 'ADMIN'), approveExpense);

// Reject an expense (Manager, Finance, Director, Admin)
router.post('/:expenseId/reject', authenticateToken, authorizeRole('MANAGER', 'FINANCE', 'DIRECTOR', 'ADMIN'), rejectExpense);

// Admin override (Admin only)
router.post('/:expenseId/override', authenticateToken, authorizeRole('ADMIN'), overrideApproval);

module.exports = router;
