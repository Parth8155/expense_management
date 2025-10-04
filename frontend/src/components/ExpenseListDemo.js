import React from 'react';
import { AuthContext } from '../contexts/AuthContext';
import ExpenseList from './ExpenseList';

const mockUser = {
  _id: 'user123',
  role: 'EMPLOYEE',
  firstName: 'John',
  lastName: 'Doe',
  company: {
    defaultCurrency: 'USD'
  }
};

const ExpenseListDemo = () => {
  const handleViewExpense = (expense) => {
    console.log('View expense:', expense);
    alert(`Viewing expense: ${expense.description}`);
  };

  const handleEditExpense = (expense) => {
    console.log('Edit expense:', expense);
    alert(`Editing expense: ${expense.description}`);
  };

  const handleCreateExpense = () => {
    console.log('Create new expense');
    alert('Create new expense clicked');
  };

  return (
    <AuthContext.Provider value={{ user: mockUser }}>
      <div style={{ padding: '20px' }}>
        <h1>Expense List Demo</h1>
        <ExpenseList
          onViewExpense={handleViewExpense}
          onEditExpense={handleEditExpense}
          onCreateExpense={handleCreateExpense}
        />
      </div>
    </AuthContext.Provider>
  );
};

export default ExpenseListDemo;