import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import CompanyProfile from './CompanyProfile';
import CurrencySettings from './CurrencySettings';
import './CompanySettings.css';

const CompanySettings = () => {
  const { user } = useContext(AuthContext);

  // Only admins can access company settings
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="company-settings">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>Only administrators can access company settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="company-settings">
      <div className="company-settings-header">
        <h1>Company Settings</h1>
        <p>Manage your company profile and currency settings</p>
      </div>

      <div className="settings-sections">
        <CompanyProfile />
        <CurrencySettings />
      </div>
    </div>
  );
};

export default CompanySettings;