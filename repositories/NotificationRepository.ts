import { inject, injectable } from 'tsyringe';
import { INotificationRepository } from './interfaces/INotificationRepository';
import { INotificationModel } from '../models/interfaces/INotificationModel';
import { INotificationTemplateModel } from '../models/interfaces/INotificationTemplateModel';
import NotificationMongo from '../models/mongodb/NotificationMongoModel';
import NotificationTemplateMongo from '../models/mongodb/NotificationTemplateMongoModel';
import { ILoggerProvider } from '../infrastructure/logging/ILoggerProvider';
import { ApplicationError } from '../infrastructure/error';
import { RepositoryConstants } from './constants/RepositoryMessages';

@injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(@inject('ILoggerProvider') private logger: ILoggerProvider) {}

  // Notification CRUD
  async createNotification(
    notification: Partial<INotificationModel>
  ): Promise<INotificationModel> {
    const newNotification = new NotificationMongo({
      ...notification,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      tags: notification.tags || [],
    });

    const savedNotification = await newNotification.save();
    this.logger.info('Notification created', {
      id: savedNotification._id,
      type: savedNotification.type,
    });

    return savedNotification.toObject();
  }

  async getNotificationById(id: string): Promise<INotificationModel> {
    const notification = await NotificationMongo.findById(id);
    if (!notification) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.NOTIFICATION.NOTIFICATION_NOT_FOUND.en
      );
    }
    return notification.toObject();
  }

  async getNotificationsByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<INotificationModel[]> {
    const notifications = await NotificationMongo.find({ userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return notifications.map(n => n.toObject());
  }

  async updateNotificationStatus(
    id: string,
    status: INotificationModel['status'],
    additionalData?: Partial<INotificationModel>
  ): Promise<boolean> {
    const updateData: any = { status };

    // Status'a göre zaman bilgilerini güncelle
    switch (status) {
      case 'sent':
        updateData.sentAt = new Date();
        break;
      case 'delivered':
        updateData.deliveredAt = new Date();
        break;
      case 'read':
        updateData.readAt = new Date();
        break;
      case 'failed':
        updateData.retryCount = (additionalData?.retryCount || 0) + 1;
        break;
    }

    // Ek verileri ekle
    if (additionalData) {
      Object.assign(updateData, additionalData);
    }

    const result = await NotificationMongo.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    this.logger.info('Notification status updated', {
      id,
      status,
      success: !!result,
    });

    return !!result;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await NotificationMongo.findByIdAndDelete(id);
    this.logger.info('Notification deleted', { id, success: !!result });
    return !!result;
  }

  // Template CRUD
  async createTemplate(
    template: Partial<INotificationTemplateModel>
  ): Promise<INotificationTemplateModel> {
    const newTemplate = new NotificationTemplateMongo({
      ...template,
      createdAt: new Date(),
      updatedAt: new Date(),
      variables: template.variables || [],
      tags: template.tags || [],
    });

    const savedTemplate = await newTemplate.save();
    this.logger.info('Template created', {
      id: savedTemplate._id,
      name: savedTemplate.name,
    });

    return savedTemplate.toObject();
  }

  async getTemplateById(id: string): Promise<INotificationTemplateModel> {
    const template = await NotificationTemplateMongo.findById(id);
    if (!template) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.NOTIFICATION_TEMPLATE.TEMPLATE_NOT_FOUND.en
      );
    }
    return template.toObject();
  }

  async getTemplateByName(name: string): Promise<INotificationTemplateModel> {
    try {
      const template = await NotificationTemplateMongo.findOne({ name });
      if (!template) {
        throw ApplicationError.notFoundError(
          RepositoryConstants.NOTIFICATION_TEMPLATE.TEMPLATE_NOT_FOUND.en
        );
      }
      return template.toObject();
    } catch (error) {
      this.logger.error('Error getting template by name', { error, name });
      throw error;
    }
  }

  async getTemplatesByType(
    type: INotificationTemplateModel['type']
  ): Promise<INotificationTemplateModel[]> {
    const templates = await NotificationTemplateMongo.find({
      type,
      isActive: true,
    });
    return templates.map(t => t.toObject());
  }

  async updateTemplate(
    id: string,
    template: Partial<INotificationTemplateModel>
  ): Promise<boolean> {
    const updateData = {
      ...template,
      updatedAt: new Date(),
    };

    const result = await NotificationTemplateMongo.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    this.logger.info('Template updated', { id, success: !!result });

    return !!result;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const result = await NotificationTemplateMongo.findByIdAndDelete(id);
    this.logger.info('Template deleted', { id, success: !!result });
    return !!result;
  }

  // Statistics
  async getNotificationStats(userId?: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    failed: number;
    delivered: number;
    read: number;
  }> {
    const filter = userId ? { userId } : {};

    const [total, pending, sent, failed, delivered, read] = await Promise.all([
      NotificationMongo.countDocuments(filter),
      NotificationMongo.countDocuments({ ...filter, status: 'pending' }),
      NotificationMongo.countDocuments({ ...filter, status: 'sent' }),
      NotificationMongo.countDocuments({ ...filter, status: 'failed' }),
      NotificationMongo.countDocuments({ ...filter, status: 'delivered' }),
      NotificationMongo.countDocuments({ ...filter, status: 'read' }),
    ]);

    return { total, pending, sent, failed, delivered, read };
  }
}
