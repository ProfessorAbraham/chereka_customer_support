const { connectDB } = require('../config/database');

// Setup test database connection
beforeAll(async () => {
  try {
    await connectDB();
    console.log('Test database connected');
  } catch (error) {
    console.error('Test database connection failed:', error);
  }
});

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

