import React, { useState, useEffect, useContext } from 'react';
import './ExpenseList.css';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  InputAdornment,
  Toolbar
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import AuthContext from '../contexts/AuthContext';
import expenseService from '../services/expenseService';

const EXPENSE_CATEGORIES = [
  'All',
  'Travel',
  'Meals',
  'Office Supplies',
  'Software',
  'Training',
  'Marketing',
  'Equipment',
  'Other'
];

const STATUS_OPTIONS = [
  'All',
  'PENDING',
  'APPROVED',
  'REJECTED'
];

const STATUS_COLORS = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error'
};

const ExpenseList = ({ onViewExpense, onEditExpense, onCreateExpense }) => {
  const { user } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    status: 'All',
    category: 'All',
    startDate: '',
    endDate: '',
    search: ''
  });

  // Load expenses when component mounts or filters change
  useEffect(() => {
    console.log('ExpenseList useEffect triggered, user:', user);
    if (user) {
      loadExpenses();
    } else {
      console.warn('No user found, cannot load expenses');
      setError('User not authenticated');
      setLoading(false);
    }
  }, [page, rowsPerPage, filters, user]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError('');

      // Prepare filter parameters
      const filterParams = {
        page: page + 1, // API expects 1-based page numbers
        limit: rowsPerPage
      };

      // Add filters only if they're not 'All' or empty
      if (filters.status !== 'All') {
        filterParams.status = filters.status;
      }
      if (filters.category !== 'All') {
        filterParams.category = filters.category;
      }
      if (filters.startDate) {
        filterParams.startDate = filters.startDate;
      }
      if (filters.endDate) {
        filterParams.endDate = filters.endDate;
      }
      if (filters.search.trim()) {
        filterParams.search = filters.search.trim();
      }

      console.log('Loading expenses with filters:', filterParams);
      const response = await expenseService.getExpenses(filterParams);
      console.log('Expense list response:', response);
      
      if (response && response.success !== false) {
        const expenses = response.data?.expenses || response.expenses || [];
        const totalCount = response.data?.totalCount || response.totalCount || expenses.length;
        
        console.log('Setting expenses:', expenses, 'Total count:', totalCount);
        setExpenses(expenses);
        setTotalCount(totalCount);
      } else {
        const errorMessage = response?.error?.message || response?.message || 'Failed to load expenses';
        console.error('Failed to load expenses:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      setError(error.response?.data?.error?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0); // Reset to first page when filters change
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewExpense = (expense) => {
    if (onViewExpense) {
      onViewExpense(expense);
    }
  };

  const handleEditExpense = (expense) => {
    if (onEditExpense && expense.status === 'PENDING') {
      onEditExpense(expense);
    }
  };

  const handleDeleteExpense = async (expense) => {
    if (expense.status !== 'PENDING') {
      setError('Only pending expenses can be deleted');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const response = await expenseService.deleteExpense(expense._id);
      if (response.success) {
        loadExpenses(); // Reload the list
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
      month: 'short',
      day: 'numeric'
    });
  };

  const canEditExpense = (expense) => {
    return expense.status === 'PENDING' && 
           (user?.role === 'ADMIN' || expense.submitterId === user?._id);
  };

  const canDeleteExpense = (expense) => {
    return expense.status === 'PENDING' && 
           (user?.role === 'ADMIN' || expense.submitterId === user?._id);
  };

  return (
    <Paper elevation={3} sx={{ width: '100%', mb: 2 }}>
      {/* Header with title and create button */}
      <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
        <Typography
          sx={{ flex: '1 1 100%' }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          Expenses
        </Typography>
        {onCreateExpense && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateExpense}
            sx={{ mr: 1 }}
          >
            New Expense
          </Button>
        )}
        <IconButton onClick={loadExpenses} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Toolbar>

      {/* Filters */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              select
              size="small"
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              select
              size="small"
              label="Category"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilters({
                status: 'All',
                category: 'All',
                startDate: '',
                endDate: '',
                search: ''
              })}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Expenses table */}
      {!loading && (
        <>
          <TableContainer>
            <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                    <TableCell>Submitter</TableCell>
                  )}
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={user?.role === 'MANAGER' || user?.role === 'ADMIN' ? 7 : 6} 
                      align="center"
                      sx={{ py: 3 }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No expenses found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow
                      key={expense._id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        {formatDate(expense.expenseDate)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {expense.description}
                        </Typography>
                      </TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(expense.amount, expense.currency)}
                        </Typography>
                        {expense.convertedAmount && expense.currency !== user?.company?.defaultCurrency && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {formatCurrency(expense.convertedAmount, user?.company?.defaultCurrency)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={expense.status}
                          color={STATUS_COLORS[expense.status]}
                          size="small"
                        />
                      </TableCell>
                      {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                        <TableCell>
                          <Typography variant="body2">
                            {expense.submitter?.firstName} {expense.submitter?.lastName}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewExpense(expense)}
                            title="View Details"
                          >
                            <ViewIcon />
                          </IconButton>
                          {canEditExpense(expense) && (
                            <IconButton
                              size="small"
                              onClick={() => handleEditExpense(expense)}
                              title="Edit Expense"
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                          {canDeleteExpense(expense) && (
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteExpense(expense)}
                              title="Delete Expense"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </>
      )}
    </Paper>
  );
};

export default ExpenseList;