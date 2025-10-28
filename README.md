# Question & Answers Platform API

A comprehensive REST API for a question and answer platform built with TypeScript, Node.js, and MongoDB.

## Tech Stack

- **Backend**: TypeScript, Node.js, Express
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Message Queue**: RabbitMQ (optional)
- **Testing**: Jest
- **Containerization**: Docker
- **Real-time**: WebSocket

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 7+
- RabbitMQ 3.9+ (optional, for queue-based notifications)

### Installation

```bash
# Clone repository
git clone <repo-url> && cd QA-API

# Install dependencies
npm install

# Environment setup
cp config/env/config.env.example config/env/config.env
# Edit config.env with your settings

# Setup notification templates (optional)
npm run setup:templates

# Start development server
npm run dev
```

### Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t qa-api .
docker run -p 3000:3000 --env-file config/env/config.env qa-api
```

## API Endpoints

### Authentication

```
POST   /api/auth/register              # User registration
POST   /api/auth/login                 # User login
POST   /api/auth/loginGoogle           # Google OAuth login
GET    /api/auth/logout                # User logout
POST   /api/auth/forgotpassword        # Password reset request
PUT    /api/auth/resetpassword         # Password reset
GET    /api/auth/profile               # Get user profile
PUT    /api/auth/edit                  # Edit user profile
```

### Questions

```
GET    /api/questions                  # List questions
POST   /api/questions/ask              # Create question
GET    /api/questions/:id              # Get question details
PUT    /api/questions/:id/edit         # Update question
DELETE /api/questions/:id/delete       # Delete question
GET    /api/questions/:id/like         # Like question
GET    /api/questions/:id/undo_like    # Unlike question
```

### Answers

```
POST   /api/answers/:questionId/answer # Add answer to question
GET    /api/answers/:id                # Get answer details
PUT    /api/answers/:id/edit           # Update answer
DELETE /api/answers/:id/delete         # Delete answer
GET    /api/answers/:id/like           # Like answer
GET    /api/answers/:id/undo_like      # Unlike answer
```

### Notifications

```
POST   /api/notifications/send         # Send notification
POST   /api/notifications/template     # Send template notification
GET    /api/notifications/history      # Get notification history
GET    /api/notifications/templates    # List available templates
GET    /api/notifications/queue-status # Get queue status
```

### User Management

```
GET    /api/users                      # List users (Admin)
GET    /api/users/:id                  # Get user details
PUT    /api/users/:id                  # Update user (Admin)
DELETE /api/users/:id                  # Delete user (Admin)
```

### Permission Management

```
GET    /api/permissions/roles          # List all roles
GET    /api/permissions/users/:userId/roles    # Get user roles
POST   /api/permissions/users/:userId/roles    # Assign role to user
DELETE /api/permissions/users/:userId/roles/:roleId  # Remove role from user
POST   /api/permissions/roles/:roleId/permissions    # Add permissions to role
DELETE /api/permissions/roles/:roleId/permissions    # Remove permissions from role
```

### Health & Monitoring

```
GET    /health                         # Full health check
GET    /health/quick                   # Quick health check
GET    /api/monitoring/connections     # Connection status
GET    /api/monitoring/alerts          # Alert history
GET    /api/monitoring/stats           # Monitoring statistics
POST   /api/monitoring/start           # Start monitoring
POST   /api/monitoring/stop            # Stop monitoring
```

### WebSocket Endpoints

```
WS     /ws/monitoring                  # Real-time monitoring updates
```

## Testing

```bash
# All tests (excluding API tests)
npm test                              # Run all tests
npm run test:watch                    # Watch mode
npm run test:coverage                 # Coverage report

# Specific test suites
npm run test:unit                     # Unit tests only
npm run test:integration              # Integration tests only
npm run test:websocket                # WebSocket tests

# Performance tests
npm run test:performance              # k6 performance tests
npm run test:load                     # Load testing
npm run test:stress                   # Stress testing

# Test utilities
npm run test:setup                    # Setup test environment
npm run test:clean                    # Clean test data
```

## Configuration

### Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/qa-platform
MONGO_TEST_URI=mongodb://localhost:27017/qa-platform-test

# Redis
REDIS_URL=redis://localhost:6379
REDIS_TEST_URL=redis://localhost:6379

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key
JWT_REFRESH_SECRET_KEY=your-super-secret-refresh-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# RabbitMQ (Optional)
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE=notifications

# Notification Settings
NOTIFICATION_STRATEGY=smart        # direct, queue, smart
NOTIFICATION_CHANNELS=email,sms    # email,sms,push,webhook
NOTIFICATION_TEMPLATE_LANG=en      # en,tr,de

# Monitoring Settings
MONITORING_ENABLED=true            # Enable monitoring
MONITORING_INTERVAL=30000          # Check interval (30s)
MONITORING_ALERT_LIMIT=50          # Max alerts to store
WEBSOCKET_PORT=3001                # WebSocket server port

# Logging
LOG_LEVEL=info                     # error, warn, info, debug
LOG_FORMAT=json                    # json, simple

# Performance
CACHE_TTL=3600                     # Cache TTL in seconds
RATE_LIMIT_WINDOW=900000           # Rate limit window (15 min)
RATE_LIMIT_MAX=100                 # Max requests per window
```

### Health Check Configuration

```typescript
// Health check types
GET /health/quick    // Fast check - basic service status
GET /health          // Full check - detailed service information

// Health check response format
{
  "status": "healthy" | "unhealthy" | "starting",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": { "status": "connected", "responseTime": 15 },
    "cache": { "status": "connected", "responseTime": 5 },
    "queue": { "status": "connected", "responseTime": 10 },
    "email": { "status": "connected", "responseTime": 25 }
  }
}
```

## Docker & Deployment

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - '3000:3000'
      - '3001:3001' # WebSocket port
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb
      - redis
      - rabbitmq

  mongodb:
    image: mongo:6
    ports:
      - '27017:27017'
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  rabbitmq:
    image: rabbitmq:3.9-management
    ports:
      - '5672:5672'
      - '15672:15672'
```

### Code Structure

```
QA-API/
├── APP.ts                    # Application entry point
├── config/                   # Configuration files
│   ├── env/                 # Environment configurations
│   └── smtpConfig.ts        # SMTP configuration
├── constants/                # Application constants
├── controllers/              # Request handlers
│   └── constants/           # Controller message constants
├── database/                 # Database management
│   ├── factories/           # Database strategy factories
│   ├── interfaces/          # Database interfaces
│   ├── migrations/          # Database migrations
│   ├── seeders/             # Database seeders
│   ├── seeds/               # Seed data
│   └── strategies/          # Database strategies
├── infrastructure/          # External services
│   ├── audit/               # Audit providers
│   ├── auth/                # Authentication providers
│   ├── cache/               # Cache providers
│   ├── error/               # Error handling
│   ├── i18n/                # Internationalization
│   ├── logging/             # Logging providers
│   ├── metrics/             # Metrics collection
│   └── validation/          # Validation schemas
├── middlewares/             # Express middlewares
│   ├── audit/               # Audit middleware
│   ├── authorization/       # Authorization middleware
│   ├── database/            # Database middleware
│   ├── errors/              # Error middleware
│   ├── i18n/                # i18n middleware
│   └── libraries/            # Library middleware
├── models/                   # Data models
│   ├── interfaces/          # Model interfaces
│   ├── mongodb/             # MongoDB models
│   └── postgresql/          # PostgreSQL models
├── performance/             # Performance testing
├── public/                   # Static files
├── repositories/             # Data access layer
│   ├── adapters/            # Database adapters
│   ├── base/                # Base repository
│   ├── interfaces/          # Repository interfaces
│   └── mongodb/             # MongoDB repositories
├── routers/                  # Route definitions
├── scripts/                  # Utility scripts
│   ├── maintenance/         # Maintenance scripts
│   └── setup/               # Setup scripts
├── services/                 # Business logic
│   ├── contracts/           # Service contracts
│   ├── managers/            # Business managers
│   ├── notification/        # Notification services
│   └── providers/           # Service providers
├── tests/                    # Test suites
│   ├── api/                 # API tests
│   ├── integration/         # Integration tests
│   ├── mocks/               # Test mocks
│   ├── unit/                # Unit tests
│   └── utils/               # Test utilities
└── types/                    # TypeScript types
    └── dto/                 # Data Transfer Objects
```
