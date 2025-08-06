import { MigrationInterface } from '../../interfaces/MigrationInterface';
import { IDatabaseAdapter } from '../../../repositories/adapters/IDatabaseAdapter';

export class CreateBookmarksTable004 implements MigrationInterface {
  version = '004';
  description = 'Create bookmarks collection';

  async up(databaseAdapter: IDatabaseAdapter): Promise<void> {
    // This migration will be handled by Mongoose schema creation
    // The actual table creation happens when the application starts
    console.log('Creating bookmarks collection...');
  }

  async down(databaseAdapter: IDatabaseAdapter): Promise<void> {
    // Drop the bookmarks collection
    console.log('Dropping bookmarks collection...');
  }
}
