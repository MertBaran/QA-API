import 'reflect-metadata';
import { container } from 'tsyringe';
import { initializeContainer } from '../services/container';
import { IDatabaseAdapter } from '../repositories/adapters/IDatabaseAdapter';
import mongoose from 'mongoose';

class FieldMigrationCLI {
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
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      process.exit(1);
    }
  }

  async migrateQuestions(): Promise<void> {
    console.log('📚 Migrating Questions collection...');

    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const questionsCollection = db.collection('questions');
      const questionsWithOldFields = await questionsCollection
        .find({
          $or: [
            { parentFormId: { $exists: true } },
            { relatedForms: { $exists: true } },
          ],
        })
        .toArray();

      console.log(
        `   Found ${questionsWithOldFields.length} questions with old field names`
      );

      for (const question of questionsWithOldFields) {
        const setUpdate: any = {};
        const unsetUpdate: any = {};

        if (question['parentFormId']) {
          setUpdate.parentContentId = question['parentFormId'];
          unsetUpdate.parentFormId = '';
        }
        if (question['relatedForms']) {
          setUpdate.relatedContents = question['relatedForms'];
          unsetUpdate.relatedForms = '';
        }

        const update: any = {};
        if (Object.keys(setUpdate).length > 0) {
          update.$set = setUpdate;
        }
        if (Object.keys(unsetUpdate).length > 0) {
          update.$unset = unsetUpdate;
        }

        if (Object.keys(update).length > 0) {
          await questionsCollection.updateOne({ _id: question._id }, update);
        }
      }

      console.log('✅ Questions migration completed');
    } catch (error: any) {
      console.error('❌ Failed to migrate questions:', error.message);
    }
  }

  async migrateAnswers(): Promise<void> {
    console.log('💬 Migrating Answers collection...');

    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const answersCollection = db.collection('answers');
      const answersWithOldFields = await answersCollection
        .find({
          $or: [
            { parentFormId: { $exists: true } },
            { relatedForms: { $exists: true } },
          ],
        })
        .toArray();

      console.log(
        `   Found ${answersWithOldFields.length} answers with old field names`
      );

      for (const answer of answersWithOldFields) {
        const setUpdate: any = {};
        const unsetUpdate: any = {};

        if (answer['parentFormId']) {
          setUpdate.parentContentId = answer['parentFormId'];
          unsetUpdate.parentFormId = '';
        }
        if (answer['relatedForms']) {
          setUpdate.relatedContents = answer['relatedForms'];
          unsetUpdate.relatedForms = '';
        }

        const update: any = {};
        if (Object.keys(setUpdate).length > 0) {
          update.$set = setUpdate;
        }
        if (Object.keys(unsetUpdate).length > 0) {
          update.$unset = unsetUpdate;
        }

        if (Object.keys(update).length > 0) {
          await answersCollection.updateOne({ _id: answer._id }, update);
        }
      }

      console.log('✅ Answers migration completed');
    } catch (error: any) {
      console.error('❌ Failed to migrate answers:', error.message);
    }
  }

  async reindexElasticsearch(): Promise<void> {
    console.log('🔍 Reindexing Elasticsearch...');
    console.log('   You need to manually run: npm run reindex');
    console.log(
      '   This will recreate Elasticsearch indexes with correct field mappings'
    );
  }

  async cleanup(): Promise<void> {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }

  async run(): Promise<void> {
    try {
      await this.initialize();
      await this.migrateQuestions();
      await this.migrateAnswers();
      await this.reindexElasticsearch();
      await this.cleanup();
      console.log('\n🎉 Migration completed successfully!');
      console.log("⚠️  Don't forget to run: npm run reindex");
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }
}

// Run migration
const migration = new FieldMigrationCLI();
migration.run();
