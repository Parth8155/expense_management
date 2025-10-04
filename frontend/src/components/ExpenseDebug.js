import React, { useState } from 'react';
import expenseService from '../services/expenseService';
import { useAuth } from '../contexts/AuthContext';

const ExpenseDebug = () => {
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testExpenseAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing expense API with user:', user);
      const response = await expenseService.getExpenses({ limit: 5 });
      console.log('Expense API response:', response);
      setResult(response);
    } catch (err) {
      console.error('Expense API error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>Expense API Debug</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Current User:</strong> {user ? `${user.firstName} ${user.lastName} (${user.role})` : 'Not authenticated'}
      </div>
      
      <button 
        onClick={testExpenseAPI} 
        disabled={loading || !user}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: loading || !user ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Expense API'}
      </button>

      {error && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '10px' }}>
          <h4>API Response:</h4>
          <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ExpenseDebug;