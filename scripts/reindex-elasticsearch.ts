import 'reflect-metadata';
import { container } from 'tsyringe';
import { initializeContainer } from '../services/container';
import { IDatabaseAdapter } from '../repositories/adapters/IDatabaseAdapter';
import { IQuestionRepository } from '../repositories/interfaces/IQuestionRepository';
import { IAnswerRepository } from '../repositories/interfaces/IAnswerRepository';
import { IIndexClient } from '../infrastructure/search/IIndexClient';
import { ISearchClient } from '../infrastructure/search/ISearchClient';
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

  async initialize(): Promise<void> {
    try {
      console.log('🔌 Initializing application container...');

      // Set NODE_ENV if not set
      if (!process.env['NODE_ENV']) {
        process.env['NODE_ENV'] = 'development';
      }

      const config = await initializeContainer();

      // Configure database connection
      const databaseConfig = {
        connectionString: config.MONGO_URI,
      };
      container.register('IDatabaseConnectionConfig', {
        useValue: databaseConfig,
      });

      // Connect to database
      console.log('🔗 Connecting to database...');
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

      // Initialize Elasticsearch indexes with proper mappings
      const searchClient = container.resolve<ISearchClient>('ISearchClient');
      await searchClient.initializeRegisteredIndexes();
      console.log('✅ Elasticsearch indexes initialized');

      // Get dependencies
      this.questionRepository = container.resolve<IQuestionRepository>(
        'IQuestionRepository'
      );
      this.answerRepository =
        container.resolve<IAnswerRepository>('IAnswerRepository');
      this.indexClient = container.resolve<IIndexClient>('IIndexClient');

      console.log('✅ Application container initialized');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      process.exit(1);
    }
  }

  async reindexQuestions(): Promise<void> {
    console.log('📚 Reindexing questions...');
    const questions = await (this.questionRepository as any).findAll();
    console.log(`   Found ${questions.length} questions`);

    let successCount = 0;
    let errorCount = 0;

    for (const question of questions) {
      try {
        const searchDoc = this.questionProjector.project(question);
        await this.indexClient.sync(
          this.questionProjector.indexName,
          'index',
          searchDoc
        );
        successCount++;
      } catch (error: any) {
        console.error(
          `   Error indexing question ${question._id}:`,
          error.message
        );
        errorCount++;
      }
    }

    console.log(
      `✅ Reindexed ${successCount} questions (${errorCount} errors)`
    );
  }

  async reindexAnswers(): Promise<void> {
    console.log('💬 Reindexing answers...');
    const answers = await (this.answerRepository as any).findAll();
    console.log(`   Found ${answers.length} answers`);

    let successCount = 0;
    let errorCount = 0;

    for (const answer of answers) {
      try {
        const searchDoc = this.answerProjector.project(answer);
        await this.indexClient.sync(
          this.answerProjector.indexName,
          'index',
          searchDoc
        );
        successCount++;
      } catch (error: any) {
        console.error(`   Error indexing answer ${answer._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`✅ Reindexed ${successCount} answers (${errorCount} errors)`);
  }

  async reindexAll(): Promise<void> {
    await this.reindexQuestions();
    await this.reindexAnswers();
  }

  async disconnect(): Promise<void> {
    const databaseAdapter =
      container.resolve<IDatabaseAdapter>('IDatabaseAdapter');
    if (databaseAdapter.isConnected()) {
      await databaseAdapter.disconnect();
      console.log('🔌 Database connection closed');
    }
  }
}

async function main() {
  const cli = new ReindexCLI();
  const command = process.argv[2];

  try {
    await cli.initialize();

    switch (command) {
      case 'questions':
        await cli.reindexQuestions();
        break;

      case 'answers':
        await cli.reindexAnswers();
        break;

      case 'all':
        await cli.reindexAll();
        break;

      default:
        console.log('📚 Reindex CLI Commands:');
        console.log('  npm run reindex:questions - Reindex all questions');
        console.log('  npm run reindex:answers   - Reindex all answers');
        console.log('  npm run reindex:all       - Reindex all data');
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await cli.disconnect();
  }
}

main();
