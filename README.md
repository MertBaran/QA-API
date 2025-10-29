# Question & Answers Platform API

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 7+
- Elasticsearch 8+ (optional, for full-text search and log aggregation)
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

# Setup notification templates
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

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE=notifications

# Elasticsearch
ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=elasticpassword

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
    "search": { "status": "connected", "responseTime": 10 },
    "queue": { "status": "connected", "responseTime": 10 },
    "email": { "status": "connected", "responseTime": 25 }
  }
}
```

## 🐳 Docker & Deployment

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
      - elasticsearch
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

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    ports:
      - '9200:9200'
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=true
      - ELASTIC_PASSWORD=elasticpassword
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  rabbitmq:
    image: rabbitmq:3.9-management
    ports:
      - '5672:5672'
      - '15672:15672'
```

### Code Structure

```
QA-API/
├── controllers/          # Request handlers
├── services/            # Business logic
│   ├── managers/        # Business managers
│   ├── providers/       # External service providers
│   └── monitoring/      # Monitoring services
├── repositories/        # Data access layer
├── models/              # Data models
├── middlewares/         # Express middlewares
├── infrastructure/      # External services
│   ├── cache/          # Cache providers
│   ├── validation/     # Validation schemas
│   ├── logging/        # Logging providers
│   └── audit/          # Audit providers
├── tests/               # Test suites
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── mocks/          # Test mocks
├── scripts/             # Utility scripts
└── types/               # TypeScript types
```

## Tech Stack

- **Backend**: TypeScript, Node.js, Express
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Search**: Elasticsearch
- **Message Queue**: RabbitMQ
- **Testing**: Jest
- **Containerization**: Docker
- **Real-time**: WebSocket

<div align="center">

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Elasticsearch](https://img.shields.io/badge/-Elasticsearch-005571?style=for-the-badge&logo=elasticsearch)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-000000?style=for-the-badge&logo=websocket&logoColor=white)

</div>

</div>
