import 'reflect-metadata';
// Side-effect import: dotenv'i TÜM diğer modüllerden önce yükler.
// TypeScript import'ları hoist ettiği için, dotenv.config() inline yazılsa bile
// diğer import'lar (container.ts vs.) ondan ÖNCE çalışır. Ayrı modül bunu çözer.
import './config/env/loadEnv';

import { ApplicationSetup } from './services/ApplicationSetup';
import { ApplicationState } from './services/ApplicationState';
import { container, initializeContainer } from './services/container';

let appSetup: ApplicationSetup;
let app: ReturnType<ApplicationSetup['getApp']> | undefined = undefined;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

  try {
    if (appSetup) await appSetup.shutdown();
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

    // Container init ÖNCE - router'lar ApplicationSetup ile yüklenecek, doğru datasource (PG/Mongo) seçilmiş olacak
    await initializeContainer();
    appSetup = new ApplicationSetup();
    app = appSetup.getApp();
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

// Testler setup.ts'teki testApp kullanmalı; bu export sadece sunucu çalışırken dolu
export default app;
