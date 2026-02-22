import { SeedInterface } from '../../interfaces/SeedInterface';
import { IDatabaseAdapter } from '../../../repositories/adapters/IDatabaseAdapter';
import { PostgreSQLAdapter } from '../../../repositories/adapters/PostgreSQLAdapter';
import { getPrismaClient } from '../../../repositories/postgresql/PrismaClientSingleton';
import { ALL_TEMPLATES } from './templates';

export class NotificationTemplateSeed implements SeedInterface {
  name = 'NotificationTemplateSeed';
  description = 'Seed all notification templates (welcome, password-reset, password-change-code, question-answered, account-verified, admin-notification)';

  async run(databaseAdapter: IDatabaseAdapter): Promise<Map<string, unknown>> {
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      console.log('⏭️ Skipping NotificationTemplate seed for non-PostgreSQL adapter');
      return new Map();
    }

    const prisma = getPrismaClient();
    const templateMap = new Map<string, string>();

    console.log('📧 Seeding PostgreSQL notification templates...');

    try {
      for (const template of ALL_TEMPLATES) {
        const existing = await prisma.notificationTemplate.findUnique({
          where: { name: template.name },
        });

        if (existing) {
          console.log(`  ✓ ${template.name} (already exists)`);
          templateMap.set(template.name, existing.id);
          continue;
        }

        const created = await prisma.notificationTemplate.create({
          data: {
            name: template.name,
            type: template.type,
            category: template.category,
            subject: template.subject as object,
            message: template.message as object,
            html: template.html as object,
            variables: template.variables,
            isActive: template.isActive,
            priority: template.priority,
            description: template.description as object,
            tags: template.tags,
          },
        });

        templateMap.set(template.name, created.id);
        console.log(`  ✅ Created: ${template.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating notification template:`, error);
      throw error;
    }

    return templateMap;
  }

  async rollback(databaseAdapter: IDatabaseAdapter): Promise<void> {
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      return;
    }

    const prisma = getPrismaClient();
    console.log('🔄 Rolling back notification templates...');

    try {
      const names = ALL_TEMPLATES.map(t => t.name);
      const result = await prisma.notificationTemplate.deleteMany({
        where: { name: { in: names } },
      });
      console.log(`✅ Deleted ${result.count} notification template(s)`);
    } catch (error) {
      console.error(`❌ Error rolling back templates:`, error);
      throw error;
    }
  }
}
