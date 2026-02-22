import { inject, injectable } from 'tsyringe';
import { INotificationRepository } from './interfaces/INotificationRepository';
import { INotificationModel } from '../models/interfaces/INotificationModel';
import { INotificationTemplateModel } from '../models/interfaces/INotificationTemplateModel';
import { INotificationDataSource } from './interfaces/INotificationDataSource';
import { ILoggerProvider } from '../infrastructure/logging/ILoggerProvider';

@injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @inject('ILoggerProvider') private logger: ILoggerProvider,
    @inject('INotificationDataSource')
    private dataSource: INotificationDataSource
  ) {}

  // Notification CRUD
  async createNotification(
    notification: Partial<INotificationModel>
  ): Promise<INotificationModel> {
    const saved = await this.dataSource.createNotification(notification);
    this.logger.info('Notification created', {
      id: saved._id,
      type: saved.type,
    });
    return saved;
  }

  async getNotificationById(id: string): Promise<INotificationModel> {
    return this.dataSource.getNotificationById(id);
  }

  async getNotificationsByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<INotificationModel[]> {
    return this.dataSource.getNotificationsByUserId(userId, limit, offset);
  }

  async updateNotificationStatus(
    id: string,
    status: INotificationModel['status'],
    additionalData?: Partial<INotificationModel>
  ): Promise<boolean> {
    const result = await this.dataSource.updateNotificationStatus(
      id,
      status,
      additionalData
    );
    this.logger.info('Notification status updated', {
      id,
      status,
      success: result,
    });
    return result;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await this.dataSource.deleteNotification(id);
    this.logger.info('Notification deleted', { id, success: result });
    return result;
  }

  // Template CRUD
  async createTemplate(
    template: Partial<INotificationTemplateModel>
  ): Promise<INotificationTemplateModel> {
    const saved = await this.dataSource.createTemplate(template);
    this.logger.info('Template created', {
      id: saved._id,
      name: saved.name,
    });
    return saved;
  }

  async getTemplateById(id: string): Promise<INotificationTemplateModel> {
    return this.dataSource.getTemplateById(id);
  }

  async getTemplateByName(name: string): Promise<INotificationTemplateModel> {
    try {
      return await this.dataSource.getTemplateByName(name);
    } catch (error) {
      this.logger.error('Error getting template by name', { error, name });
      throw error;
    }
  }

  async getTemplatesByType(
    type: INotificationTemplateModel['type']
  ): Promise<INotificationTemplateModel[]> {
    return this.dataSource.getTemplatesByType(type);
  }

  async updateTemplate(
    id: string,
    template: Partial<INotificationTemplateModel>
  ): Promise<boolean> {
    const result = await this.dataSource.updateTemplate(id, template);
    this.logger.info('Template updated', { id, success: result });
    return result;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const result = await this.dataSource.deleteTemplate(id);
    this.logger.info('Template deleted', { id, success: result });
    return result;
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
    return this.dataSource.getNotificationStats(userId);
  }
}
