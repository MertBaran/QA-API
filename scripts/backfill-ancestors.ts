import 'reflect-metadata';
import { container } from 'tsyringe';
import { initializeContainer } from '../services/container';
import { IDatabaseAdapter } from '../repositories/adapters/IDatabaseAdapter';
import mongoose from 'mongoose';

interface Ancestor {
  id: string;
  type: string;
  depth: number;
}

interface Checkpoint {
  lastProcessedId?: string;
  totalProcessed: number;
  startTime: Date;
  endTime?: Date;
}

class AncestorsBackfillCLI {
  private checkpoint: Checkpoint = {
    totalProcessed: 0,
    startTime: new Date(),
  };

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

  /**
   * Compute ancestors array from parentContentId recursively
   */
  private computeAncestors(
    parentId: string,
    parentType: string,
    allQuestions: Map<string, any>,
    allAnswers: Map<string, any>,
    visited: Set<string>,
    currentDepth: number = 0,
    maxDepth: number = 50
  ): Ancestor[] {
    // Prevent infinite loops and excessive depth
    if (currentDepth >= maxDepth || visited.has(parentId)) {
      console.warn(
        `⚠️  Cycle detected or max depth reached for ${parentId} at depth ${currentDepth}`
      );
      return [];
    }

    visited.add(parentId);

    const ancestors: Ancestor[] = [];

    // Add current parent at depth 0
    ancestors.push({
      id: parentId,
      type: parentType,
      depth: 0,
    });

    // Find parent content
    let parentContent: any = null;
    if (parentType === 'question') {
      parentContent = allQuestions.get(parentId);
    } else if (parentType === 'answer') {
      parentContent = allAnswers.get(parentId);
    }

    // If parent not found, return just this parent
    if (!parentContent) {
      return ancestors;
    }

    // Determine next parent based on type
    let nextParentId: string | null = null;
    let nextParentType: string | null = null;

    // If parent is an answer, get its question
    if (parentType === 'answer' && parentContent.question) {
      nextParentId = String(parentContent.question);
      nextParentType = 'question';
    }
    // If parent is a question and has parentContentId, use that
    else if (parentType === 'question' && parentContent.parentContentId) {
      nextParentId = String(parentContent.parentContentId);
      // Determine type by checking which collection it exists in
      if (allQuestions.has(nextParentId)) {
        nextParentType = 'question';
      } else if (allAnswers.has(nextParentId)) {
        nextParentType = 'answer';
      }
    }

    // If we have a next parent, recurse
    if (nextParentId && nextParentType) {
      const nextVisited = new Set(visited);
      const nextAncestors = this.computeAncestors(
        nextParentId,
        nextParentType,
        allQuestions,
        allAnswers,
        nextVisited,
        currentDepth + 1,
        maxDepth
      );

      // Increment depth for all ancestors
      nextAncestors.forEach(ancestor => {
        ancestors.push({
          id: ancestor.id,
          type: ancestor.type,
          depth: ancestor.depth + 1,
        });
      });
    } else if (nextParentId) {
      // Parent not found in any collection
      console.log(
        `⚠️  Parent not found: ${nextParentId} for ${parentId} (${parentType})`
      );
    }

    return ancestors;
  }

  async backfillQuestions(): Promise<void> {
    console.log('📚 Backfilling ancestors for Questions...');

    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const questionsCollection = db.collection('questions');
      const answersCollection = db.collection('answers');

      // Step 1: Load ALL questions and answers into memory for ancestor computation
      console.log('   Loading all questions into memory...');
      const allQuestionsRaw = await questionsCollection.find({}).toArray();
      const allQuestionsMap = new Map<string, any>();
      allQuestionsRaw.forEach(q => {
        allQuestionsMap.set(String(q._id), q);
      });

      console.log('   Loading all answers into memory...');
      const allAnswersRaw = await answersCollection.find({}).toArray();
      const allAnswersMap = new Map<string, any>();
      allAnswersRaw.forEach(a => {
        allAnswersMap.set(String(a._id), a);
      });

      console.log(
        `   Loaded ${allQuestionsMap.size} questions and ${allAnswersMap.size} answers`
      );

      // Step 2: Find questions with parentContentId but no ancestors (topological processing)
      console.log('   Finding questions needing ancestor backfill...');
      const questionsToProcess = await questionsCollection
        .find({
          $or: [
            { parentContentId: { $exists: true, $ne: null } },
            { ancestors: { $exists: false } },
            { ancestors: [] },
          ],
        })
        .toArray();

      console.log(
        `   Found ${questionsToProcess.length} questions to process (including fixing existing ones)`
      );

      // Step 3: Process in batches
      const BATCH_SIZE = 100;
      let processedCount = 0;

      for (let i = 0; i < questionsToProcess.length; i += BATCH_SIZE) {
        const batch = questionsToProcess.slice(i, i + BATCH_SIZE);

        const bulkOps = batch.map(question => {
          const ancestors: Ancestor[] = [];

          // Compute ancestors if parentContentId exists
          if (question['parentContentId']) {
            // Determine parent type by checking which collection it exists in
            const parentId = String(question['parentContentId']);
            let parentType = 'question';

            if (allQuestionsMap.has(parentId)) {
              parentType = 'question';
            } else if (allAnswersMap.has(parentId)) {
              parentType = 'answer';
            }

            ancestors.push(
              ...this.computeAncestors(
                parentId,
                parentType,
                allQuestionsMap,
                allAnswersMap,
                new Set([String(question._id)])
              )
            );
          }

          // Prepare update
          const update: any = {};

          if (ancestors.length > 0) {
            update.ancestors = ancestors;
            // Always set parent from ancestors[0] if we have ancestors
            const firstAncestor = ancestors[0];
            if (firstAncestor) {
              update.parent = {
                id: firstAncestor.id,
                type: firstAncestor.type,
              };
            }
          } else {
            // No ancestors and no parentContentId - set empty
            update.ancestors = [];
          }

          if (Object.keys(update).length > 0) {
            return {
              updateOne: {
                filter: { _id: question._id },
                update: { $set: update },
              },
            };
          }

          return null;
        });

        const validOps = bulkOps.filter(op => op !== null);
        if (validOps.length > 0) {
          await questionsCollection.bulkWrite(validOps);
        }

        processedCount += batch.length;
        this.checkpoint.totalProcessed = processedCount;
        console.log(
          `   Processed ${processedCount}/${questionsToProcess.length} questions`
        );
      }

      console.log('✅ Questions ancestors backfill completed');
    } catch (error: any) {
      console.error('❌ Failed to backfill questions:', error.message);
      throw error;
    }
  }

  async backfillAnswers(): Promise<void> {
    console.log('💬 Backfilling ancestors for Answers...');

    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const answersCollection = db.collection('answers');
      const questionsCollection = db.collection('questions');

      // Load all questions and answers
      console.log('   Loading all content into memory...');
      const allQuestionsRaw = await questionsCollection.find({}).toArray();
      const allQuestionsMap = new Map<string, any>();
      allQuestionsRaw.forEach(q => {
        allQuestionsMap.set(String(q._id), q);
      });

      const allAnswersRaw = await answersCollection.find({}).toArray();
      const allAnswersMap = new Map<string, any>();
      allAnswersRaw.forEach(a => {
        allAnswersMap.set(String(a._id), a);
      });

      // Find answers needing backfill - process ALL answers to ensure they have ancestors
      console.log('   Finding answers needing ancestor backfill...');
      const answersToProcess = await answersCollection.find({}).toArray();

      console.log(`   Found ${answersToProcess.length} answers to process`);

      // Process in batches
      const BATCH_SIZE = 100;
      let processedCount = 0;

      for (let i = 0; i < answersToProcess.length; i += BATCH_SIZE) {
        const batch = answersToProcess.slice(i, i + BATCH_SIZE);

        const bulkOps = batch.map(answer => {
          const ancestors: Ancestor[] = [];

          // Answer için: önce answer'ı ekle, sonra question'ın ancestors'ını al
          ancestors.push({
            id: String(answer._id),
            type: 'answer',
            depth: 0,
          });

          // Get the question this answer belongs to
          const questionId = String(answer['question']);
          const question = allQuestionsMap.get(questionId);

          if (question) {
            // If question has ancestors, use them directly (they already have the correct structure)
            // Otherwise, add question at depth 1
            if (question.ancestors && question.ancestors.length > 0) {
              // Question ancestors already contain full chain, just increment depth
              question.ancestors.forEach((ancestor: any) => {
                ancestors.push({
                  id: ancestor.id,
                  type: ancestor.type,
                  depth: ancestor.depth + 1,
                });
              });
            } else {
              // No ancestors, just add question at depth 1
              ancestors.push({
                id: questionId,
                type: 'question',
                depth: 1,
              });
            }
          }

          const update: any = {};
          if (ancestors.length > 0) {
            update.ancestors = ancestors;
          } else {
            update.ancestors = [];
          }

          if (Object.keys(update).length > 0) {
            return {
              updateOne: {
                filter: { _id: answer._id },
                update: { $set: update },
              },
            };
          }

          return null;
        });

        const validOps = bulkOps.filter(op => op !== null);
        if (validOps.length > 0) {
          await answersCollection.bulkWrite(validOps);
        }

        processedCount += batch.length;
        console.log(
          `   Processed ${processedCount}/${answersToProcess.length} answers`
        );
      }

      console.log('✅ Answers ancestors backfill completed');
    } catch (error: any) {
      console.error('❌ Failed to backfill answers:', error.message);
      throw error;
    }
  }

  async saveCheckpoint(): Promise<void> {
    this.checkpoint.endTime = new Date();
    const duration =
      this.checkpoint.endTime.getTime() - this.checkpoint.startTime.getTime();
    console.log('\n📊 Migration Statistics:');
    console.log(`   Total processed: ${this.checkpoint.totalProcessed}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
  }

  async cleanup(): Promise<void> {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }

  async run(): Promise<void> {
    try {
      await this.initialize();
      await this.backfillQuestions();
      await this.backfillAnswers();
      await this.saveCheckpoint();
      await this.cleanup();
      console.log('\n🎉 Ancestors backfill completed successfully!');
      console.log("⚠️  Don't forget to run: npm run reindex");
    } catch (error) {
      console.error('❌ Backfill failed:', error);
      await this.saveCheckpoint();
      process.exit(1);
    }
  }
}

// Run backfill
const backfill = new AncestorsBackfillCLI();
backfill.run();
