const Expense = require('../models/Expense');
const User = require('../models/User');
const ApprovalRule = require('../models/ApprovalRule');
const ApprovalAction = require('../models/ApprovalAction');

/**
 * Approval Service
 * Handles approval workflow initiation, processing, and conditional rule evaluation
 */

/**
 * Initiate approval workflow for an expense
 * @param {string} expenseId - ID of the expense
 * @returns {Promise<Object>} - Updated expense with workflow initiated
 */
const initiateApprovalWorkflow = async (expenseId) => {
  try {
    const expense = await Expense.findById(expenseId)
      .populate('submitterId')
      .populate('approvalRuleId');

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (expense.status !== 'PENDING') {
      throw new Error('Workflow can only be initiated for pending expenses');
    }

    // Get the submitter to check for manager
    const submitter = expense.submitterId;

    // Determine the approval rule to use
    let approvalRule = expense.approvalRuleId;
    
    // If no approval rule is assigned, we need to find one or handle manager-only approval
    if (!approvalRule) {
      // For now, if there's a manager, route to manager
      // In a real system, you might have default rules or rule selection logic
      if (submitter.managerId) {
        // Create a simple manager approval by setting currentApprovalStep
        expense.currentApprovalStep = 0;
        await expense.save();
        console.log(`Approval workflow initiated for expense ${expenseId}: routed to manager ${submitter.managerId}`);
        return expense;
      } else {
        // No approval rule and no manager - auto-approve or throw error
        console.log(`No approval workflow initiated for expense ${expenseId}: no manager and no approval rule`);
        throw new Error('No approval rule configured and no manager assigned');
      }
    }

    // Check if manager should be the first approver
    if (approvalRule.isManagerApprover && submitter.managerId) {
      // Route to manager first
      expense.currentApprovalStep = 0;
      await expense.save();
      
      // Note: In a full implementation, you might create a notification here
      return expense;
    }

    // Route to first approver in the approval rule sequence
    if (approvalRule.approvalSteps && approvalRule.approvalSteps.length > 0) {
      // Sort steps by sequence order to ensure correct ordering
      const sortedSteps = approvalRule.approvalSteps.sort((a, b) => 
        a.sequenceOrder - b.sequenceOrder
      );
      
      expense.currentApprovalStep = 0;
      await expense.save();

      // Note: In a full implementation, you might create notifications for approvers here
      return expense;
    }

    throw new Error('Approval rule has no approval steps configured');
  } catch (error) {
    throw error;
  }
};

/**
 * Process an approval action (approve or reject)
 * @param {string} expenseId - ID of the expense
 * @param {string} approverId - ID of the approver
 * @param {string} action - Action to take ('APPROVED' or 'REJECTED')
 * @param {string} comments - Optional comments
 * @returns {Promise<Object>} - Updated expense
 */
const processApproval = async (expenseId, approverId, action, comments = null) => {
  try {
    const expense = await Expense.findById(expenseId)
      .populate('submitterId')
      .populate('approvalRuleId');

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (expense.status !== 'PENDING') {
      throw new Error('Expense is not pending approval');
    }

    // Validate action
    if (!['APPROVED', 'REJECTED'].includes(action)) {
      throw new Error('Invalid action. Must be APPROVED or REJECTED');
    }

    // Require comments for rejection
    if (action === 'REJECTED' && (!comments || comments.trim() === '')) {
      throw new Error('Comments are required for rejection');
    }

    // Check if this is a manager-based approval (no approval rule)
    const isManagerApproval = !expense.approvalRuleId && expense.submitterId.managerId && expense.submitterId.managerId.toString() === approverId;

    // Record the approval action
    const approvalAction = await ApprovalAction.create({
      expenseId,
      approverId,
      stepNumber: expense.currentApprovalStep || 0,
      action,
      comments
    });

    // Handle rejection
    if (action === 'REJECTED') {
      await finalizeRejection(expenseId);
      return await Expense.findById(expenseId)
        .populate('submitterId')
        .populate('approvalRuleId');
    }

    // Handle approval
    if (isManagerApproval) {
      // Direct manager approval - finalize immediately
      await finalizeApproval(expenseId);
    } else {
      // Handle approval - evaluate conditional rules
      const shouldAutoApprove = await evaluateConditionalRules(expenseId, approverId);

      if (shouldAutoApprove) {
        // Auto-approve and skip remaining steps
        await finalizeApproval(expenseId);
      } else {
        // Move to next approver
        await moveToNextApprover(expenseId);
      }
    }

    return await Expense.findById(expenseId)
      .populate('submitterId')
      .populate('approvalRuleId');
  } catch (error) {
    throw error;
  }
};

/**
 * Evaluate conditional approval rules
 * @param {string} expenseId - ID of the expense
 * @param {string} approverId - ID of the approver who just approved
 * @returns {Promise<boolean>} - True if expense should be auto-approved
 */
const evaluateConditionalRules = async (expenseId, approverId) => {
  try {
    const expense = await Expense.findById(expenseId).populate('approvalRuleId');

    if (!expense || !expense.approvalRuleId) {
      return false;
    }

    const rule = expense.approvalRuleId;

    // Only evaluate conditional rules for CONDITIONAL or COMBINED rule types
    if (rule.ruleType !== 'CONDITIONAL' && rule.ruleType !== 'COMBINED') {
      return false;
    }

    // Get current step
    if (!rule.approvalSteps || rule.approvalSteps.length === 0) {
      return false;
    }

    const currentStep = rule.approvalSteps.find(
      step => step.sequenceOrder === expense.currentApprovalStep + 1
    );

    if (!currentStep) {
      return false;
    }

    // Check percentage rule
    if (rule.percentageThreshold !== null && rule.percentageThreshold !== undefined) {
      const percentageMet = await checkApprovalPercentage(expenseId, currentStep._id, rule.percentageThreshold);
      if (percentageMet) {
        return true;
      }
    }

    // Check specific approver rule
    const specificApproverApproved = await checkSpecificApprover(expenseId, approverId, currentStep);
    if (specificApproverApproved) {
      return true;
    }

    return false;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if approval percentage threshold is met
 * @param {string} expenseId - ID of the expense
 * @param {string} stepId - ID of the current step
 * @param {number} threshold - Percentage threshold (0-100)
 * @returns {Promise<boolean>} - True if threshold is met
 */
const checkApprovalPercentage = async (expenseId, stepId, threshold) => {
  try {
    const expense = await Expense.findById(expenseId).populate('approvalRuleId');
    
    if (!expense || !expense.approvalRuleId) {
      return false;
    }

    const rule = expense.approvalRuleId;
    const currentStep = rule.approvalSteps.find(
      step => step.sequenceOrder === expense.currentApprovalStep + 1
    );

    if (!currentStep || !currentStep.approvers || currentStep.approvers.length === 0) {
      return false;
    }

    // Get all approval actions for this expense at the current step
    const approvalActions = await ApprovalAction.find({
      expenseId,
      stepNumber: expense.currentApprovalStep,
      action: 'APPROVED'
    });

    const totalApprovers = currentStep.approvers.length;
    const approvedCount = approvalActions.length;
    const approvalPercentage = (approvedCount / totalApprovers) * 100;

    return approvalPercentage >= threshold;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if a specific approver has approved
 * @param {string} expenseId - ID of the expense
 * @param {string} approverId - ID of the approver
 * @param {Object} currentStep - Current approval step
 * @returns {Promise<boolean>} - True if specific approver approved
 */
const checkSpecificApprover = async (expenseId, approverId, currentStep) => {
  try {
    if (!currentStep || !currentStep.approvers) {
      return false;
    }

    // Find if the approver is marked as a specific approver
    const specificApprover = currentStep.approvers.find(
      approver => approver.userId.toString() === approverId.toString() && approver.isSpecificApprover === true
    );

    if (!specificApprover) {
      return false;
    }

    // Check if this specific approver has approved
    const approvalAction = await ApprovalAction.findOne({
      expenseId,
      approverId,
      action: 'APPROVED'
    });

    return approvalAction !== null;
  } catch (error) {
    throw error;
  }
};

/**
 * Move expense to next approver in sequence
 * @param {string} expenseId - ID of the expense
 * @returns {Promise<Object>} - Updated expense
 */
const moveToNextApprover = async (expenseId) => {
  try {
    const expense = await Expense.findById(expenseId).populate('approvalRuleId');

    if (!expense) {
      throw new Error('Expense not found');
    }

    const rule = expense.approvalRuleId;

    if (!rule || !rule.approvalSteps || rule.approvalSteps.length === 0) {
      // No more steps, finalize approval
      await finalizeApproval(expenseId);
      return expense;
    }

    // Sort steps by sequence order
    const sortedSteps = rule.approvalSteps.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    const nextStepIndex = expense.currentApprovalStep + 1;

    if (nextStepIndex >= sortedSteps.length) {
      // No more steps, finalize approval
      await finalizeApproval(expenseId);
    } else {
      // Move to next step
      expense.currentApprovalStep = nextStepIndex;
      await expense.save();
    }

    return expense;
  } catch (error) {
    throw error;
  }
};

/**
 * Finalize approval of an expense
 * @param {string} expenseId - ID of the expense
 * @returns {Promise<Object>} - Updated expense
 */
const finalizeApproval = async (expenseId) => {
  try {
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      throw new Error('Expense not found');
    }

    expense.status = 'APPROVED';
    await expense.save();

    return expense;
  } catch (error) {
    throw error;
  }
};

/**
 * Finalize rejection of an expense
 * @param {string} expenseId - ID of the expense
 * @returns {Promise<Object>} - Updated expense
 */
const finalizeRejection = async (expenseId) => {
  try {
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      throw new Error('Expense not found');
    }

    expense.status = 'REJECTED';
    await expense.save();

    return expense;
  } catch (error) {
    throw error;
  }
};

/**
 * Get pending approvals for a user
 * @param {string} userId - ID of the user
 * @returns {Promise<Array>} - Array of expenses awaiting approval
 */
const getPendingApprovals = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    console.log(`Getting pending approvals for user ${userId} (${user.role}) in company ${user.companyId}`);

    // Find all pending expenses in the user's company
    const pendingExpenses = await Expense.find({
      companyId: user.companyId,
      status: 'PENDING'
    })
      .populate('submitterId', 'firstName lastName email managerId')
      .populate('approvalRuleId');

    console.log(`Found ${pendingExpenses.length} pending expenses in company`);
    
    // Debug: Log submitter manager relationships
    pendingExpenses.forEach(expense => {
      console.log(`Expense ${expense._id}: submitter ${expense.submitterId.firstName} ${expense.submitterId.lastName}, managerId: ${expense.submitterId.managerId}`);
    });

    // Filter expenses where the user is a current approver
    const userApprovals = [];

    for (const expense of pendingExpenses) {
      let isApprover = false;

      // For MANAGER, FINANCE, DIRECTOR roles: check if they manage the submitter OR are in approval steps
      if (['MANAGER', 'FINANCE', 'DIRECTOR'].includes(user.role)) {
        // Check if user is the direct manager of the submitter
        if (expense.submitterId.managerId && expense.submitterId.managerId.toString() === userId) {
          // Managers can always see expenses from their team members that are pending
          // This ensures managers have visibility into all team expenses needing approval
          console.log(`User ${userId} is manager for expense ${expense._id} submitted by ${expense.submitterId.firstName} ${expense.submitterId.lastName}`);
          isApprover = true;
        } else {
          console.log(`User ${userId} is NOT manager for expense ${expense._id} (submitter manager: ${expense.submitterId.managerId})`);
        }
      }

      // Check if user is in the current approval step of the approval rule
      if (expense.approvalRuleId && expense.approvalRuleId.approvalSteps) {
        const currentStep = expense.approvalRuleId.approvalSteps.find(
          step => step.sequenceOrder === expense.currentApprovalStep + 1
        );

        if (currentStep && currentStep.approvers) {
          const isInStep = currentStep.approvers.some(
            approver => approver.userId.toString() === userId.toString()
          );

          if (isInStep) {
            // Check if user has already approved this step
            const alreadyApproved = await ApprovalAction.exists({
              expenseId: expense._id,
              approverId: userId,
              stepNumber: expense.currentApprovalStep,
              action: 'APPROVED'
            });

            if (!alreadyApproved) {
              isApprover = true;
            }
          }
        }
      }

      if (isApprover) {
        userApprovals.push(expense);
      }
    }

    console.log(`Returning ${userApprovals.length} pending approvals for user ${userId}`);
    return userApprovals;
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    throw error;
  }
};

module.exports = {
  initiateApprovalWorkflow,
  processApproval,
  evaluateConditionalRules,
  checkApprovalPercentage,
  checkSpecificApprover,
  moveToNextApprover,
  finalizeApproval,
  finalizeRejection,
  getPendingApprovals
};
