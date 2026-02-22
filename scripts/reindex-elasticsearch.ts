import 'reflect-metadata';
import { container } from 'tsyringe';
import { initializeContainer } from '../services/container';
import { TOKENS } from '../services/TOKENS';
import { IDatabaseAdapter } from '../repositories/adapters/IDatabaseAdapter';
import { IQuestionRepository } from '../repositories/interfaces/IQuestionRepository';
import { IAnswerRepository } from '../repositories/interfaces/IAnswerRepository';
import {
  IIndexClient,
  SyncPayload,
} from '../infrastructure/search/IIndexClient';
import { ISearchClient } from '../infrastructure/search/ISearchClient';
import { IElasticsearchClient } from '../infrastructure/elasticsearch/IElasticsearchClient';
import { QuestionProjector } from '../infrastructure/search/projectors/QuestionProjector';
import { AnswerProjector } from '../infrastructure/search/projectors/AnswerProjector';
import { IQuestionModel } from '../models/interfaces/IQuestionModel';
import { IAnswerModel } from '../models/interfaces/IAnswerModel';

class ReindexCLI {
  private questionRepository: any;
  private answerRepository: any;
  private indexClient!: IIndexClient;
  private questionProjector!: QuestionProjector;
  private answerProjector!: AnswerProjector;
  private elasticsearchClient!: IElasticsearchClient;
  private indexesInitialized: boolean = false;

  async deleteIndexesBeforeInit(): Promise<void> {
    // Delete indexes before container initialization to avoid mapping errors
    console.log('');
    console.log('🗑️  ========================================');
    console.log('🗑️  DELETING EXISTING ELASTICSEARCH INDEXES');
    console.log('🗑️  ========================================');
    console.log('');

    // Create a temporary Elasticsearch client directly
    const { Client } = await import('@elastic/elasticsearch');

    // Read Elasticsearch URL from environment or config file
    let esUrl = process.env['ELASTICSEARCH_URL'];
    if (!esUrl) {
      // Try to read from config file
      const fs = await import('fs');
      const path = await import('path');
      const configPath = path.join(
        __dirname,
        '../../config/env/config.env.dev'
      );
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const urlMatch = configContent.match(/ELASTICSEARCH_URL=(.+)/);
        if (urlMatch) {
          esUrl = urlMatch[1]?.trim() || '';
        }
      }
    }
    esUrl = esUrl || 'http://localhost:9200';

    console.log(`🔗 Connecting to Elasticsearch at: ${esUrl}`);
    const client = new Client({ node: esUrl });

    // Use known index names (from projectors)
    const indexNames = ['questions', 'answers'];
    console.log(`📋 Target indexes: ${indexNames.join(', ')}`);
    console.log('');

    for (const indexName of indexNames) {
      try {
        console.log(`🔍 Checking index: ${indexName}...`);
        const exists = await client.indices.exists({ index: indexName });

        if (exists) {
          console.log(`   📦 Index exists, deleting: ${indexName}`);

          // Delete index (Elasticsearch delete is synchronous)
          await client.indices.delete({
            index: indexName,
            ignore_unavailable: true, // Don't fail if index doesn't exist
          });
          console.log(`   ✅ Delete command sent for index: ${indexName}`);

          // Longer delay to ensure Elasticsearch has fully processed the deletion
          // and cleared cluster state
          console.log(`   ⏳ Waiting for cluster state to clear (1000ms)...`);
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Verify deletion - check multiple times to ensure cluster state is cleared
          let retries = 0;
          const maxRetries = 5;
          let stillExists = await client.indices.exists({ index: indexName });

          while (stillExists && retries < maxRetries) {
            retries++;
            console.warn(
              `   ⚠️  Index ${indexName} still exists (attempt ${retries}/${maxRetries}), retrying deletion...`
            );

            // Force delete again
            await client.indices.delete({
              index: indexName,
              ignore_unavailable: true,
            });
            console.log(
              `   🔄 Force delete retry ${retries} sent for: ${indexName}`
            );

            // Wait longer for cluster state to clear
            await new Promise(resolve => setTimeout(resolve, 1000));

            stillExists = await client.indices.exists({ index: indexName });
            console.log(
              `   🔍 Verification check ${retries}: ${stillExists ? 'EXISTS' : 'DELETED'}`
            );
          }

          if (stillExists) {
            console.error(
              `   ❌ FAILED: Index ${indexName} still exists after ${maxRetries} attempts`
            );
            throw new Error(
              `Failed to delete index ${indexName}: Index still exists after ${maxRetries} deletion attempts`
            );
          }

          console.log(`   ✅ Successfully deleted index: ${indexName}`);
        } else {
          console.log(`   ℹ️  Index does not exist: ${indexName} (skipping)`);
        }
      } catch (error: any) {
        console.error('');
        console.error(`   ❌ ERROR deleting index ${indexName}:`);
        console.error(`      Message: ${error.message}`);
        if (error.meta?.body) {
          console.error(
            `      Details: ${JSON.stringify(error.meta.body, null, 2)}`
          );
        }
        console.error('');
        throw error; // Throw to stop execution if deletion fails
      }
    }

    // Small delay to ensure Elasticsearch has processed the deletions
    console.log('');
    console.log(
      '⏳ Final wait for Elasticsearch to process deletions (500ms)...'
    );
    await new Promise(resolve => setTimeout(resolve, 500));

    await client.close();
    console.log('');
    console.log('✅ ========================================');
    console.log('✅ INDEX DELETION COMPLETED SUCCESSFULLY');
    console.log('✅ ========================================');
    console.log('');
  }

  async initialize(skipIndexInit: boolean = false): Promise<void> {
    try {
      console.log('');
      console.log('🔌 ========================================');
      console.log('🔌 INITIALIZING APPLICATION CONTAINER');
      console.log('🔌 ========================================');
      console.log(`   Skip Index Init: ${skipIndexInit}`);
      console.log('');

      // Set NODE_ENV if not set
      if (!process.env['NODE_ENV']) {
        process.env['NODE_ENV'] = 'development';
      }

      const config = await initializeContainer();

      // Database connection - --db=postgresql veya --db=mongodb ile seçilen DB'ye göre
      const dbType = (process.env['DATABASE_TYPE'] || 'mongodb').toLowerCase();
      const connectionString =
        dbType === 'postgresql'
          ? (config.DATABASE_URL || process.env['DATABASE_URL'] || 'postgresql://localhost:5432/qa_platform')
          : (config.MONGO_URI || process.env['MONGO_URI'] || '');
      if (!connectionString && dbType === 'mongodb') {
        throw new Error('MONGO_URI is required when --db=mongodb');
      }
      container.register(TOKENS.IDatabaseConnectionConfig, {
        useValue: { connectionString },
      });

      // Connect to database
      console.log(`🔗 Connecting to database (${dbType})...`);
      const databaseAdapter =
        container.resolve<IDatabaseAdapter>('IDatabaseAdapter');
      await databaseAdapter.connect();
      console.log('✅ Database connected successfully');

      // Resolve projectors first (they register their indexes)
      this.questionProjector = container.resolve<QuestionProjector>(
        'IProjector<IQuestionModel, QuestionSearchDoc>'
      );
      this.answerProjector = container.resolve<AnswerProjector>(
        'IProjector<IAnswerModel, AnswerSearchDoc>'
      );

      // Get Elasticsearch client early (needed for deleteIndexes)
      this.elasticsearchClient = container.resolve<IElasticsearchClient>(
        'IElasticsearchClient'
      );

      // Initialize Elasticsearch indexes with proper mappings (unless skipped)
      if (!skipIndexInit) {
        console.log('📋 Initializing Elasticsearch indexes...');
        const searchClient = container.resolve<ISearchClient>('ISearchClient');
        try {
          console.log('   🔄 Calling initializeRegisteredIndexes()...');
          await searchClient.initializeRegisteredIndexes();
          console.log('   ✅ Elasticsearch indexes initialized successfully');
          this.indexesInitialized = true; // Index'ler başarıyla oluşturuldu
        } catch (error: any) {
          console.error('');
          console.error('   ❌ FAILED to initialize Elasticsearch indexes');
          console.error(`      Error: ${error.message}`);

          // Check if it's a mapping error
          if (
            error.message?.includes('mapper_parsing_exception') ||
            error.message?.includes('cannot be changed from type')
          ) {
            console.error('');
            console.error('   ❌ Elasticsearch mapping error detected!');
            console.error(
              '      This usually happens when field types have changed.'
            );
            console.error(
              '      Solution: Delete and recreate indexes using --recreate flag'
            );
            console.error('');
            console.error('      Run: npm run reindex:all --recreate');
            console.error('');
            throw new Error(
              'Mapping error: Use --recreate flag to delete and recreate indexes'
            );
          }
          throw error;
        }
      } else {
        console.log(
          '⏭️  Skipping index initialization (will be done during reindexing)'
        );
        // --recreate flag ile çalıştırıldığında index'ler reindex sırasında oluşturulacak
        this.indexesInitialized = false;
      }

      // Get dependencies
      this.questionRepository = container.resolve<IQuestionRepository>(
        'IQuestionRepository'
      );
      this.answerRepository =
        container.resolve<IAnswerRepository>('IAnswerRepository');
      this.indexClient = container.resolve<IIndexClient>('IIndexClient');
      console.log('   ✅ Index client resolved');

      console.log('');
      console.log('✅ ========================================');
      console.log('✅ APPLICATION CONTAINER INITIALIZED');
      console.log('✅ ========================================');
      console.log('');
    } catch (error) {
      console.error('');
      console.error('❌ ========================================');
      console.error('❌ FAILED TO INITIALIZE APPLICATION');
      console.error('❌ ========================================');
      console.error(`   Error: ${error}`);
      console.error('');
      process.exit(1);
    }
  }

  async reindexQuestions(): Promise<void> {
    console.log('');
    console.log('📚 ========================================');
    console.log('📚 REINDEXING QUESTIONS');
    console.log('📚 ========================================');
    console.log('');

    // Eğer index'ler henüz oluşturulmadıysa (--recreate flag ile), önce oluştur
    if (!this.indexesInitialized) {
      console.log('📋 Indexes not initialized, creating them now...');
      const searchClient = container.resolve<ISearchClient>('ISearchClient');
      try {
        console.log('   🔄 Calling initializeRegisteredIndexes()...');
        await searchClient.initializeRegisteredIndexes();
        console.log('   ✅ Elasticsearch indexes created successfully');
        this.indexesInitialized = true;
      } catch (error: any) {
        console.error('');
        console.error('   ❌ FAILED to create indexes:');
        console.error(`      Error: ${error.message}`);
        if (error.meta?.body) {
          console.error(
            `      Details: ${JSON.stringify(error.meta.body, null, 2)}`
          );
        }
        console.error('');
        throw error;
      }
    } else {
      console.log('   ℹ️  Indexes already initialized, skipping creation');
    }

    console.log('');
    console.log('📖 Fetching questions from database...');
    const questions = await (this.questionRepository as any).findAll();
    console.log(`   ✅ Found ${questions.length} questions in database`);

    if (questions.length === 0) {
      console.log('   ℹ️  No questions to reindex, skipping');
      console.log('');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 100; // Batch size for bulk operations
    const totalBatches = Math.ceil(questions.length / BATCH_SIZE);

    console.log('');
    console.log(
      `📦 Processing ${questions.length} questions in ${totalBatches} batch(es) of ${BATCH_SIZE}`
    );
    console.log('');

    // Process in batches
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

      console.log(
        `   🔄 Batch ${batchNumber}/${totalBatches}: Processing ${batch.length} questions...`
      );

      const payloads = batch
        .map((question: IQuestionModel) => {
          try {
            const searchDoc = this.questionProjector.project(question);
            return {
              indexName: this.questionProjector.indexName,
              operation: 'index' as const,
              document: searchDoc,
            };
          } catch (error: any) {
            console.error(
              `   Error projecting question ${question._id}:`,
              error.message
            );
            return null;
          }
        })
        .filter(
          (payload: SyncPayload | null): payload is SyncPayload =>
            payload !== null
        );

      if (payloads.length > 0) {
        try {
          console.log(
            `      📤 Sending ${payloads.length} documents to Elasticsearch (bulk)...`
          );
          await this.indexClient.bulkSync(payloads);
          successCount += payloads.length;
          console.log(
            `      ✅ Batch ${batchNumber} bulk sync successful (${payloads.length} documents)`
          );
        } catch (error: any) {
          console.error(
            `      ⚠️  Bulk sync failed for batch ${batchNumber}: ${error.message}`
          );
          console.log(
            `      🔄 Falling back to individual sync for batch ${batchNumber}...`
          );

          // Try individual sync for this batch
          let individualSuccess = 0;
          let individualErrors = 0;

          for (const payload of payloads) {
            try {
              await this.indexClient.sync(
                payload.indexName,
                payload.operation,
                payload.document
              );
              individualSuccess++;
              successCount++;
            } catch (individualError: any) {
              const docId =
                (payload.document as any)?._id || (payload.document as any)?.id;
              console.error(
                `         ❌ Error indexing question ${docId}: ${individualError.message}`
              );
              individualErrors++;
              errorCount++;
            }
          }

          console.log(
            `      📊 Individual sync results: ${individualSuccess} success, ${individualErrors} errors`
          );
        }
      } else {
        console.log(
          `      ⚠️  No valid payloads in batch ${batchNumber} (all failed projection)`
        );
      }

      // Progress indicator
      const progress = (((i + batch.length) / questions.length) * 100).toFixed(
        1
      );
      console.log(
        `   📊 Progress: ${progress}% | Success: ${successCount} | Errors: ${errorCount}`
      );
      console.log('');
    }

    console.log('');
    console.log('✅ ========================================');
    console.log(`✅ QUESTIONS REINDEX COMPLETED`);
    console.log(`   Total: ${questions.length}`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('✅ ========================================');
    console.log('');
  }

  async reindexAnswers(): Promise<void> {
    console.log('');
    console.log('💬 ========================================');
    console.log('💬 REINDEXING ANSWERS');
    console.log('💬 ========================================');
    console.log('');

    // Eğer index'ler henüz oluşturulmadıysa (--recreate flag ile), önce oluştur
    if (!this.indexesInitialized) {
      console.log('📋 Indexes not initialized, creating them now...');
      const searchClient = container.resolve<ISearchClient>('ISearchClient');
      try {
        console.log('   🔄 Calling initializeRegisteredIndexes()...');
        await searchClient.initializeRegisteredIndexes();
        console.log('   ✅ Elasticsearch indexes created successfully');
        this.indexesInitialized = true;
      } catch (error: any) {
        console.error('');
        console.error('   ❌ FAILED to create indexes:');
        console.error(`      Error: ${error.message}`);
        if (error.meta?.body) {
          console.error(
            `      Details: ${JSON.stringify(error.meta.body, null, 2)}`
          );
        }
        console.error('');
        throw error;
      }
    } else {
      console.log('   ℹ️  Indexes already initialized, skipping creation');
    }

    console.log('');
    console.log('📖 Fetching answers from database...');
    const answers = await (this.answerRepository as any).findAll();
    console.log(`   ✅ Found ${answers.length} answers in database`);

    if (answers.length === 0) {
      console.log('   ℹ️  No answers to reindex, skipping');
      console.log('');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 100; // Batch size for bulk operations
    const totalBatches = Math.ceil(answers.length / BATCH_SIZE);

    console.log('');
    console.log(
      `📦 Processing ${answers.length} answers in ${totalBatches} batch(es) of ${BATCH_SIZE}`
    );
    console.log('');

    // Process in batches
    for (let i = 0; i < answers.length; i += BATCH_SIZE) {
      const batch = answers.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

      console.log(
        `   🔄 Batch ${batchNumber}/${totalBatches}: Processing ${batch.length} answers...`
      );

      const payloads = batch
        .map((answer: IAnswerModel) => {
          try {
            const searchDoc = this.answerProjector.project(answer);
            return {
              indexName: this.answerProjector.indexName,
              operation: 'index' as const,
              document: searchDoc,
            };
          } catch (error: any) {
            console.error(
              `   Error projecting answer ${answer._id}:`,
              error.message
            );
            return null;
          }
        })
        .filter(
          (payload: SyncPayload | null): payload is SyncPayload =>
            payload !== null
        );

      if (payloads.length > 0) {
        try {
          console.log(
            `      📤 Sending ${payloads.length} documents to Elasticsearch (bulk)...`
          );
          await this.indexClient.bulkSync(payloads);
          successCount += payloads.length;
          console.log(
            `      ✅ Batch ${batchNumber} bulk sync successful (${payloads.length} documents)`
          );
        } catch (error: any) {
          console.error(
            `      ⚠️  Bulk sync failed for batch ${batchNumber}: ${error.message}`
          );
          console.log(
            `      🔄 Falling back to individual sync for batch ${batchNumber}...`
          );

          // Try individual sync for this batch
          let individualSuccess = 0;
          let individualErrors = 0;

          for (const payload of payloads) {
            try {
              await this.indexClient.sync(
                payload.indexName,
                payload.operation,
                payload.document
              );
              individualSuccess++;
              successCount++;
            } catch (individualError: any) {
              const docId =
                (payload.document as any)?._id || (payload.document as any)?.id;
              console.error(
                `         ❌ Error indexing answer ${docId}: ${individualError.message}`
              );
              individualErrors++;
              errorCount++;
            }
          }

          console.log(
            `      📊 Individual sync results: ${individualSuccess} success, ${individualErrors} errors`
          );
        }
      } else {
        console.log(
          `      ⚠️  No valid payloads in batch ${batchNumber} (all failed projection)`
        );
      }

      // Progress indicator
      const progress = (((i + batch.length) / answers.length) * 100).toFixed(1);
      console.log(
        `   📊 Progress: ${progress}% | Success: ${successCount} | Errors: ${errorCount}`
      );
      console.log('');
    }

    console.log('');
    console.log('✅ ========================================');
    console.log(`✅ ANSWERS REINDEX COMPLETED`);
    console.log(`   Total: ${answers.length}`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('✅ ========================================');
    console.log('');
  }

  async reindexAll(): Promise<void> {
    console.log('');
    console.log('🚀 ========================================');
    console.log('🚀 STARTING FULL REINDEX OPERATION');
    console.log('🚀 ========================================');
    console.log('');

    // Eğer index'ler henüz oluşturulmadıysa (--recreate flag ile), önce oluştur
    if (!this.indexesInitialized) {
      console.log('📋 Indexes not initialized, creating them now...');
      const searchClient = container.resolve<ISearchClient>('ISearchClient');
      try {
        console.log('   🔄 Calling initializeRegisteredIndexes()...');
        await searchClient.initializeRegisteredIndexes();
        console.log('   ✅ Elasticsearch indexes created successfully');
        this.indexesInitialized = true;
      } catch (error: any) {
        console.error('');
        console.error('   ❌ FAILED to create indexes:');
        console.error(`      Error: ${error.message}`);
        if (error.meta?.body) {
          console.error(
            `      Details: ${JSON.stringify(error.meta.body, null, 2)}`
          );
        }
        console.error('');
        throw error;
      }
    } else {
      console.log('   ℹ️  Indexes already initialized, skipping creation');
    }

    console.log('');
    await this.reindexQuestions();
    await this.reindexAnswers();

    console.log('');
    console.log('🎉 ========================================');
    console.log('🎉 FULL REINDEX OPERATION COMPLETED');
    console.log('🎉 ========================================');
    console.log('');
  }

  async deleteIndexes(): Promise<void> {
    console.log('🗑️  Deleting existing Elasticsearch indexes...');
    const client = this.elasticsearchClient.getClient();
    const indexNames = [
      this.questionProjector.indexName,
      this.answerProjector.indexName,
    ];

    for (const indexName of indexNames) {
      try {
        const exists = await client.indices.exists({ index: indexName });
        if (exists) {
          await client.indices.delete({ index: indexName });
          console.log(`   ✅ Deleted index: ${indexName}`);
        } else {
          console.log(`   ℹ️  Index does not exist: ${indexName}`);
        }
      } catch (error: any) {
        console.error(
          `   ❌ Error deleting index ${indexName}:`,
          error.message
        );
        throw error;
      }
    }
    console.log('✅ Indexes deleted successfully');
  }

  async recreateIndexes(): Promise<void> {
    console.log('🔄 Recreating Elasticsearch indexes...');
    const searchClient = container.resolve<ISearchClient>('ISearchClient');
    await searchClient.initializeRegisteredIndexes();
    console.log('✅ Indexes recreated successfully');
  }

  async disconnect(): Promise<void> {
    console.log('');
    console.log('🔌 Closing database connection...');
    const databaseAdapter =
      container.resolve<IDatabaseAdapter>('IDatabaseAdapter');
    if (databaseAdapter.isConnected()) {
      await databaseAdapter.disconnect();
      console.log('   ✅ Database connection closed');
    } else {
      console.log('   ℹ️  Database not connected, skipping');
    }
    console.log('');
  }
}

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║          ELASTICSEARCH REINDEX SCRIPT                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  const cli = new ReindexCLI();
  const command = process.argv[2];
  const recreate =
    process.argv.includes('--recreate') || process.argv.includes('-r');

  const dbSource = process.env['DATABASE_TYPE'] || 'mongodb';
  console.log(`📋 Command: ${command || 'help'}`);
  console.log(`📋 Source database: ${dbSource}`);
  console.log(`📋 Recreate flag: ${recreate ? 'YES' : 'NO'}`);
  console.log('');

  try {
    // If --recreate flag is set, delete indexes BEFORE container initialization
    if (recreate) {
      console.log('⚠️  ========================================');
      console.log('⚠️  --RECREATE FLAG DETECTED');
      console.log('⚠️  This will delete existing indexes!');
      console.log('⚠️  ========================================');
      console.log('');
      await cli.deleteIndexesBeforeInit();
    }

    // Initialize container
    // If --recreate flag is set, skip index initialization (indexes will be created during reindexing)
    console.log('🔄 Starting container initialization...');
    await cli.initialize(recreate);

    console.log('');
    console.log('🔄 ========================================');
    console.log('🔄 EXECUTING REINDEX COMMAND');
    console.log('🔄 ========================================');
    console.log('');

    switch (command) {
      case 'questions':
        console.log('📋 Command: Reindex questions only');
        await cli.reindexQuestions();
        break;

      case 'answers':
        console.log('📋 Command: Reindex answers only');
        await cli.reindexAnswers();
        break;

      case 'all':
        console.log('📋 Command: Reindex all (questions + answers)');
        await cli.reindexAll();
        break;

      default:
        console.log('');
        console.log('📚 ========================================');
        console.log('📚 REINDEX CLI COMMANDS');
        console.log('📚 ========================================');
        console.log('');
        console.log('Commands:');
        console.log('  npm run reindex:questions  - Reindex all questions');
        console.log('  npm run reindex:answers    - Reindex all answers');
        console.log('  npm run reindex:all         - Reindex all data');
        console.log('');
        console.log('Options:');
        console.log(
          '  --db=<postgresql|mongodb>   - Source database (default: env DATABASE_TYPE or mongodb)'
        );
        console.log(
          '  --recreate, -r              - Delete and recreate indexes before reindexing'
        );
        console.log('');
        console.log('Examples:');
        console.log(
          '  npm run reindex:all -- --db=postgresql      - Reindex from PostgreSQL'
        );
        console.log(
          '  npm run reindex:all -- --db=mongodb        - Reindex from MongoDB'
        );
        console.log(
          '  npm run reindex:all -- --db=postgresql --recreate  - Recreate + reindex from PostgreSQL'
        );
        console.log('');
        break;
    }
  } catch (error) {
    console.error('');
    console.error('❌ ========================================');
    console.error('❌ REINDEX OPERATION FAILED');
    console.error('❌ ========================================');
    console.error(`   Error: ${error}`);
    if (error instanceof Error && error.stack) {
      console.error('');
      console.error('   Stack trace:');
      console.error(error.stack);
    }
    console.error('');
    process.exit(1);
  } finally {
    console.log('');
    console.log('🧹 Cleaning up...');
    await cli.disconnect();
    console.log('');
    console.log('👋 Script execution completed');
    console.log('');
  }
}

main();
