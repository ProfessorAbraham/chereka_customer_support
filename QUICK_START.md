# Quick Start Guide - Chereka Support System

Get up and running with the Chereka Customer Support System in minutes!

## 🚀 Prerequisites

- **Node.js** 16+ installed
- **PostgreSQL** 12+ running
- **Git** for cloning the repository

## ⚡ 5-Minute Setup

### 1. Clone and Install
```bash
# Clone the repository
git clone <your-repository-url>
cd customer-support-app

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend/chereka-support-frontend
npm install
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb chereka_support

# Or using psql
psql -c "CREATE DATABASE chereka_support;"
```

### 3. Configure Environment
```bash
# Backend configuration
cd ../../backend
cp .env.example .env

# Edit .env file with your database credentials
# Minimum required:
# DB_HOST=localhost
# DB_NAME=chereka_support
# DB_USER=your_username
# DB_PASSWORD=your_password
# JWT_SECRET=your_secret_key_here
```

```bash
# Frontend configuration
cd ../frontend/chereka-support-frontend
cp .env.example .env

# Default configuration should work for local development
```

### 4. Initialize Database
```bash
cd ../../backend
npm run seed
```

### 5. Start the Application
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend/chereka-support-frontend
npm run dev
```

## 🎯 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 👤 Demo Accounts

Login with these pre-seeded accounts:

### Admin Account
- **Email**: admin@chereka-tech.com
- **Password**: admin123
- **Access**: Full system administration

### Agent Account
- **Email**: agent@chereka-tech.com
- **Password**: agent123
- **Access**: Ticket management and chat support

### Customer Account
- **Email**: customer@chereka-tech.com
- **Password**: customer123
- **Access**: Create tickets, use chat, browse knowledge base

## 🔧 Docker Quick Start

If you prefer Docker:

```bash
# Clone repository
git clone <your-repository-url>
cd customer-support-app

# Start with Docker Compose
docker-compose up -d

# Access at http://localhost:80
```

## 📱 What to Try First

### As a Customer
1. **Login** with customer credentials
2. **Create a Ticket** - Go to "Create Ticket" and submit a support request
3. **Browse Knowledge Base** - Check out helpful articles
4. **Start Live Chat** - Click the chat icon for real-time support

### As an Agent
1. **Login** with agent credentials
2. **View Tickets** - See assigned tickets and respond to customers
3. **Join Live Chat** - Handle customer chat requests
4. **Check Analytics** - View your performance metrics

### As an Admin
1. **Login** with admin credentials
2. **User Management** - Create and manage user accounts
3. **System Analytics** - View comprehensive system statistics
4. **Settings** - Configure system preferences and email templates

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U your_username -d chereka_support
```

### Port Already in Use
```bash
# Kill processes on ports 5000 or 5173
sudo lsof -ti:5000 | xargs kill -9
sudo lsof -ti:5173 | xargs kill -9
```

### Node Modules Issues
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

- Read the [User Guide](USER_GUIDE.md) for detailed feature explanations
- Check [Deployment Guide](DEPLOYMENT.md) for production setup
- Review [README.md](README.md) for comprehensive documentation

## 🎉 You're Ready!

The Chereka Support System is now running locally. Explore the features, create test tickets, and experience the full customer support workflow!

For questions or issues, refer to the comprehensive documentation or contact support.

