import { injectable } from 'tsyringe';
import { INotificationDataSource } from '../interfaces/INotificationDataSource';
import { INotificationModel } from '../../models/interfaces/INotificationModel';
import { INotificationTemplateModel } from '../../models/interfaces/INotificationTemplateModel';
import NotificationMongo from '../../models/mongodb/NotificationMongoModel';
import NotificationTemplateMongo from '../../models/mongodb/NotificationTemplateMongoModel';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

@injectable()
export class NotificationMongooseDataSource implements INotificationDataSource {
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
    const saved = await newNotification.save();
    return saved.toObject();
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
    const updateData: Record<string, unknown> = { status };
    switch (status) {
      case 'sent':
        updateData['sentAt'] = new Date();
        break;
      case 'delivered':
        updateData['deliveredAt'] = new Date();
        break;
      case 'read':
        updateData['readAt'] = new Date();
        break;
      case 'failed':
        updateData['retryCount'] = (additionalData?.retryCount ?? 0) + 1;
        break;
    }
    if (additionalData) {
      Object.assign(updateData, additionalData);
    }
    const result = await NotificationMongo.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    return !!result;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await NotificationMongo.findByIdAndDelete(id);
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
    const saved = await newTemplate.save();
    return saved.toObject();
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
    const template = await NotificationTemplateMongo.findOne({ name });
    if (!template) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.NOTIFICATION_TEMPLATE.TEMPLATE_NOT_FOUND.en
      );
    }
    return template.toObject();
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
    return !!result;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const result = await NotificationTemplateMongo.findByIdAndDelete(id);
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
