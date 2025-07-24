import 'reflect-metadata';
// container kullanılmıyor, kaldırıldı
import dotenv from 'dotenv';
import path from 'path';

// Test environment variables
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET_KEY'] = 'test-secret-key';

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, '../config/env/config.env.test'),
});

// i18n cache'i temizle
import { clearI18nCache } from '../types/i18n';

beforeAll(async () => {
  // Test ortamı hazır
  console.log('✅ Test environment initialized');
});

beforeEach(async () => {
  // Her test öncesi cache'i temizle
  clearI18nCache();
});

afterAll(async () => {
  // Test ortamı temizle
  console.log('🔚 Test environment cleaned up');
});
