const expenseService = require('../services/expenseService');

/**
 * Expense Controller
 * Handles HTTP requests for expense operations
 */

/**
 * Create a new expense
 * POST /api/expenses
 */
const createExpense = async (req, res) => {
  try {
    const { amount, currency, category, description, expenseDate, expenseLines } = req.body;

    // Validate required fields
    if (amount === undefined || amount === null || !currency || !category || !description || !expenseDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: amount, currency, category, description, and expenseDate are required'
        }
      });
    }

    // Validate amount is positive
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Amount must be greater than 0'
        }
      });
    }

    // Validate currency format (3 letter code)
    if (!/^[A-Z]{3}$/i.test(currency)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Currency must be a 3-letter code (e.g., USD, EUR)'
        }
      });
    }

    // Validate expenseDate is a valid date
    const parsedDate = new Date(expenseDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid expense date format'
        }
      });
    }

    // Validate expenseLines if provided
    if (expenseLines && !Array.isArray(expenseLines)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'expenseLines must be an array'
        }
      });
    }

    const expenseData = {
      amount: parseFloat(amount),
      currency,
      category,
      description,
      expenseDate: parsedDate,
      expenseLines: expenseLines || []
    };

    const expense = await expenseService.createExpense(expenseData, req.user.userId);
    console.log('Expense created in controller:', expense._id);

    // Create a safe response object to avoid JSON serialization issues
    const safeExpense = {
      _id: expense._id,
      companyId: expense.companyId,
      submitterId: expense.submitterId,
      amount: expense.amount,
      currency: expense.currency,
      convertedAmount: expense.convertedAmount,
      category: expense.category,
      description: expense.description,
      expenseDate: expense.expenseDate,
      status: expense.status,
      receiptUrl: expense.receiptUrl,
      currentApprovalStep: expense.currentApprovalStep,
      expenseLines: expense.expenseLines,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt
    };

    console.log('Sending success response with safe expense data');
    res.status(201).json({
      success: true,
      data: safeExpense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPENSE_CREATION_FAILED',
        message: error.message
      }
    });
  }
};

/**
 * Get expenses with role-based filtering
 * GET /api/expenses
 */
const getExpenses = async (req, res) => {
  try {
    const { status, category, dateFrom, dateTo, limit, sort } = req.query;

    // Build filters object
    const filters = {};
    if (status) {
      // Validate status
      if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid status. Must be PENDING, APPROVED, or REJECTED'
          }
        });
      }
      filters.status = status;
    }

    if (category) {
      filters.category = category;
    }

    if (dateFrom) {
      const parsedDateFrom = new Date(dateFrom);
      if (isNaN(parsedDateFrom.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid dateFrom format'
          }
        });
      }
      filters.dateFrom = dateFrom;
    }

    if (dateTo) {
      const parsedDateTo = new Date(dateTo);
      if (isNaN(parsedDateTo.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid dateTo format'
          }
        });
      }
      filters.dateTo = dateTo;
    }

    // Add limit parameter if provided
    if (limit) {
      const parsedLimit = parseInt(limit);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        filters.limit = parsedLimit;
      }
    }

    const expenses = await expenseService.getExpenses(
      req.user.userId,
      req.user.role,
      filters
    );

    res.status(200).json({
      success: true,
      data: expenses
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPENSE_RETRIEVAL_FAILED',
        message: error.message
      }
    });
  }
};

/**
 * Get expense by ID
 * GET /api/expenses/:id
 */
const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate expense ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid expense ID format'
        }
      });
    }

    const expense = await expenseService.getExpenseById(
      id,
      req.user.userId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Get expense by ID error:', error);

    if (error.message === 'Expense not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPENSE_NOT_FOUND',
          message: 'Expense not found'
        }
      });
    }

    if (error.message === 'Unauthorized to view this expense') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this expense'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'EXPENSE_RETRIEVAL_FAILED',
        message: error.message
      }
    });
  }
};

/**
 * Update expense
 * PUT /api/expenses/:id
 */
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate expense ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid expense ID format'
        }
      });
    }

    // Validate amount if provided
    if (updates.amount !== undefined && updates.amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Amount must be greater than 0'
        }
      });
    }

    // Validate currency format if provided
    if (updates.currency && !/^[A-Z]{3}$/i.test(updates.currency)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Currency must be a 3-letter code (e.g., USD, EUR)'
        }
      });
    }

    // Validate expenseDate if provided
    if (updates.expenseDate) {
      const parsedDate = new Date(updates.expenseDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid expense date format'
          }
        });
      }
      updates.expenseDate = parsedDate;
    }

    const expense = await expenseService.updateExpense(id, updates, req.user.userId);

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Update expense error:', error);

    if (error.message === 'Expense not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPENSE_NOT_FOUND',
          message: 'Expense not found'
        }
      });
    }

    if (error.message === 'Unauthorized to update this expense') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this expense'
        }
      });
    }

    if (error.message === 'Only pending expenses can be updated') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Only pending expenses can be updated'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'EXPENSE_UPDATE_FAILED',
        message: error.message
      }
    });
  }
};

/**
 * Delete expense
 * DELETE /api/expenses/:id
 */
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate expense ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid expense ID format'
        }
      });
    }

    await expenseService.deleteExpense(id, req.user.userId, req.user.role);

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);

    if (error.message === 'Expense not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPENSE_NOT_FOUND',
          message: 'Expense not found'
        }
      });
    }

    if (error.message === 'Unauthorized to delete this expense') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this expense'
        }
      });
    }

    if (error.message === 'Only pending expenses can be deleted') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Only pending expenses can be deleted'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'EXPENSE_DELETE_FAILED',
        message: error.message
      }
    });
  }
};

/**
 * Upload receipt for expense
 * POST /api/expenses/:id/receipt
 */
const uploadReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate expense ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid expense ID format'
        }
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_MISSING',
          message: 'No file uploaded'
        }
      });
    }

    // Get relative file path for storage
    const filePath = `/uploads/${req.file.filename}`;

    const expense = await expenseService.uploadReceipt(id, filePath, req.user.userId);

    res.status(200).json({
      success: true,
      data: expense,
      message: 'Receipt uploaded successfully'
    });
  } catch (error) {
    console.error('Upload receipt error:', error);

    // Clean up uploaded file if there was an error
    if (req.file) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../uploads', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (error.message === 'Expense not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPENSE_NOT_FOUND',
          message: 'Expense not found'
        }
      });
    }

    if (error.message === 'Unauthorized to upload receipt for this expense') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to upload receipt for this expense'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'RECEIPT_UPLOAD_FAILED',
        message: error.message
      }
    });
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
