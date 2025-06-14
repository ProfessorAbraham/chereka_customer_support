const { User, Ticket, EmailLog } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const emailService = require('../services/emailService');

// @desc    Get all users with filtering and pagination
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    let whereClause = {};

    if (role) {
      whereClause.role = role;
    }

    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Build order clause
    const validSortFields = ['firstName', 'lastName', 'email', 'role', 'createdAt', 'lastLogin'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [[sortField, order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Ticket,
          as: 'customerTickets',
          attributes: ['id', 'status'],
          required: false
        }
      ]
    });

    // Add ticket counts to each user
    const usersWithStats = users.map(user => {
      const userData = user.toJSON();
      userData.ticketCount = userData.customerTickets ? userData.customerTickets.length : 0;
      userData.openTickets = userData.customerTickets ? 
        userData.customerTickets.filter(ticket => ticket.status === 'open').length : 0;
      delete userData.customerTickets;
      return userData;
    });

    res.json({
      users: usersWithStats,
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

// @desc    Get single user details
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Ticket,
          as: 'customerTickets',
          limit: 10,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'agent',
              attributes: ['firstName', 'lastName']
            }
          ]
        },
        {
          model: Ticket,
          as: 'agentTickets',
          limit: 10,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['firstName', 'lastName']
            }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get email statistics
    const emailStats = await EmailLog.findAll({
      where: { userId: id },
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('status')), 'count']
      ],
      group: ['status']
    });

    const userData = user.toJSON();
    userData.emailStats = emailStats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.dataValues.count);
      return acc;
    }, {});

    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private (Admin)
const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role = 'customer',
      isActive = true,
      sendWelcomeEmail = true
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      isActive,
      isEmailVerified: true // Admin created users are pre-verified
    });

    // Send welcome email if requested
    if (sendWelcomeEmail) {
      try {
        await emailService.sendWelcomeEmail(user);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail user creation if email fails
      }
    }

    // Return user without password
    const userData = user.toJSON();
    delete userData.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      role,
      isActive,
      isEmailVerified,
      password
    } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email,
          id: { [Op.ne]: id }
        }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use by another user' });
      }
    }

    // Prepare update data
    const updateData = {
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: email || user.email,
      role: role || user.role,
      isActive: isActive !== undefined ? isActive : user.isActive,
      isEmailVerified: isEmailVerified !== undefined ? isEmailVerified : user.isEmailVerified
    };

    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    await user.update(updateData);

    // Return updated user without password
    const userData = user.toJSON();
    delete userData.password;

    res.json({
      message: 'User updated successfully',
      user: userData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has associated tickets
    const ticketCount = await Ticket.count({
      where: {
        [Op.or]: [
          { customerId: id },
          { agentId: id }
        ]
      }
    });

    if (ticketCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with associated tickets. Please reassign or archive tickets first.',
        ticketCount
      });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle user status (activate/deactivate)
// @route   PATCH /api/admin/users/:id/toggle-status
// @access  Private (Admin)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deactivating themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ isActive: !user.isActive });

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset user password
// @route   POST /api/admin/users/:id/reset-password
// @access  Private (Admin)
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { sendEmail = true } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    await user.update({ password: hashedPassword });

    // Send password reset email if requested
    if (sendEmail) {
      try {
        await emailService.sendPlainEmail(
          user.email,
          'Password Reset - Chereka Support',
          {
            html: `
              <h2>Password Reset</h2>
              <p>Hello ${user.firstName},</p>
              <p>Your password has been reset by an administrator. Your temporary password is:</p>
              <p><strong>${tempPassword}</strong></p>
              <p>Please log in and change your password immediately.</p>
              <p>Best regards,<br>Chereka Support Team</p>
            `,
            text: `Your password has been reset. Temporary password: ${tempPassword}. Please log in and change it immediately.`
          },
          { userId: user.id }
        );
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the operation if email fails
      }
    }

    res.json({
      message: 'Password reset successfully',
      tempPassword: sendEmail ? undefined : tempPassword,
      emailSent: sendEmail
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user statistics
// @route   GET /api/admin/users/stats
// @access  Private (Admin)
const getUserStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      // Total users by role
      User.findAll({
        attributes: [
          'role',
          [require('sequelize').fn('COUNT', require('sequelize').col('role')), 'count']
        ],
        group: ['role']
      }),
      
      // Active vs inactive users
      User.findAll({
        attributes: [
          'isActive',
          [require('sequelize').fn('COUNT', require('sequelize').col('isActive')), 'count']
        ],
        group: ['isActive']
      }),

      // New users in last 30 days
      User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Users with tickets
      User.count({
        include: [
          {
            model: Ticket,
            as: 'customerTickets',
            required: true
          }
        ]
      })
    ]);

    const [roleStats, statusStats, newUsersCount, usersWithTickets] = stats;

    res.json({
      byRole: roleStats.reduce((acc, stat) => {
        acc[stat.role] = parseInt(stat.dataValues.count);
        return acc;
      }, {}),
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat.isActive ? 'active' : 'inactive'] = parseInt(stat.dataValues.count);
        return acc;
      }, {}),
      newUsersLast30Days: newUsersCount,
      usersWithTickets
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUsers,
  getUserDetails,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getUserStats
};

