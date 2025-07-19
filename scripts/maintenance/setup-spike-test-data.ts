import 'reflect-metadata';
import '../../services/container';
import { container } from 'tsyringe';
import mongoose from 'mongoose';
import * as path from 'path';
import { UserRepository } from '../../repositories/UserRepository';
import { QuestionRepository } from '../../repositories/QuestionRepository';

const envPath = path.resolve(__dirname, '../../config/env/config.env.test');
require('dotenv').config({ path: envPath });

const MONGO_URI = process.env["MONGO_URI"];

const testUsers = [
  { email: 'spike1@example.com', password: 'password123', name: 'Spike One' },
  { email: 'spike2@example.com', password: 'password123', name: 'Spike Two' },
  { email: 'spike3@example.com', password: 'password123', name: 'Spike Three' },
  { email: 'spike4@example.com', password: 'password123', name: 'Spike Four' },
  { email: 'spike5@example.com', password: 'password123', name: 'Spike Five' },
];

if (!MONGO_URI) {
  console.error('MONGO_URI is not defined in environment variables');
  process.exit(1);
}

async function setupSpikeTestData() {
  try {
    await mongoose.connect(MONGO_URI as string);
    console.log('Test database connected.');
    const userRepo = container.resolve<UserRepository>('UserRepository');
    const questionRepo = container.resolve<QuestionRepository>('QuestionRepository');
    // Kullanıcıları ekle
    const createdUsers = [];
    for (const user of testUsers) {
      let exists = (await userRepo.findAll()).find((u: any) => u.email === user.email);
      if (!exists) {
        const newUser = await userRepo.create(user);
        createdUsers.push(newUser);
        console.log(`Kullanıcı eklendi: ${user.email}`);
      } else {
        createdUsers.push(exists);
        console.log(`Kullanıcı zaten var: ${user.email}`);
      }
    }
    // Soru ekle (ilk kullanıcıyı kullanarak)
    const allQuestions = await questionRepo.findAll();
    const questionExists = allQuestions.find((q: any) => q.title === 'Spike Test Question');
    if (!questionExists && createdUsers.length > 0) {
      if (!createdUsers[0]) throw new Error("createdUsers[0] is required");
      const sampleQuestion = {
        title: 'Spike Test Question',
        content: 'This is a spike test question with sufficient content length to meet validation requirements.',
        user: createdUsers[0]._id,
      };
      await questionRepo.create(sampleQuestion);
      console.log('Örnek soru eklendi.');
    } else if (questionExists) {
      console.log('Örnek soru zaten var.');
    } else {
      console.log('Kullanıcı bulunamadığı için soru eklenemedi.');
    }
    console.log('Spike test verileri hazır!');
  } catch (err) {
    console.error('Hata:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Test database bağlantısı kapatıldı.');
  }
}

if (require.main === module) {
  setupSpikeTestData();
} 