import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import path from 'path';

import { container, initializeContainer } from './container';
import { ApplicationState } from './ApplicationState';
import { HealthCheckController } from '../controllers/healthController';
import { WebSocketMonitorService } from './WebSocketMonitorService';
import routers from '../routers';
import customErrorHandler from '../middlewares/errors/customErrorHandler';

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

    // Body parser
    this.app.use(express.json());

    // Static files
    this.app.use(express.static(path.join(__dirname, '..', 'public')));
  }

  private setupRoutes(): void {
    // Health check endpoints
    this.app.get('/health/quick', (req: Request, res: Response) => {
      this.healthController.quickHealthCheck(req, res);
    });

    this.app.get('/health', async (req: Request, res: Response) => {
      await this.healthController.fullHealthCheck(req, res);
    });

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.send('QA API Server is running');
    });

    // API routes
    this.app.use('/api', routers);

    // Error handler - MUST BE LAST
    this.app.use(customErrorHandler);
  }

  async initialize(): Promise<void> {
    try {
      // Initialize container and get config
      const config = await initializeContainer();

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

      // Connect to database
      const databaseAdapter = container.resolve<any>('IDatabaseAdapter');
      await databaseAdapter.connect();

      // Initialize cache provider
      const cacheProvider = container.resolve<any>('ICacheProvider');

      // Connection monitoring WebSocket ile yapılacak (setInterval kaldırıldı)

      console.log(`✅ Bootstrap completed successfully`);
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      throw error;
    }
  }

  startServer(port: number, environment: string): void {
    this.server = this.app.listen(port, () => {
      console.log(
        `🚀 Server is running on port ${port} in ${environment} environment`
      );

      // Initialize WebSocket monitoring after server is started
      this.initializeWebSocketMonitoring();
      console.log(`🔌 WebSocket monitoring: ws://localhost:${port}`);
      // Health check endpoints (en sonda)
      console.log(`📊 Health checks available:`);
      console.log(`  - Quick: http://localhost:${port}/health/quick`);
      console.log(`  - Full:  http://localhost:${port}/health`);
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
