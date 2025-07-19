import 'reflect-metadata';
import '../../services/container';
import { container } from 'tsyringe';
import mongoose from 'mongoose';
import * as path from 'path';
import { UserRepository } from '../../repositories/UserRepository';
import { QuestionRepository } from '../../repositories/QuestionRepository';
import { AnswerRepository } from '../../repositories/AnswerRepository';

require('dotenv').config({ path: path.resolve(__dirname, '../../config/env/config.env') });

const MONGODB_URI = process.env["MONGO_URI"];

if (!MONGODB_URI) {
  console.error('MONGO_URI is not defined in environment variables');
  process.exit(1);
}
if (/test/i.test(MONGODB_URI)) {
  console.error('ERROR: This script will NOT run on a database URI containing "test". Aborting.');
  process.exit(1);
}

async function cleanProductionDatabase() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to production database');
    const userRepo = container.resolve<UserRepository>('UserRepository');
    const questionRepo = container.resolve<QuestionRepository>('QuestionRepository');
    const answerRepo = container.resolve<AnswerRepository>('AnswerRepository');
    const deletedUsers = await userRepo.deleteAll();
    const deletedQuestions = await questionRepo.deleteAll();
    const deletedAnswers = await answerRepo.deleteAll();
    console.log(`\nTemizleme sonuçları:`);
    console.log(`- Silinen kullanıcılar: ${deletedUsers.deletedCount}`);
    console.log(`- Silinen sorular: ${deletedQuestions.deletedCount}`);
    console.log(`- Silinen cevaplar: ${deletedAnswers.deletedCount}`);
    console.log('\n✅ Production database cleaned successfully!');
  } catch (error) {
    console.error('Error cleaning production database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

if (require.main === module) {
  cleanProductionDatabase();
} 