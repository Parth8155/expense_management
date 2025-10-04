const mongoose = require('mongoose');

const approvalActionSchema = new mongoose.Schema({
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    required: [true, 'Expense ID is required']
  },
  approverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Approver ID is required']
  },
  stepNumber: {
    type: Number,
    required: [true, 'Step number is required'],
    min: [0, 'Step number cannot be negative']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: {
      values: ['APPROVED', 'REJECTED'],
      message: 'Action must be either APPROVED or REJECTED'
    }
  },
  comments: {
    type: String,
    default: null,
    trim: true,
    maxlength: [1000, 'Comments cannot exceed 1000 characters']
  },
  actionDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
approvalActionSchema.index({ expenseId: 1 });
approvalActionSchema.index({ approverId: 1 });
approvalActionSchema.index({ expenseId: 1, stepNumber: 1 });
approvalActionSchema.index({ actionDate: -1 });

const ApprovalAction = mongoose.model('ApprovalAction', approvalActionSchema);

module.exports = ApprovalAction;
