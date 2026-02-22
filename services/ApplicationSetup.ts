import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import path from 'path';

import { container, initializeContainer } from './container';
import { ApplicationState } from './ApplicationState';
import { HealthCheckController } from '../controllers/healthController';
import { WebSocketMonitorService } from './WebSocketMonitorService';
import routers from '../routers';
import { appErrorHandler } from '../middlewares/errors/appErrorHandler';
import { IQuestionModel } from '../models/interfaces/IQuestionModel';
import { IAnswerModel } from '../models/interfaces/IAnswerModel';
import {
  QuestionSearchDoc,
  AnswerSearchDoc,
} from '../infrastructure/search/SearchDocument';

export class ApplicationSetup {
  private app: Application;
  private server: any = null;
  private appState = ApplicationState.getInstance();
  private healthController = new HealthCheckController();

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // CORS
    this.app.use(
      cors({
        origin: true,
        credentials: true,
      })
    );

    // Body parser with increased limit for large captcha tokens
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    this.app.use(express.static(path.join(__dirname, '..', 'public')));
  }

  private setupRoutes(): void {
    // Health check endpoints
    this.app.get('/health/quick', (req: Request, res: Response, next: any) => {
      this.healthController.quickHealthCheck(req, res, next);
    });

    this.app.get('/health', async (req: Request, res: Response, next: any) => {
      await this.healthController.fullHealthCheck(req, res, next);
    });

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.send('QA API Server is running');
    });

    // API routes
    this.app.use('/api', routers);

    // Error handler - MUST BE LAST
    this.app.use(appErrorHandler);
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Starting QA API Application...');
      console.log('📦 Initializing application components...');

      // Initialize container and get config
      const config = await initializeContainer();
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      console.log(`🔧 Port: ${config.PORT}`);

      // Set application state
      this.appState.setReady(config);

      // IDatabaseConnectionConfig ve IDatabaseAdapter initializeContainer'da DATABASE_TYPE'a göre ayarlandı

      // Configure cache connection
      const cacheConfig = {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        url: config.REDIS_URL,
      };
      container.register('ICacheConnectionConfig', {
        useValue: cacheConfig,
      });

      // Connect to database - CRITICAL: Exit if database connection fails
      const configService = container.resolve<any>('IConfigurationService');
      const dbConnConfig = configService.getDatabaseConnectionConfig();
      const dbType = configService.getDatabaseType();
      const connStrMasked = dbConnConfig.connectionString.replace(
        /(mongodb\+srv|postgresql):\/\/[^:]+:[^@]+@/,
        '$1://***:***@'
      );
      console.log('🔌 Attempting to connect to database...');
      console.log(
        `📡 Database: ${dbType} - ${connStrMasked}`
      ); // Hide credentials

      let databaseAdapter: any = null;
      try {
        databaseAdapter = container.resolve<any>('IDatabaseAdapter');

        // Add timeout for database connection (15 seconds)
        const connectionPromise = databaseAdapter.connect();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () =>
              reject(new Error('Database connection timeout after 15 seconds')),
            15000
          );
        });

        console.log('⏳ Waiting for database connection...');

        // Progress indicator while waiting for connection
        let dots = 0;
        let seconds = 0;
        const messages = [
          '⏳ Connecting to database',
          '🔌 Establishing connection',
          '📡 Verifying database',
          '🔍 Checking credentials',
          '⚡ Testing connection',
        ];
        let messageIndex = 0;

        const progressInterval = setInterval(() => {
          seconds++;
          dots = (dots + 1) % 4;
          const dotString = '.'.repeat(dots) + ' '.repeat(3 - dots);
          const currentMessage = messages[messageIndex % messages.length];
          process.stdout.write(`${currentMessage}${dotString} (${seconds}s)\r`);

          // Change message every 3 seconds
          if (seconds % 3 === 0) {
            messageIndex++;
          }
        }, 1000);

        try {
          await Promise.race([connectionPromise, timeoutPromise]);
          clearInterval(progressInterval);
          process.stdout.write('\r'); // Clear the progress line
        } catch (error) {
          clearInterval(progressInterval);
          process.stdout.write('\r'); // Clear the progress line
          throw error;
        }

        console.log('✅ Database connection established successfully');
        console.log('🔗 Database is ready for operations');
      } catch (dbError) {
        console.error(
          '\x1b[31m❌ CRITICAL: Database connection failed!\x1b[0m'
        );
        console.error('\x1b[31m📊 Error details:\x1b[0m', {
          message: dbError instanceof Error ? dbError.message : String(dbError),
          name: dbError instanceof Error ? dbError.name : 'Unknown',
          code: (dbError as any)?.code || 'UNKNOWN',
        });
        console.error(
          '\x1b[31m🔍 Connection string:\x1b[0m',
          connStrMasked
        );
        console.error('');
        console.error(
          '\x1b[31m🛑 Application cannot start without database connection.\x1b[0m'
        );
        console.error('\x1b[31m💡 Please check:\x1b[0m');
        console.error(
          `\x1b[31m   - ${dbType === 'postgresql' ? 'PostgreSQL' : 'MongoDB'} server is running\x1b[0m`
        );
        console.error('\x1b[31m   - Connection string is correct\x1b[0m');
        console.error('\x1b[31m   - Network connectivity\x1b[0m');
        console.error('\x1b[31m   - Database credentials\x1b[0m');
        console.error('');
        console.log('🔄 Shutting down application gracefully...');

        // Graceful shutdown: disconnect database if connected
        if (databaseAdapter) {
          try {
            await databaseAdapter.disconnect();
            console.log('✅ Database disconnected successfully');
          } catch (disconnectError) {
            const disconnectMsg =
              disconnectError instanceof Error
                ? disconnectError.message
                : String(disconnectError);
            console.error(
              '\x1b[31m⚠️ Error during database disconnection:\x1b[0m',
              `\x1b[31m${disconnectMsg}\x1b[0m`
            );
          }
        }

        console.log('👋 Application shutdown complete');
        // Exit with code 0 to indicate graceful shutdown (not a crash)
        process.exit(0);
      }

      // Initialize cache provider
      console.log('🔌 Attempting to connect to cache (Redis)...');
      try {
        const cacheProvider = container.resolve<any>('ICacheProvider');
        console.log('✅ Cache provider initialized successfully');
      } catch (cacheError) {
        const cacheMsg =
          cacheError instanceof Error ? cacheError.message : String(cacheError);
        console.error(
          '\x1b[31m⚠️ Cache connection failed, but continuing without cache:\x1b[0m',
          `\x1b[31m${cacheMsg}\x1b[0m`
        );
        console.warn('💡 Application will use memory cache as fallback');
      }

      // Check Cloudflare R2 connection
      console.log('☁️  Checking Cloudflare R2 connection...');
      try {
        const configService = container.resolve<any>('IConfigurationService');
        const storageConfig = configService.getObjectStorageConfig();

        if (storageConfig.provider === 'cloudflare-r2') {
          const storageProvider = container.resolve<any>(
            'IObjectStorageProvider'
          );

          // Test connection with a simple list operation (max 1 key, timeout 15 seconds)
          const listPromise = storageProvider.listObjects({ maxKeys: 1 });
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error('R2 connection timeout after 15 seconds')),
              15000
            );
          });

          await Promise.race([listPromise, timeoutPromise]);
          console.log('✅ Cloudflare R2 connection verified successfully');
        } else {
          console.log('Cloudflare R2 is not configured, skipping check');
        }
      } catch (r2Error) {
        const errorMessage =
          r2Error instanceof Error ? r2Error.message : String(r2Error);
        console.error(
          '\x1b[31m⚠️ Cloudflare R2 connection check failed, but continuing:\x1b[0m',
          `\x1b[31m${errorMessage}\x1b[0m`
        );
      }

      // EntityType'lar model dosyalarında export edildiğinde otomatik register edilir
      // Side-effect registration sayesinde ApplicationSetup'ın model'lere bağımlı olmasına gerek yok

      // Initialize Elasticsearch if enabled
      try {
        const configService = container.resolve<any>('IConfigurationService');
        const esConfig = configService.getElasticsearchConfig();

        if (esConfig.enabled) {
          console.log('🔍 Initializing Elasticsearch...');
          const elasticsearchClient = container.resolve<any>(
            'IElasticsearchClient'
          );
          const isConnected = await elasticsearchClient.isConnected();

          if (isConnected) {
            console.log('✅ Elasticsearch connected successfully');

            // Start log shipper
            const logShipper = container.resolve<any>(
              'IElasticsearchLogShipper'
            );
            // Enable before checking - enable() sets the flag used by isEnabled()
            (logShipper as any).enable?.();
            if (logShipper.isEnabled()) {
              await logShipper.start();
              console.log('✅ Elasticsearch log shipper started');
            }

            // Initialize indexes - Self-registering projectors
            const searchClient = container.resolve<any>('ISearchClient');

            // Projector'ları resolve et (constructor'da kendi index'lerini register ederler)
            container.resolve<any>(
              'IProjector<IQuestionModel, QuestionSearchDoc>'
            );
            container.resolve<any>('IProjector<IAnswerModel, AnswerSearchDoc>');

            // Register edilmiş tüm index'leri initialize et
            await searchClient.initializeRegisteredIndexes();
            console.log('✅ Elasticsearch indexes initialized');
          } else {
            console.error(
              '\x1b[31m⚠️ Elasticsearch is enabled but connection failed, continuing without Elasticsearch\x1b[0m'
            );
          }
        } else {
          console.log('ℹ️  Elasticsearch is disabled');
        }
      } catch (esError) {
        const esMsg =
          esError instanceof Error ? esError.message : String(esError);
        console.error(
          '\x1b[31m⚠️ Elasticsearch initialization failed, continuing without Elasticsearch:\x1b[0m',
          `\x1b[31m${esMsg}\x1b[0m`
        );
      }

      // Connection monitoring WebSocket ile yapılacak (setInterval kaldırıldı)

      console.log(`✅ Bootstrap completed successfully`);
    } catch (error) {
      const initErrorMsg =
        error instanceof Error ? error.message : String(error);
      console.error(
        '\x1b[31m❌ Failed to initialize application:\x1b[0m',
        `\x1b[31m${initErrorMsg}\x1b[0m`
      );
      console.log('🔄 Shutting down application gracefully...');

      // Try to disconnect database if it was connected
      try {
        const databaseAdapter = container.resolve<any>('IDatabaseAdapter');
        if (databaseAdapter && databaseAdapter.isConnected()) {
          await databaseAdapter.disconnect();
          console.log('✅ Database disconnected successfully');
        }
      } catch (disconnectError) {
        // Database might not be initialized, ignore error
      }

      console.log('👋 Application shutdown complete');
      // Exit with code 0 to indicate graceful shutdown (not a crash)
      process.exit(0);
    }
  }

  startServer(port: number, environment: string): void {
    this.server = this.app.listen(port, () => {
      console.log('');
      console.log('🎉 ================================================');
      console.log('🎉           QA API SERVER STARTED');
      console.log('🎉 ================================================');
      console.log(`🌍 Environment: ${environment}`);
      console.log(`🔧 Port: ${port}`);
      console.log(`🌐 Server URL: http://localhost:${port}`);
      console.log('');

      // Initialize WebSocket monitoring after server is started
      this.initializeWebSocketMonitoring();
      console.log(`🔌 WebSocket monitoring: ws://localhost:${port}`);

      // Health check endpoints
      console.log(`📊 Health checks available:`);
      console.log(`  - Quick: http://localhost:${port}/health/quick`);
      console.log(`  - Full:  http://localhost:${port}/health`);

      console.log('');
      console.log('✅ Application is ready to accept requests!');
      console.log('===============================================');
      console.log('');
    });
  }

  private initializeWebSocketMonitoring(): void {
    try {
      const webSocketMonitor = container.resolve<WebSocketMonitorService>(
        'WebSocketMonitorService'
      );
      webSocketMonitor.initialize(this.server);
      webSocketMonitor.startMonitoring(30000);
      console.log('🔌 WebSocket monitoring initialized successfully');
    } catch (error) {
      const wsErrorMsg = error instanceof Error ? error.message : String(error);
      console.error(
        '\x1b[31m❌ Failed to initialize WebSocket monitoring:\x1b[0m',
        `\x1b[31m${wsErrorMsg}\x1b[0m`
      );
    }
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down server...');

    try {
      const webSocketMonitor = container.resolve<WebSocketMonitorService>(
        'WebSocketMonitorService'
      );
      await webSocketMonitor.close();
      console.log('✅ WebSocket server closed');
    } catch (error) {
      // WebSocket may not be initialized yet
      const errMsg = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ WebSocket shutdown:', errMsg);
    }

    return new Promise<void>(resolve => {
      if (this.server) {
        this.server.close(() => {
          console.log('✅ HTTP server closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getApp(): Application {
    return this.app;
  }
}
