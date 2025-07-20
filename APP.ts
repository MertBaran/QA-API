import 'reflect-metadata';
import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import path from 'path';

// Import container and bootstrap service
import { container, config } from './services/container';
import { BootstrapService } from './services/BootstrapService';
import { HealthCheckService } from './services/HealthCheckService';
import routers from './routers';
import customErrorHandler from './middlewares/errors/customErrorHandler';

const app: Application = express();

// CORS and Language Middleware
app.use(
  cors({
    origin: true, // Allow all origins for development
    credentials: true,
  })
);

// Body Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const _healthCheckService =
      container.resolve<HealthCheckService>('HealthCheckService');
    const health = await _healthCheckService.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World');
});

// Use Routers Middleware
app.use('/api', routers);

// Custom Error Handler - MUST BE LAST
app.use(customErrorHandler);

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
async function startServer() {
  try {
    const _bootstrapService =
      container.resolve<BootstrapService>('BootstrapService');
    const _healthCheckService =
      container.resolve<HealthCheckService>('HealthCheckService');

    console.log(`🔧 Starting server: ${config.NODE_ENV} environment`);

    // Connect to database
    const databaseAdapter = container.resolve<any>('IDatabaseAdapter');
    await databaseAdapter.connect();

    // Cache provider is initialized automatically on first use
    const _cacheProvider = container.resolve<any>('ICacheProvider');
    console.log('🔗 Cache provider initialized');

    // Only start the server if this is the main module (not imported for testing)
    if (require.main === module) {
      app.listen(config.PORT, () => {
        console.log(
          `🚀 Server is running on port ${config.PORT} in ${config.NODE_ENV} environment`
        );
      });
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export default app;
