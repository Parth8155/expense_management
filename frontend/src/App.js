import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, Dashboard } from './components';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import UserManagementPage from './pages/UserManagementPage';
import ExpenseListPage from './pages/ExpenseListPage';
import ExpenseFormPage from './pages/ExpenseFormPage';
import ApprovalRulesPage from './pages/ApprovalRulesPage';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* Protected routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manager/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['MANAGER']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employee/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'EMPLOYEE', 'FINANCE', 'DIRECTOR']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* User Management Routes */}
            <Route 
              path="/users" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UserManagementPage />
                </ProtectedRoute>
              } 
            />

            {/* Expense Routes */}
            <Route 
              path="/expenses" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'EMPLOYEE', 'FINANCE', 'DIRECTOR']}>
                  <ExpenseListPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/expenses/new" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'EMPLOYEE', 'FINANCE', 'DIRECTOR']}>
                  <ExpenseFormPage />
                </ProtectedRoute>
              } 
            />

            {/* Approval Routes - Removed, approvals now handled from expense details */}
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
