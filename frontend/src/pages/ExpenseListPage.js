import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { ExpenseList, ExpenseDetail, ExpenseForm } from '../components';
import ExpenseDebug from '../components/ExpenseDebug';

const ExpenseListPage = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('list'); // 'list', 'detail', 'form', 'edit'
  const [selectedExpense, setSelectedExpense] = useState(null);

  const handleViewExpense = (expense) => {
    setSelectedExpense(expense);
    setCurrentView('detail');
  };

  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setCurrentView('edit');
  };

  const handleCreateExpense = () => {
    setSelectedExpense(null);
    setCurrentView('form');
  };

  const handleBack = () => {
    setCurrentView('list');
    setSelectedExpense(null);
  };

  const handleExpenseDeleted = () => {
    setCurrentView('list');
    setSelectedExpense(null);
  };

  const handleExpenseSaved = () => {
    setCurrentView('list');
    setSelectedExpense(null);
  };

  const handleExpenseUpdated = (updatedExpense) => {
    // Refresh the list when an expense is updated (e.g., approved/rejected)
    setCurrentView('list');
    setSelectedExpense(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/dashboard')}
            variant="outlined"
            size="small"
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1">
            {currentView === 'list' && 'Expenses'}
            {currentView === 'detail' && 'Expense Details'}
            {currentView === 'form' && 'New Expense'}
            {currentView === 'edit' && 'Edit Expense'}
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        {currentView === 'list' && (
          <>
            <ExpenseDebug />
            <ExpenseList
              onViewExpense={handleViewExpense}
              onEditExpense={handleEditExpense}
              onCreateExpense={handleCreateExpense}
            />
          </>
        )}

        {currentView === 'detail' && selectedExpense && (
          <ExpenseDetail
            expenseId={selectedExpense._id}
            onBack={handleBack}
            onEdit={handleEditExpense}
            onDelete={handleExpenseDeleted}
            onExpenseUpdated={handleExpenseUpdated}
          />
        )}

        {(currentView === 'form' || currentView === 'edit') && (
          <ExpenseForm
            expense={selectedExpense}
            onSubmit={handleExpenseSaved}
            onCancel={handleBack}
          />
        )}
      </Box>
    </Box>
  );
};

export default ExpenseListPage;