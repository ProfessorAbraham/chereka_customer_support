const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // For development, use Ethereal Email (fake SMTP service)
  // In production, replace with your actual SMTP settings
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Development configuration - using Ethereal Email
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'ethereal.pass'
      }
    });
  }
};

// Email configuration
const emailConfig = {
  from: {
    name: process.env.EMAIL_FROM_NAME || 'Chereka Support',
    address: process.env.EMAIL_FROM_ADDRESS || 'support@chereka.com'
  },
  replyTo: process.env.EMAIL_REPLY_TO || 'noreply@chereka.com',
  baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
};

module.exports = {
  createTransporter,
  emailConfig
};

