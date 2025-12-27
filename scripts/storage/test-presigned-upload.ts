#!/usr/bin/env ts-node
/**
 * Presigned URL Upload Test
 * Tests actual upload using presigned URL
 */

import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import { initializeContainer } from '../../services/container';
import {
  ContentAssetType,
  ContentAssetVisibility,
} from '../../infrastructure/storage/content/ContentAssetType';
import { IContentAssetService } from '../../infrastructure/storage/content/IContentAssetService';
import { TOKENS } from '../../services/TOKENS';
import { container } from '../../services/container';

// Load environment variables
const envPath = path.resolve(process.cwd(), 'config/env/config.env');
console.log('[Presigned Upload Test] .env path:', envPath);
loadEnv({ path: envPath });

async function testPresignedUpload() {
  try {
    console.log('🚀 Presigned URL Upload Test başlıyor...\n');

    // Initialize container
    await initializeContainer();

    // Get ContentAssetService
    const contentAssetService = container.resolve<IContentAssetService>(
      TOKENS.IContentAssetService
    );

    // Test data
    const testUserId = 'test-user-' + Date.now();
    const testFilename = 'test-presigned-upload.jpg';
    const testContent = Buffer.from(
      'Test image content for presigned URL upload'
    );

    console.log('📋 Test Parametreleri:');
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Filename: ${testFilename}`);
    console.log(`   Content Length: ${testContent.length} bytes\n`);

    // Create presigned URL
    console.log('📤 Presigned URL oluşturuluyor...');

    const presigned = await contentAssetService.createPresignedUpload({
      descriptor: {
        type: ContentAssetType.QuestionThumbnail,
        ownerId: testUserId,
        visibility: ContentAssetVisibility.Public,
      },
      filename: testFilename,
      mimeType: 'image/jpeg',
      contentLength: testContent.length,
    });

    console.log('✅ Presigned URL oluşturuldu!\n');
    console.log('📊 Presigned URL Bilgileri:');
    console.log(`   Key: ${presigned.key}`);
    console.log(`   Headers:`, JSON.stringify(presigned.headers, null, 2));

    // Parse URL to check signed headers
    const url = new URL(presigned.uploadUrl);
    const signedHeaders = url.searchParams.get('X-Amz-SignedHeaders');
    console.log(`\n   Signed Headers: ${signedHeaders}`);
    console.log(`   Full URL: ${presigned.uploadUrl}\n`);

    // Upload file using presigned URL
    console.log('📤 Presigned URL kullanarak upload yapılıyor...');

    const headers = new Headers();
    Object.entries(presigned.headers || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        headers.append(key, value);
      }
    });

    // Note: We don't add Content-Type header because it's not in the signed headers.
    // AWS SDK's getSignedUrl doesn't include ContentType in the signature for presigned URLs.

    console.log('   Gönderilen Headers:');
    headers.forEach((value, key) => {
      console.log(`     ${key}: ${value}`);
    });

    const response = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      headers,
      body: testContent,
    });

    console.log(`\n📊 Upload Sonucu:`);
    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`   ❌ Upload başarısız!`);
      console.error(`   Hata: ${errorText}`);
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    console.log(`   ✅ Upload başarılı!`);
    console.log(`\n🎉 Test tamamlandı!`);
    console.log(
      `\n💡 Cloudflare R2 bucket'ında bu dosyayı kontrol edebilirsiniz:`
    );
    console.log(`   ${presigned.key}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test başarısız:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
testPresignedUpload();
