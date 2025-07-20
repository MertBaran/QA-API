import 'reflect-metadata';
import { container } from 'tsyringe';
import { BootstrapService } from './BootstrapService';
import { HealthCheckService } from './HealthCheckService';
import { EnvironmentProvider } from './providers/EnvironmentProvider';
import { ConfigurationManager } from './managers/ConfigurationManager';
import { AuthManager } from './managers/AuthManager';
import { QuestionManager } from './managers/QuestionManager';
import { AnswerManager } from './managers/AnswerManager';
import { AdminManager } from './managers/AdminManager';

import { NotificationManager } from './managers/NotificationManager';
import { MultiChannelNotificationManager } from './managers/MultiChannelNotificationManager';
import { NotificationChannelRegistry } from './managers/NotificationChannelRegistry';
import { EmailNotificationHandler } from './managers/EmailNotificationHandler';
import { EmailChannel } from './managers/EmailChannel';
import { SMSChannel } from './managers/SMSChannel';
import { PushChannel } from './managers/PushChannel';
import { WebhookChannel } from './managers/WebhookChannel';
import { EmailNotificationProvider } from './notification/EmailNotificationProvider';
import { PinoLoggerProvider } from '../infrastructure/logging/PinoLoggerProvider';
import { RedisCacheProvider } from '../infrastructure/cache/RedisCacheProvider';
import { MongoDBAdapter } from '../repositories/adapters/MongoDBAdapter';
import { UserRepository } from '../repositories/UserRepository';
import { QuestionRepository } from '../repositories/QuestionRepository';
import { AnswerRepository } from '../repositories/AnswerRepository';
import { UserMongooseDataSource } from '../repositories/mongodb/UserMongooseDataSource';
import { QuestionMongooseDataSource } from '../repositories/mongodb/QuestionMongooseDataSource';
import { AnswerMongooseDataSource } from '../repositories/mongodb/AnswerMongooseDataSource';
import { MongoAuditProvider } from '../infrastructure/audit/MongoAuditProvider';
import { ZodValidationProvider } from '../infrastructure/validation/ZodValidationProvider';
import UserMongo from '../models/mongodb/UserMongoModel';
import QuestionMongo from '../models/mongodb/QuestionMongoModel';
import AnswerMongo from '../models/mongodb/AnswerMongoModel';
import { AuthController } from '../controllers/authController';
import { UserController } from '../controllers/userController';
import { AdminController } from '../controllers/adminController';
import { QuestionController } from '../controllers/questionController';
import { AnswerController } from '../controllers/answerController';
import { NotificationController } from '../controllers/notificationController';

// Register core services first
container.registerSingleton('BootstrapService', BootstrapService);

// Now resolve and bootstrap
const bootstrapService = container.resolve(BootstrapService);
const config = bootstrapService.bootstrap();

// Register core services
container.registerSingleton('HealthCheckService', HealthCheckService);

// Register infrastructure providers
container.registerSingleton('ILoggerProvider', PinoLoggerProvider);
container.registerSingleton('ICacheProvider', RedisCacheProvider);
container.registerSingleton('IDatabaseAdapter', MongoDBAdapter);
container.registerSingleton('IAuditProvider', MongoAuditProvider);

// Register data sources
container.registerSingleton('IUserDataSource', UserMongooseDataSource);
container.registerSingleton('IQuestionDataSource', QuestionMongooseDataSource);
container.registerSingleton('IAnswerDataSource', AnswerMongooseDataSource);

// Register repositories
container.registerSingleton('IUserRepository', UserRepository);
container.registerSingleton('IQuestionRepository', QuestionRepository);
container.registerSingleton('IAnswerRepository', AnswerRepository);

// Register managers as services
container.registerSingleton('IAuthService', AuthManager);
container.registerSingleton('IQuestionService', QuestionManager);
container.registerSingleton('IAnswerService', AnswerManager);
container.registerSingleton('IAdminService', AdminManager);

// Register notification services
container.registerSingleton(
  'INotificationChannelRegistry',
  NotificationChannelRegistry
);
container.registerSingleton(
  'INotificationService',
  MultiChannelNotificationManager
);

// Register notification channels
container.registerSingleton('IEmailChannel', EmailChannel);
container.registerSingleton('ISMSChannel', SMSChannel);
container.registerSingleton('IPushChannel', PushChannel);
container.registerSingleton('IWebhookChannel', WebhookChannel);

// Register legacy notification services (for backward compatibility)
container.registerSingleton('LegacyNotificationManager', NotificationManager);
container.registerSingleton(
  'IEmailNotificationHandler',
  EmailNotificationHandler
);
container.registerSingleton('INotificationProvider', EmailNotificationProvider);

// Register legacy services (for backward compatibility)
container.registerSingleton('EnvironmentProvider', EnvironmentProvider);
container.registerSingleton('ConfigurationManager', ConfigurationManager);

// Register models for data source compatibility
container.register('IUserModel', { useValue: UserMongo });
container.register('IQuestionModel', { useValue: QuestionMongo });
container.register('IAnswerModel', { useValue: AnswerMongo });

// Register typed configuration
container.register('AppConfig', { useValue: config });
container.register('IDatabaseConnectionConfig', {
  useValue: { connectionString: config.MONGO_URI },
});
container.register('ICacheConnectionConfig', {
  useValue: {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    url: config.REDIS_URL,
  },
});

// Register validation provider
container.registerSingleton('IValidationProvider', ZodValidationProvider);

// Register controllers
container.registerSingleton('AuthController', AuthController);
container.registerSingleton('UserController', UserController);
container.registerSingleton('AdminController', AdminController);
container.registerSingleton('QuestionController', QuestionController);
container.registerSingleton('AnswerController', AnswerController);
container.registerSingleton('NotificationController', NotificationController);

export { container, config };
