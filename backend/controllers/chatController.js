const { ChatRoom, ChatMessage, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// @desc    Get or create chat room for customer
// @route   POST /api/chat/room
// @access  Private (Customer)
const getOrCreateChatRoom = async (req, res) => {
  try {
    const { subject } = req.body;
    const customerId = req.user.id;

    // Check if customer has an active chat room
    let chatRoom = await ChatRoom.findOne({
      where: {
        customerId,
        status: { [Op.in]: ['waiting', 'active'] }
      },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!chatRoom) {
      // Create new chat room
      chatRoom = await ChatRoom.create({
        customerId,
        subject: subject || 'Live Chat Support',
        status: 'waiting'
      });

      // Fetch with associations
      chatRoom = await ChatRoom.findByPk(chatRoom.id, {
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'agent',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      // Add system message
      await ChatMessage.create({
        chatRoomId: chatRoom.id,
        senderId: req.user.id,
        content: 'Chat session started. Please wait for an agent to join.',
        messageType: 'system'
      });
    }

    res.json(chatRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get chat rooms for agent
// @route   GET /api/chat/rooms
// @access  Private (Agent/Admin)
const getChatRooms = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    if (req.user.role === 'agent') {
      whereClause = {
        [Op.or]: [
          { agentId: req.user.id },
          { status: 'waiting' }
        ]
      };
    }

    if (status !== 'all') {
      whereClause.status = status;
    }

    const { count, rows: chatRooms } = await ChatRoom.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['lastMessageAt', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      chatRooms,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single chat room
// @route   GET /api/chat/rooms/:id
// @access  Private
const getChatRoom = async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: ChatMessage,
          as: 'messages',
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'role']
          }],
          order: [['createdAt', 'ASC']]
        }
      ]
    });

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check access permissions
    if (req.user.role === 'customer' && chatRoom.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'agent' && 
        chatRoom.agentId !== req.user.id && 
        chatRoom.status === 'active') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(chatRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Join chat room as agent
// @route   POST /api/chat/rooms/:id/join
// @access  Private (Agent/Admin)
const joinChatRoom = async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findByPk(req.params.id);

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (chatRoom.status !== 'waiting') {
      return res.status(400).json({ message: 'Chat room is not available' });
    }

    // Assign agent and activate chat
    chatRoom.agentId = req.user.id;
    chatRoom.status = 'active';
    await chatRoom.save();

    // Add system message
    await ChatMessage.create({
      chatRoomId: chatRoom.id,
      senderId: req.user.id,
      content: `${req.user.firstName} ${req.user.lastName} has joined the chat.`,
      messageType: 'system'
    });

    // Fetch updated chat room
    const updatedChatRoom = await ChatRoom.findByPk(chatRoom.id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.json(updatedChatRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Close chat room
// @route   POST /api/chat/rooms/:id/close
// @access  Private (Agent/Admin/Customer)
const closeChatRoom = async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findByPk(req.params.id);

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check permissions
    if (req.user.role === 'customer' && chatRoom.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'agent' && chatRoom.agentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    chatRoom.status = 'closed';
    chatRoom.closedAt = new Date();
    await chatRoom.save();

    // Add system message
    await ChatMessage.create({
      chatRoomId: chatRoom.id,
      senderId: req.user.id,
      content: `Chat session closed by ${req.user.firstName} ${req.user.lastName}.`,
      messageType: 'system'
    });

    res.json({ message: 'Chat room closed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get chat messages
// @route   GET /api/chat/rooms/:id/messages
// @access  Private
const getChatMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const chatRoomId = req.params.id;

    // Verify chat room exists and user has access
    const chatRoom = await ChatRoom.findByPk(chatRoomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check access permissions
    if (req.user.role === 'customer' && chatRoom.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'agent' && 
        chatRoom.agentId !== req.user.id && 
        chatRoom.status === 'active') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { count, rows: messages } = await ChatMessage.findAndCountAll({
      where: { chatRoomId },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName', 'role']
      }],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send chat message
// @route   POST /api/chat/rooms/:id/messages
// @access  Private
const sendChatMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const chatRoomId = req.params.id;

    // Verify chat room exists and user has access
    const chatRoom = await ChatRoom.findByPk(chatRoomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check access permissions
    if (req.user.role === 'customer' && chatRoom.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'agent' && chatRoom.agentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (chatRoom.status === 'closed') {
      return res.status(400).json({ message: 'Chat room is closed' });
    }

    const message = await ChatMessage.create({
      chatRoomId,
      senderId: req.user.id,
      content,
      messageType: 'text'
    });

    // Update chat room last message time
    chatRoom.lastMessageAt = new Date();
    await chatRoom.save();

    // Fetch message with sender info
    const createdMessage = await ChatMessage.findByPk(message.id, {
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName', 'role']
      }]
    });

    res.status(201).json(createdMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get chat statistics
// @route   GET /api/chat/stats
// @access  Private (Agent/Admin)
const getChatStats = async (req, res) => {
  try {
    let whereClause = {};
    
    if (req.user.role === 'agent') {
      whereClause.agentId = req.user.id;
    }

    const stats = await Promise.all([
      ChatRoom.count({ where: { ...whereClause, status: 'waiting' } }),
      ChatRoom.count({ where: { ...whereClause, status: 'active' } }),
      ChatRoom.count({ where: { ...whereClause, status: 'closed' } }),
      ChatRoom.count({ where: whereClause })
    ]);

    res.json({
      waiting: stats[0],
      active: stats[1],
      closed: stats[2],
      total: stats[3]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getOrCreateChatRoom,
  getChatRooms,
  getChatRoom,
  joinChatRoom,
  closeChatRoom,
  getChatMessages,
  sendChatMessage,
  getChatStats
};

