import 'reflect-metadata';

import { ApplicationSetup } from './services/ApplicationSetup';
import { ApplicationState } from './services/ApplicationState';

// Main application instance
const appSetup = new ApplicationSetup();
const app = appSetup.getApp();

// Server startup
async function startServer() {
  try {
    await appSetup.initialize();

    const config = ApplicationState.getInstance().config;
    appSetup.startServer(config.PORT, config.NODE_ENV);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server only if this is the main module
if (require.main === module) {
  startServer();
}

export default app;
