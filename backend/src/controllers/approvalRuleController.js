const approvalRuleService = require('../services/approvalRuleService');

/**
 * Approval Rule Controller
 * Handles HTTP requests for approval rule management
 */

/**
 * Create a new approval rule (Admin only)
 * POST /api/approval-rules
 */
const createApprovalRule = async (req, res) => {
  try {
    const { name, ruleType, percentageThreshold, isManagerApprover, approvalSteps } = req.body;

    // Use the company ID from the authenticated user
    const companyId = req.user.companyId;

    const ruleData = {
      companyId,
      name,
      ruleType,
      percentageThreshold,
      isManagerApprover,
      approvalSteps
    };

    const approvalRule = await approvalRuleService.createRule(ruleData);

    res.status(201).json({
      success: true,
      data: approvalRule
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
};

/**
 * Get all approval rules for the user's company
 * GET /api/approval-rules
 */
const getApprovalRules = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const rules = await approvalRuleService.getRulesByCompany(companyId);

    res.status(200).json({
      success: true,
      data: rules
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
};

/**
 * Get a single approval rule by ID
 * GET /api/approval-rules/:id
 */
const getApprovalRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await approvalRuleService.getRuleById(id);

    // Verify the rule belongs to the user's company
    if (rule.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. This approval rule does not belong to your company'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: rule
    });
  } catch (error) {
    if (error.message === 'Approval rule not found') {
      return res.status(404).json({
        success: false,
        error: {
          message: error.message
        }
      });
    }

    res.status(400).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
};

/**
 * Update an approval rule (Admin only)
 * PUT /api/approval-rules/:id
 */
const updateApprovalRule = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // First, get the rule to verify it belongs to the user's company
    const rule = await approvalRuleService.getRuleById(id);

    if (rule.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. This approval rule does not belong to your company'
        }
      });
    }

    // Don't allow updating companyId
    delete updates.companyId;

    const updatedRule = await approvalRuleService.updateRule(id, updates);

    res.status(200).json({
      success: true,
      data: updatedRule
    });
  } catch (error) {
    if (error.message === 'Approval rule not found') {
      return res.status(404).json({
        success: false,
        error: {
          message: error.message
        }
      });
    }

    res.status(400).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
};

/**
 * Delete an approval rule (Admin only)
 * DELETE /api/approval-rules/:id
 */
const deleteApprovalRule = async (req, res) => {
  try {
    const { id } = req.params;

    // First, get the rule to verify it belongs to the user's company
    const rule = await approvalRuleService.getRuleById(id);

    if (rule.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. This approval rule does not belong to your company'
        }
      });
    }

    await approvalRuleService.deleteRule(id);

    res.status(200).json({
      success: true,
      message: 'Approval rule deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Approval rule not found') {
      return res.status(404).json({
        success: false,
        error: {
          message: error.message
        }
      });
    }

    res.status(400).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
};

module.exports = {
  createApprovalRule,
  getApprovalRules,
  getApprovalRuleById,
  updateApprovalRule,
  deleteApprovalRule
};
