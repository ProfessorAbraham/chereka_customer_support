const { Ticket, User, Message, Attachment } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// @desc    Get all tickets (with filtering based on user role)
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause based on user role
    let whereClause = {};
    
    if (req.user.role === 'customer') {
      whereClause.customerId = req.user.id;
    } else if (req.user.role === 'agent') {
      whereClause.agentId = req.user.id;
    }
    // Admin can see all tickets (no additional filter)

    // Add optional filters
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;
    if (priority) whereClause.priority = priority;

    const { count, rows: tickets } = await Ticket.findAndCountAll({
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
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      tickets,
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

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
const getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
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
          model: Message,
          as: 'messages',
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'role']
          }],
          order: [['createdAt', 'ASC']]
        },
        {
          model: Attachment,
          as: 'attachments',
          include: [{
            model: User,
            as: 'uploader',
            attributes: ['id', 'firstName', 'lastName']
          }]
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check access permissions
    if (req.user.role === 'customer' && ticket.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'agent' && ticket.agentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private (Customer)
const createTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subject, description, category, priority } = req.body;

    const ticket = await Ticket.create({
      subject,
      description,
      category: category || 'General',
      priority: priority || 'medium',
      customerId: req.user.id,
      status: 'open'
    });

    // Fetch the created ticket with associations
    const createdTicket = await Ticket.findByPk(ticket.id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(201).json(createdTicket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private (Agent/Admin)
const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check permissions
    if (req.user.role === 'agent' && ticket.agentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { subject, description, category, priority, status } = req.body;

    // Update allowed fields
    if (subject) ticket.subject = subject;
    if (description) ticket.description = description;
    if (category) ticket.category = category;
    if (priority) ticket.priority = priority;
    if (status) ticket.status = status;

    await ticket.save();

    // Fetch updated ticket with associations
    const updatedTicket = await Ticket.findByPk(ticket.id, {
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

    res.json(updatedTicket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Assign ticket to agent
// @route   POST /api/tickets/:id/assign
// @access  Private (Admin)
const assignTicket = async (req, res) => {
  try {
    const { agentId } = req.body;

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Verify agent exists and has agent role
    const agent = await User.findByPk(agentId);
    if (!agent || agent.role !== 'agent') {
      return res.status(400).json({ message: 'Invalid agent' });
    }

    ticket.agentId = agentId;
    if (ticket.status === 'open') {
      ticket.status = 'pending';
    }

    await ticket.save();

    // Fetch updated ticket with associations
    const updatedTicket = await Ticket.findByPk(ticket.id, {
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

    res.json(updatedTicket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private (Admin)
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ticket.destroy();
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add message to ticket
// @route   POST /api/tickets/:id/messages
// @access  Private
const addMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const ticketId = req.params.id;

    // Verify ticket exists and user has access
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check access permissions
    if (req.user.role === 'customer' && ticket.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'agent' && ticket.agentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = await Message.create({
      content,
      ticketId,
      senderId: req.user.id,
      messageType: 'reply'
    });

    // Update ticket status if needed
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      ticket.status = 'pending';
      await ticket.save();
    }

    // Fetch message with sender info
    const createdMessage = await Message.findByPk(message.id, {
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

// @desc    Get ticket messages
// @route   GET /api/tickets/:id/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const ticketId = req.params.id;

    // Verify ticket exists and user has access
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check access permissions
    if (req.user.role === 'customer' && ticket.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'agent' && ticket.agentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.findAll({
      where: { ticketId },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName', 'role']
      }],
      order: [['createdAt', 'ASC']]
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get ticket statistics
// @route   GET /api/tickets/stats
// @access  Private (Admin/Agent)
const getTicketStats = async (req, res) => {
  try {
    let whereClause = {};
    
    if (req.user.role === 'agent') {
      whereClause.agentId = req.user.id;
    }

    const stats = await Promise.all([
      Ticket.count({ where: { ...whereClause, status: 'open' } }),
      Ticket.count({ where: { ...whereClause, status: 'pending' } }),
      Ticket.count({ where: { ...whereClause, status: 'resolved' } }),
      Ticket.count({ where: { ...whereClause, status: 'closed' } }),
      Ticket.count({ where: whereClause })
    ]);

    res.json({
      open: stats[0],
      pending: stats[1],
      resolved: stats[2],
      closed: stats[3],
      total: stats[4]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  assignTicket,
  deleteTicket,
  addMessage,
  getMessages,
  getTicketStats
};

