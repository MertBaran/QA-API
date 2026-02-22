import { injectable } from 'tsyringe';
import { INotificationDataSource } from '../interfaces/INotificationDataSource';
import { INotificationModel } from '../../models/interfaces/INotificationModel';
import { INotificationTemplateModel } from '../../models/interfaces/INotificationTemplateModel';
import { getPrismaClient } from './PrismaClientSingleton';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

function toTemplateModel(row: {
  id: string;
  name: string;
  type: string;
  category: string;
  subject: unknown;
  message: unknown;
  html: unknown;
  variables: string[];
  isActive: boolean;
  priority: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}): INotificationTemplateModel {
  return {
    _id: row.id,
    name: row.name,
    type: row.type as INotificationTemplateModel['type'],
    category: row.category as INotificationTemplateModel['category'],
    subject: row.subject as INotificationTemplateModel['subject'],
    message: row.message as INotificationTemplateModel['message'],
    html: (row.html as INotificationTemplateModel['html']) ?? undefined,
    variables: row.variables || [],
    isActive: row.isActive,
    priority: row.priority as INotificationTemplateModel['priority'],
    tags: row.tags || [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@injectable()
export class NotificationPostgreSQLDataSource implements INotificationDataSource {
  async createNotification(
    notification: Partial<INotificationModel>
  ): Promise<INotificationModel> {
    const prisma = getPrismaClient();
    const created = await prisma.notification.create({
      data: {
        userId: String(notification.userId),
        type: (notification.type as 'email') || 'email',
        status: (notification.status as 'pending') || 'pending',
        subject: notification.subject || '',
        message: notification.message || '',
        html: notification.html || null,
        from: notification.from || 'system@qa.local',
        to: notification.to || String(notification.userId),
        strategy: (notification.strategy as 'direct') || 'direct',
        priority: (notification.priority as 'normal') || 'normal',
        tags: notification.tags || [],
      },
    });
    return { ...created, _id: created.id } as unknown as INotificationModel;
  }

  async getNotificationById(id: string): Promise<INotificationModel> {
    const prisma = getPrismaClient();
    const row = await prisma.notification.findUnique({ where: { id } });
    if (!row) {
      throw ApplicationError.notFoundError(RepositoryConstants.NOTIFICATION.NOTIFICATION_NOT_FOUND.en);
    }
    return row as unknown as INotificationModel;
  }

  async getNotificationsByUserId(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<INotificationModel[]> {
    const prisma = getPrismaClient();
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    return rows as unknown as INotificationModel[];
  }

  async updateNotificationStatus(
    id: string,
    status: INotificationModel['status'],
    additionalData?: Partial<INotificationModel>
  ): Promise<boolean> {
    const prisma = getPrismaClient();
    const updateData: Record<string, unknown> = { status };
    if (status === 'sent') updateData['sentAt'] = new Date();
    if (status === 'delivered') updateData['deliveredAt'] = new Date();
    if (status === 'read') updateData['readAt'] = new Date();
    if (additionalData) Object.assign(updateData, additionalData);
    await prisma.notification.update({
      where: { id },
      data: updateData as never,
    });
    return true;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const prisma = getPrismaClient();
    await prisma.notification.delete({ where: { id } });
    return true;
  }

  async createTemplate(
    template: Partial<INotificationTemplateModel>
  ): Promise<INotificationTemplateModel> {
    const prisma = getPrismaClient();
    const created = await prisma.notificationTemplate.create({
      data: {
        name: template.name!,
        type: template.type as 'email',
        category: template.category as 'security',
        subject: template.subject as object,
        message: template.message as object,
        html: (template.html as object) ?? undefined,
        variables: template.variables || [],
        isActive: template.isActive ?? true,
        priority: (template.priority as 'normal') || 'normal',
        tags: template.tags || [],
      },
    });
    return toTemplateModel(created);
  }

  async getTemplateById(id: string): Promise<INotificationTemplateModel> {
    const prisma = getPrismaClient();
    const row = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!row) {
      throw ApplicationError.notFoundError(RepositoryConstants.NOTIFICATION_TEMPLATE.TEMPLATE_NOT_FOUND.en);
    }
    return toTemplateModel(row);
  }

  async getTemplateByName(name: string): Promise<INotificationTemplateModel> {
    const prisma = getPrismaClient();
    const row = await prisma.notificationTemplate.findUnique({ where: { name } });
    if (!row) {
      throw ApplicationError.notFoundError(RepositoryConstants.NOTIFICATION_TEMPLATE.TEMPLATE_NOT_FOUND.en);
    }
    return toTemplateModel(row);
  }

  async getTemplatesByType(
    type: INotificationTemplateModel['type']
  ): Promise<INotificationTemplateModel[]> {
    const prisma = getPrismaClient();
    const rows = await prisma.notificationTemplate.findMany({
      where: { type, isActive: true },
    });
    return rows.map(toTemplateModel);
  }

  async updateTemplate(
    id: string,
    template: Partial<INotificationTemplateModel>
  ): Promise<boolean> {
    const prisma = getPrismaClient();
    await prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...template,
        subject: template.subject as object,
        message: template.message as object,
        html: template.html as object,
        updatedAt: new Date(),
      } as never,
    });
    return true;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const prisma = getPrismaClient();
    await prisma.notificationTemplate.delete({ where: { id } });
    return true;
  }

  async getNotificationStats(userId?: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    failed: number;
    delivered: number;
    read: number;
  }> {
    const prisma = getPrismaClient();
    const where = userId ? { userId } : {};
    const [total, pending, sent, failed, delivered, read] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, status: 'pending' } }),
      prisma.notification.count({ where: { ...where, status: 'sent' } }),
      prisma.notification.count({ where: { ...where, status: 'failed' } }),
      prisma.notification.count({ where: { ...where, status: 'delivered' } }),
      prisma.notification.count({ where: { ...where, status: 'read' } }),
    ]);
    return { total, pending, sent, failed, delivered, read };
  }
}
