#!/usr/bin/env ts-node
/**
 * Content Asset Path Structure Test
 * Tests the path structure: yıl/ay/gün/question-thumbnails/owner/userid
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
console.log('[Content Asset Test] .env path:', envPath);
loadEnv({ path: envPath });

async function testContentAssetPath() {
  try {
    console.log('🚀 Content Asset Path Structure Test başlıyor...\n');

    // Initialize container
    await initializeContainer();

    // Get ContentAssetService
    const contentAssetService = container.resolve<IContentAssetService>(
      TOKENS.IContentAssetService
    );

    // Test data
    const testUserId = 'test-user-' + Date.now();
    const testFilename = 'test-thumbnail.jpg';
    const testContent = Buffer.from(
      'Test image content for path structure verification'
    );

    console.log('📋 Test Parametreleri:');
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Filename: ${testFilename}`);
    console.log(`   Type: QuestionThumbnail\n`);

    // Create descriptor
    const descriptor = {
      type: ContentAssetType.QuestionThumbnail,
      ownerId: testUserId,
      visibility: ContentAssetVisibility.Public,
    };

    console.log('📤 Upload başlatılıyor...');

    // Upload asset
    const result = await contentAssetService.uploadAsset({
      descriptor,
      buffer: testContent,
      filename: testFilename,
      mimeType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000',
    });

    console.log('\n✅ Upload başarılı!\n');
    console.log('📊 Sonuçlar:');
    console.log(`   Bucket: ${result.bucket}`);
    console.log(`   Key: ${result.key}`);
    if (result.url) {
      console.log(`   URL: ${result.url}`);
    }

    // Parse and display path structure
    const pathParts = result.key.split('/');
    console.log('\n📁 Path Yapısı Analizi:');
    console.log(`   Yıl: ${pathParts[0]}`);
    console.log(`   Ay: ${pathParts[1]}`);
    console.log(`   Gün: ${pathParts[2]}`);
    console.log(`   Klasör: ${pathParts[3]}`);
    console.log(`   Owner: ${pathParts[4]}`);
    console.log(`   User ID: ${pathParts[5]}`);
    console.log(`   Dosya: ${pathParts.slice(6).join('/')}`);

    // Verify path structure
    const expectedStructure = [
      pathParts[0], // year
      pathParts[1], // month
      pathParts[2], // day
      'question-thumbnails',
      'owner',
      testUserId,
    ];

    const actualStructure = pathParts.slice(0, 6);
    const isValid =
      JSON.stringify(actualStructure) === JSON.stringify(expectedStructure);

    console.log('\n🔍 Doğrulama:');
    if (isValid) {
      console.log('   ✅ Path yapısı doğru!');
      console.log(
        `   ✅ Format: ${pathParts[0]}/${pathParts[1]}/${pathParts[2]}/question-thumbnails/owner/${testUserId}/...`
      );
    } else {
      console.log('   ❌ Path yapısı beklenen formatta değil!');
      console.log(`   Beklenen: ${expectedStructure.join('/')}`);
      console.log(`   Gerçek: ${actualStructure.join('/')}`);
    }

    console.log('\n🎉 Test tamamlandı!');
    console.log(
      `\n💡 Cloudflare R2 bucket'ında bu dosyayı kontrol edebilirsiniz:`
    );
    console.log(`   ${result.key}`);

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
testContentAssetPath();
