const {
  getPendingApprovals,
  processApproval
} = require('../services/approvalService');

/**
 * Approval Controller
 * Handles approval-related HTTP requests
 */

/**
 * Get pending approvals for the current user
 * GET /api/approvals/pending
 */
const getPendingApprovalsHandler = async (req, res) => {
  try {
    const userId = req.user.userId;

    const pendingApprovals = await getPendingApprovals(userId);

    res.status(200).json({
      success: true,
      data: pendingApprovals
    });
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get pending approvals'
    });
  }
};

/**
 * Approve an expense
 * POST /api/approvals/:expenseId/approve
 */
const approveExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { comments } = req.body;
    const approverId = req.user.userId;

    const expense = await processApproval(expenseId, approverId, 'APPROVED', comments);

    res.status(200).json({
      success: true,
      message: 'Expense approved successfully',
      data: expense
    });
  } catch (error) {
    console.error('Error approving expense:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('not pending')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve expense'
    });
  }
};

/**
 * Reject an expense
 * POST /api/approvals/:expenseId/reject
 */
const rejectExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { comments } = req.body;
    const approverId = req.user.userId;

    // Validate that comments are provided
    if (!comments || comments.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Comments are required for rejection'
      });
    }

    const expense = await processApproval(expenseId, approverId, 'REJECTED', comments);

    res.status(200).json({
      success: true,
      message: 'Expense rejected successfully',
      data: expense
    });
  } catch (error) {
    console.error('Error rejecting expense:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('not pending')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject expense'
    });
  }
};

/**
 * Admin override - approve or reject any expense
 * POST /api/approvals/:expenseId/override
 */
const overrideApproval = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { action, comments } = req.body;
    const adminId = req.user.userId;

    // Validate action
    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be APPROVED or REJECTED'
      });
    }

    // Require comments for rejection
    if (action === 'REJECTED' && (!comments || comments.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: 'Comments are required for rejection'
      });
    }

    const expense = await processApproval(expenseId, adminId, action, comments);

    res.status(200).json({
      success: true,
      message: `Expense ${action.toLowerCase()} by admin override`,
      data: expense
    });
  } catch (error) {
    console.error('Error overriding approval:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to override approval'
    });
  }
};

module.exports = {
  getPendingApprovalsHandler,
  approveExpense,
  rejectExpense,
  overrideApproval
};
