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
  Receipt as ReceiptIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Pending as PendingIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import dashboardService from '../services/dashboardService';

const EmployeeDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const result = await dashboardService.getEmployeeDashboard();
        
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

  const { summary, recentExpenses } = dashboardData;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Employee Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's an overview of your expenses.
        </Typography>
      </Box>

      {/* Expense Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
                {summary.total}
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
                {summary.pending}
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
                {summary.approved}
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
                {summary.rejected}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/expenses/new')}
          size="large"
        >
          Submit New Expense
        </Button>
      </Box>

      {/* Recent Expenses */}
      <Card>
        <CardContent sx={{ pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="600">
              Recent Expenses
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
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body1" fontWeight="600" gutterBottom>
                      {formatCurrency(expense.amount)}
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
                Submit your first expense to get started
              </Typography>
            </Box>
          )}
        </Box>
      </Card>
    </Container>
  );
};

export default EmployeeDashboard;