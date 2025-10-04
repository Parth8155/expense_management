const mongoose = require('mongoose');

// Subdocument schema for expense lines
const expenseLineSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Expense line description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Expense line amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Expense line category is required'],
    trim: true
  }
}, { _id: true });

const expenseSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required']
  },
  submitterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Submitter ID is required']
  },
  approvalRuleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApprovalRule',
    default: null
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    trim: true,
    uppercase: true,
    minlength: [3, 'Currency code must be 3 characters'],
    maxlength: [3, 'Currency code must be 3 characters']
  },
  convertedAmount: {
    type: Number,
    default: null,
    min: [0, 'Converted amount must be non-negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  expenseDate: {
    type: Date,
    required: [true, 'Expense date is required']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['PENDING', 'APPROVED', 'REJECTED'],
      message: 'Status must be either PENDING, APPROVED, or REJECTED'
    },
    default: 'PENDING'
  },
  receiptUrl: {
    type: String,
    default: null,
    trim: true
  },
  currentApprovalStep: {
    type: Number,
    default: 0,
    min: [0, 'Current approval step cannot be negative']
  },
  expenseLines: {
    type: [expenseLineSchema],
    default: []
  }
}, {
  timestamps: true
});

// Indexes for faster queries
expenseSchema.index({ companyId: 1 });
expenseSchema.index({ submitterId: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ companyId: 1, status: 1 });
expenseSchema.index({ submitterId: 1, status: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
