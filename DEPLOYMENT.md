# Deployment Guide - Chereka Support System

This guide provides detailed instructions for deploying the Chereka Customer Support System to production environments.

## 🚀 Quick Deployment Options

### Option 1: Traditional Server (Recommended)
- **Best for**: Full control, custom configurations
- **Requirements**: VPS/Dedicated server, Linux OS
- **Complexity**: Medium
- **Cost**: Variable based on server specs

### Option 2: Docker Containers
- **Best for**: Consistent environments, easy scaling
- **Requirements**: Docker, Docker Compose
- **Complexity**: Low-Medium
- **Cost**: Based on hosting platform

### Option 3: Cloud Platforms
- **Best for**: Quick deployment, managed services
- **Requirements**: Platform account (Heroku, Vercel, etc.)
- **Complexity**: Low
- **Cost**: Platform-dependent

## 🖥️ Traditional Server Deployment

### Server Requirements

**Minimum Specifications:**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Network**: 1Gbps connection

**Recommended Specifications:**
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 22.04 LTS
- **Network**: High-speed connection with CDN

### Step 1: Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 for process management
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

### Step 2: Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE chereka_support_prod;
CREATE USER chereka_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE chereka_support_prod TO chereka_user;
ALTER USER chereka_user CREATEDB;
\q

# Configure PostgreSQL (optional but recommended)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Uncomment and modify:
# listen_addresses = 'localhost'
# max_connections = 100
# shared_buffers = 256MB

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 3: Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/chereka-support
sudo chown $USER:$USER /var/www/chereka-support

# Clone repository
cd /var/www/chereka-support
git clone https://github.com/your-repo/customer-support-app.git .

# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies and build
cd ../frontend/chereka-support-frontend
npm install
npm run build

# Create production environment file
cd ../../backend
cp .env.example .env.production
```

### Step 4: Environment Configuration

Edit `/var/www/chereka-support/backend/.env.production`:

```env
NODE_ENV=production
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chereka_support_prod
DB_USER=chereka_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRE=30d

# Email (Production SMTP)
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Chereka Support
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Application
FRONTEND_URL=https://yourdomain.com
COMPANY_NAME=Chereka Technology
SUPPORT_EMAIL=support@yourdomain.com

# File uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,txt

# Security
CORS_ORIGIN=https://yourdomain.com
```

### Step 5: PM2 Configuration

Create `/var/www/chereka-support/backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'chereka-support-backend',
    script: 'server.js',
    cwd: '/var/www/chereka-support/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_file: '.env.production',
    error_file: '/var/log/chereka-support/error.log',
    out_file: '/var/log/chereka-support/out.log',
    log_file: '/var/log/chereka-support/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### Step 6: Nginx Configuration

Create `/etc/nginx/sites-available/chereka-support`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (will be added by Certbot)
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Frontend (React build)
    location / {
        root /var/www/chereka-support/frontend/chereka-support-frontend/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # File uploads
    location /uploads/ {
        root /var/www/chereka-support/backend;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Security: Block access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log|config)$ {
        deny all;
    }
}
```

### Step 7: SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Step 8: Start Services

```bash
# Create log directory
sudo mkdir -p /var/log/chereka-support
sudo chown $USER:$USER /var/log/chereka-support

# Seed database
cd /var/www/chereka-support/backend
NODE_ENV=production npm run seed

# Start application with PM2
pm2 start ecosystem.config.js

# Enable Nginx site
sudo ln -s /etc/nginx/sites-available/chereka-support /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Save PM2 configuration
pm2 save
pm2 startup

# Enable services to start on boot
sudo systemctl enable nginx
sudo systemctl enable postgresql
```

## 🐳 Docker Deployment

### Prerequisites

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Docker Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: chereka_support
      POSTGRES_USER: chereka_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      REDIS_URL: redis://redis:6379
    env_file:
      - ./backend/.env.production
    volumes:
      - ./backend/uploads:/app/uploads
    ports:
      - "5000:5000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend/chereka-support-frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

CMD ["node", "server.js"]
```

Create `frontend/chereka-support-frontend/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

### Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale backend service
docker-compose up -d --scale backend=3

# Update services
docker-compose pull
docker-compose up -d --force-recreate
```

## ☁️ Cloud Platform Deployment

### Heroku Deployment

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create applications
heroku create chereka-support-backend
heroku create chereka-support-frontend

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev --app chereka-support-backend

# Set environment variables
heroku config:set NODE_ENV=production --app chereka-support-backend
heroku config:set JWT_SECRET=your_jwt_secret --app chereka-support-backend

# Deploy backend
git subtree push --prefix backend heroku main

# Deploy frontend
cd frontend/chereka-support-frontend
heroku create chereka-support-frontend
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a chereka-support-frontend
git push heroku main
```

### Vercel Deployment (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend/chereka-support-frontend
vercel --prod
```

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

## 📊 Monitoring and Maintenance

### Health Monitoring

```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-server-monit

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### Backup Strategy

```bash
#!/bin/bash
# backup.sh - Database backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/chereka-support"
DB_NAME="chereka_support_prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/db_backup_$DATE.sql.gz"
```

### Performance Optimization

```bash
# Enable Redis for session storage
sudo apt install redis-server -y

# Configure PostgreSQL for production
sudo nano /etc/postgresql/14/main/postgresql.conf
# Add:
# shared_buffers = 256MB
# effective_cache_size = 1GB
# maintenance_work_mem = 64MB
# checkpoint_completion_target = 0.9
# wal_buffers = 16MB
# default_statistics_target = 100

# Restart services
sudo systemctl restart postgresql
sudo systemctl restart redis-server
```

### Security Hardening

```bash
# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Install fail2ban
sudo apt install fail2ban -y

# Configure automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure unattended-upgrades
```

## 🔧 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U chereka_user -d chereka_support_prod

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

**Application Won't Start**
```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs chereka-support-backend

# Restart application
pm2 restart chereka-support-backend
```

**Nginx Issues**
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

**SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Performance Issues

**High Memory Usage**
```bash
# Monitor memory usage
htop

# Restart PM2 with memory limit
pm2 restart chereka-support-backend --max-memory-restart 1G
```

**Database Performance**
```bash
# Check slow queries
sudo -u postgres psql chereka_support_prod -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Analyze table sizes
sudo -u postgres psql chereka_support_prod -c "\dt+"
```

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or HAProxy
2. **Database Replication**: Master-slave PostgreSQL setup
3. **Redis Cluster**: For session storage and caching
4. **CDN**: For static asset delivery
5. **Microservices**: Split into smaller services

### Vertical Scaling

1. **Increase server resources**
2. **Optimize database queries**
3. **Implement caching strategies**
4. **Use connection pooling**
5. **Enable compression**

---

This deployment guide provides comprehensive instructions for various deployment scenarios. Choose the option that best fits your requirements and infrastructure capabilities.

