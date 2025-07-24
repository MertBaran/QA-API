import { ISeedStrategy } from '../interfaces/ISeedStrategy';
import { IDatabaseAdapter } from '../../repositories/adapters/IDatabaseAdapter';
import { MongoDBAdapter } from '../../repositories/adapters/MongoDBAdapter';
import { PermissionSeed } from '../seeds/mongodb/PermissionSeed';
import { RoleSeed } from '../seeds/mongodb/RoleSeed';

export class MongoDBSeedStrategy implements ISeedStrategy {
  private seeds = [new PermissionSeed(), new RoleSeed()];

  async runSeeds(databaseAdapter: IDatabaseAdapter): Promise<void> {
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      throw new Error('MongoDBSeedStrategy requires MongoDBAdapter');
    }

    console.log('🌱 Running MongoDB seeds...');

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

    console.log('✅ All MongoDB seeds completed');
  }

  async rollbackSeeds(databaseAdapter: IDatabaseAdapter): Promise<void> {
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      throw new Error('MongoDBSeedStrategy requires MongoDBAdapter');
    }

    console.log('🔄 Rolling back MongoDB seeds...');

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

    console.log('✅ All MongoDB seeds rolled back');
  }

  async runSpecificSeed(
    databaseAdapter: IDatabaseAdapter,
    seedName: string
  ): Promise<void> {
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      throw new Error('MongoDBSeedStrategy requires MongoDBAdapter');
    }

    const seed = this.seeds.find(s => s.name === seedName);
    if (!seed) {
      throw new Error(`Seed ${seedName} not found`);
    }

    console.log(`🌱 Running specific MongoDB seed: ${seed.name}`);
    await seed.run(databaseAdapter);
    console.log(`✅ Seed ${seedName} completed`);
  }
}
