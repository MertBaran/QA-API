// Mock mongoose completely BEFORE any other imports
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    close: jest.fn(),
    readyState: 1,
  },
  model: jest.fn(() => ({
    find: jest.fn(() => Promise.resolve([])),
    findById: jest.fn(() => Promise.resolve(null)),
    findOne: jest.fn(() => Promise.resolve(null)),
    create: jest.fn(() => Promise.resolve({})),
    findByIdAndUpdate: jest.fn(() => Promise.resolve(null)),
    findByIdAndDelete: jest.fn(() => Promise.resolve(null)),
    countDocuments: jest.fn(() => Promise.resolve(0)),
    aggregate: jest.fn(() => Promise.resolve([])),
  })),
  Schema: jest.fn(),
  Types: {
    ObjectId: jest.fn(() => 'mock-id'),
  },
}));

import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';

// Container'ı tamamen temizle
import { container } from 'tsyringe';
container.reset();

// Sadece fake/mock import'ları
import { FakeCacheProvider } from './mocks/cache/FakeCacheProvider';
import { FakeNotificationProvider } from './mocks/notification/FakeNotificationProvider';
import { FakeLoggerProvider } from './mocks/logger/FakeLoggerProvider';
import { FakeAuditProvider } from './mocks/audit/FakeAuditProvider';
import { ZodValidationProvider } from '../infrastructure/validation/ZodValidationProvider';

// Fake service'ler
import { FakeUserService } from './mocks/services/FakeUserService';
import { FakeRoleService } from './mocks/services/FakeRoleService';
import { FakeUserRoleService } from './mocks/services/FakeUserRoleService';
import { FakePermissionService } from './mocks/services/FakePermissionService';
import { FakeExceptionTracker } from './mocks/error/FakeExceptionTracker';
import { FakeQuestionService } from './mocks/services/FakeQuestionService';
import { FakeAnswerService } from './mocks/services/FakeAnswerService';
import { FakeAdminService } from './mocks/services/FakeAdminService';

// Fake Repository'ler
import { FakeUserRepository } from './mocks/repositories/FakeUserRepository';
import { FakeQuestionRepository } from './mocks/repositories/FakeQuestionRepository';
import { FakeAnswerRepository } from './mocks/repositories/FakeAnswerRepository';

// Fake DataSource'ler
import { FakeUserDataSource } from './mocks/datasource/FakeUserDataSource';

// Manager'lar - Fake'ler kullanılıyor
import { FakeAuthManager } from './mocks/managers/FakeAuthManager';

// Controller'lar
import { AuthController } from '../controllers/authController';
import { QuestionController } from '../controllers/questionController';
import { AnswerController } from '../controllers/answerController';
import { UserController } from '../controllers/userController';
import { AdminController } from '../controllers/adminController';
import { NotificationController } from '../controllers/notificationController';
import { HealthCheckController } from '../controllers/healthController';
import { MonitoringController } from '../controllers/monitoringController';

// Middleware'ler
import { getAccessToRoute } from '../middlewares/authorization/authMiddleware';
import customErrorHandler from '../middlewares/errors/customErrorHandler';

// Validation schemas
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  editProfileSchema,
} from '../infrastructure/validation/schemas/authSchemas';
import {
  createQuestionSchema,
  updateQuestionSchema,
} from '../infrastructure/validation/schemas/questionSchemas';
import {
  createAnswerSchema,
  updateAnswerSchema,
} from '../infrastructure/validation/schemas/answerSchemas';

// Test ortamı için fake instance'lar oluştur
const fakeCache = new FakeCacheProvider();
const fakeNotification = new FakeNotificationProvider();
const fakeLogger = new FakeLoggerProvider();
const fakeAudit = new FakeAuditProvider();
const validator = new ZodValidationProvider();

const fakeUserService = new FakeUserService();
const fakeRoleService = new FakeRoleService();
const fakeUserRoleService = new FakeUserRoleService();
const fakePermissionService = new FakePermissionService();
const fakeExceptionTracker = new FakeExceptionTracker();
const fakeQuestionService = new FakeQuestionService();
const fakeAnswerService = new FakeAnswerService();
const fakeAdminService = new FakeAdminService();

// Container'a fake'leri register et
container.registerInstance('ICacheProvider', fakeCache);
container.registerInstance('INotificationService', fakeNotification);
container.registerInstance('ILoggerProvider', fakeLogger);
container.registerInstance('IAuditProvider', fakeAudit);
container.registerInstance('IValidationProvider', validator);

// Fake service'leri register et
container.registerInstance('IUserService', fakeUserService);
container.registerInstance('IRoleService', fakeRoleService);
container.registerInstance('IUserRoleService', fakeUserRoleService);
container.registerInstance('IPermissionService', fakePermissionService);
container.registerInstance('IExceptionTracker', fakeExceptionTracker);

// Repository'leri register et - Fake'ler kullanılıyor
container.registerInstance('IUserRepository', new FakeUserRepository());
container.registerInstance('IQuestionRepository', new FakeQuestionRepository());
container.registerInstance('IAnswerRepository', new FakeAnswerRepository());

// DataSource'ları register et - Fake'ler kullanılıyor
container.registerInstance('IUserDataSource', new FakeUserDataSource());

// Manager'ları register et - Fake'ler kullanılıyor
container.registerInstance('IAuthService', new FakeAuthManager());
container.registerInstance('IAdminService', fakeAdminService);
container.registerInstance('IQuestionService', fakeQuestionService);
container.registerInstance('IAnswerService', fakeAnswerService);

// Test app oluştur
export function createTestApp(): Application {
  const app = express();

  // CORS
  app.use(cors({ origin: true, credentials: true }));

  // Body parser
  app.use(express.json());

  // Static files
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Health check endpoints
  const healthController = new HealthCheckController();
  app.get('/health/quick', (req, res) => {
    healthController.quickHealthCheck(req, res);
  });
  app.get('/health', async (req, res) => {
    await healthController.fullHealthCheck(req, res);
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.send('QA API Test Server is running');
  });

  // Controller'ları doğrudan fake instance'larla oluştur
  const authController = new AuthController(
    new FakeAuthManager(),
    fakeUserService,
    fakeUserRoleService,
    fakeRoleService,
    fakePermissionService,
    fakeLogger,
    fakeExceptionTracker
  );
  const questionController = new QuestionController(fakeQuestionService);
  const answerController = new AnswerController(fakeAnswerService);
  const _userController = new UserController(
    fakeAdminService,
    fakeUserRoleService
  );
  const _adminController = new AdminController();
  const _notificationController = new NotificationController(fakeNotification);
  const monitoringController = new MonitoringController();

  // API routes - Audit middleware'leri devre dışı
  app.use(
    '/api/auth',
    (() => {
      const router = express.Router();

      router.post(
        '/register',
        validator.validateBody(registerSchema),
        authController.register
      );
      router.post(
        '/login',
        validator.validateBody(loginSchema),
        authController.login
      );
      router.get('/logout', authController.logout);
      router.post(
        '/forgotpassword',
        validator.validateBody(forgotPasswordSchema),
        authController.forgotpassword
      );
      router.put(
        '/resetpassword',
        validator.validateBody(resetPasswordSchema),
        authController.resetPassword
      );
      router.get('/profile', getAccessToRoute, authController.getUser);
      router.put(
        '/edit',
        getAccessToRoute,
        validator.validateBody(editProfileSchema),
        authController.editProfile
      );
      router.post('/loginGoogle', authController.googleLogin);

      return router;
    })()
  );

  app.use(
    '/api/questions',
    (() => {
      const router = express.Router();

      router.post(
        '/ask',
        getAccessToRoute,
        validator.validateBody(createQuestionSchema),
        questionController.askNewQuestion
      );
      router.get('/', questionController.getAllQuestions);
      router.get('/:id', questionController.getSingleQuestion);
      router.put(
        '/:id/edit',
        getAccessToRoute,
        validator.validateBody(updateQuestionSchema),
        questionController.editQuestion
      );
      router.delete(
        '/:id/delete',
        getAccessToRoute,
        questionController.deleteQuestion
      );
      router.get(
        '/:id/like',
        getAccessToRoute,
        questionController.likeQuestion
      );
      router.get(
        '/:id/undo_like',
        getAccessToRoute,
        questionController.undoLikeQuestion
      );

      return router;
    })()
  );

  app.use(
    '/api/answers',
    (() => {
      const router = express.Router();

      router.post(
        '/:questionId/answer',
        getAccessToRoute,
        validator.validateBody(createAnswerSchema),
        answerController.addNewAnswerToQuestion
      );
      router.get('/:id', answerController.getSingleAnswer);
      router.put(
        '/:id/edit',
        getAccessToRoute,
        validator.validateBody(updateAnswerSchema),
        answerController.editAnswer
      );
      router.delete(
        '/:id/delete',
        getAccessToRoute,
        answerController.deleteAnswer
      );
      router.get('/:id/like', getAccessToRoute, answerController.likeAnswer);
      router.get(
        '/:id/undo_like',
        getAccessToRoute,
        answerController.undoLikeAnswer
      );

      return router;
    })()
  );

  app.use(
    '/api/monitoring',
    (() => {
      const router = express.Router();

      router.get('/connections', monitoringController.getConnectionStatus);
      router.get('/alerts', monitoringController.getAlertHistory);
      router.get('/stats', monitoringController.getMonitoringStats);
      router.post('/start', monitoringController.startMonitoring);
      router.post('/stop', monitoringController.stopMonitoring);

      return router;
    })()
  );

  // Error handler
  app.use(customErrorHandler);

  return app;
}

// Test app instance
const testApp = createTestApp();
export default testApp;
