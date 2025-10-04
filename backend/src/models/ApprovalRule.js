const mongoose = require('mongoose');

// Subdocument schema for approvers
const approverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required for approver']
  },
  isSpecificApprover: {
    type: Boolean,
    default: false
  }
}, { _id: true });

// Subdocument schema for approval steps
const approvalStepSchema = new mongoose.Schema({
  sequenceOrder: {
    type: Number,
    required: [true, 'Sequence order is required'],
    min: [1, 'Sequence order must be at least 1']
  },
  approvers: {
    type: [approverSchema],
    validate: {
      validator: function(approvers) {
        return approvers && approvers.length > 0;
      },
      message: 'At least one approver is required for each step'
    }
  }
}, { _id: true });

const approvalRuleSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required']
  },
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true,
    minlength: [2, 'Rule name must be at least 2 characters long'],
    maxlength: [100, 'Rule name cannot exceed 100 characters']
  },
  ruleType: {
    type: String,
    required: [true, 'Rule type is required'],
    enum: {
      values: ['SEQUENTIAL', 'CONDITIONAL', 'COMBINED'],
      message: 'Rule type must be either SEQUENTIAL, CONDITIONAL, or COMBINED'
    }
  },
  percentageThreshold: {
    type: Number,
    default: null,
    min: [0, 'Percentage threshold must be at least 0'],
    max: [100, 'Percentage threshold cannot exceed 100']
  },
  isManagerApprover: {
    type: Boolean,
    default: false
  },
  approvalSteps: {
    type: [approvalStepSchema],
    validate: {
      validator: function(steps) {
        return steps && steps.length > 0;
      },
      message: 'At least one approval step is required'
    }
  }
}, {
  timestamps: true
});

// Indexes for faster queries
approvalRuleSchema.index({ companyId: 1 });
approvalRuleSchema.index({ ruleType: 1 });

const ApprovalRule = mongoose.model('ApprovalRule', approvalRuleSchema);

module.exports = ApprovalRule;
