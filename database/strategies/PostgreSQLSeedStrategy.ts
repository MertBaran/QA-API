import { ISeedStrategy } from '../interfaces/ISeedStrategy';
import { IDatabaseAdapter } from '../../repositories/adapters/IDatabaseAdapter';
import { PostgreSQLAdapter } from '../../repositories/adapters/PostgreSQLAdapter';
import { PermissionSeed } from '../seeds/postgresql/PermissionSeed';
import { RoleSeed } from '../seeds/postgresql/RoleSeed';
import { NotificationTemplateSeed } from '../seeds/postgresql/NotificationTemplateSeed';

export class PostgreSQLSeedStrategy implements ISeedStrategy {
  private seeds = [new PermissionSeed(), new RoleSeed(), new NotificationTemplateSeed()];

  async runSeeds(databaseAdapter: IDatabaseAdapter): Promise<void> {
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      throw new Error('PostgreSQLSeedStrategy requires PostgreSQLAdapter');
    }

    console.log('🌱 Running PostgreSQL seeds...');

    for (const seed of this.seeds) {
      try {
        console.log(`\n📦 Running seed: ${seed.name}`);
        await seed.run(databaseAdapter);
        console.log(`✅ Seed ${seed.name} completed`);
      } catch (error) {
        console.error(`❌ Seed ${seed.name} failed:`, error);
        throw error;
      }
    }

    console.log('✅ All PostgreSQL seeds completed');
  }

  async rollbackSeeds(databaseAdapter: IDatabaseAdapter): Promise<void> {
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      throw new Error('PostgreSQLSeedStrategy requires PostgreSQLAdapter');
    }

    console.log('🔄 Rolling back PostgreSQL seeds...');

    for (let i = this.seeds.length - 1; i >= 0; i--) {
      const seed = this.seeds[i];
      if (!seed) {
        console.error(`❌ Seed not found at index ${i}`);
        continue;
      }

      try {
        console.log(`\n📦 Rolling back seed: ${seed.name}`);
        await seed.rollback(databaseAdapter);
        console.log(`✅ Seed ${seed.name} rolled back`);
      } catch (error) {
        console.error(`❌ Failed to rollback seed ${seed.name}:`, error);
        throw error;
      }
    }

    console.log('✅ All PostgreSQL seeds rolled back');
  }

  async runSpecificSeed(
    databaseAdapter: IDatabaseAdapter,
    seedName: string
  ): Promise<void> {
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      throw new Error('PostgreSQLSeedStrategy requires PostgreSQLAdapter');
    }

    const seed = this.seeds.find(s => s.name === seedName);
    if (!seed) {
      throw new Error(`Seed ${seedName} not found`);
    }

    console.log(`🌱 Running specific PostgreSQL seed: ${seed.name}`);
    await seed.run(databaseAdapter);
    console.log(`✅ Seed ${seedName} completed`);
  }
}
