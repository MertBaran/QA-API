import { container } from "./services/container";
import { DatabaseIdFactory } from "./types/database";

console.log("=== Database Switch Test ===");

// Başlangıçta MongoDB kullanıyoruz
console.log("\n1. Initial state (MongoDB):");
const initialAdapter = container.resolve<any>("DatabaseAdapter");
console.log("Database adapter:", initialAdapter.constructor.name);
console.log("ID adapter:", initialAdapter.getIdAdapter().constructor.name);

// MongoDB ID oluştur
const mongoId = DatabaseIdFactory.createId();
console.log("MongoDB ID:", mongoId);
console.log("Is valid MongoDB ID:", DatabaseIdFactory.isValidId(mongoId));

// PostgreSQL'e geç
console.log("\n2. Switching to PostgreSQL:");
if (typeof (container as any).switchDatabase === 'function') {
  (container as any).switchDatabase("postgresql");
}

const newAdapter = container.resolve<any>("DatabaseAdapter");
console.log("Database adapter:", newAdapter.constructor.name);
console.log("ID adapter:", newAdapter.getIdAdapter().constructor.name);

// PostgreSQL ID oluştur
const postgresId = DatabaseIdFactory.createId();
console.log("PostgreSQL ID:", postgresId);
console.log("Is valid PostgreSQL ID:", DatabaseIdFactory.isValidId(postgresId));

// MongoDB ID'yi PostgreSQL ile test et
console.log("\n3. Testing MongoDB ID with PostgreSQL adapter:");
console.log(
  "MongoDB ID in PostgreSQL context:",
  DatabaseIdFactory.isValidId(mongoId)
);

// MongoDB'ye geri dön
console.log("\n4. Switching back to MongoDB:");
if (typeof (container as any).switchDatabase === 'function') {
  (container as any).switchDatabase("mongodb");
}

const finalAdapter = container.resolve<any>("DatabaseAdapter");
console.log("Database adapter:", finalAdapter.constructor.name);
console.log("ID adapter:", finalAdapter.getIdAdapter().constructor.name);

console.log("\n=== Test completed ==="); 