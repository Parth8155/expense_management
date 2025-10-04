import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import companyService from '../services/companyService';
import './CompanyProfile.css';

const CompanyProfile = () => {
  const { user } = useContext(AuthContext);
  const [company, setCompany] = useState(null);
  const [countries, setCountries] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user?.companyId) {
      loadCompanyData();
      loadCountries();
    }
  }, [user]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      const response = await companyService.getCompanyById(user.companyId);
      if (response.success) {
        setCompany(response.data);
        setEditForm({
          name: response.data.name
        });
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      setError('Failed to load company information');
    } finally {
      setLoading(false);
    }
  };

  const loadCountries = async () => {
    try {
      const response = await companyService.getCountries();
      if (response.success) {
        setCountries(response.data);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      // Don't show error for countries as it's not critical
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form when canceling
      setEditForm({
        name: company.name
      });
      setError('');
      setSuccess('');
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editForm.name.trim()) {
      setError('Company name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await companyService.updateCompany(user.companyId, {
        name: editForm.name.trim()
      });

      if (response.success) {
        setCompany(response.data);
        setIsEditing(false);
        setSuccess('Company profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating company:', error);
      if (error.response?.data?.error?.message) {
        setError(error.response.data.error.message);
      } else {
        setError('Failed to update company profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const getCountryName = (countryCode) => {
    const country = countries.find(c => c.cca2 === countryCode);
    return country ? country.name.common : countryCode;
  };

  if (loading) {
    return (
      <div className="company-profile">
        <div className="loading">Loading company information...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="company-profile">
        <div className="error">Company information not found</div>
      </div>
    );
  }

  return (
    <div className="company-profile">
      <div className="company-profile-header">
        <h2>Company Profile</h2>
        <button 
          className={`edit-button ${isEditing ? 'cancel' : 'edit'}`}
          onClick={handleEditToggle}
          disabled={saving}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="company-profile-content">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-group">
              <label htmlFor="name">Company Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={editForm.name}
                onChange={handleInputChange}
                required
                disabled={saving}
                placeholder="Enter company name"
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="save-button"
                disabled={saving || !editForm.name.trim()}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="company-info">
            <div className="info-group">
              <label>Company Name</label>
              <div className="info-value">{company.name}</div>
            </div>

            <div className="info-group">
              <label>Country</label>
              <div className="info-value">{getCountryName(company.country)}</div>
            </div>

            <div className="info-group">
              <label>Default Currency</label>
              <div className="info-value">{company.defaultCurrency}</div>
            </div>

            <div className="info-group">
              <label>Created</label>
              <div className="info-value">
                {new Date(company.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfile;