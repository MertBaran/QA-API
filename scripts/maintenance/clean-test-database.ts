import 'reflect-metadata';
import '../../services/container';
import { container } from 'tsyringe';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserRepository } from '../../repositories/UserRepository';
import { QuestionRepository } from '../../repositories/QuestionRepository';
import { AnswerRepository } from '../../repositories/AnswerRepository';
import * as path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../config/env/config.env.test'),
});

const TEST_MONGO_URI = process.env['MONGO_URI'];

if (!TEST_MONGO_URI || !/test/i.test(TEST_MONGO_URI)) {
  console.error(
    'ERROR: This script will only run if the database URI contains "test". Aborting.'
  );
  process.exit(1);
}

async function cleanTestDatabase() {
  try {
    await mongoose.connect(TEST_MONGO_URI as string);
    console.log("Test MongoDB'ye bağlandı (question-answer-test)");
    const userRepo = container.resolve<UserRepository>('UserRepository');
    const questionRepo =
      container.resolve<QuestionRepository>('QuestionRepository');
    const answerRepo = container.resolve<AnswerRepository>('AnswerRepository');
    const userCount = await userRepo.countAll();
    const questionCount = await questionRepo.countAll();
    const answerCount = await answerRepo.countAll();
    console.log(`\n=== TEST DATABASE TEMİZLİĞİ ===`);
    console.log(`Temizlemeden önce:`);
    console.log(`- Kullanıcılar: ${userCount}`);
    console.log(`- Sorular: ${questionCount}`);
    console.log(`- Cevaplar: ${answerCount}`);
    const deletedUsers = await userRepo.deleteAll();
    const deletedQuestions = await questionRepo.deleteAll();
    const deletedAnswers = await answerRepo.deleteAll();
    console.log(`\nTemizleme sonuçları:`);
    console.log(`- Silinen kullanıcılar: ${deletedUsers.deletedCount}`);
    console.log(`- Silinen sorular: ${deletedQuestions.deletedCount}`);
    console.log(`- Silinen cevaplar: ${deletedAnswers.deletedCount}`);
    const finalUserCount = await userRepo.countAll();
    const finalQuestionCount = await questionRepo.countAll();
    const finalAnswerCount = await answerRepo.countAll();
    console.log(`\nTemizlemeden sonra:`);
    console.log(`- Kullanıcılar: ${finalUserCount}`);
    console.log(`- Sorular: ${finalQuestionCount}`);
    console.log(`- Cevaplar: ${finalAnswerCount}`);
    console.log('\n✅ Test database tamamen temizlendi!');
  } catch (_error: any) {
    console.error('Hata:', _error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Test MongoDB bağlantısı kapatıldı');
  }
}

if (require.main === module) {
  cleanTestDatabase();
}
