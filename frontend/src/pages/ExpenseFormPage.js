import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { ExpenseForm } from '../components';

const ExpenseFormPage = () => {
  const navigate = useNavigate();

  const handleSave = () => {
    // After saving, redirect to expenses list
    navigate('/expenses');
  };

  const handleCancel = () => {
    // Go back to previous page or expenses list
    navigate('/expenses');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/expenses')}
            variant="outlined"
            size="small"
          >
            Back to Expenses
          </Button>
          <Typography variant="h4" component="h1">
            New Expense
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        <ExpenseForm
          onSubmit={handleSave}
          onCancel={handleCancel}
        />
      </Box>
    </Box>
  );
};

export default ExpenseFormPage;