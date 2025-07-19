import 'reflect-metadata';
import '../../services/container';
import { container } from 'tsyringe';
import mongoose from 'mongoose';
import * as path from 'path';
import { UserRepository } from '../../repositories/UserRepository';
import { QuestionRepository } from '../../repositories/QuestionRepository';
import { AnswerRepository } from '../../repositories/AnswerRepository';

const envPath = path.resolve(__dirname, '../../config/env/config.env.test');
require('dotenv').config({ path: envPath });

const TEST_MONGO_URI = process.env["MONGO_URI"];

if (!TEST_MONGO_URI) {
  console.error('MONGO_URI is not defined in environment variables');
  process.exit(1);
}

async function checkTestDatabase() {
  try {
    await mongoose.connect(TEST_MONGO_URI as string);
    console.log('Test MongoDB\'ye bağlandı (question-answer-test)');
    const userRepo = container.resolve<UserRepository>('UserRepository');
    const questionRepo = container.resolve<QuestionRepository>('QuestionRepository');
    const answerRepo = container.resolve<AnswerRepository>('AnswerRepository');
    const userCount = await userRepo.countAll();
    const questionCount = await questionRepo.countAll();
    const answerCount = await answerRepo.countAll();
    console.log(`\nTest Database Mevcut Veriler:`);
    console.log(`- Kullanıcılar: ${userCount}`);
    console.log(`- Sorular: ${questionCount}`);
    console.log(`- Cevaplar: ${answerCount}`);
    // Test kullanıcılarını kontrol et
    const allUsers = await userRepo.findAll();
    const testUsers = allUsers.filter((user: any) =>
      /spike\d+@example\.com/.test(user.email) || /test\d+@example\.com/.test(user.email)
    );
    console.log(`\nTest Kullanıcıları:`);
    console.log(`- Bulunan test kullanıcısı: ${testUsers.length}`);
    if (testUsers.length > 0) {
      testUsers.forEach((user: any) => {
        console.log(`  - ${user.email}`);
      });
    } else {
      console.log('  - Test kullanıcısı bulunamadı!');
    }
  } catch (error: any) {
    console.error('Hata:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Test MongoDB bağlantısı kapatıldı');
  }
}

if (require.main === module) {
  checkTestDatabase();
} 