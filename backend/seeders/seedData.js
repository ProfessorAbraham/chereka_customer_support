const { User, Ticket, Article, Setting, Category, Tag, ArticleTag } = require('../models');
const { seedEmailTemplates } = require('./emailTemplates');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Seed email templates first
    await seedEmailTemplates();

    // Create categories
    const categories = await Promise.all([
      Category.findOrCreate({
        where: { slug: 'getting-started' },
        defaults: {
          name: 'Getting Started',
          slug: 'getting-started',
          description: 'Basic information to help you get started with our platform',
          color: '#3b82f6',
          icon: 'book',
          sortOrder: 1
        }
      }),
      Category.findOrCreate({
        where: { slug: 'account-billing' },
        defaults: {
          name: 'Account & Billing',
          slug: 'account-billing',
          description: 'Questions about your account, billing, and subscription',
          color: '#10b981',
          icon: 'folder',
          sortOrder: 2
        }
      }),
      Category.findOrCreate({
        where: { slug: 'technical-support' },
        defaults: {
          name: 'Technical Support',
          slug: 'technical-support',
          description: 'Technical issues and troubleshooting guides',
          color: '#f59e0b',
          icon: 'folder',
          sortOrder: 3
        }
      })
    ]);

    // Create tags
    const tags = await Promise.all([
      Tag.findOrCreate({
        where: { slug: 'beginner' },
        defaults: { name: 'Beginner', slug: 'beginner', color: '#3b82f6' }
      }),
      Tag.findOrCreate({
        where: { slug: 'advanced' },
        defaults: { name: 'Advanced', slug: 'advanced', color: '#8b5cf6' }
      }),
      Tag.findOrCreate({
        where: { slug: 'troubleshooting' },
        defaults: { name: 'Troubleshooting', slug: 'troubleshooting', color: '#ef4444' }
      }),
      Tag.findOrCreate({
        where: { slug: 'tutorial' },
        defaults: { name: 'Tutorial', slug: 'tutorial', color: '#10b981' }
      })
    ]);

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const [adminUser] = await User.findOrCreate({
      where: { email: 'admin@chereka.com' },
      defaults: {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@chereka.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        isEmailVerified: true
      }
    });

    const [agentUser] = await User.findOrCreate({
      where: { email: 'agent@chereka.com' },
      defaults: {
        firstName: 'Support',
        lastName: 'Agent',
        email: 'agent@chereka.com',
        password: hashedPassword,
        role: 'agent',
        isActive: true,
        isEmailVerified: true
      }
    });

    const [customerUser] = await User.findOrCreate({
      where: { email: 'customer@example.com' },
      defaults: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'customer@example.com',
        password: hashedPassword,
        role: 'customer',
        isActive: true,
        isEmailVerified: true
      }
    });

    console.log('✅ Users created');

    // Create sample tickets
    const tickets = [
      {
        subject: 'Unable to login to my account',
        description: 'I am having trouble logging into my account. I keep getting an error message saying my credentials are invalid.',
        status: 'open',
        priority: 'medium',
        category: 'Account & Billing',
        customerId: customerUser.id,
        agentId: agentUser.id
      },
      {
        subject: 'How to reset my password?',
        description: 'I forgot my password and need help resetting it. Can you guide me through the process?',
        status: 'resolved',
        priority: 'low',
        category: 'Account & Billing',
        customerId: customerUser.id,
        agentId: agentUser.id
      },
      {
        subject: 'Feature request: Dark mode',
        description: 'It would be great if you could add a dark mode option to the interface. Many users would appreciate this feature.',
        status: 'pending',
        priority: 'low',
        category: 'General',
        customerId: customerUser.id
      }
    ];

    for (const ticketData of tickets) {
      await Ticket.findOrCreate({
        where: { subject: ticketData.subject },
        defaults: ticketData
      });
    }

    console.log('✅ Sample tickets created');

    // Create sample articles
    const articles = [
      {
        title: 'Getting Started with Chereka Support',
        slug: 'getting-started-with-chereka-support',
        content: `
          <h2>Welcome to Chereka Support</h2>
          <p>This guide will help you get started with our support platform and make the most of its features.</p>
          
          <h3>Creating Your First Ticket</h3>
          <p>To create a support ticket:</p>
          <ol>
            <li>Click on "New Ticket" in the navigation menu</li>
            <li>Fill in the subject and description</li>
            <li>Select the appropriate category and priority</li>
            <li>Click "Submit" to create your ticket</li>
          </ol>
          
          <h3>Using Live Chat</h3>
          <p>For immediate assistance, you can use our live chat feature. Simply click on the "Chat" button and connect with one of our support agents.</p>
          
          <h3>Knowledge Base</h3>
          <p>Before creating a ticket, we recommend checking our knowledge base for quick answers to common questions.</p>
        `,
        excerpt: 'Learn how to get started with Chereka Support and make the most of our platform features.',
        categoryId: categories[0][0].id,
        authorId: adminUser.id,
        status: 'published',
        featured: true,
        publishedAt: new Date(),
        viewCount: 125,
        helpfulCount: 23,
        notHelpfulCount: 2
      },
      {
        title: 'How to Reset Your Password',
        slug: 'how-to-reset-your-password',
        content: `
          <h2>Password Reset Guide</h2>
          <p>If you've forgotten your password, don't worry! You can easily reset it by following these steps.</p>
          
          <h3>Step 1: Go to Login Page</h3>
          <p>Navigate to the login page and click on "Forgot Password?" link below the login form.</p>
          
          <h3>Step 2: Enter Your Email</h3>
          <p>Enter the email address associated with your account and click "Send Reset Link".</p>
          
          <h3>Step 3: Check Your Email</h3>
          <p>You'll receive an email with a password reset link. Click on the link to proceed.</p>
          
          <h3>Step 4: Set New Password</h3>
          <p>Enter your new password and confirm it. Make sure to use a strong password with at least 8 characters.</p>
          
          <h3>Troubleshooting</h3>
          <p>If you don't receive the reset email, check your spam folder or contact our support team.</p>
        `,
        excerpt: 'Step-by-step guide to reset your password if you forget it.',
        categoryId: categories[1][0].id,
        authorId: agentUser.id,
        status: 'published',
        featured: false,
        publishedAt: new Date(),
        viewCount: 89,
        helpfulCount: 18,
        notHelpfulCount: 1
      },
      {
        title: 'Troubleshooting Common Login Issues',
        slug: 'troubleshooting-common-login-issues',
        content: `
          <h2>Common Login Problems and Solutions</h2>
          <p>Having trouble logging in? Here are the most common issues and how to fix them.</p>
          
          <h3>Invalid Credentials Error</h3>
          <p>If you're getting an "invalid credentials" error:</p>
          <ul>
            <li>Double-check your email address for typos</li>
            <li>Ensure your password is correct (check caps lock)</li>
            <li>Try resetting your password if you're unsure</li>
          </ul>
          
          <h3>Account Locked</h3>
          <p>After multiple failed login attempts, your account may be temporarily locked for security. Wait 15 minutes and try again.</p>
          
          <h3>Browser Issues</h3>
          <p>Sometimes browser-related issues can prevent login:</p>
          <ul>
            <li>Clear your browser cache and cookies</li>
            <li>Try using an incognito/private browsing window</li>
            <li>Disable browser extensions temporarily</li>
          </ul>
          
          <h3>Still Having Problems?</h3>
          <p>If none of these solutions work, please contact our support team with details about the error you're experiencing.</p>
        `,
        excerpt: 'Solutions to common login problems and troubleshooting steps.',
        categoryId: categories[2][0].id,
        authorId: agentUser.id,
        status: 'published',
        featured: true,
        publishedAt: new Date(),
        viewCount: 156,
        helpfulCount: 31,
        notHelpfulCount: 3
      }
    ];

    for (const articleData of articles) {
      const [article] = await Article.findOrCreate({
        where: { slug: articleData.slug },
        defaults: articleData
      });

      // Add tags to articles
      if (articleData.slug === 'getting-started-with-chereka-support') {
        await article.addTags([tags[0][0], tags[3][0]]); // beginner, tutorial
      } else if (articleData.slug === 'how-to-reset-your-password') {
        await article.addTags([tags[0][0]]); // beginner
      } else if (articleData.slug === 'troubleshooting-common-login-issues') {
        await article.addTags([tags[2][0], tags[1][0]]); // troubleshooting, advanced
      }
    }

    console.log('✅ Knowledge base articles created');

    // Create system settings
    const settings = [
      { key: 'site_name', value: 'Chereka Support', type: 'string' },
      { key: 'site_description', value: 'Professional Customer Support System', type: 'string' },
      { key: 'support_email', value: 'support@chereka.com', type: 'string' },
      { key: 'max_file_size', value: '10485760', type: 'number' }, // 10MB
      { key: 'allowed_file_types', value: 'jpg,jpeg,png,gif,pdf,doc,docx,txt', type: 'string' },
      { key: 'tickets_per_page', value: '20', type: 'number' },
      { key: 'enable_chat', value: 'true', type: 'boolean' },
      { key: 'enable_notifications', value: 'true', type: 'boolean' },
      { key: 'maintenance_mode', value: 'false', type: 'boolean' }
    ];

    for (const setting of settings) {
      await Setting.findOrCreate({
        where: { key: setting.key },
        defaults: setting
      });
    }

    console.log('✅ System settings created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📧 Demo Accounts:');
    console.log('Admin: admin@chereka.com / password123');
    console.log('Agent: agent@chereka.com / password123');
    console.log('Customer: customer@example.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

module.exports = { seedData };

