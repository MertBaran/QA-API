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

      // Configure database connection
      const databaseConfig = {
        connectionString: config.MONGO_URI,
      };
      container.register('IDatabaseConnectionConfig', {
        useValue: databaseConfig,
      });

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
      console.log('🔌 Attempting to connect to database...');
      console.log(
        `📡 Database URI: ${config.MONGO_URI.replace(/\/\/.*@/, '//***:***@')}`
      ); // Hide credentials

      try {
        const databaseAdapter = container.resolve<any>('IDatabaseAdapter');

        // Add timeout for database connection
        const connectionPromise = databaseAdapter.connect();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () =>
              reject(new Error('Database connection timeout after 30 seconds')),
            30000
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
        console.error('❌ CRITICAL: Database connection failed!');
        console.error('📊 Error details:', {
          message: dbError instanceof Error ? dbError.message : String(dbError),
          name: dbError instanceof Error ? dbError.name : 'Unknown',
          code: (dbError as any)?.code || 'UNKNOWN',
        });
        console.error(
          '🔍 Connection string:',
          config.MONGO_URI.replace(/\/\/.*@/, '//***:***@')
        );
        console.error('');
        console.error(
          '🛑 Application cannot start without database connection.'
        );
        console.error('💡 Please check:');
        console.error('   - MongoDB server is running');
        console.error('   - Connection string is correct');
        console.error('   - Network connectivity');
        console.error('   - Database credentials');
        console.error('');
        console.error('🔄 Shutting down application...');
        process.exit(1);
      }

      // Initialize cache provider
      console.log('🔌 Attempting to connect to cache (Redis)...');
      try {
        const cacheProvider = container.resolve<any>('ICacheProvider');
        console.log('✅ Cache provider initialized successfully');
      } catch (cacheError) {
        console.warn(
          '⚠️ Cache connection failed, but continuing without cache:',
          cacheError instanceof Error ? cacheError.message : String(cacheError)
        );
        console.warn('💡 Application will use memory cache as fallback');
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
            if (logShipper.isEnabled()) {
              (logShipper as any).enable?.();
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
            console.warn(
              '⚠️ Elasticsearch is enabled but connection failed, continuing without Elasticsearch'
            );
          }
        } else {
          console.log('ℹ️  Elasticsearch is disabled');
        }
      } catch (esError) {
        console.warn(
          '⚠️ Elasticsearch initialization failed, continuing without Elasticsearch:',
          esError instanceof Error ? esError.message : String(esError)
        );
      }

      // Connection monitoring WebSocket ile yapılacak (setInterval kaldırıldı)

      console.log(`✅ Bootstrap completed successfully`);
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      console.error('🛑 Application initialization failed. Shutting down...');
      process.exit(1);
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
      console.error('❌ Failed to initialize WebSocket monitoring:', error);
    }
  }

  getApp(): Application {
    return this.app;
  }
}
