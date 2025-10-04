import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Button
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { ReceiptUpload, OCRReview } from '../components';
import { useNavigate } from 'react-router-dom';

const OCRDemoPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState('');

  const steps = ['Upload Receipt', 'Review Data', 'Complete'];

  const handleOCRComplete = (text, file) => {
    setExtractedText(text);
    setUploadedFile(file);
    setActiveStep(1);
    setError('');
  };

  const handleOCRError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleDataConfirmed = (confirmedData) => {
    console.log('Confirmed OCR Data:', confirmedData);
    
    // Here you would typically:
    // 1. Navigate to expense form with pre-filled data
    // 2. Or directly submit the expense
    // For demo purposes, we'll just show completion
    setActiveStep(2);
    
    // In a real app, you might do:
    // navigate('/expenses/new', { state: { ocrData: confirmedData } });
  };

  const handleCancel = () => {
    if (activeStep === 1) {
      setActiveStep(0);
      setExtractedText('');
      setUploadedFile(null);
    } else {
      navigate('/expenses');
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setExtractedText('');
    setUploadedFile(null);
    setError('');
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <ReceiptUpload
            onOCRComplete={handleOCRComplete}
            onError={handleOCRError}
          />
        );
      case 1:
        return (
          <OCRReview
            extractedText={extractedText}
            onDataConfirmed={handleDataConfirmed}
            onCancel={handleCancel}
          />
        );
      case 2:
        return (
          <Box textAlign="center" py={4}>
            <Typography variant="h5" gutterBottom color="success.main">
              OCR Processing Complete!
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              The receipt data has been extracted and is ready to use.
            </Typography>
            <Box mt={3}>
              <Button
                variant="contained"
                onClick={() => navigate('/expenses/new')}
                sx={{ mr: 2 }}
              >
                Create Expense
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
              >
                Process Another Receipt
              </Button>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/expenses')}
          sx={{ mb: 2 }}
        >
          Back to Expenses
        </Button>
        
        <Typography variant="h4" gutterBottom>
          OCR Receipt Scanner
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload a receipt image to automatically extract expense data using OCR technology.
        </Typography>
      </Box>

      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2}>
        {renderStepContent()}
      </Paper>

      {activeStep === 1 && (
        <Box mt={2}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Tips for better OCR results:</strong>
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Ensure the receipt is well-lit and clearly visible</li>
              <li>Avoid shadows or glare on the receipt</li>
              <li>Make sure the text is not blurry or distorted</li>
              <li>Include the entire receipt in the image</li>
            </ul>
          </Alert>
        </Box>
      )}
    </Container>
  );
};

export default OCRDemoPage;