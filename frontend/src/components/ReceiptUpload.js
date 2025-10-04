import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  Alert,
  IconButton,
  Chip
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon, 
  Delete as DeleteIcon,
  Visibility as VisibilityIcon 
} from '@mui/icons-material';
import { createWorker } from 'tesseract.js';
import './ReceiptUpload.css';

const ReceiptUpload = ({ onOCRComplete, onError }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile) => {
    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      onError && onError('Please select an image file (PNG, JPG, JPEG)');
      return;
    }

    // Validate file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      onError && onError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const processOCR = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setExtractedText('');

    try {
      const worker = await createWorker('eng');
      
      // Set up progress tracking
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/$-: \n\t',
      });

      const { data: { text } } = await worker.recognize(file, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });

      await worker.terminate();

      setExtractedText(text);
      setIsProcessing(false);
      
      // Call the callback with extracted text
      if (onOCRComplete) {
        onOCRComplete(text, file);
      }

    } catch (error) {
      console.error('OCR processing failed:', error);
      setIsProcessing(false);
      onError && onError('Failed to process receipt. Please try again.');
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setExtractedText('');
    setShowExtractedText(false);
    setProgress(0);
  };

  const toggleExtractedText = () => {
    setShowExtractedText(!showExtractedText);
  };

  return (
    <Box className="receipt-upload">
      <Typography variant="h6" gutterBottom>
        Upload Receipt
      </Typography>

      {!file ? (
        <Paper
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          elevation={dragActive ? 4 : 1}
        >
          <input
            type="file"
            id="receipt-upload"
            accept="image/*"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="receipt-upload" className="upload-label">
            <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drop receipt image here
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              or click to browse files
            </Typography>
            <Button variant="contained" component="span" sx={{ mt: 2 }}>
              Choose File
            </Button>
          </label>
        </Paper>
      ) : (
        <Box className="file-preview">
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle1">
                {file.name}
              </Typography>
              <Box>
                {extractedText && (
                  <IconButton 
                    onClick={toggleExtractedText}
                    color="primary"
                    title="View extracted text"
                  >
                    <VisibilityIcon />
                  </IconButton>
                )}
                <IconButton onClick={clearFile} color="error" title="Remove file">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>

            {preview && (
              <Box className="image-preview" mb={2}>
                <img 
                  src={preview} 
                  alt="Receipt preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px', 
                    objectFit: 'contain',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }} 
                />
              </Box>
            )}

            <Box display="flex" gap={2} alignItems="center">
              <Button
                variant="contained"
                onClick={processOCR}
                disabled={isProcessing}
                startIcon={isProcessing ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              >
                {isProcessing ? `Processing... ${progress}%` : 'Extract Data'}
              </Button>
              
              {extractedText && (
                <Chip 
                  label="OCR Complete" 
                  color="success" 
                  variant="outlined"
                />
              )}
            </Box>

            {isProcessing && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Processing receipt with OCR... {progress}%
                </Typography>
                <Box sx={{ width: '100%', mt: 1 }}>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </Box>
              </Box>
            )}

            {showExtractedText && extractedText && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Extracted Text (for debugging):
                </Typography>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#f5f5f5',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}
                >
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
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ReceiptUpload;