# 🚀 QA Platform API

<div align="center">

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-000000?style=for-the-badge&logo=websocket&logoColor=white)

**Enterprise-grade Q&A platform API with AI-powered development, real-time monitoring, and smart notification system**

</div>

---

## 🤖 AI-Powered Development

- Auto test generation ve optimization
- AI-assisted code review ve refactoring
- Intelligent architecture decisions
- Smart notification strategy selection

**232+ Tests** ✅ | **Multi-language i18n** 🌍 | **Redis Caching** ⚡ | **Smart Notifications** 📧 | **Real-time Monitoring** 📊 | **Permission Management** 🔐

## ✨ Core Features

### 🔐 Authentication & Authorization

- **JWT Authentication** with refresh tokens
- **Google OAuth2** integration
- **Role-based access control** (User, Moderator, Admin)
- **Permission-based authorization** with granular control
- **Password reset** with template-based emails
- **Profile management** with edit capabilities

### ❓ Q&A System

- **Question creation** with rich text support
- **Answer management** with voting system
- **Like/Unlike** functionality for questions and answers
- **Search and filtering** capabilities
- **Category-based organization**

### 🌐 Internationalization (i18n)

- **Multi-language support** (EN, TR, DE)
- **Dynamic language switching**
- **Localized error messages**
- **Template-based content localization**
- **Redis-based caching** for translations

### 📧 Smart Notification System

- **Multi-channel notifications** (Email, SMS, Push, Webhook)
- **Template-based messaging** with variable replacement
- **Smart hybrid strategy** (Direct vs Queue-based)
- **Multi-language templates** (EN, TR, DE)
- **RabbitMQ integration** for async processing
- **Notification history** and tracking
- **Dynamic strategy selection** based on load and priority

### 📊 Real-time Monitoring & Health Checks

- **Hybrid health check system** (Quick & Full)
- **WebSocket-based real-time monitoring**
- **Connection status monitoring** (Database, Cache, Queue, Email)
- **Automatic alert notifications** on service failures
- **Monitoring statistics** and metrics
- **Alert history** with configurable limits
- **Service dependency tracking**

### 🚀 Performance & Scalability

- **Redis caching** for improved performance
- **Load balancing** ready
- **Horizontal scaling** support
- **Performance monitoring** with metrics
- **Rate limiting** and throttling
- **Connection pooling** optimization

### 🛡️ Security & Monitoring

- **Audit logging** for all operations
- **Input validation** with Zod schemas
- **Error handling** with custom error types
- **Request/Response logging**
- **Health check endpoints**
- **Security middleware** stack

## 🏗️ Architecture

### 📦 Dependency Injection

- **tsyringe** container for DI
- **Interface-based tokens** for loose coupling
- **Service layer** abstraction
- **Repository pattern** implementation

### 🗄️ Data Layer

- **MongoDB** as primary database
- **MongoDB Adapter** for database abstraction
- **Repository pattern** for data access
- **Service layer** for business logic abstraction
- **Mongoose** for schema management

### 📡 Real-time Monitoring Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   Connection     │    │   Alert         │
│   Server        │───▶│   Monitor        │───▶│   System        │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Real-time     │    │   Service        │    │   Notification  │
│   Updates       │    │   Health Check   │    │   Manager       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 🔄 Notification Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Smart         │    │   Multi-Channel  │    │   Template      │
│ Notification    │───▶│   Manager        │───▶│   System        │
│ Manager         │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Strategy      │    │   Channel        │    │   Multi-Lang    │
│   Selection     │    │   Handlers       │    │   Templates     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

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

## 📚 API Endpoints

### 🔐 Authentication

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

### ❓ Questions

```
GET    /api/questions                  # List questions
POST   /api/questions/ask              # Create question
GET    /api/questions/:id              # Get question details
PUT    /api/questions/:id/edit         # Update question
DELETE /api/questions/:id/delete       # Delete question
GET    /api/questions/:id/like         # Like question
GET    /api/questions/:id/undo_like    # Unlike question
```

### 💬 Answers

```
POST   /api/answers/:questionId/answer # Add answer to question
GET    /api/answers/:id                # Get answer details
PUT    /api/answers/:id/edit           # Update answer
DELETE /api/answers/:id/delete         # Delete answer
GET    /api/answers/:id/like           # Like answer
GET    /api/answers/:id/undo_like      # Unlike answer
```

### 📧 Notifications

```
POST   /api/notifications/send         # Send notification
POST   /api/notifications/template     # Send template notification
GET    /api/notifications/history      # Get notification history
GET    /api/notifications/templates    # List available templates
GET    /api/notifications/queue-status # Get queue status
```

### 👥 User Management

```
GET    /api/users                      # List users (Admin)
GET    /api/users/:id                  # Get user details
PUT    /api/users/:id                  # Update user (Admin)
DELETE /api/users/:id                  # Delete user (Admin)
```

### 🔐 Permission Management

```
GET    /api/permissions/roles          # List all roles
GET    /api/permissions/users/:userId/roles    # Get user roles
POST   /api/permissions/users/:userId/roles    # Assign role to user
DELETE /api/permissions/users/:userId/roles/:roleId  # Remove role from user
POST   /api/permissions/roles/:roleId/permissions    # Add permissions to role
DELETE /api/permissions/roles/:roleId/permissions    # Remove permissions from role
```

### 🏥 Health & Monitoring

```
GET    /health                         # Full health check
GET    /health/quick                   # Quick health check
GET    /api/monitoring/connections     # Connection status
GET    /api/monitoring/alerts          # Alert history
GET    /api/monitoring/stats           # Monitoring statistics
POST   /api/monitoring/start           # Start monitoring
POST   /api/monitoring/stop            # Stop monitoring
```

### 🔌 WebSocket Endpoints

```
WS     /ws/monitoring                  # Real-time monitoring updates
```

## 🧪 Testing

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

## 🔧 Configuration

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

## 📊 Performance Metrics

- ✅ **<200ms** average response time
- ✅ **300 RPS** capacity under load
- ✅ **<1%** error rate
- ✅ **Multi-language** caching
- ✅ **Smart notification** strategy selection
- ✅ **Queue-based** async processing
- ✅ **Real-time monitoring** with WebSocket
- ✅ **Hybrid health checks** for optimal performance

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

### Kubernetes

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/
```

## 🔄 CI/CD Pipeline

### Jenkins Pipeline

- **Automated testing** on every commit
- **Docker image** building
- **Deployment** to staging/production
- **Performance testing** integration

### GitHub Actions

- **Code quality** checks
- **Security scanning**
- **Automated releases**

## 🛠️ Development

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

### Key Patterns

- **Dependency Injection** with tsyringe
- **Repository Pattern** for data access
- **Service Layer** for business logic abstraction
- **DTO Pattern** for request/response type safety
- **Middleware Pattern** for cross-cutting concerns
- **Strategy Pattern** for notification selection
- **Observer Pattern** for real-time monitoring
- **Factory Pattern** for service creation

## 🔍 Monitoring & Observability

### Health Checks

- **Quick Health Check**: Basic service availability
- **Full Health Check**: Detailed service information with response times
- **Service-specific checks**: Database, Cache, Queue, Email connectivity

### Real-time Monitoring

- **WebSocket-based** real-time updates
- **Connection status** monitoring
- **Automatic alerts** on service failures
- **Monitoring statistics** and metrics
- **Alert history** with configurable limits

### Metrics & Logging

- **Request/Response logging**
- **Performance metrics**
- **Error tracking**
- **Audit logging**
- **Custom metrics** collection

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ using AI-powered development**

_Enterprise-grade architecture • Comprehensive testing • Smart notifications • Real-time monitoring • Modern practices_

[![GitHub stars](https://img.shields.io/github/stars/MertBaran/QA-API?style=social)](https://github.com/MertBaran/QA-API)
[![GitHub forks](https://img.shields.io/github/forks/MertBaran/QA-API?style=social)](https://github.com/MertBaran/QA-API)

</div>
