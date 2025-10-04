import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  IconButton,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import expenseService from '../services/expenseService';

const EXPENSE_CATEGORIES = [
  'Travel',
  'Meals',
  'Office Supplies',
  'Software',
  'Training',
  'Marketing',
  'Equipment',
  'Other'
];

const COMMON_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR'
];

const ExpenseForm = ({ expense = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    category: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    expenseLines: [
      {
        description: '',
        amount: '',
        category: ''
      }
    ]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currencies, setCurrencies] = useState(COMMON_CURRENCIES);

  // Initialize form with existing expense data if editing
  useEffect(() => {
    if (expense) {
      setFormData({
        amount: expense.amount.toString(),
        currency: expense.currency,
        category: expense.category,
        description: expense.description,
        expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
        expenseLines: expense.expenseLines.length > 0 
          ? expense.expenseLines.map(line => ({
              description: line.description,
              amount: line.amount.toString(),
              category: line.category
            }))
          : [{
              description: '',
              amount: '',
              category: ''
            }]
      });
    }
  }, [expense]);

  // Load available currencies
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const response = await expenseService.getCurrencies();
        if (response.success && response.data.rates) {
          const availableCurrencies = Object.keys(response.data.rates);
          setCurrencies([response.data.baseCurrency, ...availableCurrencies]);
        }
      } catch (error) {
        console.error('Failed to load currencies:', error);
        // Keep default currencies if API fails
      }
    };

    loadCurrencies();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleExpenseLineChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      expenseLines: prev.expenseLines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }));
    setError('');
  };

  const addExpenseLine = () => {
    setFormData(prev => ({
      ...prev,
      expenseLines: [
        ...prev.expenseLines,
        {
          description: '',
          amount: '',
          category: ''
        }
      ]
    }));
  };

  const removeExpenseLine = (index) => {
    if (formData.expenseLines.length > 1) {
      setFormData(prev => ({
        ...prev,
        expenseLines: prev.expenseLines.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (!formData.currency) {
      setError('Please select a currency');
      return false;
    }

    if (!formData.category) {
      setError('Please select a category');
      return false;
    }

    if (!formData.description.trim()) {
      setError('Please enter a description');
      return false;
    }

    if (!formData.expenseDate) {
      setError('Please select an expense date');
      return false;
    }

    // Validate expense lines if any are filled
    const filledLines = formData.expenseLines.filter(line => 
      line.description.trim() || line.amount || line.category
    );

    for (let i = 0; i < filledLines.length; i++) {
      const line = filledLines[i];
      if (!line.description.trim()) {
        setError(`Please enter description for expense line ${i + 1}`);
        return false;
      }
      if (!line.amount || parseFloat(line.amount) <= 0) {
        setError(`Please enter valid amount for expense line ${i + 1}`);
        return false;
      }
      if (!line.category) {
        setError(`Please select category for expense line ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Filter out empty expense lines
      const filledLines = formData.expenseLines.filter(line => 
        line.description.trim() && line.amount && line.category
      );

      const expenseData = {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        category: formData.category,
        description: formData.description,
        expenseDate: formData.expenseDate,
        expenseLines: filledLines.map(line => ({
          description: line.description.trim(),
          amount: parseFloat(line.amount),
          category: line.category
        }))
      };

      let result;
      if (expense) {
        // Update existing expense
        result = await expenseService.updateExpense(expense._id, expenseData);
      } else {
        // Create new expense
        result = await expenseService.createExpense(expenseData);
      }

      console.log('Expense save result:', result);
      console.log('Result success:', result?.success);
      console.log('Result error:', result?.error);

      if (result.success) {
        onSubmit(result.data);
      } else {
        setError(result.error?.message || 'Failed to save expense');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      setError(error.response?.data?.error?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {expense ? 'Edit Expense' : 'Submit New Expense'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Main expense details */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Currency"
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              required
            >
              {currencies.map((currency) => (
                <MenuItem key={currency} value={currency}>
                  {currency}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              required
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Expense Date"
              type="date"
              value={formData.expenseDate}
              onChange={(e) => handleInputChange('expenseDate', e.target.value)}
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
            />
          </Grid>

          {/* Expense Lines Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Expense Line Items (Optional)
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addExpenseLine}
                variant="outlined"
                size="small"
              >
                Add Line
              </Button>
            </Box>

            {formData.expenseLines.map((line, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Line Description"
                      value={line.description}
                      onChange={(e) => handleExpenseLineChange(index, 'description', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Amount"
                      type="number"
                      value={line.amount}
                      onChange={(e) => handleExpenseLineChange(index, 'amount', e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      select
                      label="Category"
                      value={line.category}
                      onChange={(e) => handleExpenseLineChange(index, 'category', e.target.value)}
                      size="small"
                    >
                      {EXPENSE_CATEGORIES.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton
                      onClick={() => removeExpenseLine(index)}
                      disabled={formData.expenseLines.length === 1}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Grid>

          {/* Action buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Saving...' : (expense ? 'Update Expense' : 'Submit Expense')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ExpenseForm;