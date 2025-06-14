# Chereka Technology Customer Support System

A modern, scalable Customer Support Web Application built with Node.js, React, and PostgreSQL. This comprehensive system provides ticket management, live chat, knowledge base, analytics, and admin controls for efficient customer support operations.

## 🚀 Features

### Core Features
- **Multi-Role Authentication**: Admin, Support Agent, and Customer roles with JWT-based security
- **Support Ticket Management**: Complete ticket lifecycle with status tracking, assignments, and messaging
- **Real-Time Live Chat**: WebSocket-powered chat system with agent assignment and typing indicators
- **Knowledge Base**: Searchable articles with categories, tags, and rating system
- **Analytics Dashboard**: Comprehensive insights with charts, KPIs, and performance metrics
- **Email Notifications**: Automated email system with customizable templates
- **Admin Panel**: System configuration, user management, and monitoring tools
- **Responsive Design**: Mobile-friendly interface optimized for all screen sizes

### Technical Highlights
- **RESTful API**: Well-structured backend with comprehensive validation
- **Real-Time Communication**: Socket.IO integration for live features
- **Database Design**: Optimized PostgreSQL schema with proper relationships
- **Security**: JWT authentication, role-based access control, input validation
- **Performance**: Efficient queries, pagination, caching, and optimization
- **Scalability**: Modular architecture designed for growth

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [Database Setup](#database-setup)
6. [API Documentation](#api-documentation)
7. [User Roles & Permissions](#user-roles--permissions)
8. [Deployment](#deployment)
9. [Testing](#testing)
10. [Contributing](#contributing)
11. [Support](#support)

## 🔧 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16.0.0 or higher)
- **npm** or **pnpm** (latest version)
- **PostgreSQL** (v12.0 or higher)
- **Git** (for cloning the repository)

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: At least 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

## 📦 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/chereka-tech/customer-support-app.git
cd customer-support-app
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Frontend Setup
```bash
cd ../frontend/chereka-support-frontend
npm install
# or using pnpm
pnpm install
```

## ⚙️ Configuration

### Backend Configuration

1. **Create Environment File**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Configure Environment Variables**
   Edit the `.env` file with your settings:
   ```env
   NODE_ENV=development
   PORT=5000
   
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=chereka_support
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=30d
   
   # Email Configuration (Development - Ethereal)
   EMAIL_FROM=noreply@chereka-support.com
   EMAIL_FROM_NAME=Chereka Support
   ETHEREAL_USER=your_ethereal_user
   ETHEREAL_PASS=your_ethereal_password
   
   # Email Configuration (Production - SMTP)
   # SMTP_HOST=smtp.gmail.com
   # SMTP_PORT=587
   # SMTP_USER=your_email@gmail.com
   # SMTP_PASS=your_app_password
   
   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,txt
   
   # Application Settings
   FRONTEND_URL=http://localhost:5173
   COMPANY_NAME=Chereka Technology
   SUPPORT_EMAIL=support@chereka-tech.com
   ```

### Frontend Configuration

1. **Create Environment File**
   ```bash
   cd frontend/chereka-support-frontend
   cp .env.example .env
   ```

2. **Configure Environment Variables**
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   VITE_APP_NAME=Chereka Support
   VITE_COMPANY_NAME=Chereka Technology
   ```

### Database Configuration

1. **Create PostgreSQL Database**
   ```sql
   CREATE DATABASE chereka_support;
   CREATE USER chereka_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE chereka_support TO chereka_user;
   ```

2. **Update Database Connection**
   Ensure your `.env` file has the correct database credentials.

## 🚀 Running the Application

### Development Mode

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend/chereka-support-frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

### Production Mode

1. **Build the Frontend**
   ```bash
   cd frontend/chereka-support-frontend
   npm run build
   ```

2. **Start the Backend in Production**
   ```bash
   cd backend
   npm start
   ```

## 🗄️ Database Setup

### Initialize Database Schema

The application will automatically create database tables on first run. To manually seed the database with sample data:

```bash
cd backend
npm run seed
```

This will create:
- **Sample Users**: Admin, Agent, and Customer accounts
- **Demo Tickets**: Various ticket statuses and priorities
- **Knowledge Base Articles**: Sample help articles with categories
- **Email Templates**: Professional notification templates
- **System Settings**: Default configuration values

### Sample Login Credentials

After seeding, you can use these accounts:

**Admin Account**
- Email: `admin@chereka-tech.com`
- Password: `admin123`

**Agent Account**
- Email: `agent@chereka-tech.com`
- Password: `agent123`

**Customer Account**
- Email: `customer@chereka-tech.com`
- Password: `customer123`

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/profile` | Update user profile |

### Ticket Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets` | Get tickets (filtered by role) |
| POST | `/api/tickets` | Create new ticket |
| GET | `/api/tickets/:id` | Get ticket details |
| PUT | `/api/tickets/:id` | Update ticket |
| DELETE | `/api/tickets/:id` | Delete ticket |
| POST | `/api/tickets/:id/messages` | Add message to ticket |
| GET | `/api/tickets/:id/messages` | Get ticket messages |

### Live Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/rooms` | Get chat rooms |
| POST | `/api/chat/rooms` | Create chat room |
| GET | `/api/chat/rooms/:id` | Get chat room details |
| POST | `/api/chat/rooms/:id/join` | Join chat room |
| POST | `/api/chat/rooms/:id/leave` | Leave chat room |
| GET | `/api/chat/rooms/:id/messages` | Get chat messages |

### Knowledge Base Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/knowledge-base/articles` | Get articles |
| GET | `/api/knowledge-base/articles/:id` | Get article details |
| POST | `/api/knowledge-base/articles` | Create article (admin/agent) |
| PUT | `/api/knowledge-base/articles/:id` | Update article (admin/agent) |
| DELETE | `/api/knowledge-base/articles/:id` | Delete article (admin) |
| GET | `/api/knowledge-base/categories` | Get categories |
| GET | `/api/knowledge-base/search` | Search articles |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Get dashboard overview |
| GET | `/api/analytics/tickets` | Get ticket analytics |
| GET | `/api/analytics/agents` | Get agent performance |
| GET | `/api/analytics/trends` | Get trend data |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Get all users |
| POST | `/api/admin/users` | Create user |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/settings` | Get system settings |
| PUT | `/api/settings/:key` | Update setting |
| GET | `/api/settings/system-health` | Get system health |

## 👥 User Roles & Permissions

### Customer Role
- Create and view their own tickets
- Send messages on their tickets
- Access knowledge base articles
- Start live chat sessions
- Update their profile

### Agent Role
- View assigned tickets
- Update ticket status and priority
- Respond to customer messages
- Join live chat sessions
- Access analytics dashboard
- View knowledge base articles

### Admin Role
- Full access to all tickets
- Assign tickets to agents
- Manage users (create, update, delete)
- Manage knowledge base articles
- Access comprehensive analytics
- Configure system settings
- Manage email templates
- Monitor system health

## 🌐 Deployment

### Environment Setup

1. **Production Environment Variables**
   ```env
   NODE_ENV=production
   PORT=5000
   DB_HOST=your_production_db_host
   DB_NAME=chereka_support_prod
   JWT_SECRET=your_production_jwt_secret
   SMTP_HOST=your_smtp_host
   SMTP_USER=your_smtp_user
   SMTP_PASS=your_smtp_password
   ```

2. **Build Frontend for Production**
   ```bash
   cd frontend/chereka-support-frontend
   npm run build
   ```

### Deployment Options

#### Option 1: Traditional Server Deployment

1. **Server Requirements**
   - Ubuntu 20.04+ or CentOS 8+
   - Node.js 16+
   - PostgreSQL 12+
   - Nginx (recommended)
   - PM2 for process management

2. **Setup Process**
   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Start backend with PM2
   cd backend
   pm2 start ecosystem.config.js
   
   # Configure Nginx
   sudo nginx -t
   sudo systemctl reload nginx
   ```

#### Option 2: Docker Deployment

1. **Build Docker Images**
   ```bash
   # Build backend image
   cd backend
   docker build -t chereka-support-backend .
   
   # Build frontend image
   cd ../frontend/chereka-support-frontend
   docker build -t chereka-support-frontend .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

#### Option 3: Cloud Platform Deployment

**Heroku Deployment**
```bash
# Install Heroku CLI and login
heroku login

# Create Heroku apps
heroku create chereka-support-backend
heroku create chereka-support-frontend

# Set environment variables
heroku config:set NODE_ENV=production --app chereka-support-backend

# Deploy
git push heroku main
```

**AWS/DigitalOcean/Vercel**
- Follow platform-specific deployment guides
- Ensure environment variables are properly configured
- Set up database connections and SSL certificates

### Database Migration for Production

```bash
# Backup existing data (if any)
pg_dump chereka_support > backup.sql

# Run migrations
npm run migrate

# Seed production data
npm run seed:prod
```

### SSL Certificate Setup

```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Performance Optimization

1. **Enable Gzip Compression**
2. **Set up CDN for static assets**
3. **Configure database connection pooling**
4. **Implement Redis for session storage**
5. **Set up monitoring and logging**

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend/chereka-support-frontend
npm test
```

### End-to-End Testing

```bash
# Install Cypress
npm install -g cypress

# Run E2E tests
cypress open
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Ticket creation and management
- [ ] Live chat functionality
- [ ] Knowledge base search
- [ ] Email notifications
- [ ] Admin panel operations
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

## 🤝 Contributing

We welcome contributions to improve the Chereka Support System!

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure responsive design compatibility

## 📞 Support

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Email**: Contact support@chereka-tech.com
- **Community**: Join our Discord server for discussions

### Common Issues

**Database Connection Issues**
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists and user has permissions

**Email Not Sending**
- Verify SMTP credentials
- Check firewall settings
- Test with Ethereal Email in development

**Frontend Build Issues**
- Clear node_modules and reinstall dependencies
- Check Node.js version compatibility
- Verify environment variables are set

### System Requirements Troubleshooting

**Memory Issues**
- Increase Node.js heap size: `node --max-old-space-size=4096`
- Monitor memory usage with `htop` or similar tools

**Performance Issues**
- Enable database query logging
- Use Redis for caching
- Optimize database indexes
- Monitor with APM tools

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by leading customer support platforms
- Community feedback and contributions
- Open source libraries and frameworks

---

**Chereka Technology Customer Support System** - Empowering efficient customer support operations with modern technology.

For more information, visit our [website](https://chereka-tech.com) or contact our [support team](mailto:support@chereka-tech.com).

# chereka_customer_support
