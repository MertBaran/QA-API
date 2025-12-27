// src/infrastructure/r2/R2Client.ts
import { config as loadEnv } from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';

// 1) Proje köküne göre .env yolunu belirle
// Eğer dosyanın adı farklıysa (mesela config.env) buradaki ".env" kısmını değiştir.
const envPath = path.resolve(process.cwd(), 'config/env/config.env');

// Debug için istersen bir kere bakıp sonra silebilirsin:
console.log('[R2] .env path:', envPath);

loadEnv({ path: envPath });

// 2) Env değerlerini tek bir config objesine alalım
const config = {
  R2_ACCESS_KEY_ID: process.env['R2_ACCESS_KEY_ID'],
  R2_SECRET_ACCESS_KEY: process.env['R2_SECRET_ACCESS_KEY'],
  R2_ACCOUNT_ID: process.env['R2_ACCOUNT_ID'],
  R2_BUCKET: process.env['R2_BUCKET'],
  R2_ENDPOINT: process.env['R2_ENDPOINT'],
};

// 3) Eksik env varsa net bir hata fırlat
for (const key of Object.keys(config)) {
  if (!config[key as keyof typeof config]) {
    throw new Error(
      `R2 config hatası: '${key}' .env içinde tanımlı değil. Yüklenen dosya: ${envPath}`
    );
  }
}

// 4) S3 client
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: config['R2_ENDPOINT'],
  credentials: {
    accessKeyId: config['R2_ACCESS_KEY_ID']!,
    secretAccessKey: config['R2_SECRET_ACCESS_KEY']!,
  },
  forcePathStyle: true,
});

export async function uploadTextObject(key: string, content: string) {
  console.log('✅ R2 upload başladı:');
  const command = new PutObjectCommand({
    Bucket: config['R2_BUCKET'],
    Key: key,
    Body: content,
  });

  const result = await r2Client.send(command);
  console.log('✅ R2 upload tamam:', {
    bucket: config['R2_BUCKET'],
    key,
    statusCode: result.$metadata.httpStatusCode,
    requestId: result.$metadata.requestId,
  });
  return result;
}

async function main() {
  const key = 'smoke-tests/r2-' + Date.now() + '.txt';
  const content = 'Hello from r2-smoke-test at ' + new Date().toISOString();

  console.log('🚀 R2 smoke test başlıyor. Key:', key);

  await uploadTextObject(key, content);

  console.log(
    "🎉 R2 smoke test tamamlandı. Cloudflare R2 bucket'ında bu key'i arayabilirsin:"
  );
  console.log('   ', key);
}

// main'i ÇAĞIR
main().catch(err => {
  console.error('❌ R2 smoke test HATASI:', err);
  process.exit(1);
});
