import 'reflect-metadata';
import { container } from 'tsyringe';
import { TOKENS } from './TOKENS';
import { BootstrapService } from './BootstrapService';
import { HealthCheckService } from './HealthCheckService';
import { EnvironmentProvider } from './providers/EnvironmentProvider';
import { ConfigurationManager } from './managers/ConfigurationManager';
import {
  IConfigurationService,
  DatabaseType,
} from './contracts/IConfigurationService';
import { AuthManager } from './managers/AuthManager';
import { QuestionManager } from './managers/QuestionManager';
import { AnswerManager } from './managers/AnswerManager';
import { AdminManager } from './managers/AdminManager';

import { MultiChannelNotificationManager } from './managers/MultiChannelNotificationManager';
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
import { PostgreSQLAdapter } from '../repositories/adapters/PostgreSQLAdapter';
import { UserRepository } from '../repositories/UserRepository';
import { QuestionRepository } from '../repositories/QuestionRepository';
import { AnswerRepository } from '../repositories/AnswerRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { NotificationMongooseDataSource } from '../repositories/mongodb/NotificationMongooseDataSource';
import { UserMongooseDataSource } from '../repositories/mongodb/UserMongooseDataSource';
import { QuestionMongooseDataSource } from '../repositories/mongodb/QuestionMongooseDataSource';
import { AnswerMongooseDataSource } from '../repositories/mongodb/AnswerMongooseDataSource';
import { MongoAuditProvider } from '../infrastructure/audit/MongoAuditProvider';
import { NoOpAuditProvider } from '../infrastructure/audit/NoOpAuditProvider';
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
import { PermissionPostgreSQLDataSource } from '../repositories/postgresql/PermissionPostgreSQLDataSource';
import { RolePostgreSQLDataSource } from '../repositories/postgresql/RolePostgreSQLDataSource';
import { UserRolePostgreSQLDataSource } from '../repositories/postgresql/UserRolePostgreSQLDataSource';
import { UserPostgreSQLDataSource } from '../repositories/postgresql/UserPostgreSQLDataSource';
import { QuestionPostgreSQLDataSource } from '../repositories/postgresql/QuestionPostgreSQLDataSource';
import { AnswerPostgreSQLDataSource } from '../repositories/postgresql/AnswerPostgreSQLDataSource';
import { BookmarkPostgreSQLDataSource } from '../repositories/postgresql/BookmarkPostgreSQLDataSource';
import { BookmarkCollectionPostgreSQLDataSource } from '../repositories/postgresql/BookmarkCollectionPostgreSQLDataSource';
import { BookmarkCollectionItemPostgreSQLDataSource } from '../repositories/postgresql/BookmarkCollectionItemPostgreSQLDataSource';
import { ContentRelationPostgreSQLDataSource } from '../repositories/postgresql/ContentRelationPostgreSQLDataSource';
import { NotificationPostgreSQLDataSource } from '../repositories/postgresql/NotificationPostgreSQLDataSource';
import { BookmarkManager } from './managers/BookmarkManager';
import { BookmarkRepository } from '../repositories/BookmarkRepository';
import { BookmarkMongooseDataSource } from '../repositories/mongodb/BookmarkMongooseDataSource';
import { BookmarkCollectionMongooseDataSource } from '../repositories/mongodb/BookmarkCollectionMongooseDataSource';
import { BookmarkCollectionItemMongooseDataSource } from '../repositories/mongodb/BookmarkCollectionItemMongooseDataSource';
import { ContentRelationMongooseDataSource } from '../repositories/mongodb/ContentRelationMongooseDataSource';
import { ContentRelationRepository } from '../repositories/ContentRelationRepository';
import ContentRelationMongo from '../models/mongodb/ContentRelationMongoModel';

import { BookmarkController } from '../controllers/bookmarkController';
import { ElasticsearchClient } from '../infrastructure/elasticsearch/ElasticsearchClient';
import { ElasticsearchIndexService } from '../infrastructure/elasticsearch/ElasticsearchIndexService';
import { ElasticsearchLogShipper } from '../infrastructure/elasticsearch/ElasticsearchLogShipper';
import { ElasticsearchSyncService } from '../infrastructure/elasticsearch/ElasticsearchSyncService';
import { ElserSemanticSearchService } from '../infrastructure/search/ElserSemanticSearchService';
import { ElasticsearchIngestPipeline } from '../infrastructure/elasticsearch/ElasticsearchIngestPipeline';
import { SynonymService } from '../infrastructure/search/SynonymService';
import { EntityTypeResolver } from '../infrastructure/search/EntityTypeResolver';
import { EntityTypeRegistry } from '../infrastructure/search/EntityType';
import { QuestionProjector } from '../infrastructure/search/projectors/QuestionProjector';
import { AnswerProjector } from '../infrastructure/search/projectors/AnswerProjector';
import { CloudflareR2StorageProvider } from '../infrastructure/storage/providers/CloudflareR2StorageProvider';
import { ContentAssetService } from '../infrastructure/storage/content/ContentAssetService';
import { ContentAssetController } from '../controllers/contentAssetController';
import { IQuestionModel } from '../models/interfaces/IQuestionModel';
import { IAnswerModel } from '../models/interfaces/IAnswerModel';
import { QuestionSearchDoc } from '../infrastructure/search/SearchDocument';
import { AnswerSearchDoc } from '../infrastructure/search/SearchDocument';

// Register core services first
container.registerSingleton(TOKENS.BootstrapService, BootstrapService);

// Bootstrap function - idempotent, birden fazla çağrı güvenli
let _initConfig: import('./BootstrapService').ParsedConfiguration | null = null;

export async function initializeContainer() {
  if (_initConfig) return _initConfig;

  // DataSource'lar module-level'da _isPostgreSQL flag'ine göre zaten kayıtlı.
  // Burada sadece connection config ve bootstrap yapılıyor.

  if (_isPostgreSQL) {
    const dbUrl = process.env['DATABASE_URL'] || 'postgresql://localhost:5432/qa_platform';
    container.registerInstance(TOKENS.IDatabaseConnectionConfig, {
      connectionString: dbUrl,
    });
    console.log('📦 Container: PostgreSQL mode');
  }

  const bootstrapService = container.resolve(BootstrapService);
  const config = await bootstrapService.bootstrap();

  if (!_isPostgreSQL) {
    const configManager = container.resolve<IConfigurationService>(
      TOKENS.IConfigurationService
    );
    const dbConnConfig = configManager.getDatabaseConnectionConfig();
    container.registerInstance(TOKENS.IDatabaseConnectionConfig, dbConnConfig);
  }

  _initConfig = config;
  return config;
}

// Register core services
container.registerSingleton(TOKENS.HealthCheckService, HealthCheckService);

// Register infrastructure providers
container.registerSingleton(TOKENS.ILoggerProvider, PinoLoggerProvider);
container.registerSingleton(TOKENS.IExceptionTracker, SentryTracker);
container.registerSingleton(TOKENS.ICacheProvider, RedisCacheProvider);
// DATABASE_TYPE check: dotenv APP.ts'de container import'undan ÖNCE yükleniyor
const _isPostgreSQL =
  (process.env['DATABASE_TYPE'] || 'mongodb').toLowerCase() === DatabaseType.PostgreSQL;

if (_isPostgreSQL) {
  container.registerSingleton(TOKENS.IDatabaseAdapter, PostgreSQLAdapter);
} else {
  container.registerSingleton(TOKENS.IDatabaseAdapter, MongoDBAdapter);
}
if (_isPostgreSQL) {
  container.registerSingleton(TOKENS.IAuditProvider, NoOpAuditProvider);
  container.registerSingleton(TOKENS.AuditProvider, NoOpAuditProvider);
} else {
  container.registerSingleton(TOKENS.IAuditProvider, MongoAuditProvider);
  container.registerSingleton(TOKENS.AuditProvider, MongoAuditProvider);
}
container.registerSingleton(TOKENS.IEnvironmentProvider, EnvironmentProvider);
container.registerSingleton(
  TOKENS.IObjectStorageProvider,
  CloudflareR2StorageProvider
);
container.registerSingleton(TOKENS.IContentAssetService, ContentAssetService);

// Register Elasticsearch services
container.registerSingleton(TOKENS.IElasticsearchClient, ElasticsearchClient);
container.registerSingleton(
  TOKENS.IElasticsearchLogShipper,
  ElasticsearchLogShipper
);

// Register Search & Index services (soyut interface'ler)
container.registerSingleton(TOKENS.ISearchClient, ElasticsearchIndexService);
container.registerSingleton(TOKENS.IIndexClient, ElasticsearchSyncService);
container.registerSingleton(TOKENS.IDocumentService, ElasticsearchIndexService);
container.registerSingleton(TOKENS.IEntityTypeRegistry, EntityTypeRegistry);
container.registerSingleton(TOKENS.IEntityTypeResolver, EntityTypeResolver);

// Register semantic search service (ELSER) - optional, can be undefined if not configured
container.registerSingleton(
  TOKENS.ISemanticSearchService,
  ElserSemanticSearchService
);

// Register synonym service (optional, can be undefined if not configured)
container.registerSingleton(TOKENS.ISynonymService, SynonymService);

// Register ingest pipeline service for ELSER semantic fields
container.registerSingleton(
  TOKENS.ElasticsearchIngestPipeline,
  ElasticsearchIngestPipeline
);

// Register Projectors - Entity'den SearchDocument'a mapping
// Manager'larda kullanılan token string'leri ile register ediyoruz
container.registerSingleton(
  'IProjector<IQuestionModel, QuestionSearchDoc>',
  QuestionProjector
);
container.registerSingleton(
  'IProjector<IAnswerModel, AnswerSearchDoc>',
  AnswerProjector
);

// Register queue providers
container.registerSingleton(TOKENS.IQueueProvider, RabbitMQProvider);

// Register data sources - DATABASE_TYPE'a göre PostgreSQL veya MongoDB
if (_isPostgreSQL) {
  container.registerSingleton(TOKENS.IUserDataSource, UserPostgreSQLDataSource);
  container.registerSingleton(TOKENS.IQuestionDataSource, QuestionPostgreSQLDataSource);
  container.registerSingleton(TOKENS.IAnswerDataSource, AnswerPostgreSQLDataSource);
  container.registerSingleton(TOKENS.IPermissionDataSource, PermissionPostgreSQLDataSource);
  container.registerSingleton(TOKENS.IRoleDataSource, RolePostgreSQLDataSource);
  container.registerSingleton(TOKENS.IUserRoleDataSource, UserRolePostgreSQLDataSource);
  container.registerSingleton(TOKENS.IBookmarkDataSource, BookmarkPostgreSQLDataSource);
  container.registerSingleton(TOKENS.IBookmarkCollectionDataSource, BookmarkCollectionPostgreSQLDataSource);
  container.registerSingleton(TOKENS.IBookmarkCollectionItemDataSource, BookmarkCollectionItemPostgreSQLDataSource);
  container.registerSingleton(TOKENS.IContentRelationDataSource, ContentRelationPostgreSQLDataSource);
  container.registerSingleton(TOKENS.INotificationDataSource, NotificationPostgreSQLDataSource);
} else {
  container.registerSingleton(TOKENS.IUserDataSource, UserMongooseDataSource);
  container.registerSingleton(TOKENS.IQuestionDataSource, QuestionMongooseDataSource);
  container.registerSingleton(TOKENS.IAnswerDataSource, AnswerMongooseDataSource);
  container.registerSingleton(TOKENS.IPermissionDataSource, PermissionMongooseDataSource);
  container.registerSingleton(TOKENS.IRoleDataSource, RoleMongooseDataSource);
  container.registerSingleton(TOKENS.IUserRoleDataSource, UserRoleMongooseDataSource);
  container.registerSingleton(TOKENS.IBookmarkDataSource, BookmarkMongooseDataSource);
  container.registerSingleton(TOKENS.IBookmarkCollectionDataSource, BookmarkCollectionMongooseDataSource);
  container.registerSingleton(TOKENS.IBookmarkCollectionItemDataSource, BookmarkCollectionItemMongooseDataSource);
  container.registerSingleton(TOKENS.IContentRelationDataSource, ContentRelationMongooseDataSource);
  container.registerSingleton(TOKENS.INotificationDataSource, NotificationMongooseDataSource);
}

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
container.registerSingleton(
  TOKENS.IContentRelationRepository,
  ContentRelationRepository
);

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
// Default to MultiChannelNotificationManager (direct mode)
// BootstrapService will override this based on NOTIFICATION_TECHNOLOGY
container.registerSingleton(
  TOKENS.INotificationService,
  MultiChannelNotificationManager
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
container.register('IContentRelationModel', { useValue: ContentRelationMongo });
container.register(TOKENS.INotificationTemplateModel, {
  useValue: NotificationTemplateMongo,
});

// Register typed configuration
container.register(TOKENS.AppConfig, { useValue: null });
// Use process.env so loadEnv/test setup provides correct values.
// IMPORTANT: Bu değer, PostgreSQLAdapter constructor inject'i için kritik (adapter resolve anında okur).
container.registerInstance(TOKENS.IDatabaseConnectionConfig, {
  connectionString: _isPostgreSQL
    ? process.env['DATABASE_URL'] || 'postgresql://localhost:5432/qa_platform'
    : process.env['MONGO_URI'] || 'mongodb://localhost:27017/qa-platform',
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
container.registerSingleton(
  TOKENS.ContentAssetController,
  ContentAssetController
);

export { container };
