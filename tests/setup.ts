import 'reflect-metadata';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Set test environment before any other imports
process.env['NODE_ENV'] = 'test';

// Load test environment variables first
dotenv.config({
  path: path.resolve(__dirname, '../config/env/config.env.test'),
});

import { container } from 'tsyringe';
import { FakeLoggerProvider } from './mocks/logger/FakeLoggerProvider';
import { FakeCacheProvider } from './mocks/cache/FakeCacheProvider';
import { FakeAuditProvider } from './mocks/audit/FakeAuditProvider';
import { FakeEmailService } from './mocks/email/FakeEmailService';
import { FakeNotificationProvider } from './mocks/notification/FakeNotificationProvider';
import { FakeUserDataSource } from './mocks/datasource/FakeUserDataSource';
import { FakeQuestionDataSource } from './mocks/datasource/FakeQuestionDataSource';
import { FakeAnswerDataSource } from './mocks/datasource/FakeAnswerDataSource';
import { setI18nCacheProvider, clearI18nCache } from '../types/i18n';

const MONGO_URI =
  process.env['MONGO_URI'] || 'mongodb://localhost:27017/qa-test';

beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(MONGO_URI);

  // Clear any existing registrations and register test providers
  container.clearInstances();

  // Register test providers in DI container (override production ones)
  container.register('LoggerProvider', { useClass: FakeLoggerProvider });
  container.register('AuditProvider', { useClass: FakeAuditProvider });
  container.register('CacheProvider', { useClass: FakeCacheProvider });
  container.register('EmailService', { useClass: FakeEmailService });
  container.register('EmailManager', { useClass: FakeEmailService });
  container.register('EmailNotificationProvider', {
    useClass: FakeNotificationProvider,
  });

  // Setup i18n with fake cache provider for tests
  const fakeCacheProvider =
    container.resolve<FakeCacheProvider>('CacheProvider');
  setI18nCacheProvider(fakeCacheProvider);

  // Register test data sources (override production MongoDB data sources)
  container.register('UserDataSource', { useValue: new FakeUserDataSource() });
  container.register('QuestionDataSource', {
    useValue: new FakeQuestionDataSource(),
  });
  container.register('AnswerDataSource', {
    useValue: new FakeAnswerDataSource(),
  });

  console.log('✅ Test environment initialized with fake data sources');
});

beforeEach(async () => {
  // Clear database collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    if (collection) {
      await collection.deleteMany({});
    }
  }

  // Clear i18n cache before each test
  await clearI18nCache();

  // Clear fake providers
  try {
    const fakeCache = container.resolve<FakeCacheProvider>('CacheProvider');
    if (fakeCache && typeof fakeCache.del === 'function') {
      await fakeCache.del('*'); // Clear all cache keys
    }

    const fakeEmail = container.resolve<FakeEmailService>('EmailService');
    if (fakeEmail && fakeEmail.sent) fakeEmail.sent.length = 0;

    const fakeNotification = container.resolve<FakeNotificationProvider>(
      'EmailNotificationProvider'
    );
    if (fakeNotification && fakeNotification.sent)
      fakeNotification.sent.length = 0;

    // Clear fake data sources
    const fakeUserDS = container.resolve<FakeUserDataSource>('UserDataSource');
    const fakeQuestionDS =
      container.resolve<FakeQuestionDataSource>('QuestionDataSource');
    const fakeAnswerDS =
      container.resolve<FakeAnswerDataSource>('AnswerDataSource');

    if (fakeUserDS && typeof fakeUserDS.deleteAll === 'function') {
      await fakeUserDS.deleteAll();
    }
    if (fakeQuestionDS && typeof fakeQuestionDS.deleteAll === 'function') {
      await fakeQuestionDS.deleteAll();
    }
    if (fakeAnswerDS && typeof fakeAnswerDS.deleteAll === 'function') {
      await fakeAnswerDS.deleteAll();
    }
  } catch (error) {
    console.warn('Warning: Could not clear some fake providers:', error);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
  console.log('🔚 Test environment cleaned up');
});
