const { EmailTemplate } = require('../models');

const emailTemplates = [
  {
    name: 'welcome',
    subject: 'Welcome to {{companyName}} - Your Account is Ready!',
    description: 'Welcome email sent to new users after registration',
    variables: ['userName', 'loginUrl', 'supportUrl', 'role'],
    htmlContent: `
      <h2>Welcome {{userName}}!</h2>
      <p>Thank you for joining {{companyName}}. Your account has been successfully created and you're ready to get started.</p>
      
      {{#if (eq role 'customer')}}
      <div class="alert alert-info">
        <strong>Getting Started:</strong>
        <ul>
          <li>Browse our <a href="{{supportUrl}}">Knowledge Base</a> for quick answers</li>
          <li>Create support tickets when you need help</li>
          <li>Use our live chat for immediate assistance</li>
        </ul>
      </div>
      {{else}}
      <div class="alert alert-info">
        <strong>Team Member Access:</strong>
        <p>You now have {{role}} access to the support system. You can manage tickets, assist customers, and access analytics.</p>
      </div>
      {{/if}}
      
      <p style="text-align: center;">
        <a href="{{loginUrl}}" class="btn">Access Your Account</a>
      </p>
      
      <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
      
      <p>Best regards,<br>The {{companyName}} Team</p>
    `,
    textContent: `
      Welcome {{userName}}!
      
      Thank you for joining {{companyName}}. Your account has been successfully created and you're ready to get started.
      
      Access your account: {{loginUrl}}
      
      If you have any questions, please contact us at {{supportEmail}}.
      
      Best regards,
      The {{companyName}} Team
    `
  },
  {
    name: 'ticket-created',
    subject: 'Support Ticket Created - #{{ticketId}}',
    description: 'Confirmation email sent when a new ticket is created',
    variables: ['customerName', 'ticketId', 'ticketSubject', 'ticketUrl', 'priority', 'category'],
    htmlContent: `
      <h2>Support Ticket Created</h2>
      <p>Hello {{customerName}},</p>
      <p>We've received your support request and a ticket has been created. Our team will review your request and respond as soon as possible.</p>
      
      <div class="ticket-info">
        <h3>Ticket Details</h3>
        <p><strong>Ticket ID:</strong> #{{ticketId}}</p>
        <p><strong>Subject:</strong> {{ticketSubject}}</p>
        <p><strong>Priority:</strong> <span class="priority-{{priority}}">{{priority}}</span></p>
        <p><strong>Category:</strong> {{category}}</p>
      </div>
      
      <div class="alert alert-info">
        <strong>What happens next?</strong>
        <ul>
          <li>Our support team will review your request</li>
          <li>You'll receive updates via email when there are responses</li>
          <li>You can track progress and add comments using the link below</li>
        </ul>
      </div>
      
      <p style="text-align: center;">
        <a href="{{ticketUrl}}" class="btn">View Ticket</a>
      </p>
      
      <p>Thank you for contacting {{companyName}} support.</p>
    `,
    textContent: `
      Support Ticket Created - #{{ticketId}}
      
      Hello {{customerName}},
      
      We've received your support request and a ticket has been created.
      
      Ticket Details:
      - Ticket ID: #{{ticketId}}
      - Subject: {{ticketSubject}}
      - Priority: {{priority}}
      - Category: {{category}}
      
      View your ticket: {{ticketUrl}}
      
      Thank you for contacting {{companyName}} support.
    `
  },
  {
    name: 'ticket-updated',
    subject: 'Ticket Update - #{{ticketId}}',
    description: 'Email sent when a ticket is updated or receives a response',
    variables: ['customerName', 'agentName', 'ticketId', 'ticketSubject', 'ticketUrl', 'status', 'message', 'priority'],
    htmlContent: `
      <h2>Ticket Update</h2>
      <p>Hello {{customerName}},</p>
      <p>Your support ticket has been updated by {{agentName}}.</p>
      
      <div class="ticket-info">
        <h3>Ticket Details</h3>
        <p><strong>Ticket ID:</strong> #{{ticketId}}</p>
        <p><strong>Subject:</strong> {{ticketSubject}}</p>
        <p><strong>Status:</strong> <span class="status-badge status-{{status}}">{{status}}</span></p>
        <p><strong>Priority:</strong> <span class="priority-{{priority}}">{{priority}}</span></p>
      </div>
      
      {{#if message}}
      <div class="alert alert-info">
        <strong>Latest Update:</strong>
        <p>{{message}}</p>
      </div>
      {{/if}}
      
      <p style="text-align: center;">
        <a href="{{ticketUrl}}" class="btn">View Full Conversation</a>
      </p>
      
      <p>If you have additional questions or information to add, please reply through the ticket system.</p>
    `,
    textContent: `
      Ticket Update - #{{ticketId}}
      
      Hello {{customerName}},
      
      Your support ticket has been updated by {{agentName}}.
      
      Ticket Details:
      - Ticket ID: #{{ticketId}}
      - Subject: {{ticketSubject}}
      - Status: {{status}}
      - Priority: {{priority}}
      
      {{#if message}}
      Latest Update: {{message}}
      {{/if}}
      
      View full conversation: {{ticketUrl}}
    `
  },
  {
    name: 'ticket-assigned',
    subject: 'New Ticket Assignment - #{{ticketId}}',
    description: 'Email sent to agents when a ticket is assigned to them',
    variables: ['agentName', 'customerName', 'ticketId', 'ticketSubject', 'ticketUrl', 'priority', 'category', 'createdAt'],
    htmlContent: `
      <h2>New Ticket Assignment</h2>
      <p>Hello {{agentName}},</p>
      <p>A new support ticket has been assigned to you. Please review and respond as soon as possible.</p>
      
      <div class="ticket-info">
        <h3>Ticket Details</h3>
        <p><strong>Ticket ID:</strong> #{{ticketId}}</p>
        <p><strong>Subject:</strong> {{ticketSubject}}</p>
        <p><strong>Customer:</strong> {{customerName}}</p>
        <p><strong>Priority:</strong> <span class="priority-{{priority}}">{{priority}}</span></p>
        <p><strong>Category:</strong> {{category}}</p>
        <p><strong>Created:</strong> {{createdAt}}</p>
      </div>
      
      {{#if (eq priority 'urgent')}}
      <div class="alert alert-warning">
        <strong>⚠️ Urgent Priority:</strong> This ticket requires immediate attention.
      </div>
      {{/if}}
      
      <p style="text-align: center;">
        <a href="{{ticketUrl}}" class="btn">View & Respond</a>
      </p>
      
      <p>Please ensure timely response according to our SLA guidelines.</p>
    `,
    textContent: `
      New Ticket Assignment - #{{ticketId}}
      
      Hello {{agentName}},
      
      A new support ticket has been assigned to you.
      
      Ticket Details:
      - Ticket ID: #{{ticketId}}
      - Subject: {{ticketSubject}}
      - Customer: {{customerName}}
      - Priority: {{priority}}
      - Category: {{category}}
      - Created: {{createdAt}}
      
      View and respond: {{ticketUrl}}
    `
  },
  {
    name: 'password-reset',
    subject: 'Password Reset Request - {{companyName}}',
    description: 'Email sent when user requests password reset',
    variables: ['userName', 'resetUrl', 'expiresIn'],
    htmlContent: `
      <h2>Password Reset Request</h2>
      <p>Hello {{userName}},</p>
      <p>We received a request to reset your password for your {{companyName}} account.</p>
      
      <div class="alert alert-warning">
        <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      </div>
      
      <p>To reset your password, click the button below:</p>
      
      <p style="text-align: center;">
        <a href="{{resetUrl}}" class="btn">Reset Password</a>
      </p>
      
      <p><strong>Important:</strong> This link will expire in {{expiresIn}}. After that, you'll need to request a new password reset.</p>
      
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #64748b;">{{resetUrl}}</p>
      
      <p>If you continue to have problems, please contact our support team.</p>
    `,
    textContent: `
      Password Reset Request
      
      Hello {{userName}},
      
      We received a request to reset your password for your {{companyName}} account.
      
      To reset your password, visit this link: {{resetUrl}}
      
      This link will expire in {{expiresIn}}.
      
      If you didn't request this password reset, please ignore this email.
      
      If you need help, contact our support team at {{supportEmail}}.
    `
  }
];

const seedEmailTemplates = async () => {
  try {
    console.log('Seeding email templates...');
    
    for (const template of emailTemplates) {
      await EmailTemplate.findOrCreate({
        where: { name: template.name },
        defaults: template
      });
    }
    
    console.log('Email templates seeded successfully');
  } catch (error) {
    console.error('Error seeding email templates:', error);
  }
};

module.exports = { seedEmailTemplates, emailTemplates };

