const express = require('express');
const { body } = require('express-validator');
const {
  getOrCreateChatRoom,
  getChatRooms,
  getChatRoom,
  joinChatRoom,
  closeChatRoom,
  getChatMessages,
  sendChatMessage,
  getChatStats
} = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const sendMessageValidation = [
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Message content must be between 1 and 5000 characters')
];

const createRoomValidation = [
  body('subject').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Subject must be between 1 and 200 characters')
];

// Apply authentication to all routes
router.use(protect);

// Chat room routes
router.get('/stats', authorize('admin', 'agent'), getChatStats);
router.post('/room', authorize('customer'), createRoomValidation, getOrCreateChatRoom);
router.get('/rooms', authorize('admin', 'agent'), getChatRooms);
router.get('/rooms/:id', getChatRoom);
router.post('/rooms/:id/join', authorize('admin', 'agent'), joinChatRoom);
router.post('/rooms/:id/close', closeChatRoom);

// Message routes
router.get('/rooms/:id/messages', getChatMessages);
router.post('/rooms/:id/messages', sendMessageValidation, sendChatMessage);

module.exports = router;

