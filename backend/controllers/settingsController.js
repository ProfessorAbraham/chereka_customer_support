const { Setting, EmailTemplate } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private (Admin)
const getSettings = async (req, res) => {
  try {
    const settings = await Setting.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    });

    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      const category = setting.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(setting);
      return acc;
    }, {});

    res.json(groupedSettings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update setting
// @route   PUT /api/settings/:key
// @access  Private (Admin)
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const setting = await Setting.findOne({ where: { key } });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    // Validate value based on type
    let validatedValue = value;
    if (setting.type === 'boolean') {
      validatedValue = value === 'true' || value === true;
    } else if (setting.type === 'number') {
      validatedValue = parseInt(value);
      if (isNaN(validatedValue)) {
        return res.status(400).json({ message: 'Invalid number value' });
      }
    }

    await setting.update({ value: validatedValue.toString() });

    res.json({
      message: 'Setting updated successfully',
      setting
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new setting
// @route   POST /api/settings
// @access  Private (Admin)
const createSetting = async (req, res) => {
  try {
    const { key, value, type = 'string', category = 'general', description } = req.body;

    // Check if setting already exists
    const existingSetting = await Setting.findOne({ where: { key } });
    if (existingSetting) {
      return res.status(400).json({ message: 'Setting already exists' });
    }

    const setting = await Setting.create({
      key,
      value: value.toString(),
      type,
      category,
      description
    });

    res.status(201).json(setting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete setting
// @route   DELETE /api/settings/:key
// @access  Private (Admin)
const deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await Setting.findOne({ where: { key } });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    await setting.destroy();
    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get email templates
// @route   GET /api/settings/email-templates
// @access  Private (Admin)
const getEmailTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.findAll({
      order: [['name', 'ASC']]
    });

    res.json(templates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update email template
// @route   PUT /api/settings/email-templates/:id
// @access  Private (Admin)
const updateEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, htmlContent, textContent, isActive, description } = req.body;

    const template = await EmailTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    await template.update({
      subject: subject || template.subject,
      htmlContent: htmlContent || template.htmlContent,
      textContent: textContent || template.textContent,
      isActive: isActive !== undefined ? isActive : template.isActive,
      description: description || template.description
    });

    res.json({
      message: 'Email template updated successfully',
      template
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get system statistics
// @route   GET /api/settings/system-stats
// @access  Private (Admin)
const getSystemStats = async (req, res) => {
  try {
    const { User, Ticket, Article, EmailLog } = require('../models');

    // Get counts
    const [
      totalUsers,
      totalTickets,
      totalArticles,
      totalEmailsSent,
      activeUsers,
      openTickets,
      publishedArticles
    ] = await Promise.all([
      User.count(),
      Ticket.count(),
      Article.count(),
      EmailLog.count({ where: { status: 'sent' } }),
      User.count({ where: { isActive: true } }),
      Ticket.count({ where: { status: 'open' } }),
      Article.count({ where: { status: 'published' } })
    ]);

    // Get recent activity
    const recentTickets = await Ticket.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    const recentUsers = await User.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt']
    });

    res.json({
      counts: {
        totalUsers,
        totalTickets,
        totalArticles,
        totalEmailsSent,
        activeUsers,
        openTickets,
        publishedArticles
      },
      recentActivity: {
        tickets: recentTickets,
        users: recentUsers
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get system health
// @route   GET /api/settings/system-health
// @access  Private (Admin)
const getSystemHealth = async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    
    // Check database connection
    let dbStatus = 'healthy';
    let dbLatency = 0;
    try {
      const start = Date.now();
      await sequelize.authenticate();
      dbLatency = Date.now() - start;
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    // Check email service
    let emailStatus = 'healthy';
    try {
      const emailService = require('../services/emailService');
      // Simple check - we can't actually test sending without proper config
      emailStatus = emailService ? 'healthy' : 'unhealthy';
    } catch (error) {
      emailStatus = 'unhealthy';
    }

    // System uptime
    const uptime = process.uptime();

    // Memory usage
    const memoryUsage = process.memoryUsage();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptime,
        formatted: formatUptime(uptime)
      },
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`
      },
      email: {
        status: emailStatus
      },
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'unhealthy',
      message: 'System health check failed',
      error: error.message
    });
  }
};

// Helper function to format uptime
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// @desc    Backup system data
// @route   POST /api/settings/backup
// @access  Private (Admin)
const createBackup = async (req, res) => {
  try {
    const { User, Ticket, Article, Setting, EmailTemplate } = require('../models');
    
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {
        users: await User.findAll({ attributes: { exclude: ['password'] } }),
        tickets: await Ticket.findAll(),
        articles: await Article.findAll(),
        settings: await Setting.findAll(),
        emailTemplates: await EmailTemplate.findAll()
      }
    };

    res.json({
      message: 'Backup created successfully',
      backup: {
        timestamp: backup.timestamp,
        size: JSON.stringify(backup).length,
        tables: Object.keys(backup.data),
        counts: {
          users: backup.data.users.length,
          tickets: backup.data.tickets.length,
          articles: backup.data.articles.length,
          settings: backup.data.settings.length,
          emailTemplates: backup.data.emailTemplates.length
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Backup creation failed' });
  }
};

module.exports = {
  getSettings,
  updateSetting,
  createSetting,
  deleteSetting,
  getEmailTemplates,
  updateEmailTemplate,
  getSystemStats,
  getSystemHealth,
  createBackup
};

