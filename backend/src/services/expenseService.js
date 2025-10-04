const Expense = require('../models/Expense');
const User = require('../models/User');
const Company = require('../models/Company');
const { convertAmount } = require('./currencyService');

/**
 * Expense Service
 * Handles expense creation, retrieval, updates, and deletion
 */

/**
 * Create a new expense
 * @param {Object} expenseData - Expense data
 * @param {string} userId - ID of the user submitting the expense
 * @returns {Promise<Object>} - Created expense
 */
const createExpense = async (expenseData, userId) => {
  try {
    // Get user to retrieve companyId
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    // Get company to check default currency
    const company = await Company.findById(user.companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Prepare expense object
    const expense = new Expense({
      companyId: user.companyId,
      submitterId: userId,
      amount: expenseData.amount,
      currency: expenseData.currency.toUpperCase(),
      category: expenseData.category,
      description: expenseData.description,
      expenseDate: expenseData.expenseDate,
      status: 'PENDING',
      expenseLines: expenseData.expenseLines || [],
      currentApprovalStep: 0
    });

    // Convert amount to company default currency if different
    if (expense.currency !== company.defaultCurrency) {
      try {
        expense.convertedAmount = await convertAmount(
          expense.amount,
          expense.currency,
          company.defaultCurrency
        );
      } catch (conversionError) {
        // If conversion fails, log but don't block expense creation
        console.error('Currency conversion failed:', conversionError.message);
        expense.convertedAmount = null;
      }
    } else {
      expense.convertedAmount = expense.amount;
    }

    // Save expense
    await expense.save();

    // Trigger approval workflow initiation
    const { initiateApprovalWorkflow } = require('./approvalService');
    try {
      console.log(`Initiating approval workflow for expense ${expense._id} submitted by user ${userId}`);
      await initiateApprovalWorkflow(expense._id);
      console.log(`Approval workflow initiated successfully for expense ${expense._id}`);
    } catch (workflowError) {
      // Log error but don't block expense creation
      console.error('Failed to initiate approval workflow:', workflowError.message);
    }

    return expense;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
};

/**
 * Get expenses with role-based filtering
 * @param {string} userId - ID of the user requesting expenses
 * @param {string} role - Role of the user (ADMIN, MANAGER, EMPLOYEE, FINANCE, DIRECTOR)
 * @param {Object} filters - Optional filters (status, dateFrom, dateTo, category)
 * @returns {Promise<Array>} - Array of expenses
 */
const getExpenses = async (userId, role, filters = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Build query based on role
    let query = { companyId: user.companyId };

    if (role === 'EMPLOYEE') {
      // Employees can only see their own expenses
      query.submitterId = userId;
    } else if (role === 'MANAGER' || role === 'FINANCE' || role === 'DIRECTOR') {
      // Managers, Finance, and Directors can see expenses from their team members
      const teamMembers = await User.find({ managerId: userId, isActive: true });
      const teamMemberIds = teamMembers.map(member => member._id);
      // Include their own expenses
      teamMemberIds.push(userId);
      query.submitterId = { $in: teamMemberIds };
    }
    // ADMIN can see all expenses in the company (no additional filter needed)

    // Apply optional filters
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.expenseDate = {};
      if (filters.dateFrom) {
        query.expenseDate.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.expenseDate.$lte = new Date(filters.dateTo);
      }
    }

    // Execute query with population
    let expenseQuery = Expense.find(query)
      .populate('submitterId', 'firstName lastName email managerId')
      .sort({ expenseDate: -1, createdAt: -1 });

    // Apply limit if specified
    if (filters.limit) {
      expenseQuery = expenseQuery.limit(parseInt(filters.limit));
    }

    const expenses = await expenseQuery;

    // For managers, finance, directors, and admins, ensure currency conversion
    if (role === 'MANAGER' || role === 'FINANCE' || role === 'DIRECTOR' || role === 'ADMIN') {
      const company = await Company.findById(user.companyId);
      
      // Process each expense to ensure converted amounts
      for (let expense of expenses) {
        if (expense.currency !== company.defaultCurrency) {
          // If convertedAmount is not set or is null, try to convert it now
          if (!expense.convertedAmount) {
            try {
              expense.convertedAmount = await convertAmount(
                expense.amount,
                expense.currency,
                company.defaultCurrency
              );
              // Update the expense in database for future use
              await Expense.findByIdAndUpdate(expense._id, { 
                convertedAmount: expense.convertedAmount 
              });
            } catch (conversionError) {
              console.error(`Currency conversion failed for expense ${expense._id}:`, conversionError.message);
              expense.convertedAmount = null;
            }
          }
        } else {
          // If currency is the same as company default, convertedAmount should equal amount
          if (expense.convertedAmount !== expense.amount) {
            expense.convertedAmount = expense.amount;
            await Expense.findByIdAndUpdate(expense._id, { 
              convertedAmount: expense.convertedAmount 
            });
          }
        }
      }
    }

    return expenses;
  } catch (error) {
    throw error;
  }
};

/**
 * Get expense by ID with authorization checks
 * @param {string} expenseId - ID of the expense
 * @param {string} userId - ID of the user requesting the expense
 * @param {string} role - Role of the user (ADMIN, MANAGER, EMPLOYEE, FINANCE, DIRECTOR)
 * @returns {Promise<Object>} - Expense with approval history
 */
const getExpenseById = async (expenseId, userId, role) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get expense with populated fields
    const expense = await Expense.findById(expenseId)
      .populate('submitterId', 'firstName lastName email managerId')
      .populate('approvalRuleId');

    if (!expense) {
      throw new Error('Expense not found');
    }

    // Check authorization
    if (role === 'EMPLOYEE') {
      // Employees can only view their own expenses
      if (expense.submitterId._id.toString() !== userId) {
        throw new Error('Unauthorized to view this expense');
      }
    } else if (role === 'MANAGER' || role === 'FINANCE' || role === 'DIRECTOR') {
      // Managers, Finance, and Directors can view expenses from their team members and their own
      const isOwnExpense = expense.submitterId._id.toString() === userId;
      const isTeamMemberExpense = await User.exists({
        _id: expense.submitterId._id,
        managerId: userId,
        isActive: true
      });

      if (!isOwnExpense && !isTeamMemberExpense) {
        throw new Error('Unauthorized to view this expense');
      }
    }
    // ADMIN can view any expense in their company

    // Check if expense belongs to user's company
    if (expense.companyId.toString() !== user.companyId.toString()) {
      throw new Error('Unauthorized to view this expense');
    }

    // Get approval history
    const ApprovalAction = require('../models/ApprovalAction');
    const approvalHistory = await ApprovalAction.find({ expenseId })
      .populate('approverId', 'firstName lastName email role')
      .sort({ actionDate: 1 });

    // Get company for currency conversion
    const company = await Company.findById(user.companyId);

    // Convert amount to company default currency if needed and user is Manager, Finance, Director or Admin
    let displayAmount = expense.amount;
    let displayCurrency = expense.currency;

    if ((role === 'MANAGER' || role === 'FINANCE' || role === 'DIRECTOR' || role === 'ADMIN') && expense.currency !== company.defaultCurrency) {
      if (expense.convertedAmount) {
        displayAmount = expense.convertedAmount;
        displayCurrency = company.defaultCurrency;
      }
    }

    // Get current approver info if expense is pending
    let currentApproverInfo = null;
    if (expense.status === 'PENDING' && expense.approvalRuleId) {
      const approvalRule = expense.approvalRuleId;
      if (approvalRule.approvalSteps && approvalRule.approvalSteps.length > expense.currentApprovalStep) {
        const currentStep = approvalRule.approvalSteps[expense.currentApprovalStep];
        if (currentStep && currentStep.approvers && currentStep.approvers.length > 0) {
          const approverIds = currentStep.approvers.map(a => a.userId);
          const approvers = await User.find({ _id: { $in: approverIds } }, 'firstName lastName email role');
          currentApproverInfo = {
            stepNumber: expense.currentApprovalStep + 1,
            approvers: approvers
          };
        }
      }
    }

    return {
      ...expense.toObject(),
      approvalHistory,
      currentApproverInfo,
      displayAmount,
      displayCurrency,
      originalAmount: expense.amount,
      originalCurrency: expense.currency
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update expense (only for pending expenses)
 * @param {string} expenseId - ID of the expense
 * @param {Object} updates - Fields to update
 * @param {string} userId - ID of the user updating the expense
 * @returns {Promise<Object>} - Updated expense
 */
const updateExpense = async (expenseId, updates, userId) => {
  try {
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      throw new Error('Expense not found');
    }

    // Only submitter can update their own expense
    if (expense.submitterId.toString() !== userId) {
      throw new Error('Unauthorized to update this expense');
    }

    // Only pending expenses can be updated
    if (expense.status !== 'PENDING') {
      throw new Error('Only pending expenses can be updated');
    }

    // Update allowed fields
    const allowedFields = ['amount', 'currency', 'category', 'description', 'expenseDate', 'expenseLines'];
    const updateData = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    // If currency is updated, normalize to uppercase
    if (updateData.currency) {
      updateData.currency = updateData.currency.toUpperCase();
    }

    // If amount or currency changed, recalculate converted amount
    if (updateData.amount || updateData.currency) {
      const user = await User.findById(userId);
      const company = await Company.findById(user.companyId);
      
      const newAmount = updateData.amount || expense.amount;
      const newCurrency = updateData.currency || expense.currency;

      if (newCurrency !== company.defaultCurrency) {
        try {
          updateData.convertedAmount = await convertAmount(
            newAmount,
            newCurrency,
            company.defaultCurrency
          );
        } catch (conversionError) {
          console.error('Currency conversion failed:', conversionError.message);
          updateData.convertedAmount = null;
        }
      } else {
        updateData.convertedAmount = newAmount;
      }
    }

    // Update expense
    Object.assign(expense, updateData);
    await expense.save();

    return expense;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
};

/**
 * Delete expense (only for pending expenses by submitter)
 * @param {string} expenseId - ID of the expense
 * @param {string} userId - ID of the user deleting the expense
 * @param {string} role - Role of the user
 * @returns {Promise<void>}
 */
const deleteExpense = async (expenseId, userId, role) => {
  try {
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      throw new Error('Expense not found');
    }

    // Only submitter can delete their own expense (or admin can delete any)
    if (role !== 'ADMIN' && expense.submitterId.toString() !== userId) {
      throw new Error('Unauthorized to delete this expense');
    }

    // Only pending expenses can be deleted by employees
    if (role === 'EMPLOYEE' && expense.status !== 'PENDING') {
      throw new Error('Only pending expenses can be deleted');
    }

    await Expense.findByIdAndDelete(expenseId);
  } catch (error) {
    throw error;
  }
};

/**
 * Upload receipt for an expense
 * @param {string} expenseId - ID of the expense
 * @param {string} filePath - Path to the uploaded file
 * @param {string} userId - ID of the user uploading the receipt
 * @returns {Promise<Object>} - Updated expense
 */
const uploadReceipt = async (expenseId, filePath, userId) => {
  try {
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      throw new Error('Expense not found');
    }

    // Only submitter can upload receipt for their own expense
    if (expense.submitterId.toString() !== userId) {
      throw new Error('Unauthorized to upload receipt for this expense');
    }

    // Update expense with receipt URL
    expense.receiptUrl = filePath;
    await expense.save();

    return expense;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  uploadReceipt
};
