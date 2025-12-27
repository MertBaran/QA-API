#!/usr/bin/env ts-node
/**
 * Presigned URL Test
 * Tests presigned URL creation and headers
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
console.log('[Presigned URL Test] .env path:', envPath);
loadEnv({ path: envPath });

async function testPresignedURL() {
  try {
    console.log('🚀 Presigned URL Test başlıyor...\n');

    // Initialize container
    await initializeContainer();

    // Get ContentAssetService
    const contentAssetService = container.resolve<IContentAssetService>(
      TOKENS.IContentAssetService
    );

    // Test data
    const testUserId = 'test-user-' + Date.now();
    const testFilename = 'test-thumbnail.jpg';

    console.log('📋 Test Parametreleri:');
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Filename: ${testFilename}`);
    console.log(`   Type: QuestionThumbnail\n`);

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
      contentLength: 1024,
    });

    console.log('\n✅ Presigned URL oluşturuldu!\n');
    console.log('📊 Sonuçlar:');
    console.log(`   Key: ${presigned.key}`);
    console.log(`   Expires In: ${presigned.expiresInSeconds} seconds`);
    console.log(`\n   URL: ${presigned.uploadUrl}`);
    console.log(`\n   Headers:`);
    console.log(JSON.stringify(presigned.headers, null, 2));

    // Check if account ID header is present
    const hasAccountId = presigned.headers['x-amz-account-id'];
    console.log('\n🔍 Header Kontrolü:');
    if (hasAccountId) {
      console.log(`   ✅ x-amz-account-id header mevcut: ${hasAccountId}`);
    } else {
      console.log('   ❌ x-amz-account-id header mevcut değil!');
    }

    // Parse URL to check signature
    const url = new URL(presigned.uploadUrl);
    const signature = url.searchParams.get('X-Amz-Signature');
    console.log(
      `\n   Signature: ${signature ? signature.substring(0, 20) + '...' : 'Yok'}`
    );

    // Check URL structure
    console.log('\n📁 URL Yapısı:');
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Path: ${url.pathname}`);
    console.log(
      `   Query params: ${url.searchParams.toString().substring(0, 100)}...`
    );

    console.log('\n🎉 Test tamamlandı!');

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
testPresignedURL();
