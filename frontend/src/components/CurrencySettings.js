import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import companyService from '../services/companyService';
import './CurrencySettings.css';

const CurrencySettings = () => {
  const { user } = useContext(AuthContext);
  const [company, setCompany] = useState(null);
  const [exchangeRates, setExchangeRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user?.companyId) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load company data
      const companyResponse = await companyService.getCompanyById(user.companyId);
      if (companyResponse.success) {
        setCompany(companyResponse.data);
        
        // Load exchange rates for the company's default currency
        try {
          const ratesResponse = await companyService.getExchangeRates(companyResponse.data.defaultCurrency);
          if (ratesResponse.success) {
            setExchangeRates(ratesResponse.data);
          }
        } catch (ratesError) {
          console.error('Error loading exchange rates:', ratesError);
          // Don't show error for rates as it's not critical for display
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load currency settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRates = async () => {
    if (!company?.defaultCurrency) {
      setError('No default currency found');
      return;
    }

    try {
      setUpdating(true);
      setError('');
      setSuccess('');

      const response = await companyService.updateExchangeRates(company.defaultCurrency);
      
      if (response.success) {
        setSuccess(`Exchange rates updated successfully. ${response.data.ratesCount} rates fetched.`);
        
        // Reload exchange rates to show updated data
        try {
          const ratesResponse = await companyService.getExchangeRates(company.defaultCurrency);
          if (ratesResponse.success) {
            setExchangeRates(ratesResponse.data);
          }
        } catch (ratesError) {
          console.error('Error reloading exchange rates:', ratesError);
        }
      }
    } catch (error) {
      console.error('Error updating exchange rates:', error);
      if (error.response?.data?.error?.message) {
        setError(error.response.data.error.message);
      } else {
        setError('Failed to update exchange rates');
      }
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getUpdateStatus = () => {
    if (!exchangeRates?.fetchedAt) {
      return { status: 'never', message: 'Never updated', className: 'status-never' };
    }

    const lastUpdate = new Date(exchangeRates.fetchedAt);
    const now = new Date();
    const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

    if (hoursSinceUpdate < 1) {
      return { status: 'fresh', message: 'Recently updated', className: 'status-fresh' };
    } else if (hoursSinceUpdate < 24) {
      return { status: 'current', message: 'Current', className: 'status-current' };
    } else {
      return { status: 'stale', message: 'Needs update', className: 'status-stale' };
    }
  };

  if (loading) {
    return (
      <div className="currency-settings">
        <div className="loading">Loading currency settings...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="currency-settings">
        <div className="error">Company information not found</div>
      </div>
    );
  }

  const updateStatus = getUpdateStatus();

  return (
    <div className="currency-settings">
      <div className="currency-settings-header">
        <h2>Currency Settings</h2>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="currency-settings-content">
        <div className="currency-info">
          <div className="info-group">
            <label>Default Currency</label>
            <div className="currency-display">
              <span className="currency-code">{company.defaultCurrency}</span>
              <span className="currency-note">
                All expenses will be converted to this currency for reporting
              </span>
            </div>
          </div>

          <div className="info-group">
            <label>Exchange Rate Status</label>
            <div className="rate-status">
              <span className={`status-indicator ${updateStatus.className}`}>
                {updateStatus.message}
              </span>
              {exchangeRates?.fetchedAt && (
                <span className="last-update">
                  Last updated: {formatDate(exchangeRates.fetchedAt)}
                </span>
              )}
              {exchangeRates?.isCached && (
                <span className="cache-indicator">
                  (Cached data)
                </span>
              )}
            </div>
          </div>

          {exchangeRates && (
            <div className="info-group">
              <label>Available Exchange Rates</label>
              <div className="rates-summary">
                <span className="rates-count">
                  {Object.keys(exchangeRates.rates || {}).length} currencies available
                </span>
                <div className="sample-rates">
                  {Object.entries(exchangeRates.rates || {})
                    .slice(0, 5)
                    .map(([currency, rate]) => (
                      <span key={currency} className="rate-item">
                        1 {exchangeRates.baseCurrency} = {rate} {currency}
                      </span>
                    ))}
                  {Object.keys(exchangeRates.rates || {}).length > 5 && (
                    <span className="more-rates">
                      ... and {Object.keys(exchangeRates.rates).length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="info-group">
            <label>Manual Update</label>
            <div className="update-section">
              <p className="update-description">
                Exchange rates are automatically updated daily. You can manually trigger 
                an update to get the latest rates immediately.
              </p>
              <button 
                className="update-button"
                onClick={handleUpdateRates}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update Exchange Rates Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencySettings;