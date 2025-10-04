import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboardService';

const ManagerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const result = await dashboardService.getManagerDashboard();
        
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
      currency: 'USD'
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
        return '#10b981'; // green
      case 'REJECTED':
        return '#ef4444'; // red
      case 'PENDING':
        return '#f59e0b'; // yellow
      default:
        return '#6b7280'; // gray
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>
        <div>Error: {error}</div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, recentExpenses, pendingApprovals } = dashboardData;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Manager Dashboard
        </h1>
        <p style={{ color: '#6b7280' }}>
          Manage your team's expenses and approvals.
        </p>
      </div>

      {/* Team Expense Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
            Team Expenses
          </h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
            {summary.total}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
            Pending Approvals
          </h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {summary.pendingApprovals}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
            Approved
          </h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {summary.approved}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
            Rejected
          </h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
            {summary.rejected}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
            Total Amount
          </h3>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
            {formatCurrency(summary.totalAmount)}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '12px' }}>
        <button
          onClick={() => navigate('/approvals')}
          style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#d97706'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#f59e0b'}
        >
          View Pending Approvals ({summary.pendingApprovals})
        </button>
        
        <button
          onClick={() => navigate('/expenses/new')}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          + Submit New Expense
        </button>
      </div>

      {/* Recent Team Expenses */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              Recent Team Expenses
            </h2>
            <button
              onClick={() => navigate('/expenses')}
              style={{
                color: '#3b82f6',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              View All
            </button>
          </div>
        </div>

        <div style={{ padding: '0' }}>
          {recentExpenses && recentExpenses.length > 0 ? (
            <div>
              {recentExpenses.map((expense, index) => (
                <div
                  key={expense._id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: index < recentExpenses.length - 1 ? '1px solid #f3f4f6' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                      {expense.description}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {expense.category} • {formatDate(expense.expenseDate)}
                      {expense.submitterName && ` • ${expense.submitterName}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {formatCurrency(expense.convertedAmount || expense.amount)}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: getStatusColor(expense.status),
                        backgroundColor: `${getStatusColor(expense.status)}20`,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'inline-block'
                      }}
                    >
                      {expense.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ marginBottom: '8px' }}>No team expenses yet</div>
              <div style={{ fontSize: '14px' }}>
                Team expenses will appear here once submitted
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;