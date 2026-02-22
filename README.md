# Question & Answers Platform API

### Prerequisites

- Node.js 18+
- Database: **PostgreSQL 15+** veya **MongoDB 6+**
- Redis 7+
- Elasticsearch 8+ (opsiyonel)
- RabbitMQ 3.9+ (opsiyonel)
- Cloudflare R2 veya S3-uyumlu object storage (opsiyonel)

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
npm run dev              # MongoDB ile
npm run dev:postgres     # PostgreSQL ile
```

### Docker Setup

```bash
# 1) .env oluştur (şifreler için - zorunlu)
cp .env.example .env
# .env içinde POSTGRES_PASSWORD ve RABBITMQ_PASS değerlerini güncelleyin

# 2) PostgreSQL stack ile çalıştır (migration + seed otomatik)
docker-compose up -d

# Manuel build
docker build -t qa-api .
docker run -p 3000:3000 --env-file config/env/config.env.docker qa-api
```

Docker Compose: PostgreSQL, Redis, Elasticsearch, RabbitMQ ve API servisini başlatır. İlk çalıştırmada Prisma migration ve seed otomatik uygulanır. Şifreler `.env` dosyasından okunur (`.env.example` şablonu).

## API Endpoints

**Looking for a Postman collection?** Find it in the [`postman/`](./postman/) directory.

```bash
# Import the collection into Postman
postman/QA-API.postman_collection.json
```

The collection includes all API endpoints, request examples, and automatic token management. Just update the `baseUrl` variable if needed.

### Authentication

```
POST   /api/auth/register                   # User registration
POST   /api/auth/login                      # User login (auto-saves token)
POST   /api/auth/loginGoogle                # Google OAuth login
POST   /api/auth/registerGoogle             # Google OAuth registration
GET    /api/auth/logout                     # User logout
POST   /api/auth/forgotpassword             # Password reset request
PUT    /api/auth/resetpassword              # Password reset
GET    /api/auth/profile                    # Get user profile
PUT    /api/auth/edit                       # Edit user profile
POST   /api/auth/upload                     # Upload profile image
PUT    /api/auth/background                 # Update profile background
PUT    /api/auth/profile-image              # Update profile image
POST   /api/auth/change-password/request    # Request password change
POST   /api/auth/change-password/verify     # Verify password change code
POST   /api/auth/change-password/confirm    # Confirm password change
GET    /api/auth/check-admin-permissions    # Check admin permissions
```

### Questions

```
GET    /api/questions                        # List all questions
GET    /api/questions/search                 # Search questions
GET    /api/questions/paginated              # Get paginated questions (with filters, search, sort)
GET    /api/questions/paginated/with-parents # Get paginated questions with parent information
GET    /api/questions/:id                    # Get question details
GET    /api/questions/user/:userId           # Get questions by user
GET    /api/questions/parent/:id             # Get questions related to a parent content
POST   /api/questions/ask                    # Create question (supports optional parent & thumbnailKey)
PUT    /api/questions/:id/edit               # Update question (title/content/thumbnailKey/removeThumbnail)
DELETE /api/questions/:id/delete             # Delete question
GET    /api/questions/:id/like               # Like question
GET    /api/questions/:id/undo_like          # Unlike question
GET    /api/questions/:id/dislike            # Dislike question
GET    /api/questions/:id/undo_dislike       # Undo dislike question
```

### Content Assets

```
POST   /api/content-assets/presigned-upload   # Generate presigned upload URL (auth required)
POST   /api/content-assets/resolve-url        # Resolve asset URL (auth required)
DELETE /api/content-assets                    # Delete asset (auth required)
```

Payloads accept `type`, `filename`, optional `ownerId`, `entityId`, and visibility flags. By default the authenticated user becomes the asset owner.

### Answers

```
GET    /api/questions/:question_id/answers                      # Get all answers for a question
GET    /api/questions/:question_id/answers/:answer_id           # Get specific answer
GET    /api/questions/:question_id/answers/:answer_id/page      # Get page number of answer in paginated list
POST   /api/questions/:question_id/answers                      # Add answer to question
PUT    /api/questions/:question_id/answers/:answer_id/edit      # Update answer
DELETE /api/questions/:question_id/answers/:answer_id/delete    # Delete answer
GET    /api/questions/:question_id/answers/:answer_id/like      # Like answer
GET    /api/questions/:question_id/answers/:answer_id/undo_like # Unlike answer
GET    /api/questions/:question_id/answers/:answer_id/dislike   # Dislike answer
GET    /api/questions/:question_id/answers/:answer_id/undo_dislike # Undo dislike answer
GET    /api/answers/search                                      # Search answers
GET    /api/answers/:id                                         # Get answer by ID (standalone)
GET    /api/answers/user/:userId                                # Get answers by user
```

### Notifications (Admin Only)

```
POST   /api/notifications/user/:userId              # Send notification to user
POST   /api/notifications/channels                  # Send notification to specific channels
GET    /api/notifications/user/:userId              # Get user notifications
GET    /api/notifications/preferences/:userId       # Get user notification preferences
PUT    /api/notifications/preferences/:userId       # Update user notification preferences
POST   /api/notifications/test/:userId              # Send test notification (all channels)
GET    /api/notifications/debug/:userId             # Debug notifications
GET    /api/notifications/queue/status              # Get queue status
GET    /api/notifications/stats                     # Get notification statistics
```

### Bookmarks

```
POST   /api/bookmarks/add                                    # Add bookmark
DELETE /api/bookmarks/remove/:id                             # Remove bookmark
PUT    /api/bookmarks/:id                                    # Update bookmark
GET    /api/bookmarks/user                                   # Get user bookmarks
GET    /api/bookmarks/check/:targetType/:targetId            # Check if bookmark exists
GET    /api/bookmarks/search                                 # Search bookmarks
GET    /api/bookmarks/paginated                              # Get paginated bookmarks
POST   /api/bookmarks/collections                            # Create collection
GET    /api/bookmarks/collections                            # Get user collections
PUT    /api/bookmarks/collections/:id                        # Update collection
DELETE /api/bookmarks/collections/:id                        # Delete collection
POST   /api/bookmarks/collections/:collectionId/items/:bookmarkId   # Add to collection
DELETE /api/bookmarks/collections/:collectionId/items/:bookmarkId  # Remove from collection
GET    /api/bookmarks/collections/:id/items                  # Get collection items
GET    /api/bookmarks/stats                                  # Get bookmark statistics
```

### Users

```
GET    /api/public/users/:id           # Get public user profile (no auth required, optional auth for isFollowing)
POST   /api/public/users/:id/follow    # Follow user (auth required)
POST   /api/public/users/:id/unfollow  # Unfollow user (auth required)
GET    /api/public/users/:id/followers # Get user followers (public)
GET    /api/public/users/:id/following # Get user following (public)
GET    /api/users                      # List all users (Admin only)
GET    /api/users/:id                  # Get user details (Admin only)
```

### Admin Operations

```
GET    /api/admin/users                           # List all users (Admin only)
PUT    /api/admin/users/:userId                   # Update user (Admin only)
DELETE /api/admin/users/:userId                   # Delete user (Admin only)
PATCH  /api/admin/users/:userId/block             # Toggle user block status (Admin only)
PATCH  /api/admin/users/:userId/roles             # Update user roles (Admin only)
GET    /api/admin/users/stats                     # Get user statistics (Admin only)
```

### Permission Management (Admin Only)

```
GET    /api/permissions/roles                     # List all roles
POST   /api/permissions/assign-role               # Assign role to user
DELETE /api/permissions/remove-role               # Remove role from user
GET    /api/permissions/user-roles/:userId        # Get user roles
GET    /api/permissions/permissions               # List all permissions
POST   /api/permissions/role-permissions          # Add permissions to role
DELETE /api/permissions/role-permissions          # Remove permissions from role
GET    /api/permissions/user-permissions/:userId  # Get user permissions
```

### Health & Monitoring

```
GET    /health                         # Full health check (no auth)
GET    /health/quick                   # Quick health check (no auth)
GET    /api/monitoring/connections     # Connection status (Admin only)
GET    /api/monitoring/alerts          # Alert history (Admin only)
GET    /api/monitoring/stats           # Monitoring statistics (Admin only)
POST   /api/monitoring/start           # Start monitoring (Admin only)
POST   /api/monitoring/stop            # Stop monitoring (Admin only)
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

# Object Storage
OBJECT_STORAGE_PROVIDER=cloudflare-r2
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=your-r2-bucket-name
R2_ENDPOINT=https://r2.cloudflarestorage.com
# Optional public CDN/base URL for direct access
R2_PUBLIC_BASE_URL=https://<your-public-domain>

# Database (MongoDB varsayılan; PostgreSQL için DATABASE_TYPE=postgresql)
DATABASE_TYPE=mongodb
MONGO_URI=mongodb://localhost:27017/qa-platform

# PostgreSQL için:
# DATABASE_TYPE=postgresql
# DATABASE_URL=postgresql://user:pass@localhost:5432/qa_platform

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

### Project Structure

```
QA-API/
├── config/                         # Configuration files
│   └── env/                       # Environment configurations
├── constants/                      # Application constants
├── controllers/                    # Request handlers
├── services/                       # Business logic
│   ├── managers/                  # Business managers
│   └── contracts/                 # Service contracts/interfaces
├── repositories/                   # Data access layer
│   ├── interfaces/                # Repository interfaces
│   └── mongodb/                   # MongoDB implementations
├── models/                         # Data models
│   └── mongodb/                   # MongoDB models
├── middlewares/                    # Express middlewares
│   ├── authorization/             # Authorization middleware
│   └── errors/                    # Error handling
├── infrastructure/                 # External services & infrastructure
│   ├── cache/                     # Cache providers
│   ├── elasticsearch/             # Elasticsearch integration
│   ├── search/                    # Search & Index (abstraction of elastic)
│   ├── logging/                   # Logging providers
│   └── validation/                # Validation schemas
├── database/                       # Database utilities
│   ├── migrations/                # Database migrations
│   └── seeds/                     # Seed data
├── routers/                        # API route definitions
├── types/                          # TypeScript type definitions
│   └── dto/                       # Data Transfer Objects
├── tests/                          # Test suites
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   └── mocks/                     # Test mocks
├── scripts/                        # Utility scripts
├── performance/                    # Performance testing
├── k8s/                            # Kubernetes configurations
└── public/                         # Public assets
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
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Elasticsearch](https://img.shields.io/badge/-Elasticsearch-005571?style=for-the-badge&logo=elasticsearch)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-000000?style=for-the-badge&logo=websocket&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare%20R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

</div>
