const { Ticket, User, ChatRoom, ChatMessage, Message } = require('../models');
const { Op, Sequelize } = require('sequelize');

// @desc    Get dashboard overview statistics
// @route   GET /api/analytics/overview
// @access  Private (Admin/Agent)
const getOverviewStats = async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build where clause based on user role
    let ticketWhereClause = { createdAt: { [Op.gte]: startDate } };
    let chatWhereClause = { createdAt: { [Op.gte]: startDate } };
    
    if (req.user.role === 'agent') {
      ticketWhereClause.agentId = req.user.id;
      chatWhereClause.agentId = req.user.id;
    }

    // Get ticket statistics
    const [
      totalTickets,
      openTickets,
      pendingTickets,
      resolvedTickets,
      closedTickets,
      totalChats,
      activeChats,
      waitingChats,
      closedChats,
      totalUsers,
      activeUsers,
      totalMessages
    ] = await Promise.all([
      Ticket.count({ where: ticketWhereClause }),
      Ticket.count({ where: { ...ticketWhereClause, status: 'open' } }),
      Ticket.count({ where: { ...ticketWhereClause, status: 'pending' } }),
      Ticket.count({ where: { ...ticketWhereClause, status: 'resolved' } }),
      Ticket.count({ where: { ...ticketWhereClause, status: 'closed' } }),
      ChatRoom.count({ where: chatWhereClause }),
      ChatRoom.count({ where: { ...chatWhereClause, status: 'active' } }),
      ChatRoom.count({ where: { ...chatWhereClause, status: 'waiting' } }),
      ChatRoom.count({ where: { ...chatWhereClause, status: 'closed' } }),
      req.user.role === 'admin' ? User.count() : 0,
      req.user.role === 'admin' ? User.count({ where: { isActive: true } }) : 0,
      Message.count({ where: { createdAt: { [Op.gte]: startDate } } })
    ]);

    // Calculate resolution rate
    const resolutionRate = totalTickets > 0 
      ? Math.round(((resolvedTickets + closedTickets) / totalTickets) * 100)
      : 0;

    // Calculate average response time (in hours)
    const avgResponseTime = await Ticket.findAll({
      where: {
        ...ticketWhereClause,
        status: { [Op.in]: ['resolved', 'closed'] },
        resolvedAt: { [Op.not]: null }
      },
      attributes: [
        [Sequelize.fn('AVG', 
          Sequelize.literal('EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600')
        ), 'avgHours']
      ],
      raw: true
    });

    const averageResolutionTime = avgResponseTime[0]?.avgHours 
      ? Math.round(parseFloat(avgResponseTime[0].avgHours) * 10) / 10
      : 0;

    res.json({
      tickets: {
        total: totalTickets,
        open: openTickets,
        pending: pendingTickets,
        resolved: resolvedTickets,
        closed: closedTickets,
        resolutionRate
      },
      chats: {
        total: totalChats,
        active: activeChats,
        waiting: waitingChats,
        closed: closedChats
      },
      users: {
        total: totalUsers,
        active: activeUsers
      },
      metrics: {
        totalMessages,
        averageResolutionTime,
        resolutionRate
      },
      timeRange,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get ticket trends over time
// @route   GET /api/analytics/ticket-trends
// @access  Private (Admin/Agent)
const getTicketTrends = async (req, res) => {
  try {
    const { timeRange = '30d', interval = 'day' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    let dateFormat;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFormat = '%Y-%m-%d';
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFormat = '%Y-%m-%d';
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        dateFormat = interval === 'week' ? '%Y-W%V' : '%Y-%m-%d';
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        dateFormat = '%Y-%m';
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFormat = '%Y-%m-%d';
    }

    let whereClause = { createdAt: { [Op.gte]: startDate } };
    
    if (req.user.role === 'agent') {
      whereClause.agentId = req.user.id;
    }

    const ticketTrends = await Ticket.findAll({
      where: whereClause,
      attributes: [
        [Sequelize.fn('DATE_TRUNC', interval, Sequelize.col('createdAt')), 'date'],
        [Sequelize.fn('COUNT', '*'), 'total'],
        [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'open' THEN 1 END")), 'open'],
        [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'pending' THEN 1 END")), 'pending'],
        [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'resolved' THEN 1 END")), 'resolved'],
        [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'closed' THEN 1 END")), 'closed']
      ],
      group: [Sequelize.fn('DATE_TRUNC', interval, Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('DATE_TRUNC', interval, Sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    res.json({
      trends: ticketTrends.map(trend => ({
        date: trend.date,
        total: parseInt(trend.total),
        open: parseInt(trend.open),
        pending: parseInt(trend.pending),
        resolved: parseInt(trend.resolved),
        closed: parseInt(trend.closed)
      })),
      timeRange,
      interval
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get ticket distribution by category and priority
// @route   GET /api/analytics/ticket-distribution
// @access  Private (Admin/Agent)
const getTicketDistribution = async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let whereClause = { createdAt: { [Op.gte]: startDate } };
    
    if (req.user.role === 'agent') {
      whereClause.agentId = req.user.id;
    }

    const [categoryDistribution, priorityDistribution, statusDistribution] = await Promise.all([
      Ticket.findAll({
        where: whereClause,
        attributes: [
          'category',
          [Sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['category'],
        order: [[Sequelize.fn('COUNT', '*'), 'DESC']],
        raw: true
      }),
      Ticket.findAll({
        where: whereClause,
        attributes: [
          'priority',
          [Sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['priority'],
        order: [[Sequelize.fn('COUNT', '*'), 'DESC']],
        raw: true
      }),
      Ticket.findAll({
        where: whereClause,
        attributes: [
          'status',
          [Sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['status'],
        order: [[Sequelize.fn('COUNT', '*'), 'DESC']],
        raw: true
      })
    ]);

    res.json({
      categories: categoryDistribution.map(item => ({
        name: item.category,
        value: parseInt(item.count)
      })),
      priorities: priorityDistribution.map(item => ({
        name: item.priority,
        value: parseInt(item.count)
      })),
      statuses: statusDistribution.map(item => ({
        name: item.status,
        value: parseInt(item.count)
      })),
      timeRange
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get agent performance metrics
// @route   GET /api/analytics/agent-performance
// @access  Private (Admin)
const getAgentPerformance = async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const agentPerformance = await User.findAll({
      where: { role: 'agent', isActive: true },
      attributes: [
        'id',
        'firstName',
        'lastName',
        'email',
        [Sequelize.literal(`(
          SELECT COUNT(*)
          FROM "Tickets" t
          WHERE t."agentId" = "User"."id"
          AND t."createdAt" >= '${startDate.toISOString()}'
        )`), 'totalTickets'],
        [Sequelize.literal(`(
          SELECT COUNT(*)
          FROM "Tickets" t
          WHERE t."agentId" = "User"."id"
          AND t."status" IN ('resolved', 'closed')
          AND t."createdAt" >= '${startDate.toISOString()}'
        )`), 'resolvedTickets'],
        [Sequelize.literal(`(
          SELECT COUNT(*)
          FROM "ChatRooms" c
          WHERE c."agentId" = "User"."id"
          AND c."createdAt" >= '${startDate.toISOString()}'
        )`), 'totalChats'],
        [Sequelize.literal(`(
          SELECT AVG(EXTRACT(EPOCH FROM (t."resolvedAt" - t."createdAt")) / 3600)
          FROM "Tickets" t
          WHERE t."agentId" = "User"."id"
          AND t."status" IN ('resolved', 'closed')
          AND t."resolvedAt" IS NOT NULL
          AND t."createdAt" >= '${startDate.toISOString()}'
        )`), 'avgResolutionTime']
      ],
      raw: true
    });

    const formattedPerformance = agentPerformance.map(agent => ({
      id: agent.id,
      name: `${agent.firstName} ${agent.lastName}`,
      email: agent.email,
      totalTickets: parseInt(agent.totalTickets) || 0,
      resolvedTickets: parseInt(agent.resolvedTickets) || 0,
      totalChats: parseInt(agent.totalChats) || 0,
      resolutionRate: agent.totalTickets > 0 
        ? Math.round((agent.resolvedTickets / agent.totalTickets) * 100)
        : 0,
      avgResolutionTime: agent.avgResolutionTime 
        ? Math.round(parseFloat(agent.avgResolutionTime) * 10) / 10
        : 0
    }));

    res.json({
      agents: formattedPerformance,
      timeRange
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get customer satisfaction metrics
// @route   GET /api/analytics/satisfaction
// @access  Private (Admin/Agent)
const getSatisfactionMetrics = async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // For now, return mock data since we haven't implemented rating system
    // This would be connected to a rating/feedback system in a full implementation
    const mockSatisfactionData = {
      averageRating: 4.2,
      totalRatings: 156,
      ratingDistribution: [
        { rating: 5, count: 78 },
        { rating: 4, count: 45 },
        { rating: 3, count: 20 },
        { rating: 2, count: 8 },
        { rating: 1, count: 5 }
      ],
      satisfactionTrend: [
        { date: '2024-05-01', rating: 4.1 },
        { date: '2024-05-08', rating: 4.3 },
        { date: '2024-05-15', rating: 4.2 },
        { date: '2024-05-22', rating: 4.4 },
        { date: '2024-05-29', rating: 4.2 }
      ],
      timeRange
    };

    res.json(mockSatisfactionData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get system activity metrics
// @route   GET /api/analytics/activity
// @access  Private (Admin)
const getActivityMetrics = async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const [
      newTickets,
      newChats,
      newMessages,
      activeUsers,
      peakHours
    ] = await Promise.all([
      Ticket.findAll({
        where: { createdAt: { [Op.gte]: startDate } },
        attributes: [
          [Sequelize.fn('DATE_TRUNC', 'hour', Sequelize.col('createdAt')), 'hour'],
          [Sequelize.fn('COUNT', '*'), 'count']
        ],
        group: [Sequelize.fn('DATE_TRUNC', 'hour', Sequelize.col('createdAt'))],
        order: [[Sequelize.fn('DATE_TRUNC', 'hour', Sequelize.col('createdAt')), 'ASC']],
        raw: true
      }),
      ChatRoom.findAll({
        where: { createdAt: { [Op.gte]: startDate } },
        attributes: [
          [Sequelize.fn('DATE_TRUNC', 'hour', Sequelize.col('createdAt')), 'hour'],
          [Sequelize.fn('COUNT', '*'), 'count']
        ],
        group: [Sequelize.fn('DATE_TRUNC', 'hour', Sequelize.col('createdAt'))],
        order: [[Sequelize.fn('DATE_TRUNC', 'hour', Sequelize.col('createdAt')), 'ASC']],
        raw: true
      }),
      Message.count({ where: { createdAt: { [Op.gte]: startDate } } }),
      User.count({ where: { lastLoginAt: { [Op.gte]: startDate } } }),
      Ticket.findAll({
        where: { createdAt: { [Op.gte]: startDate } },
        attributes: [
          [Sequelize.fn('EXTRACT', Sequelize.literal('HOUR FROM "createdAt"')), 'hour'],
          [Sequelize.fn('COUNT', '*'), 'count']
        ],
        group: [Sequelize.fn('EXTRACT', Sequelize.literal('HOUR FROM "createdAt"'))],
        order: [[Sequelize.fn('COUNT', '*'), 'DESC']],
        limit: 5,
        raw: true
      })
    ]);

    res.json({
      ticketActivity: newTickets.map(item => ({
        time: item.hour,
        count: parseInt(item.count)
      })),
      chatActivity: newChats.map(item => ({
        time: item.hour,
        count: parseInt(item.count)
      })),
      totalMessages: newMessages,
      activeUsers: activeUsers,
      peakHours: peakHours.map(item => ({
        hour: parseInt(item.hour),
        count: parseInt(item.count)
      })),
      timeRange
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getOverviewStats,
  getTicketTrends,
  getTicketDistribution,
  getAgentPerformance,
  getSatisfactionMetrics,
  getActivityMetrics
};

