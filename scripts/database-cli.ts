import 'reflect-metadata';
import { container } from 'tsyringe';
import { initializeContainer } from '../services/container';
import { IEnvironmentProvider } from '../services/contracts/IEnvironmentProvider';
import { IDatabaseAdapter } from '../repositories/adapters/IDatabaseAdapter';
import { MigrationManager } from '../database/migrations/MigrationManager';
import { SeederManager } from '../database/seeders/SeederManager';

class DatabaseCLI {
  private migrationManager = new MigrationManager();
  private seederManager = new SeederManager();

  async initialize(): Promise<void> {
    try {
      console.log('🔌 Initializing application container...');

      // Environment'ı dinamik olarak detect et
      const detectedEnv = this.detectEnvironment();
      process.env['NODE_ENV'] = detectedEnv;

      const envProvider = container.resolve<IEnvironmentProvider>(
        'IEnvironmentProvider'
      );
      console.log(`🔧 Environment detected: ${envProvider.getEnvironment()}`);

      // Sonra BootstrapService'i initialize et
      await initializeContainer();

      console.log('✅ Application container initialized');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      process.exit(1);
    }
  }

  private detectEnvironment(): string {
    // 1. NODE_ENV environment variable'ından al
    if (process.env['NODE_ENV']) {
      return process.env['NODE_ENV'];
    }

    // 2. Package.json script'inden al
    const npmScript = process.env['npm_lifecycle_event'];
    if (npmScript) {
      if (npmScript.includes('dev') || npmScript.includes('start:dev')) {
        return 'development';
      }
      if (npmScript.includes('test')) {
        return 'test';
      }
      if (npmScript.includes('start') || npmScript.includes('prod')) {
        return 'production';
      }
    }

    // 3. Process title'dan al
    const processTitle = process.title;
    if (processTitle.includes('dev') || processTitle.includes('development')) {
      return 'development';
    }
    if (processTitle.includes('test')) {
      return 'test';
    }
    if (processTitle.includes('prod') || processTitle.includes('production')) {
      return 'production';
    }

    // 4. Default olarak development
    console.log('⚠️  No environment detected, defaulting to development');
    return 'development';
  }

  async getDatabaseConnection() {
    const databaseAdapter =
      container.resolve<IDatabaseAdapter>('IDatabaseAdapter');

    if (!databaseAdapter.isConnected()) {
      await databaseAdapter.connect();
    }

    // Mongoose connection'ı direkt al
    return require('mongoose').connection;
  }

  async migrate(): Promise<void> {
    const databaseAdapter =
      container.resolve<IDatabaseAdapter>('IDatabaseAdapter');
    await this.migrationManager.runAll(databaseAdapter);
  }

  async rollback(): Promise<void> {
    const databaseAdapter =
      container.resolve<IDatabaseAdapter>('IDatabaseAdapter');
    await this.migrationManager.rollbackAll(databaseAdapter);
  }

  async seed(): Promise<void> {
    const databaseAdapter =
      container.resolve<IDatabaseAdapter>('IDatabaseAdapter');
    await this.seederManager.runAll(databaseAdapter);
  }

  async rollbackSeeds(): Promise<void> {
    const databaseAdapter =
      container.resolve<IDatabaseAdapter>('IDatabaseAdapter');
    await this.seederManager.rollbackAll(databaseAdapter);
  }

  async setup(): Promise<void> {
    const databaseAdapter =
      container.resolve<IDatabaseAdapter>('IDatabaseAdapter');

    console.log('🚀 Setting up database...');
    await this.migrationManager.runAll(databaseAdapter);
    await this.seederManager.runAll(databaseAdapter);
    console.log('🎉 Database setup completed!');
  }

  async assignAdmin(userEmail: string): Promise<void> {
    const connection = await this.getDatabaseConnection();

    console.log(`👑 Assigning admin role to ${userEmail}...`);

    // User'ı bul
    const User = connection.model('User', new (require('mongoose').Schema)({}));
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.error(`❌ User with email ${userEmail} not found!`);
      return;
    }

    // Admin role'ünü bul
    const Role = connection.model('Role');
    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      console.error('❌ Admin role not found! Run setup first.');
      return;
    }

    // UserRole model'ini oluştur
    const UserRoleSchema = new (require('mongoose').Schema)(
      {
        userId: {
          type: require('mongoose').Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        roleId: {
          type: require('mongoose').Schema.Types.ObjectId,
          ref: 'Role',
          required: true,
        },
        isActive: { type: Boolean, default: true },
      },
      { timestamps: true }
    );

    const UserRole = connection.model('UserRole', UserRoleSchema);

    // Mevcut user role'ü kontrol et
    const existingUserRole = await UserRole.findOne({
      userId: user._id,
      roleId: adminRole._id,
      isActive: true,
    });

    if (existingUserRole) {
      console.log(`✅ User ${userEmail} already has admin role`);
      return;
    }

    // Admin role'ünü ata
    await UserRole.create({
      userId: user._id,
      roleId: adminRole._id,
      isActive: true,
    });

    console.log(`✅ Assigned admin role to ${userEmail}`);
  }

  async status(): Promise<void> {
    const connection = await this.getDatabaseConnection();

    console.log('📊 Database Status:');

    // Collections'ları listele
    const collections = await connection.db.listCollections().toArray();
    console.log(`   Collections: ${collections.length}`);

    for (const collection of collections) {
      if (connection?.db) {
        const count = await connection.db
          .collection(collection.name)
          .countDocuments();
        console.log(`   - ${collection.name}: ${count} documents`);
      }
    }
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
  const cli = new DatabaseCLI();
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    await cli.initialize();

    switch (command) {
      case 'migrate':
        await cli.migrate();
        break;

      case 'rollback':
        await cli.rollback();
        break;

      case 'seed':
        await cli.seed();
        break;

      case 'rollback-seeds':
        await cli.rollbackSeeds();
        break;

      case 'setup':
        await cli.setup();
        break;

      case 'admin':
        if (!arg) {
          console.error('❌ Email required for admin assignment');
          console.log('Usage: npm run db:admin <email>');
          break;
        }
        await cli.assignAdmin(arg);
        break;

      case 'status':
        await cli.status();
        break;

      default:
        console.log('📚 Database CLI Commands:');
        console.log('  npm run db:migrate        - Run all migrations');
        console.log('  npm run db:rollback       - Rollback all migrations');
        console.log('  npm run db:seed           - Run all seeds');
        console.log('  npm run db:rollback-seeds - Rollback all seeds');
        console.log('  npm run db:setup          - Run migrations + seeds');
        console.log('  npm run db:admin <email>  - Assign admin role to user');
        console.log('  npm run db:status         - Show database status');
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
