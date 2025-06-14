const { createTransporter, emailConfig } = require('../config/email');
const { EmailTemplate, EmailLog } = require('../models');
const handlebars = require('handlebars');

class EmailService {
  constructor() {
    this.transporter = createTransporter();
  }

  // Compile template with variables
  compileTemplate(template, variables) {
    const compiledSubject = handlebars.compile(template.subject);
    const compiledHtml = handlebars.compile(template.htmlContent);
    const compiledText = template.textContent ? handlebars.compile(template.textContent) : null;

    return {
      subject: compiledSubject(variables),
      html: compiledHtml(variables),
      text: compiledText ? compiledText(variables) : null
    };
  }

  // Send email using template
  async sendTemplateEmail(templateName, to, variables = {}, options = {}) {
    try {
      // Get template
      const template = await EmailTemplate.findOne({
        where: { name: templateName, isActive: true }
      });

      if (!template) {
        throw new Error(`Email template '${templateName}' not found`);
      }

      // Add base variables
      const templateVariables = {
        ...variables,
        baseUrl: emailConfig.baseUrl,
        supportEmail: emailConfig.from.address,
        companyName: emailConfig.from.name,
        currentYear: new Date().getFullYear()
      };

      // Compile template
      const compiled = this.compileTemplate(template, templateVariables);

      // Prepare email options
      const mailOptions = {
        from: `${emailConfig.from.name} <${emailConfig.from.address}>`,
        to,
        subject: compiled.subject,
        html: compiled.html,
        text: compiled.text,
        replyTo: emailConfig.replyTo,
        ...options
      };

      // Create email log entry
      const emailLog = await EmailLog.create({
        to,
        from: emailConfig.from.address,
        subject: compiled.subject,
        templateName,
        status: 'pending',
        userId: options.userId || null,
        ticketId: options.ticketId || null,
        metadata: {
          variables: templateVariables,
          template: template.name
        }
      });

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      // Update log with success
      await emailLog.update({
        status: 'sent',
        sentAt: new Date(),
        metadata: {
          ...emailLog.metadata,
          messageId: info.messageId,
          response: info.response
        }
      });

      console.log(`Email sent successfully: ${info.messageId}`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null
      };

    } catch (error) {
      console.error('Email sending failed:', error);

      // Update log with error if it exists
      if (emailLog) {
        await emailLog.update({
          status: 'failed',
          error: error.message
        });
      }

      throw error;
    }
  }

  // Send plain email without template
  async sendPlainEmail(to, subject, content, options = {}) {
    try {
      const mailOptions = {
        from: `${emailConfig.from.name} <${emailConfig.from.address}>`,
        to,
        subject,
        html: content.html || content,
        text: content.text || null,
        replyTo: emailConfig.replyTo,
        ...options
      };

      // Create email log entry
      const emailLog = await EmailLog.create({
        to,
        from: emailConfig.from.address,
        subject,
        status: 'pending',
        userId: options.userId || null,
        ticketId: options.ticketId || null
      });

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      // Update log with success
      await emailLog.update({
        status: 'sent',
        sentAt: new Date(),
        metadata: {
          messageId: info.messageId,
          response: info.response
        }
      });

      console.log(`Email sent successfully: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error) {
      console.error('Email sending failed:', error);

      // Update log with error
      if (emailLog) {
        await emailLog.update({
          status: 'failed',
          error: error.message
        });
      }

      throw error;
    }
  }

  // Ticket-related email methods
  async sendTicketCreatedEmail(ticket, customer) {
    return this.sendTemplateEmail('ticket-created', customer.email, {
      customerName: `${customer.firstName} ${customer.lastName}`,
      ticketId: ticket.id,
      ticketSubject: ticket.subject,
      ticketUrl: `${emailConfig.baseUrl}/tickets/${ticket.id}`,
      priority: ticket.priority,
      category: ticket.category
    }, {
      userId: customer.id,
      ticketId: ticket.id
    });
  }

  async sendTicketUpdatedEmail(ticket, customer, agent, message) {
    return this.sendTemplateEmail('ticket-updated', customer.email, {
      customerName: `${customer.firstName} ${customer.lastName}`,
      agentName: agent ? `${agent.firstName} ${agent.lastName}` : 'Support Team',
      ticketId: ticket.id,
      ticketSubject: ticket.subject,
      ticketUrl: `${emailConfig.baseUrl}/tickets/${ticket.id}`,
      status: ticket.status,
      message: message || 'Your ticket has been updated.',
      priority: ticket.priority
    }, {
      userId: customer.id,
      ticketId: ticket.id
    });
  }

  async sendTicketAssignedEmail(ticket, agent, customer) {
    return this.sendTemplateEmail('ticket-assigned', agent.email, {
      agentName: `${agent.firstName} ${agent.lastName}`,
      customerName: `${customer.firstName} ${customer.lastName}`,
      ticketId: ticket.id,
      ticketSubject: ticket.subject,
      ticketUrl: `${emailConfig.baseUrl}/tickets/${ticket.id}`,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt
    }, {
      userId: agent.id,
      ticketId: ticket.id
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    return this.sendTemplateEmail('password-reset', user.email, {
      userName: `${user.firstName} ${user.lastName}`,
      resetUrl: `${emailConfig.baseUrl}/reset-password?token=${resetToken}`,
      expiresIn: '1 hour'
    }, {
      userId: user.id
    });
  }

  async sendWelcomeEmail(user) {
    return this.sendTemplateEmail('welcome', user.email, {
      userName: `${user.firstName} ${user.lastName}`,
      loginUrl: `${emailConfig.baseUrl}/login`,
      supportUrl: `${emailConfig.baseUrl}/knowledge-base`,
      role: user.role
    }, {
      userId: user.id
    });
  }

  // Get email logs
  async getEmailLogs(filters = {}) {
    const { page = 1, limit = 50, status, userId, ticketId } = filters;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (userId) whereClause.userId = userId;
    if (ticketId) whereClause.ticketId = ticketId;

    return EmailLog.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: require('../models').User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: require('../models').Ticket,
          as: 'ticket',
          attributes: ['id', 'subject']
        }
      ]
    });
  }
}

module.exports = new EmailService();

