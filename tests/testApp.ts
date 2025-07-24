import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';

// Container'ı tamamen temizle
import { container } from 'tsyringe';
container.reset();

// Sadece fake/mock import'ları
import { FakeUserDataSource } from './mocks/datasource/FakeUserDataSource';
import { FakeQuestionDataSource } from './mocks/datasource/FakeQuestionDataSource';
import { FakeAnswerDataSource } from './mocks/datasource/FakeAnswerDataSource';
import { FakeCacheProvider } from './mocks/cache/FakeCacheProvider';
import { FakeNotificationProvider } from './mocks/notification/FakeNotificationProvider';
import { FakeLoggerProvider } from './mocks/logger/FakeLoggerProvider';
import { FakeAuditProvider } from './mocks/audit/FakeAuditProvider';
import { ZodValidationProvider } from '../infrastructure/validation/ZodValidationProvider';

// Repository'ler
import { UserRepository } from '../repositories/UserRepository';
import { QuestionRepository } from '../repositories/QuestionRepository';
import { AnswerRepository } from '../repositories/AnswerRepository';

// Manager'lar
import { AuthManager } from '../services/managers/AuthManager';
import { AdminManager } from '../services/managers/AdminManager';
import { QuestionManager } from '../services/managers/QuestionManager';
import { AnswerManager } from '../services/managers/AnswerManager';

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
const fakeUserDS = new FakeUserDataSource();
const fakeQuestionDS = new FakeQuestionDataSource();
const fakeAnswerDS = new FakeAnswerDataSource();
const fakeCache = new FakeCacheProvider();
const fakeNotification = new FakeNotificationProvider();
const fakeLogger = new FakeLoggerProvider();
const fakeAudit = new FakeAuditProvider();
const validator = new ZodValidationProvider();

// Container'a fake'leri register et
container.registerInstance('IUserDataSource', fakeUserDS);
container.registerInstance('IQuestionDataSource', fakeQuestionDS);
container.registerInstance('IAnswerDataSource', fakeAnswerDS);
container.registerInstance('ICacheProvider', fakeCache);
container.registerInstance('INotificationService', fakeNotification);
container.registerInstance('ILoggerProvider', fakeLogger);
container.registerInstance('IAuditProvider', fakeAudit);
container.registerInstance('IValidationProvider', validator);

// Repository'leri register et
container.registerInstance('IUserRepository', new UserRepository(fakeUserDS));
container.registerInstance(
  'IQuestionRepository',
  new QuestionRepository(fakeQuestionDS)
);
container.registerInstance(
  'IAnswerRepository',
  new AnswerRepository(fakeAnswerDS)
);

// Manager'ları register et
container.registerInstance(
  'IAuthService',
  new AuthManager(
    container.resolve('IUserRepository'),
    container.resolve('IUserService'),
    container.resolve('IRoleService'),
    container.resolve('IUserRoleService'),
    container.resolve('INotificationService')
  )
);
container.registerInstance(
  'IAdminService',
  new AdminManager(container.resolve('IUserRepository'))
);
container.registerInstance(
  'IQuestionService',
  new QuestionManager(
    container.resolve('IQuestionRepository'),
    container.resolve('ICacheProvider')
  )
);
container.registerInstance(
  'IAnswerService',
  new AnswerManager(
    container.resolve('IAnswerRepository'),
    container.resolve('ICacheProvider')
  )
);

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

  // Controller'ları oluştur
  const authController = new AuthController(
    container.resolve('IAuthService'),
    container.resolve('IUserRoleService'),
    container.resolve('ILoggerProvider')
  );
  const questionController = new QuestionController(
    container.resolve('IQuestionService')
  );
  const answerController = new AnswerController(
    container.resolve('IAnswerService')
  );
  const _userController = new UserController(
    container.resolve('IAdminService'),
    container.resolve('IUserRoleService')
  );
  const _adminController = new AdminController(
    container.resolve('IAdminService'),
    container.resolve('IUserRoleService')
  );
  const _notificationController = new NotificationController(
    container.resolve('INotificationService')
  );
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
