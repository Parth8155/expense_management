const express = require('express');
const router = express.Router();
const approvalRuleController = require('../controllers/approvalRuleController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * Approval Rule Routes
 * All routes require authentication
 * Admin-only routes are protected with authorizeRole middleware
 */

// Create a new approval rule (Admin only)
router.post(
  '/',
  authenticateToken,
  authorizeRole('ADMIN'),
  approvalRuleController.createApprovalRule
);

// Get all approval rules for the user's company
router.get(
  '/',
  authenticateToken,
  approvalRuleController.getApprovalRules
);

// Get a single approval rule by ID
router.get(
  '/:id',
  authenticateToken,
  approvalRuleController.getApprovalRuleById
);

// Update an approval rule (Admin only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  approvalRuleController.updateApprovalRule
);

// Delete an approval rule (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  approvalRuleController.deleteApprovalRule
);

module.exports = router;
