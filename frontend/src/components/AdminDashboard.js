import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Pending as PendingIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import dashboardService from '../services/dashboardService';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const result = await dashboardService.getAdminDashboard();
        
        if (result.success) {
          setDashboardData(result);
          setError(null);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.defaultCurrency || 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Loading dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography variant="h6" color="text.secondary">
          Loading user information...
        </Typography>
      </Container>
    );
  }

  const { expenseSummary, userSummary, recentExpenses } = dashboardData;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Company-wide overview and management tools.
        </Typography>
      </Box>

      {/* Company-wide Expense Statistics */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="600">
          Expense Statistics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ReceiptIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Expenses
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {expenseSummary.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PendingIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {expenseSummary.pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ApprovedIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {expenseSummary.approved}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <RejectedIcon sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Rejected
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="error.main">
                  {expenseSummary.rejected}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Amount
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(expenseSummary.totalAmount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* User Statistics */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="600">
          User Statistics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {userSummary.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SettingsIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Admins
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="secondary.main">
                  {userSummary.admins}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AssignmentIcon sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Managers
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {userSummary.managers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccountBalanceIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Finance
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {userSummary.finance}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Directors
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {userSummary.directors}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Employees
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {userSummary.employees}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ApprovedIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {userSummary.active}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="600">
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<PeopleIcon />}
            onClick={() => navigate('/users')}
            size="large"
          >
            Manage Users
          </Button>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<SettingsIcon />}
            onClick={() => navigate('/approval-rules')}
            size="large"
          >
            Approval Rules
          </Button>

          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => navigate('/expenses/new')}
            size="large"
          >
            Submit New Expense
          </Button>
        </Box>
      </Box>

      {/* Recent Company Expenses */}
      <Card>
        <CardContent sx={{ pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="600">
              Recent Company Expenses
            </Typography>
            <Button
              variant="text"
              onClick={() => navigate('/expenses')}
              sx={{ textTransform: 'none' }}
            >
              View All
            </Button>
          </Box>
        </CardContent>

        <Box>
          {recentExpenses && recentExpenses.length > 0 ? (
            recentExpenses.map((expense, index) => (
              <Box key={expense._id}>
                <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1" fontWeight="500" gutterBottom>
                      {expense.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {expense.category} • {formatDate(expense.expenseDate)}
                      {expense.submitterName && ` • ${expense.submitterName}`}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body1" fontWeight="600" gutterBottom>
                      {formatCurrency(expense.convertedAmount || expense.amount)}
                    </Typography>
                    <Chip
                      label={expense.status}
                      size="small"
                      color={getStatusColor(expense.status)}
                      variant="outlined"
                    />
                  </Box>
                </Box>
                {index < recentExpenses.length - 1 && <Divider />}
              </Box>
            ))
          ) : (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No expenses yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Company expenses will appear here once submitted
              </Typography>
            </Box>
          )}
        </Box>
      </Card>
    </Container>
  );
};

export default AdminDashboard;