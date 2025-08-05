import 'reflect-metadata';

import { ApplicationSetup } from './services/ApplicationSetup';
import { ApplicationState } from './services/ApplicationState';

// Main application instance
const appSetup = new ApplicationSetup();
const app = appSetup.getApp();

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  process.exit(0);
};

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Server startup
async function startServer() {
  try {
    console.log('🚀 Starting QA API Server...');
    console.log('📊 Environment:', process.env['NODE_ENV'] || 'development');

    await appSetup.initialize();

    const config = ApplicationState.getInstance().config;
    appSetup.startServer(config.PORT, config.NODE_ENV);
  } catch (error) {
    console.error('❌ CRITICAL: Failed to start server:', error);
    console.error('🛑 Application cannot start. Exiting...');
    process.exit(1);
  }
}

// Start server only if this is the main module
if (require.main === module) {
  startServer();
}

export default app;
