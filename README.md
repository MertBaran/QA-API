# 🚀 QA Platform API

<div align="center">

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

**Enterprise-grade Q&A platform API with AI-powered development and smart notification system**

</div>

---

## 🤖 AI-Powered Development

- Auto test generation ve optimization
- AI-assisted code review ve refactoring
- Intelligent architecture decisions
- Smart notification strategy selection

**94/94 Unit Tests** ✅ | **Multi-language i18n** 🌍 | **Redis Caching** ⚡ | **Smart Notifications** 📧

## ✨ Core Features

### 🔐 Authentication & Authorization

- **JWT Authentication** with refresh tokens
- **Google OAuth2** integration
- **Role-based access control** (User, Admin)
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

### 📧 Smart Notification System

- **Multi-channel notifications** (Email, SMS, Push, Webhook)
- **Template-based messaging** with variable replacement
- **Smart hybrid strategy** (Direct vs Queue-based)
- **Multi-language templates** (EN, TR, DE)
- **RabbitMQ integration** for async processing
- **Notification history** and tracking
- **Dynamic strategy selection** based on load and priority

### 🚀 Performance & Scalability

- **Redis caching** for improved performance
- **Load balancing** ready
- **Horizontal scaling** support
- **Performance monitoring** with metrics
- **Rate limiting** and throttling

### 🛡️ Security & Monitoring

- **Audit logging** for all operations
- **Input validation** with Zod schemas
- **Error handling** with custom error types
- **Request/Response logging**
- **Health check endpoints**

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
- **Mongoose** for schema management

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
POST   /auth/register              # User registration
POST   /auth/login                 # User login
POST   /auth/loginGoogle           # Google OAuth login
POST   /auth/logout                # User logout
POST   /auth/forgot-password       # Password reset request
POST   /auth/reset-password        # Password reset
GET    /auth/profile               # Get user profile
PUT    /auth/profile               # Edit user profile
```

### ❓ Questions

```
GET    /questions                  # List questions
POST   /questions                  # Create question
GET    /questions/:id              # Get question details
PUT    /questions/:id              # Update question
DELETE /questions/:id              # Delete question
POST   /questions/:id/like         # Like/unlike question
```

### 💬 Answers

```
GET    /questions/:id/answers      # Get question answers
POST   /questions/:id/answers      # Add answer
PUT    /answers/:id                # Update answer
DELETE /answers/:id                # Delete answer
POST   /answers/:id/like           # Like/unlike answer
```

### 📧 Notifications

```
POST   /notifications/send         # Send notification
POST   /notifications/template     # Send template notification
GET    /notifications/history      # Get notification history
GET    /notifications/templates    # List available templates
```

### 👥 User Management

```
GET    /users                      # List users (Admin)
GET    /users/:id                  # Get user details
PUT    /users/:id                  # Update user (Admin)
DELETE /users/:id                  # Delete user (Admin)
```

### 🏥 Health & Monitoring

```
GET    /health                     # Health check
GET    /metrics                    # System metrics
GET    /logs                       # Application logs
```

## 🧪 Testing

```bash
# Unit tests
npm test                          # Run all unit tests
npm run test:watch                # Watch mode
npm run test:coverage             # Coverage report

# Integration tests
npm run test:integration          # Integration tests

# Performance tests
npm run test:performance          # k6 performance tests
npm run test:load                 # Load testing
npm run test:stress               # Stress testing

# E2E tests
npm run test:e2e                  # End-to-end tests
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

# Logging
LOG_LEVEL=info                     # error, warn, info, debug
LOG_FORMAT=json                    # json, simple

# Performance
CACHE_TTL=3600                     # Cache TTL in seconds
RATE_LIMIT_WINDOW=900000           # Rate limit window (15 min)
RATE_LIMIT_MAX=100                 # Max requests per window
```

### Notification Configuration

```typescript
// Notification strategy selection
NOTIFICATION_STRATEGY = smart; // Automatically chooses best strategy

// Available channels
((NOTIFICATION_CHANNELS = email), sms, push, webhook);

// Template language
NOTIFICATION_TEMPLATE_LANG = en; // Default template language
```

## 📊 Performance Metrics

- ✅ **<200ms** average response time
- ✅ **300 RPS** capacity under load
- ✅ **<1%** error rate
- ✅ **Multi-language** caching
- ✅ **Smart notification** strategy selection
- ✅ **Queue-based** async processing

## 🐳 Docker & Deployment

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - '3000:3000'
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
├── repositories/        # Data access layer
├── models/              # Data models
├── middlewares/         # Express middlewares
├── infrastructure/      # External services
├── tests/               # Test suites
├── scripts/             # Utility scripts
└── types/               # TypeScript types
```

### Key Patterns

- **Dependency Injection** with tsyringe
- **Repository Pattern** for data access
- **Service Layer** for business logic
- **Middleware Pattern** for cross-cutting concerns
- **Strategy Pattern** for notification selection

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

_Enterprise-grade architecture • Comprehensive testing • Smart notifications • Modern practices_

[![GitHub stars](https://img.shields.io/github/stars/MertBaran/QA-API?style=social)](https://github.com/MertBaran/QA-API)
[![GitHub forks](https://img.shields.io/github/forks/MertBaran/QA-API?style=social)](https://github.com/MertBaran/QA-API)

</div>
