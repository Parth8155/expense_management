/**
 * OCR Service for parsing receipt data
 * Extracts structured data from OCR text output
 */

/**
 * Main function to parse receipt data from OCR text
 * @param {string} text - Raw OCR text from receipt
 * @returns {object} Parsed receipt data
 */
export const parseReceiptData = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      amount: null,
      date: null,
      vendor: null,
      lineItems: [],
      confidence: 'low'
    };
  }

  const cleanText = text.trim();
  
  return {
    amount: extractAmount(cleanText),
    date: extractDate(cleanText),
    vendor: extractVendor(cleanText),
    lineItems: extractLineItems(cleanText),
    confidence: calculateConfidence(cleanText)
  };
};

/**
 * Extract monetary amounts from receipt text
 * @param {string} text - OCR text
 * @returns {object} Amount data with value and confidence
 */
export const extractAmount = (text) => {
  const lines = text.split('\n').map(line => line.trim());
  
  // Common patterns for amounts
  const amountPatterns = [
    // Total patterns (highest priority)
    /(?:total|sum|amount|grand\s*total|final|balance)\s*:?\s*\$?(\d+\.?\d*)/i,
    /\$?\s*(\d+\.\d{2})\s*(?:total|sum|amount)/i,
    
    // Currency symbols with amounts
    /\$\s*(\d+\.\d{2})/g,
    /(\d+\.\d{2})\s*\$/g,
    
    // Decimal amounts (2 decimal places)
    /(\d+\.\d{2})/g,
    
    // Whole dollar amounts
    /\$\s*(\d+)/g,
    /(\d+)\s*\$/g
  ];

  const foundAmounts = [];
  
  for (const pattern of amountPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const numMatch = match.match(/(\d+\.?\d*)/);
        if (numMatch) {
          const amount = parseFloat(numMatch[1]);
          if (amount > 0 && amount < 10000) { // Reasonable range
            foundAmounts.push({
              value: amount,
              context: match,
              confidence: getAmountConfidence(match, text)
            });
          }
        }
      });
    }
  }

  if (foundAmounts.length === 0) {
    return { value: null, confidence: 'low' };
  }

  // Sort by confidence and return the best match
  foundAmounts.sort((a, b) => {
    const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  });

  return {
    value: foundAmounts[0].value,
    confidence: foundAmounts[0].confidence
  };
};

/**
 * Extract date from receipt text
 * @param {string} text - OCR text
 * @returns {object} Date data with value and confidence
 */
export const extractDate = (text) => {
  const datePatterns = [
    // MM/DD/YYYY or MM-DD-YYYY
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
    // DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
    // Month DD, YYYY
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/gi,
    // DD Month YYYY
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/gi,
    // YYYY-MM-DD
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g
  ];

  const foundDates = [];
  
  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const dateStr = match[0];
      const parsedDate = parseDate(dateStr);
      
      if (parsedDate && isValidReceiptDate(parsedDate)) {
        foundDates.push({
          value: parsedDate,
          confidence: getDateConfidence(dateStr, text)
        });
      }
    }
  }

  if (foundDates.length === 0) {
    return { value: null, confidence: 'low' };
  }

  // Return the most recent valid date
  foundDates.sort((a, b) => b.value - a.value);
  
  return {
    value: foundDates[0].value.toISOString().split('T')[0], // YYYY-MM-DD format
    confidence: foundDates[0].confidence
  };
};/**
 * E
xtract vendor/merchant name from receipt text
 * @param {string} text - OCR text
 * @returns {object} Vendor data with value and confidence
 */
export const extractVendor = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    return { value: null, confidence: 'low' };
  }

  // Common vendor indicators
  const vendorPatterns = [
    /^([A-Z][A-Z\s&]+[A-Z])$/,  // All caps company names
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/,  // Title case company names
    /^([A-Z][A-Za-z\s&'-]+)(?:\s+(?:inc|llc|corp|ltd|co)\.?)?$/i  // Company with suffixes
  ];

  // Look at first few lines for vendor name
  const candidateLines = lines.slice(0, 5);
  
  for (const line of candidateLines) {
    // Skip lines that look like addresses, phone numbers, or other data
    if (isLikelyVendorName(line)) {
      return {
        value: cleanVendorName(line),
        confidence: 'medium'
      };
    }
  }

  // Fallback to first non-empty line
  const firstLine = lines[0];
  if (firstLine && firstLine.length > 2 && firstLine.length < 50) {
    return {
      value: cleanVendorName(firstLine),
      confidence: 'low'
    };
  }

  return { value: null, confidence: 'low' };
};

/**
 * Extract line items from receipt text
 * @param {string} text - OCR text
 * @returns {array} Array of line items with description and amount
 */
export const extractLineItems = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const lineItems = [];
  
  for (const line of lines) {
    const item = parseLineItem(line);
    if (item) {
      lineItems.push(item);
    }
  }

  // If no line items found, create a single item with the total amount
  if (lineItems.length === 0) {
    const totalAmount = extractAmount(text);
    if (totalAmount.value) {
      lineItems.push({
        description: 'Receipt item',
        amount: totalAmount.value,
        category: 'General'
      });
    }
  }

  return lineItems;
};

// Helper functions

/**
 * Calculate overall confidence based on extracted data
 */
const calculateConfidence = (text) => {
  let score = 0;
  
  // Check for amount
  const amount = extractAmount(text);
  if (amount.confidence === 'high') score += 3;
  else if (amount.confidence === 'medium') score += 2;
  else if (amount.confidence === 'low') score += 1;
  
  // Check for date
  const date = extractDate(text);
  if (date.confidence === 'high') score += 2;
  else if (date.confidence === 'medium') score += 1;
  
  // Check for vendor
  const vendor = extractVendor(text);
  if (vendor.confidence === 'medium') score += 1;
  
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
};

/**
 * Get confidence level for amount extraction
 */
const getAmountConfidence = (match, fullText) => {
  const lowerMatch = match.toLowerCase();
  
  // High confidence indicators
  if (lowerMatch.includes('total') || lowerMatch.includes('amount') || lowerMatch.includes('sum')) {
    return 'high';
  }
  
  // Medium confidence for currency symbols
  if (match.includes('$')) {
    return 'medium';
  }
  
  return 'low';
};

/**
 * Get confidence level for date extraction
 */
const getDateConfidence = (dateStr, fullText) => {
  // Higher confidence if date appears near common receipt terms
  const context = fullText.toLowerCase();
  if (context.includes('date') || context.includes('time') || context.includes('receipt')) {
    return 'medium';
  }
  
  return 'low';
};

/**
 * Parse date string into Date object
 */
const parseDate = (dateStr) => {
  try {
    // Try different date formats
    const formats = [
      // MM/DD/YYYY
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
      // YYYY-MM-DD
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) {
          // MM/DD/YYYY format
          return new Date(match[3], match[1] - 1, match[2]);
        } else {
          // YYYY-MM-DD format
          return new Date(match[1], match[2] - 1, match[3]);
        }
      }
    }
    
    // Fallback to Date constructor
    return new Date(dateStr);
  } catch (error) {
    return null;
  }
};

/**
 * Check if date is valid for a receipt (not too old, not in future)
 */
const isValidReceiptDate = (date) => {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  return date >= oneYearAgo && date <= tomorrow;
};

/**
 * Check if a line looks like a vendor name
 */
const isLikelyVendorName = (line) => {
  // Skip lines that look like addresses, phone numbers, etc.
  if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line)) return false; // Phone number
  if (/\d+\s+[A-Za-z\s]+(?:st|street|ave|avenue|rd|road|blvd|boulevard)/i.test(line)) return false; // Address
  if (/^\d+$/.test(line)) return false; // Just numbers
  if (line.length < 3 || line.length > 50) return false; // Too short or long
  
  return true;
};

/**
 * Clean vendor name by removing extra characters
 */
const cleanVendorName = (name) => {
  return name
    .replace(/[^\w\s&'-]/g, '') // Remove special characters except &, ', -
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

/**
 * Parse a single line to extract item description and amount
 */
const parseLineItem = (line) => {
  // Look for patterns like "Item description $5.99" or "Item 5.99"
  const patterns = [
    /^(.+?)\s+\$?(\d+\.\d{2})$/,
    /^(.+?)\s+(\d+\.\d{2})\s*\$?$/,
    /^(.+?)\s+\$(\d+)$/
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const description = match[1].trim();
      const amount = parseFloat(match[2]);
      
      // Skip if description is too short or amount is unreasonable
      if (description.length < 2 || amount <= 0 || amount > 1000) {
        continue;
      }
      
      return {
        description: description,
        amount: amount,
        category: 'General'
      };
    }
  }
  
  return null;
};