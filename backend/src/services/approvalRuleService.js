const ApprovalRule = require('../models/ApprovalRule');
const User = require('../models/User');
const Expense = require('../models/Expense');

/**
 * Approval Rule Service
 * Handles CRUD operations for approval rules
 */

/**
 * Create a new approval rule
 * @param {Object} ruleData - Rule data
 * @returns {Promise<Object>} - Created approval rule
 */
const createRule = async (ruleData) => {
  try {
    const { companyId, name, ruleType, percentageThreshold, isManagerApprover, approvalSteps } = ruleData;

    // Validate required fields
    if (!companyId || !name || !ruleType || !approvalSteps || approvalSteps.length === 0) {
      throw new Error('Missing required fields: companyId, name, ruleType, and approvalSteps are required');
    }

    // Validate rule type
    if (!['SEQUENTIAL', 'CONDITIONAL', 'COMBINED'].includes(ruleType)) {
      throw new Error('Invalid rule type. Must be SEQUENTIAL, CONDITIONAL, or COMBINED');
    }

    // Validate percentage threshold for conditional rules
    if ((ruleType === 'CONDITIONAL' || ruleType === 'COMBINED') && percentageThreshold !== null && percentageThreshold !== undefined) {
      if (percentageThreshold < 0 || percentageThreshold > 100) {
        throw new Error('Percentage threshold must be between 0 and 100');
      }
    }

    // Validate approval steps
    for (const step of approvalSteps) {
      if (!step.sequenceOrder || !step.approvers || step.approvers.length === 0) {
        throw new Error('Each approval step must have a sequenceOrder and at least one approver');
      }

      // Validate that all approvers exist and belong to the same company
      for (const approver of step.approvers) {
        const user = await User.findById(approver.userId);
        if (!user) {
          throw new Error(`Approver with ID ${approver.userId} not found`);
        }
        if (user.companyId.toString() !== companyId.toString()) {
          throw new Error(`Approver ${user.email} does not belong to the same company`);
        }
      }
    }

    // Create the approval rule
    const approvalRule = await ApprovalRule.create({
      companyId,
      name,
      ruleType,
      percentageThreshold: percentageThreshold || null,
      isManagerApprover: isManagerApprover || false,
      approvalSteps
    });

    return approvalRule;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing approval rule
 * @param {string} ruleId - ID of the rule to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated approval rule
 */
const updateRule = async (ruleId, updates) => {
  try {
    const rule = await ApprovalRule.findById(ruleId);

    if (!rule) {
      throw new Error('Approval rule not found');
    }

    // Validate rule type if being updated
    if (updates.ruleType && !['SEQUENTIAL', 'CONDITIONAL', 'COMBINED'].includes(updates.ruleType)) {
      throw new Error('Invalid rule type. Must be SEQUENTIAL, CONDITIONAL, or COMBINED');
    }

    // Validate percentage threshold if being updated
    if (updates.percentageThreshold !== undefined && updates.percentageThreshold !== null) {
      if (updates.percentageThreshold < 0 || updates.percentageThreshold > 100) {
        throw new Error('Percentage threshold must be between 0 and 100');
      }
    }

    // Validate approval steps if being updated
    if (updates.approvalSteps) {
      if (updates.approvalSteps.length === 0) {
        throw new Error('At least one approval step is required');
      }

      for (const step of updates.approvalSteps) {
        if (!step.sequenceOrder || !step.approvers || step.approvers.length === 0) {
          throw new Error('Each approval step must have a sequenceOrder and at least one approver');
        }

        // Validate that all approvers exist and belong to the same company
        for (const approver of step.approvers) {
          const user = await User.findById(approver.userId);
          if (!user) {
            throw new Error(`Approver with ID ${approver.userId} not found`);
          }
          if (user.companyId.toString() !== rule.companyId.toString()) {
            throw new Error(`Approver ${user.email} does not belong to the same company`);
          }
        }
      }
    }

    // Update the rule
    Object.assign(rule, updates);
    await rule.save();

    return rule;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete an approval rule
 * @param {string} ruleId - ID of the rule to delete
 * @returns {Promise<Object>} - Deleted approval rule
 */
const deleteRule = async (ruleId) => {
  try {
    const rule = await ApprovalRule.findById(ruleId);

    if (!rule) {
      throw new Error('Approval rule not found');
    }

    // Check if any expenses are using this rule
    const expensesUsingRule = await Expense.countDocuments({ approvalRuleId: ruleId });

    if (expensesUsingRule > 0) {
      throw new Error(`Cannot delete approval rule. ${expensesUsingRule} expense(s) are currently using this rule`);
    }

    await ApprovalRule.findByIdAndDelete(ruleId);

    return rule;
  } catch (error) {
    throw error;
  }
};

/**
 * Assign an approval rule to an expense
 * @param {string} expenseId - ID of the expense
 * @param {string} ruleId - ID of the approval rule
 * @returns {Promise<Object>} - Updated expense
 */
const assignRuleToExpense = async (expenseId, ruleId) => {
  try {
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      throw new Error('Expense not found');
    }

    const rule = await ApprovalRule.findById(ruleId);

    if (!rule) {
      throw new Error('Approval rule not found');
    }

    // Validate that the rule belongs to the same company as the expense
    if (rule.companyId.toString() !== expense.companyId.toString()) {
      throw new Error('Approval rule does not belong to the same company as the expense');
    }

    // Assign the rule
    expense.approvalRuleId = ruleId;
    await expense.save();

    return expense;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all approval rules for a company
 * @param {string} companyId - ID of the company
 * @returns {Promise<Array>} - Array of approval rules
 */
const getRulesByCompany = async (companyId) => {
  try {
    const rules = await ApprovalRule.find({ companyId })
      .populate('approvalSteps.approvers.userId', 'firstName lastName email role')
      .sort({ createdAt: -1 });

    return rules;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single approval rule by ID
 * @param {string} ruleId - ID of the rule
 * @returns {Promise<Object>} - Approval rule
 */
const getRuleById = async (ruleId) => {
  try {
    const rule = await ApprovalRule.findById(ruleId)
      .populate('approvalSteps.approvers.userId', 'firstName lastName email role');

    if (!rule) {
      throw new Error('Approval rule not found');
    }

    return rule;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createRule,
  updateRule,
  deleteRule,
  assignRuleToExpense,
  getRulesByCompany,
  getRuleById
};
