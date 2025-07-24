import 'reflect-metadata';
import '../../services/container';
import { container } from 'tsyringe';
import mongoose from 'mongoose';
import * as path from 'path';
import { UserRepository } from '../../repositories/UserRepository';
import { QuestionRepository } from '../../repositories/QuestionRepository';
import { AnswerRepository } from '../../repositories/AnswerRepository';

require('dotenv').config({
  path: path.resolve(__dirname, '../../config/env/config.env'),
});

const PROD_MONGO_URI = process.env['MONGO_URI'];

if (!PROD_MONGO_URI) {
  console.error('MONGO_URI is not defined in environment variables');
  process.exit(1);
}

async function checkProdDatabase() {
  try {
    await mongoose.connect(PROD_MONGO_URI as string);
    console.log("Prod MongoDB'ye bağlandı (question-answer)");
    const userRepo = container.resolve<UserRepository>('UserRepository');
    const questionRepo =
      container.resolve<QuestionRepository>('QuestionRepository');
    const answerRepo = container.resolve<AnswerRepository>('AnswerRepository');
    const userCount = await userRepo.countAll();
    const questionCount = await questionRepo.countAll();
    const answerCount = await answerRepo.countAll();
    console.log(`\nProd Database Mevcut Veriler:`);
    console.log(`- Kullanıcılar: ${userCount}`);
    console.log(`- Sorular: ${questionCount}`);
    console.log(`- Cevaplar: ${answerCount}`);
  } catch (_error: any) {
    console.error('Hata:', _error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Prod MongoDB bağlantısı kapatıldı');
  }
}

if (require.main === module) {
  checkProdDatabase();
}
