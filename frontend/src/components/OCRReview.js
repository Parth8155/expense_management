import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  Alert,
  Divider,
  IconButton,
  Collapse
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { parseReceiptData } from '../services/ocrService';
import './OCRReview.css';

const OCRReview = ({ extractedText, onDataConfirmed, onCancel }) => {
  const [parsedData, setParsedData] = useState(null);
  const [editableData, setEditableData] = useState({
    amount: '',
    date: '',
    vendor: '',
    description: '',
    category: 'General'
  });
  const [showRawText, setShowRawText] = useState(false);
  const [fieldConfidence, setFieldConfidence] = useState({});

  useEffect(() => {
    if (extractedText) {
      const parsed = parseReceiptData(extractedText);
      setParsedData(parsed);
      
      // Set initial editable data
      setEditableData({
        amount: parsed.amount?.value || '',
        date: parsed.date?.value || '',
        vendor: parsed.vendor?.value || '',
        description: parsed.vendor?.value || 'Receipt expense',
        category: 'General'
      });

      // Set field confidence levels
      setFieldConfidence({
        amount: parsed.amount?.confidence || 'low',
        date: parsed.date?.confidence || 'low',
        vendor: parsed.vendor?.confidence || 'low',
        overall: parsed.confidence || 'low'
      });
    }
  }, [extractedText]);

  const handleFieldChange = (field, value) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getConfidenceIcon = (confidence) => {
    switch (confidence) {
      case 'high':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'medium':
        return <WarningIcon color="warning" fontSize="small" />;
      case 'low':
      default:
        return <ErrorIcon color="error" fontSize="small" />;
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'error';
    }
  };

  const getConfidenceText = (confidence) => {
    switch (confidence) {
      case 'high':
        return 'High confidence - likely accurate';
      case 'medium':
        return 'Medium confidence - please review';
      case 'low':
      default:
        return 'Low confidence - please verify';
    }
  };

  const handleConfirm = () => {
    // Validate required fields
    if (!editableData.amount || !editableData.description) {
      return;
    }

    const confirmedData = {
      ...editableData,
      amount: parseFloat(editableData.amount),
      confidence: fieldConfidence.overall,
      originalText: extractedText
    };

    onDataConfirmed(confirmedData);
  };

  const isFormValid = () => {
    return editableData.amount && 
           editableData.description && 
           !isNaN(parseFloat(editableData.amount)) &&
           parseFloat(editableData.amount) > 0;
  };

  if (!parsedData) {
    return (
      <Box className="ocr-review">
        <Typography>Processing OCR data...</Typography>
      </Box>
    );
  }

  return (
    <Box className="ocr-review">
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            Review Extracted Data
          </Typography>
          <Chip
            icon={getConfidenceIcon(fieldConfidence.overall)}
            label={`${fieldConfidence.overall.toUpperCase()} CONFIDENCE`}
            color={getConfidenceColor(fieldConfidence.overall)}
            variant="outlined"
          />
        </Box>

        <Alert 
          severity={fieldConfidence.overall === 'high' ? 'success' : 'warning'} 
          sx={{ mb: 3 }}
        >
          {getConfidenceText(fieldConfidence.overall)}. 
          Please review and edit the extracted information before submitting.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box className="field-container">
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle2">Amount *</Typography>
                {getConfidenceIcon(fieldConfidence.amount)}
              </Box>
              <TextField
                fullWidth
                type="number"
                value={editableData.amount}
                onChange={(e) => handleFieldChange('amount', e.target.value)}
                placeholder="0.00"
                inputProps={{ 
                  step: "0.01",
                  min: "0"
                }}
                error={!editableData.amount || isNaN(parseFloat(editableData.amount))}
                helperText={
                  fieldConfidence.amount === 'low' 
                    ? "Low confidence - please verify amount"
                    : "Enter the total amount from the receipt"
                }
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box className="field-container">
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle2">Date</Typography>
                {getConfidenceIcon(fieldConfidence.date)}
              </Box>
              <TextField
                fullWidth
                type="date"
                value={editableData.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                helperText={
                  fieldConfidence.date === 'low'
                    ? "Low confidence - please verify date"
                    : "Date of the expense"
                }
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box className="field-container">
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle2">Vendor/Merchant</Typography>
                {getConfidenceIcon(fieldConfidence.vendor)}
              </Box>
              <TextField
                fullWidth
                value={editableData.vendor}
                onChange={(e) => handleFieldChange('vendor', e.target.value)}
                placeholder="Enter vendor name"
                helperText={
                  fieldConfidence.vendor === 'low'
                    ? "Low confidence - please verify vendor name"
                    : "Name of the merchant or vendor"
                }
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Description *"
              value={editableData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Enter expense description"
              error={!editableData.description}
              helperText="Brief description of the expense"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Category"
              value={editableData.category}
              onChange={(e) => handleFieldChange('category', e.target.value)}
              SelectProps={{
                native: true,
              }}
            >
              <option value="General">General</option>
              <option value="Travel">Travel</option>
              <option value="Meals">Meals</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Transportation">Transportation</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </TextField>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Button
            onClick={() => setShowRawText(!showRawText)}
            startIcon={showRawText ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            variant="text"
            size="small"
          >
            {showRawText ? 'Hide' : 'Show'} Raw OCR Text
          </Button>
          
          <Collapse in={showRawText}>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                mt: 2,
                backgroundColor: '#f5f5f5',
                maxHeight: '200px',
                overflow: 'auto'
              }}
            >
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Raw extracted text for reference:
              </Typography>
              <Typography 
                variant="body2" 
                component="pre" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem'
                }}
              >
                {extractedText}
              </Typography>
            </Paper>
          </Collapse>
        </Box>

        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button
            variant="outlined"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={!isFormValid()}
            startIcon={<CheckCircleIcon />}
          >
            Use This Data
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default OCRReview;