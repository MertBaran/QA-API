import 'reflect-metadata';
import { container } from 'tsyringe';
import { TOKENS } from './TOKENS';
import { BootstrapService } from './BootstrapService';
import { HealthCheckService } from './HealthCheckService';
import { EnvironmentProvider } from './providers/EnvironmentProvider';
import { ConfigurationManager } from './managers/ConfigurationManager';
import { AuthManager } from './managers/AuthManager';
import { QuestionManager } from './managers/QuestionManager';
import { AnswerManager } from './managers/AnswerManager';
import { AdminManager } from './managers/AdminManager';

// MultiChannelNotificationManager kullanılmıyor, kaldırıldı
import { NotificationChannelRegistry } from './managers/NotificationChannelRegistry';
import { EmailNotificationHandler } from './managers/EmailNotificationHandler';
import { EmailChannel } from './managers/EmailChannel';
import { SMSChannel } from './managers/SMSChannel';
import { PushChannel } from './managers/PushChannel';
import { WebhookChannel } from './managers/WebhookChannel';
import { EmailNotificationProvider } from './notification/EmailNotificationProvider';
import { PinoLoggerProvider } from '../infrastructure/logging/PinoLoggerProvider';
import { SentryTracker } from '../infrastructure/error/SentryTracker';
import { RedisCacheProvider } from '../infrastructure/cache/RedisCacheProvider';
import { MongoDBAdapter } from '../repositories/adapters/MongoDBAdapter';
import { UserRepository } from '../repositories/UserRepository';
import { QuestionRepository } from '../repositories/QuestionRepository';
import { AnswerRepository } from '../repositories/AnswerRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { UserMongooseDataSource } from '../repositories/mongodb/UserMongooseDataSource';
import { QuestionMongooseDataSource } from '../repositories/mongodb/QuestionMongooseDataSource';
import { AnswerMongooseDataSource } from '../repositories/mongodb/AnswerMongooseDataSource';
import { MongoAuditProvider } from '../infrastructure/audit/MongoAuditProvider';
import { ZodValidationProvider } from '../infrastructure/validation/ZodValidationProvider';
import { MongoDBMigrationStrategy } from '../database/strategies/MongoDBMigrationStrategy';
import { MongoDBSeedStrategy } from '../database/strategies/MongoDBSeedStrategy';
import UserMongo from '../models/mongodb/UserMongoModel';
import QuestionMongo from '../models/mongodb/QuestionMongoModel';
import AnswerMongo from '../models/mongodb/AnswerMongoModel';
import NotificationMongo from '../models/mongodb/NotificationMongoModel';
import NotificationTemplateMongo from '../models/mongodb/NotificationTemplateMongoModel';
import { AuthController } from '../controllers/authController';
import { UserController } from '../controllers/userController';
import { AdminController } from '../controllers/adminController';
import { QuestionController } from '../controllers/questionController';
import { AnswerController } from '../controllers/answerController';
import { NotificationController } from '../controllers/notificationController';
import { RabbitMQProvider } from './providers/RabbitMQProvider';
import { SmartNotificationManager } from './managers/SmartNotificationManager';
import { SmartNotificationStrategy } from './strategies/SmartNotificationStrategy';
import { SystemMetricsCollector } from './metrics/SystemMetricsCollector';
import { WebSocketMonitorService } from './WebSocketMonitorService';
import { InternalWebSocketClient } from './InternalWebSocketClient';
import { PermissionManager } from './managers/PermissionManager';
import { RoleManager } from './managers/RoleManager';
import { UserRoleManager } from './managers/UserRoleManager';
import { UserManager } from './managers/UserManager';
import { PermissionRepository } from '../repositories/PermissionRepository';
import { RoleRepository } from '../repositories/RoleRepository';
import { UserRoleRepository } from '../repositories/UserRoleRepository';
import { PermissionMongooseDataSource } from '../repositories/mongodb/PermissionMongooseDataSource';
import { RoleMongooseDataSource } from '../repositories/mongodb/RoleMongooseDataSource';
import { UserRoleMongooseDataSource } from '../repositories/mongodb/UserRoleMongooseDataSource';
import { BookmarkManager } from './managers/BookmarkManager';
import { BookmarkRepository } from '../repositories/BookmarkRepository';
import { BookmarkMongooseDataSource } from '../repositories/mongodb/BookmarkMongooseDataSource';

import { BookmarkController } from '../controllers/bookmarkController';

// Register core services first
container.registerSingleton(TOKENS.BootstrapService, BootstrapService);

// Bootstrap function
export async function initializeContainer() {
  const bootstrapService = container.resolve(BootstrapService);
  const config = await bootstrapService.bootstrap();
  return config;
}

// Register core services
container.registerSingleton(TOKENS.HealthCheckService, HealthCheckService);

// Register infrastructure providers
container.registerSingleton(TOKENS.ILoggerProvider, PinoLoggerProvider);
container.registerSingleton(TOKENS.IExceptionTracker, SentryTracker);
container.registerSingleton(TOKENS.ICacheProvider, RedisCacheProvider);
container.registerSingleton(TOKENS.IDatabaseAdapter, MongoDBAdapter);
container.registerSingleton(TOKENS.IAuditProvider, MongoAuditProvider);
container.registerSingleton(TOKENS.AuditProvider, MongoAuditProvider);
container.registerSingleton(TOKENS.IEnvironmentProvider, EnvironmentProvider);

// Register queue providers
container.registerSingleton(TOKENS.IQueueProvider, RabbitMQProvider);

// Register data sources
container.registerSingleton(TOKENS.IUserDataSource, UserMongooseDataSource);
container.registerSingleton(
  TOKENS.IQuestionDataSource,
  QuestionMongooseDataSource
);
container.registerSingleton(TOKENS.IAnswerDataSource, AnswerMongooseDataSource);
container.registerSingleton(
  TOKENS.IPermissionDataSource,
  PermissionMongooseDataSource
);
container.registerSingleton(TOKENS.IRoleDataSource, RoleMongooseDataSource);
container.registerSingleton(
  TOKENS.IUserRoleDataSource,
  UserRoleMongooseDataSource
);
container.registerSingleton(
  TOKENS.IBookmarkDataSource,
  BookmarkMongooseDataSource
);

// Register repositories
container.registerSingleton(TOKENS.IUserRepository, UserRepository);
container.registerSingleton(TOKENS.IQuestionRepository, QuestionRepository);
container.registerSingleton(TOKENS.IAnswerRepository, AnswerRepository);
container.registerSingleton(
  TOKENS.INotificationRepository,
  NotificationRepository
);
container.registerSingleton(TOKENS.IPermissionRepository, PermissionRepository);
container.registerSingleton(TOKENS.IRoleRepository, RoleRepository);
container.registerSingleton(TOKENS.IUserRoleRepository, UserRoleRepository);
container.registerSingleton(TOKENS.IBookmarkRepository, BookmarkRepository);

// Register managers as services
container.registerSingleton(TOKENS.IAuthService, AuthManager);
container.registerSingleton(TOKENS.IUserService, UserManager);
container.registerSingleton(TOKENS.IQuestionService, QuestionManager);
container.registerSingleton(TOKENS.IAnswerService, AnswerManager);
container.registerSingleton(TOKENS.IBookmarkService, BookmarkManager);
container.registerSingleton(TOKENS.IAdminService, AdminManager);

container.registerSingleton(TOKENS.IPermissionService, PermissionManager);
container.registerSingleton(TOKENS.IRoleService, RoleManager);
container.registerSingleton(TOKENS.IUserRoleService, UserRoleManager);

// Register notification services
container.registerSingleton(
  TOKENS.INotificationChannelRegistry,
  NotificationChannelRegistry
);

// Register smart notification system
container.registerSingleton(
  TOKENS.INotificationStrategy,
  SmartNotificationStrategy
);
container.registerSingleton(
  TOKENS.SystemMetricsCollector,
  SystemMetricsCollector
);

// Register WebSocket monitoring service
container.registerSingleton(
  TOKENS.WebSocketMonitorService,
  WebSocketMonitorService
);

// Register internal WebSocket client
container.registerSingleton(
  TOKENS.InternalWebSocketClient,
  InternalWebSocketClient
);

// Register notification managers based on technology
container.registerSingleton(
  TOKENS.INotificationService,
  SmartNotificationManager
);

// Register notification channels
container.registerSingleton(TOKENS.IEmailChannel, EmailChannel);
container.registerSingleton(TOKENS.ISMSChannel, SMSChannel);
container.registerSingleton(TOKENS.IPushChannel, PushChannel);
container.registerSingleton(TOKENS.IWebhookChannel, WebhookChannel);

// Register legacy notification services
container.registerSingleton(
  TOKENS.IEmailNotificationHandler,
  EmailNotificationHandler
);
container.registerSingleton(
  TOKENS.INotificationProvider,
  EmailNotificationProvider
);

// Register legacy services
container.registerSingleton(TOKENS.ConfigurationManager, ConfigurationManager);
container.registerSingleton(TOKENS.IConfigurationService, ConfigurationManager);

// Register models for data source compatibility
container.register(TOKENS.IUserModel, { useValue: UserMongo });
container.register(TOKENS.IQuestionModel, { useValue: QuestionMongo });
container.register(TOKENS.IAnswerModel, { useValue: AnswerMongo });
container.register(TOKENS.INotificationModel, { useValue: NotificationMongo });
container.register(TOKENS.INotificationTemplateModel, {
  useValue: NotificationTemplateMongo,
});

// Register typed configuration
container.register(TOKENS.AppConfig, { useValue: null });
container.register(TOKENS.IDatabaseConnectionConfig, {
  useValue: { connectionString: '' },
});
container.register(TOKENS.ICacheConnectionConfig, {
  useValue: { host: '', port: 0, url: '' },
});

// Register validation provider
container.registerSingleton(TOKENS.IValidationProvider, ZodValidationProvider);

// Register database strategies
container.registerSingleton(
  TOKENS.IMigrationStrategy,
  MongoDBMigrationStrategy
);
container.registerSingleton(TOKENS.ISeedStrategy, MongoDBSeedStrategy);

// Register controllers
container.registerSingleton(TOKENS.AuthController, AuthController);
container.registerSingleton(TOKENS.UserController, UserController);
container.registerSingleton(TOKENS.AdminController, AdminController);
container.registerSingleton(TOKENS.QuestionController, QuestionController);
container.registerSingleton(TOKENS.AnswerController, AnswerController);
container.registerSingleton(TOKENS.BookmarkController, BookmarkController);
container.registerSingleton(
  TOKENS.NotificationController,
  NotificationController
);

export { container };
