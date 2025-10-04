import React, { useState, useEffect, useContext } from 'react';
import './ExpenseDetail.css';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon
} from '@mui/icons-material';
import AuthContext from '../contexts/AuthContext';
import expenseService from '../services/expenseService';
import approvalService from '../services/approvalService';

const STATUS_COLORS = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error'
};

const ExpenseDetail = ({ expenseId, onBack, onEdit, onDelete, onExpenseUpdated }) => {
  const { user } = useContext(AuthContext);
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null); // 'approve' or 'reject'
  const [approvalComments, setApprovalComments] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);

  useEffect(() => {
    if (expenseId) {
      loadExpenseDetail();
    }
  }, [expenseId]);

  const loadExpenseDetail = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await expenseService.getExpenseById(expenseId);
      
      if (response.success) {
        setExpense(response.data);
      } else {
        setError(response.error?.message || 'Failed to load expense details');
      }
    } catch (error) {
      console.error('Error loading expense details:', error);
      setError(error.response?.data?.error?.message || 'Failed to load expense details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (onEdit && expense) {
      onEdit(expense);
    }
  };

  const handleDelete = async () => {
    if (!expense || expense.status !== 'PENDING') {
      setError('Only pending expenses can be deleted');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const response = await expenseService.deleteExpense(expense._id);
      if (response.success) {
        if (onDelete) {
          onDelete(expense);
        }
        if (onBack) {
          onBack();
        }
      } else {
        setError(response.error?.message || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError(error.response?.data?.error?.message || 'Failed to delete expense');
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEditExpense = () => {
    return expense && expense.status === 'PENDING' && 
           (user?.role === 'ADMIN' || expense.submitterId._id === user?._id);
  };

  const canDeleteExpense = () => {
    return expense && expense.status === 'PENDING' && 
           (user?.role === 'ADMIN' || expense.submitterId._id === user?._id);
  };

  const canApproveExpense = () => {
    console.log('canApproveExpense check:', {
      expense: expense ? {
        id: expense._id,
        status: expense.status,
        currentApprovalStep: expense.currentApprovalStep,
        approvalRuleId: expense.approvalRuleId,
        currentApproverInfo: expense.currentApproverInfo
      } : null,
      user: user ? {
        id: user._id,
        role: user.role
      } : null
    });

    if (!expense || expense.status !== 'PENDING') {
      console.log('canApproveExpense: false - expense not pending');
      return false;
    }
    
    // Admin can approve any pending expense
    if (user?.role === 'ADMIN') {
      console.log('canApproveExpense: true - user is admin');
      return true;
    }
    
    // Check if user is in the current approval step of a formal approval rule
    if (expense.currentApproverInfo && expense.currentApproverInfo.approvers) {
      const isInApprovers = expense.currentApproverInfo.approvers.some(
        approver => approver._id === user?._id
      );
      console.log('canApproveExpense: checking currentApproverInfo - isInApprovers:', isInApprovers);
      if (isInApprovers) {
        console.log('canApproveExpense: true - user in currentApproverInfo');
        return true;
      }
    }
    
    // For default workflow: check based on current step and role
    const currentStep = expense.currentApprovalStep || 0;
    const isDefaultWorkflow = !expense.approvalRuleId || (expense.approvalRuleId && expense.approvalRuleId.isManagerApprover);
    
    console.log('canApproveExpense: default workflow check', {
      currentStep,
      isDefaultWorkflow,
      userRole: user?.role
    });
    
    if (isDefaultWorkflow) {
      if (currentStep === 0 && user?.role === 'MANAGER' && expense.submitterId) {
        const isManager = expense.submitterId.managerId === user?._id;
        console.log('canApproveExpense: step 0 manager check - isManager:', isManager);
        return isManager;
      } else if (currentStep === 1 && user?.role === 'FINANCE') {
        console.log('canApproveExpense: true - step 1 finance user');
        return true; // Any finance user can approve at step 1
      } else if (currentStep === 2 && user?.role === 'DIRECTOR') {
        console.log('canApproveExpense: true - step 2 director user');
        return true; // Any director user can approve at step 2
      }
    }
    
    console.log('canApproveExpense: false - no conditions met');
    return false;
  };

  const handleApprovalAction = async (action) => {
    if (action === 'reject' && !approvalComments.trim()) {
      setError('Comments are required when rejecting an expense');
      return;
    }

    try {
      setApprovalLoading(true);
      setError('');

      let result;
      if (action === 'approve') {
        result = await approvalService.approveExpense(expense._id, approvalComments);
      } else if (action === 'reject') {
        result = await approvalService.rejectExpense(expense._id, approvalComments);
      }

      // Update the expense data
      await loadExpenseDetail();
      
      // Notify parent component
      if (onExpenseUpdated) {
        onExpenseUpdated(result.data);
      }

      // Reset approval state
      setApprovalAction(null);
      setApprovalComments('');
      
      // Show success message
      setError('');
      alert(`${action === 'approve' ? 'Expense approved' : 'Expense rejected'} successfully! Please refresh the expense list to see updated status.`);
    } catch (error) {
      setError(error.response?.data?.error?.message || `Failed to ${action} expense`);
    } finally {
      setApprovalLoading(false);
    }
  };

  const getApprovalIcon = (action) => {
    switch (action) {
      case 'APPROVED':
        return <CheckCircleIcon color="success" />;
      case 'REJECTED':
        return <CancelIcon color="error" />;
      default:
        return <ScheduleIcon color="warning" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!expense) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Expense not found
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        {onBack && (
          <IconButton onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Expense Details
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {canEditExpense() && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Edit
            </Button>
          )}
          {canDeleteExpense() && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          )}
        </Box>
      </Box>

      {/* Approval Actions for Pending Expenses */}
      {canApproveExpense() && (
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'info.light' }}>
          <Typography variant="h6" gutterBottom color="info.contrastText">
            Approval Required
          </Typography>
          <Typography variant="body2" color="info.contrastText" sx={{ mb: 2 }}>
            This expense requires your approval. Please review the details and take action.
          </Typography>
          
          {approvalAction && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="info.contrastText" gutterBottom>
                {approvalAction === 'approve' ? 'Approval' : 'Rejection'} Comments 
                {approvalAction === 'reject' && <span style={{ color: '#ff6b6b' }}>*</span>}
              </Typography>
              <textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                placeholder={
                  approvalAction === 'reject' 
                    ? "Please provide a reason for rejection..." 
                    : "Add any comments (optional)..."
                }
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '14px'
                }}
                disabled={approvalLoading}
                required={approvalAction === 'reject'}
              />
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {!approvalAction ? (
              <>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<ApproveIcon />}
                  onClick={() => setApprovalAction('approve')}
                  disabled={approvalLoading}
                >
                  Approve
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={() => setApprovalAction('reject')}
                  disabled={approvalLoading}
                >
                  Reject
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  color={approvalAction === 'approve' ? 'success' : 'error'}
                  onClick={() => handleApprovalAction(approvalAction)}
                  disabled={approvalLoading}
                >
                  {approvalLoading ? 'Processing...' : `Confirm ${approvalAction === 'approve' ? 'Approval' : 'Rejection'}`}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setApprovalAction(null);
                    setApprovalComments('');
                    setError('');
                  }}
                  disabled={approvalLoading}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Main Expense Information */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Typography variant="h5" component="h2">
                {expense.description}
              </Typography>
              <Chip
                label={expense.status}
                color={STATUS_COLORS[expense.status]}
                size="large"
              />
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Amount
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {formatCurrency(expense.originalAmount, expense.originalCurrency)}
                </Typography>
                {(user?.role === 'MANAGER' || user?.role === 'FINANCE' || user?.role === 'DIRECTOR' || user?.role === 'ADMIN') && 
                 expense.displayCurrency !== expense.originalCurrency && (
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(expense.displayAmount, expense.displayCurrency)} (converted)
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Category
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {expense.category}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(expense.expenseDate)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Submitted By
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24 }}>
                    <PersonIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="body1">
                    {expense.submitterId.firstName} {expense.submitterId.lastName}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {expense.description}
                </Typography>
              </Grid>

              {expense.expenseLines && expense.expenseLines.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Expense Lines
                  </Typography>
                  {expense.expenseLines.map((line, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {line.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {line.category}
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(line.amount, expense.originalCurrency)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Receipt Section */}
          {expense.receiptUrl && (
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon />
                Receipt
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <img
                  src={expense.receiptUrl}
                  alt="Receipt"
                  style={{
                    maxWidth: 200,
                    maxHeight: 200,
                    objectFit: 'contain',
                    cursor: 'pointer',
                    border: '1px solid #e0e0e0',
                    borderRadius: 4
                  }}
                  onClick={() => setReceiptDialogOpen(true)}
                />
                <Button
                  variant="outlined"
                  startIcon={<ZoomInIcon />}
                  onClick={() => setReceiptDialogOpen(true)}
                >
                  View Full Size
                </Button>
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Approval Information */}
        <Grid item xs={12} md={4}>
          {/* Current Workflow Stage */}
          {expense.status === 'PENDING' && expense.currentApproverInfo && (
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Current Approval Stage
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {expense.currentApproverInfo.stepName || `Step ${expense.currentApproverInfo.stepNumber}`}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Awaiting approval from:
              </Typography>
              {expense.currentApproverInfo.approvers.map((approver, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Avatar sx={{ width: 24, height: 24 }}>
                    <PersonIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="body2">
                    {approver.firstName} {approver.lastName}
                    {approver.role && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({approver.role})
                      </Typography>
                    )}
                  </Typography>
                </Box>
              ))}
            </Paper>
          )}

          {/* Approval History */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Approval History
            </Typography>
            
            {expense.approvalHistory && expense.approvalHistory.length > 0 ? (
              <List>
                {expense.approvalHistory.map((action, index) => (
                  <ListItem key={index} alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: action.action === 'APPROVED' ? 'success.main' : 'error.main' }}>
                        {getApprovalIcon(action.action)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="subtitle2" component="span">
                            {action.action === 'APPROVED' ? 'Approved' : 'Rejected'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            by {action.approverId.firstName} {action.approverId.lastName}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {formatDateTime(action.actionDate)}
                          </Typography>
                          {action.comments && (
                            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                              "{action.comments}"
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No approval actions yet
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Receipt Dialog */}
      <Dialog
        open={receiptDialogOpen}
        onClose={() => setReceiptDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Receipt
          <IconButton onClick={() => setReceiptDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {expense.receiptUrl && (
            <img
              src={expense.receiptUrl}
              alt="Receipt"
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpenseDetail;