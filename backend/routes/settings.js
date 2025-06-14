const express = require('express');
const { body, param } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getSettings,
  updateSetting,
  createSetting,
  deleteSetting,
  getEmailTemplates,
  updateEmailTemplate,
  getSystemStats,
  getSystemHealth,
  createBackup
} = require('../controllers/settingsController');

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// Settings routes
router.get('/', getSettings);
router.post('/', [
  body('key').notEmpty().withMessage('Setting key is required'),
  body('value').notEmpty().withMessage('Setting value is required'),
  body('type').optional().isIn(['string', 'number', 'boolean']).withMessage('Invalid setting type')
], createSetting);

router.put('/:key', [
  param('key').notEmpty().withMessage('Setting key is required'),
  body('value').notEmpty().withMessage('Setting value is required')
], updateSetting);

router.delete('/:key', [
  param('key').notEmpty().withMessage('Setting key is required')
], deleteSetting);

// Email template routes
router.get('/email-templates', getEmailTemplates);
router.put('/email-templates/:id', [
  param('id').isInt().withMessage('Invalid template ID'),
  body('subject').optional().notEmpty().withMessage('Subject cannot be empty'),
  body('htmlContent').optional().notEmpty().withMessage('HTML content cannot be empty')
], updateEmailTemplate);

// System monitoring routes
router.get('/system-stats', getSystemStats);
router.get('/system-health', getSystemHealth);
router.post('/backup', createBackup);

module.exports = router;

