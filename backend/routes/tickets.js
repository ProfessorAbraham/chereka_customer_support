const express = require('express');
const { body } = require('express-validator');
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  assignTicket,
  deleteTicket,
  addMessage,
  getMessages,
  getTicketStats
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createTicketValidation = [
  body('subject').trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be between 5 and 200 characters'),
  body('description').trim().isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters'),
  body('category').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Category must be between 1 and 50 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Priority must be low, medium, high, or urgent')
];

const addMessageValidation = [
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Message content must be between 1 and 5000 characters')
];

// Apply authentication to all routes
router.use(protect);

// Ticket routes
router.get('/stats', authorize('admin', 'agent'), getTicketStats);
router.get('/', getTickets);
router.get('/:id', getTicket);
router.post('/', authorize('customer'), createTicketValidation, createTicket);
router.put('/:id', authorize('admin', 'agent'), updateTicket);
router.delete('/:id', authorize('admin'), deleteTicket);

// Assignment route
router.post('/:id/assign', authorize('admin'), assignTicket);

// Message routes
router.get('/:id/messages', getMessages);
router.post('/:id/messages', addMessageValidation, addMessage);

module.exports = router;

