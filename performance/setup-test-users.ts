import mongoose from "mongoose";
import UserMongo from "../models/mongodb/UserMongoModel";
import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "../config/env/config.env.test"),
});

interface TestUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const testUsers: TestUser[] = [
  { firstName: "Test", lastName: "User1", email: "test1@example.com", password: "password123" },
  { firstName: "Test", lastName: "User2", email: "test2@example.com", password: "password123" },
  { firstName: "Test", lastName: "User3", email: "test3@example.com", password: "password123" },
  { firstName: "Spike", lastName: "User1", email: "spike1@example.com", password: "password123" },
  { firstName: "Spike", lastName: "User2", email: "spike2@example.com", password: "password123" },
  { firstName: "Spike", lastName: "User3", email: "spike3@example.com", password: "password123" },
  { firstName: "Spike", lastName: "User4", email: "spike4@example.com", password: "password123" },
  { firstName: "Spike", lastName: "User5", email: "spike5@example.com", password: "password123" },
];

export async function setupTestUsers(): Promise<void> {
  try {
    await mongoose.connect(process.env["MONGODB_URI"] || "mongodb://localhost:27017/qa-api");
    console.log("MongoDB'ye bağlandı");

    await UserMongo.deleteMany({
      email: { $in: testUsers.map((user) => user.email) },
    });
    console.log("Mevcut test kullanıcıları temizlendi");

    const createdUsers = [];
    for (const userData of testUsers) {
      const user = new UserMongo({
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        password: userData.password,
        role: "user",
      });
      await user.save();
      createdUsers.push(user);
      console.log(`Kullanıcı oluşturuldu: ${userData.email}`);
    }

    console.log(`\nToplam ${createdUsers.length} test kullanıcısı oluşturuldu:`);
    createdUsers.forEach((user) => {
      console.log(`- ${user.email}`);
    });

    console.log("\nTest kullanıcıları hazır! Performans testlerini çalıştırabilirsiniz.");
  } catch (error: any) {
    console.error("Hata:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB bağlantısı kapatıldı");
  }
}

if (require.main === module) {
  setupTestUsers();
}

export { testUsers }; 