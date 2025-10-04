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

    // Check if we should use the default sequential workflow
    // This applies when there's no formal approval rule OR when isManagerApprover is true
    const useDefaultWorkflow = !expense.approvalRuleId || (expense.approvalRuleId && expense.approvalRuleId.isManagerApprover);

    if (useDefaultWorkflow) {
      // Default workflow: Manager (if exists) → Finance → Director

      if (expense.approvalRuleId && expense.approvalRuleId.isManagerApprover && submitter.managerId) {
        // Start with manager approval
        expense.currentApprovalStep = 0; // 0 = Manager, 1 = Finance, 2 = Director
        await expense.save();
        console.log(`Approval workflow initiated for expense ${expenseId}: Step 1 - Manager approval (${submitter.managerId})`);
        return expense;
      } else {
        // Skip manager step, start with Finance
        expense.currentApprovalStep = 1; // 1 = Finance, 2 = Director
        await expense.save();
        console.log(`Approval workflow initiated for expense ${expenseId}: Step 2 - Finance approval (no manager)`);
        return expense;
      }
    }

    // Use formal approval rule workflow
    if (expense.approvalRuleId.approvalSteps && expense.approvalRuleId.approvalSteps.length > 0) {
      // Sort steps by sequence order to ensure correct ordering
      const sortedSteps = expense.approvalRuleId.approvalSteps.sort((a, b) =>
        a.sequenceOrder - b.sequenceOrder
      );

      expense.currentApprovalStep = 0;
      await expense.save();

      console.log(`Approval workflow initiated for expense ${expenseId}: Using formal approval rule`);
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
    console.log(`Processing approval for expense ${expenseId} by user ${approverId}, action: ${action}`);

    const expense = await Expense.findById(expenseId)
      .populate('submitterId')
      .populate('approvalRuleId');

    if (!expense) {
      throw new Error('Expense not found');
    }

    console.log(`Expense found: status=${expense.status}, currentStep=${expense.currentApprovalStep}, approvalRuleId=${expense.approvalRuleId}`);

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
    console.log(`isManagerApproval: ${isManagerApproval} (approverId=${approverId}, managerId=${expense.submitterId.managerId})`);

    // Record the approval action
    const approvalAction = await ApprovalAction.create({
      expenseId,
      approverId,
      stepNumber: expense.currentApprovalStep || 0,
      action,
      comments
    });
    console.log(`Approval action recorded: ${approvalAction._id}`);

    // Handle rejection
    if (action === 'REJECTED') {
      console.log(`Processing rejection for expense ${expenseId}`);
      await finalizeRejection(expenseId);
      return await Expense.findById(expenseId)
        .populate('submitterId')
        .populate('approvalRuleId');
    }

    // Handle approval
    if (isManagerApproval) {
      // Direct manager approval - move to next step (Finance)
      console.log(`Manager approval detected for expense ${expenseId}, moving to next step`);
      await moveToNextStep(expenseId);
    } else {
      // Check if this is part of the default sequential workflow
      const isDefaultWorkflow = !expense.approvalRuleId || (expense.approvalRuleId && expense.approvalRuleId.isManagerApprover);
      console.log(`isDefaultWorkflow: ${isDefaultWorkflow}, approvalRuleId: ${expense.approvalRuleId}`);

      if (isDefaultWorkflow) {
        // Handle default workflow approval
                console.log(`Default workflow approval for expense ${expenseId}, current step: ${expense.currentApprovalStep}`);
        await moveToNextStep(expenseId);
      } else {
        // Handle formal approval rule workflow
        console.log(`Formal approval rule workflow for expense ${expenseId}`);
        const shouldAutoApprove = await evaluateConditionalRules(expenseId, approverId);

        if (shouldAutoApprove) {
          // Auto-approve and skip remaining steps
          await finalizeApproval(expenseId);
        } else {
          // Move to next step
          await moveToNextStep(expenseId);
        }
      }
    }

    const updatedExpense = await Expense.findById(expenseId);
    console.log(`Final expense state: status=${updatedExpense.status}, currentStep=${updatedExpense.currentApprovalStep}`);

    return await Expense.findById(expenseId)
      .populate('submitterId')
      .populate('approvalRuleId');
  } catch (error) {
    console.error('Error in processApproval:', error);
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
 * Move expense to next step in default sequential workflow
 * @param {string} expenseId - ID of the expense
 * @returns {Promise<Object>} - Updated expense
 */
const moveToNextStep = async (expenseId) => {
  try {
    console.log(`Moving expense ${expenseId} to next step`);

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      throw new Error('Expense not found');
    }

    const currentStep = expense.currentApprovalStep || 0;
    console.log(`Current step: ${currentStep}`);

    // Default workflow steps:
    // 0 = Manager, 1 = Finance, 2 = Director, 3+ = Approved
    if (currentStep === 0) {
      // Manager approved, move to Finance
      expense.currentApprovalStep = 1;
      await expense.save();
      console.log(`Expense ${expenseId} moved from Manager to Finance approval`);
    } else if (currentStep === 1) {
      // Finance approved, move to Director
      expense.currentApprovalStep = 2;
      await expense.save();
      console.log(`Expense ${expenseId} moved from Finance to Director approval`);
    } else if (currentStep === 2) {
      // Director approved, finalize
      await finalizeApproval(expenseId);
      console.log(`Expense ${expenseId} approved by Director - workflow complete`);
    } else {
      // Unknown step, finalize
      await finalizeApproval(expenseId);
      console.log(`Expense ${expenseId} finalized from unknown step ${currentStep}`);
    }

    return expense;
  } catch (error) {
    console.error('Error in moveToNextStep:', error);
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

      // Check if this expense uses the default sequential workflow
      const isDefaultWorkflow = !expense.approvalRuleId || (expense.approvalRuleId && expense.approvalRuleId.isManagerApprover);
      const currentStep = expense.currentApprovalStep || 0;

      if (isDefaultWorkflow) {
        // Default workflow: Manager → Finance → Director
        if (currentStep === 0) {
          // Manager step - check if user is the submitter's manager
          if (expense.submitterId.managerId && expense.submitterId.managerId.toString() === userId) {
            isApprover = true;
            console.log(`User ${userId} is manager for expense ${expense._id} (Step 0: Manager)`);
          }
        } else if (currentStep === 1 && user.role === 'FINANCE') {
          // Finance step - any FINANCE user can approve
          isApprover = true;
          console.log(`User ${userId} (${user.role}) can approve expense ${expense._id} (Step 1: Finance)`);
        } else if (currentStep === 2 && user.role === 'DIRECTOR') {
          // Director step - any DIRECTOR user can approve
          isApprover = true;
          console.log(`User ${userId} (${user.role}) can approve expense ${expense._id} (Step 2: Director)`);
        }
      } else {
        // Formal approval rule workflow
        if (expense.approvalRuleId && expense.approvalRuleId.approvalSteps) {
          const currentStepData = expense.approvalRuleId.approvalSteps.find(
            step => step.sequenceOrder === expense.currentApprovalStep + 1
          );

          if (currentStepData && currentStepData.approvers) {
            const isInStep = currentStepData.approvers.some(
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
      }

      // Legacy check for MANAGER, FINANCE, DIRECTOR roles (for backward compatibility)
      if (!isApprover && ['MANAGER', 'FINANCE', 'DIRECTOR'].includes(user.role)) {
        // Check if user is the direct manager of the submitter
        if (expense.submitterId.managerId && expense.submitterId.managerId.toString() === userId) {
          isApprover = true;
          console.log(`Legacy: User ${userId} is manager for expense ${expense._id}`);
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
  moveToNextStep,
  finalizeApproval,
  finalizeRejection,
  getPendingApprovals
};
