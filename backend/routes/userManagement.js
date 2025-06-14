const express = require('express');
const { body, param, query } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUserDetails,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getUserStats
} = require('../controllers/userManagementController');

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// User management routes
router.get('/stats', getUserStats);

router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['admin', 'agent', 'customer']).withMessage('Invalid role'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  query('sortBy').optional().isIn(['firstName', 'lastName', 'email', 'role', 'createdAt', 'lastLogin']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Invalid sort order')
], getUsers);

router.get('/:id', [
  param('id').isInt().withMessage('Invalid user ID')
], getUserDetails);

router.post('/', [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'agent', 'customer']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('sendWelcomeEmail').optional().isBoolean().withMessage('sendWelcomeEmail must be boolean')
], createUser);

router.put('/:id', [
  param('id').isInt().withMessage('Invalid user ID'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'agent', 'customer']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('isEmailVerified').optional().isBoolean().withMessage('isEmailVerified must be boolean')
], updateUser);

router.delete('/:id', [
  param('id').isInt().withMessage('Invalid user ID')
], deleteUser);

router.patch('/:id/toggle-status', [
  param('id').isInt().withMessage('Invalid user ID')
], toggleUserStatus);

router.post('/:id/reset-password', [
  param('id').isInt().withMessage('Invalid user ID'),
  body('sendEmail').optional().isBoolean().withMessage('sendEmail must be boolean')
], resetUserPassword);

module.exports = router;

