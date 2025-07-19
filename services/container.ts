import { container } from "tsyringe";
import UserMongo from "../models/mongodb/UserMongoModel";
import QuestionMongo from "../models/mongodb/QuestionMongoModel";
import AnswerMongo from "../models/mongodb/AnswerMongoModel";
import { UserRepository } from "../repositories/UserRepository";
import { QuestionRepository } from "../repositories/QuestionRepository";
import { AnswerRepository } from "../repositories/AnswerRepository";
import { IAuthService } from "./contracts/IAuthService";
import { IQuestionService } from "./contracts/IQuestionService";
import { IAnswerService } from "./contracts/IAnswerService";
import { IAdminService } from "./contracts/IAdminService";
import { IEmailService } from "./contracts/IEmailService";
import { INotificationService } from "./contracts/INotificationService";
import { NotificationChannel } from "./contracts/NotificationChannel";
import { AuthManager } from "./managers/AuthManager";
import { QuestionManager } from "./managers/QuestionManager";
import { AnswerManager } from "./managers/AnswerManager";
import { AdminManager } from "./managers/AdminManager";
import { EmailManager } from "./managers/EmailManager";
import { NotificationManager } from "./managers/NotificationManager";
import { EmailChannel } from "./managers/EmailChannel";
import { IDatabaseAdapter } from "../repositories/adapters/IDatabaseAdapter";
import { MongoDBAdapter } from "../repositories/adapters/MongoDBAdapter";
import { UserMongooseDataSource } from "../repositories/mongodb/UserMongooseDataSource";
import { QuestionMongooseDataSource } from "../repositories/mongodb/QuestionMongooseDataSource";
import { AnswerMongooseDataSource } from "../repositories/mongodb/AnswerMongooseDataSource";
import { MongooseModelAdapter } from "../repositories/mongodb/MongooseModelAdapter";
import { PinoLoggerProvider } from "../infrastructure/logging/PinoLoggerProvider";
import { MongoAuditProvider } from "../infrastructure/audit/MongoAuditProvider";
import { RedisCacheProvider } from "../infrastructure/cache/RedisCacheProvider";
import { ILoggerProvider } from "../infrastructure/logging/ILoggerProvider";
import { IAuditProvider } from "../infrastructure/audit/IAuditProvider";
import { ICacheProvider } from "../infrastructure/cache/ICacheProvider";
import { AuthController } from "../controllers/authController";
import { UserController } from "../controllers/userController";
import { AdminController } from "../controllers/adminController";
import { QuestionController } from "../controllers/questionController";
import { AnswerController } from "../controllers/answerController";
import { ZodValidationProvider } from "../infrastructure/validation/ZodValidationProvider";
import { IValidationProvider } from "../infrastructure/validation/IValidationProvider";
import { setI18nCacheProvider } from "../types/i18n";

// DataSource registration
container.register("UserDataSource", {
  useValue: new UserMongooseDataSource(new MongooseModelAdapter(UserMongo)),
});
container.register("QuestionDataSource", {
  useValue: new QuestionMongooseDataSource(
    new MongooseModelAdapter(QuestionMongo)
  ),
});
container.register("AnswerDataSource", {
  useValue: new AnswerMongooseDataSource(new MongooseModelAdapter(AnswerMongo)),
});

// Repository registration
container.register("UserRepository", UserRepository);
container.register("QuestionRepository", QuestionRepository);
container.register("AnswerRepository", AnswerRepository);

// Service registration
container.register<IAuthService>("AuthService", AuthManager);
container.register<IQuestionService>("QuestionService", QuestionManager);
container.register<IAnswerService>("AnswerService", AnswerManager);
container.register<IAdminService>("AdminService", AdminManager);
container.register<IEmailService>("EmailManager", EmailManager);

// Notification channels
container.register<NotificationChannel>("EmailChannel", EmailChannel);

// NotificationManager registration (manuel instance, EmailChannel ile)
container.register<INotificationService>("NotificationService", {
  useFactory: (c) =>
    new NotificationManager([c.resolve<NotificationChannel>("EmailChannel")]),
});

// Validation Provider
container.register<IValidationProvider>("ValidationProvider", {
  useValue: ZodValidationProvider,
});

// Database Adapter registration (MongoDB as default)
container.registerSingleton<IDatabaseAdapter>(
  "DatabaseAdapter",
  MongoDBAdapter
);
// Logger
container.registerSingleton<ILoggerProvider>(
  "LoggerProvider",
  PinoLoggerProvider
);
// Audit
container.registerSingleton<IAuditProvider>(
  "AuditProvider",
  MongoAuditProvider
);
// Cache
container.registerSingleton<ICacheProvider>(
  "CacheProvider",
  RedisCacheProvider
);

// Setup i18n cache provider
const cacheProvider = container.resolve<ICacheProvider>("CacheProvider");
setI18nCacheProvider(cacheProvider);

// Controller registration
container.register(AuthController, AuthController);
container.register(UserController, UserController);
container.register(AdminController, AdminController);
container.register(QuestionController, QuestionController);
container.register(AnswerController, AnswerController);

// Örnek resolve (kullanım):
// const authService = container.resolve<AuthService>("AuthService");
export { container };
