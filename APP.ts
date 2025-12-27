import 'reflect-metadata';

import { ApplicationSetup } from './services/ApplicationSetup';
import { ApplicationState } from './services/ApplicationState';
import { container } from './services/container';

// Main application instance
const appSetup = new ApplicationSetup();
const app = appSetup.getApp();

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

  try {
    // Shutdown server first
    await appSetup.shutdown();
  } catch (error) {
    const shutdownErrorMsg =
      error instanceof Error ? error.message : String(error);
    console.error(
      '\x1b[31mError during server shutdown:\x1b[0m',
      `\x1b[31m${shutdownErrorMsg}\x1b[0m`
    );
  }

  try {
    // Disconnect from database
    const databaseAdapter = container.resolve<any>('IDatabaseAdapter');
    if (databaseAdapter && databaseAdapter.isConnected()) {
      console.log('🔌 Disconnecting from database...');
      await databaseAdapter.disconnect();
      console.log('Database disconnected');
    }
  } catch (error) {
    const dbDisconnectErrorMsg =
      error instanceof Error ? error.message : String(error);
    console.error(
      '\x1b[31mError during database disconnection:\x1b[0m',
      `\x1b[31m${dbDisconnectErrorMsg}\x1b[0m`
    );
  }

  console.log(' Shutdown complete');
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
    const startErrorMsg =
      error instanceof Error ? error.message : String(error);
    console.error(
      '\x1b[31m❌ CRITICAL: Failed to start server:\x1b[0m',
      `\x1b[31m${startErrorMsg}\x1b[0m`
    );
    console.log('Shutting down application gracefully...');

    // Try to disconnect database if it was connected
    try {
      const databaseAdapter = container.resolve<any>('IDatabaseAdapter');
      if (databaseAdapter && databaseAdapter.isConnected()) {
        await databaseAdapter.disconnect();
        console.log('Database disconnected successfully');
      }
    } catch (disconnectError) {
      // Database might not be initialized, ignore error
    }

    console.log('Application shutdown complete');
    // Exit with code 0 to indicate graceful shutdown (not a crash)
    process.exit(0);
  }
}

// Start server only if this is the main module
if (require.main === module) {
  startServer();
}

export default app;
