/**
 * Jest setupFiles - runs before test framework.
 * Loads env so DATABASE_TYPE and other vars are set before container.ts is imported.
 */
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import https from 'https';

// Avoid MaxListenersExceededWarning from HTTP clients (AWS SDK R2, etc.) during tests
http.globalAgent.setMaxListeners(20);
https.globalAgent.setMaxListeners(20);

process.env['NODE_ENV'] = 'test';
const configFile = process.env['CONFIG_FILE'] || 'config.env.test';
dotenv.config({
  path: path.resolve(__dirname, '../config/env/', configFile),
  override: true,
});
