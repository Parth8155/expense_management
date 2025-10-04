import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Fallback list of common countries when backend is not available
const FALLBACK_COUNTRIES = [
  { cca2: 'US', name: { common: 'United States' }, currencies: { USD: { name: 'United States dollar', symbol: '$' } } },
  { cca2: 'GB', name: { common: 'United Kingdom' }, currencies: { GBP: { name: 'British pound', symbol: '£' } } },
  { cca2: 'CA', name: { common: 'Canada' }, currencies: { CAD: { name: 'Canadian dollar', symbol: '$' } } },
  { cca2: 'AU', name: { common: 'Australia' }, currencies: { AUD: { name: 'Australian dollar', symbol: '$' } } },
  { cca2: 'DE', name: { common: 'Germany' }, currencies: { EUR: { name: 'Euro', symbol: '€' } } },
  { cca2: 'FR', name: { common: 'France' }, currencies: { EUR: { name: 'Euro', symbol: '€' } } },
  { cca2: 'IT', name: { common: 'Italy' }, currencies: { EUR: { name: 'Euro', symbol: '€' } } },
  { cca2: 'ES', name: { common: 'Spain' }, currencies: { EUR: { name: 'Euro', symbol: '€' } } },
  { cca2: 'NL', name: { common: 'Netherlands' }, currencies: { EUR: { name: 'Euro', symbol: '€' } } },
  { cca2: 'JP', name: { common: 'Japan' }, currencies: { JPY: { name: 'Japanese yen', symbol: '¥' } } },
  { cca2: 'CN', name: { common: 'China' }, currencies: { CNY: { name: 'Chinese yuan', symbol: '¥' } } },
  { cca2: 'IN', name: { common: 'India' }, currencies: { INR: { name: 'Indian rupee', symbol: '₹' } } },
  { cca2: 'BR', name: { common: 'Brazil' }, currencies: { BRL: { name: 'Brazilian real', symbol: 'R$' } } },
  { cca2: 'MX', name: { common: 'Mexico' }, currencies: { MXN: { name: 'Mexican peso', symbol: '$' } } },
  { cca2: 'SG', name: { common: 'Singapore' }, currencies: { SGD: { name: 'Singapore dollar', symbol: '$' } } }
].sort((a, b) => a.name.common.localeCompare(b.name.common));

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    country: '',
    currency: ''
  });
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get('/companies/countries');
        setCountries(response.data.data || response.data.countries || []);
      } catch (err) {
        console.error('Failed to fetch countries:', err);
        // Use fallback countries when backend is not available
        console.log('Using fallback countries list');
        setCountries(FALLBACK_COUNTRIES);
      } finally {
        setCountriesLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    const country = countries.find(c => c.cca2 === countryCode);
    
    // Get the primary currency for the selected country
    let primaryCurrency = '';
    if (country && country.currencies) {
      const currencyCode = Object.keys(country.currencies)[0];
      primaryCurrency = currencyCode.toUpperCase();
    }
    
    setFormData(prev => ({
      ...prev,
      country: countryCode,
      currency: primaryCurrency
    }));
    setSelectedCountry(country);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.firstName || 
          !formData.lastName || !formData.companyName || !formData.country || !formData.currency) {
        throw new Error('All fields are required');
      }

      console.log('Sending signup data:', formData);
      const result = await signup(formData);
      
      if (result.success) {
        console.log('Signup successful, user:', result.user);
        
        // Redirect to dashboard based on role (should be ADMIN for signup)
        const userRole = result.user?.role;
        if (userRole === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (userRole === 'MANAGER') {
          navigate('/manager/dashboard');
        } else {
          navigate('/employee/dashboard');
        }
      } else {
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(
        err.response?.data?.error?.message || 
        err.message || 
        'Signup failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getDisplayCurrency = () => {
    if (!selectedCountry || !selectedCountry.currencies) {
      return '';
    }
    
    const currencyCode = Object.keys(selectedCountry.currencies)[0];
    const currency = selectedCountry.currencies[currencyCode];
    return `${currencyCode} - ${currency.name}`;
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Sign Up
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Create your company account to get started
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              autoComplete="given-name"
              autoFocus
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="companyName"
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              disabled={loading}
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel id="country-label">Country</InputLabel>
              <Select
                labelId="country-label"
                id="country"
                name="country"
                value={formData.country}
                label="Country"
                onChange={handleCountryChange}
                disabled={loading || countriesLoading}
              >
                {countriesLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading countries...
                  </MenuItem>
                ) : (
                  countries.map((country) => (
                    <MenuItem key={country.cca2} value={country.cca2}>
                      {country.name.common}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {selectedCountry && (
              <Box sx={{ mt: 1, mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Default Currency: <strong>{getDisplayCurrency()}</strong>
                </Typography>
              </Box>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || countriesLoading}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>

            <Box textAlign="center">
              <Typography variant="body2">
                Already have an account?{' '}
                <Button
                  variant="text"
                  onClick={() => navigate('/login')}
                  disabled={loading}
                >
                  Sign In
                </Button>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignupPage;