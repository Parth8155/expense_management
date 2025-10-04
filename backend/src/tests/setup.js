// Test setup file
// Add global test configurations here

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/expense-management-test';

// Increase timeout for tests
jest.setTimeout(30000);
