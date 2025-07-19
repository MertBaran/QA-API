# 🚀 QA Platform API

<div align="center">

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)

**Enterprise-grade Q&A platform API built with AI-powered development**

</div>

---

## 🤖 AI-Powered Development

- Auto test generation ve optimization
- AI-assisted code review ve refactoring
- Intelligent architecture decisions

**94/94 Unit Tests** ✅ | **Multi-language i18n** 🌍 | **Redis Caching** ⚡

## ✨ Features

- 🔐 **JWT Auth** + Google OAuth2
- 👥 **User Management** + Role-based access
- ❓ **Q&A System** with voting
- 🌐 **i18n Support** (EN/TR/DE)
- 📊 **Performance Testing** (k6)
- 🐳 **Docker Ready**

## 🚀 Quick Start

```bash
# Setup
git clone <repo-url> && cd QA-API
npm install

# Configure
cp config/env/config.env.example config/env/config.env
# Edit config.env with your settings

# Run
npm run dev
```

## 📚 API Endpoints

### Auth

- `POST /auth/register` - Register
- `POST /auth/login` - Login
- `POST /auth/loginGoogle` - Google OAuth

### Questions

- `GET /questions` - List questions
- `POST /questions` - Create question
- `POST /questions/:id/like` - Like question

### Answers

- `POST /questions/:id/answers` - Add answer
- `POST /answers/:id/like` - Like answer

## 🧪 Testing

```bash
npm test                    # Unit tests (94/94 ✅)
npm run test:integration    # Integration tests
npm run test:performance    # k6 performance tests
```

## 🐳 Docker

```bash
docker build -t qa-api .
docker run -p 3000:3000 --env-file config/env/config.env qa-api
```

## 🏗️ Tech Stack

**Backend:** Node.js + TypeScript + Express  
**Database:** MongoDB + Redis  
**Auth:** JWT + Google OAuth2  
**Testing:** Jest + k6  
**DevOps:** Docker + Jenkins

## 🔧 Environment

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/qa-platform
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
```

## 📊 Performance

- ✅ **<200ms** avg response time
- ✅ **300 RPS** capacity
- ✅ **<1%** error rate
- ✅ **Multi-language** caching

---

<div align="center">

**Made with ❤️ using AI-powered development**

_Enterprise-grade architecture • Comprehensive testing • Modern practices_

</div>
