import { INotificationModel } from '../../models/interfaces/INotificationModel';
import { INotificationTemplateModel } from '../../models/interfaces/INotificationTemplateModel';

export interface INotificationRepository {
  // Notification CRUD
  createNotification(
    notification: Partial<INotificationModel>
  ): Promise<INotificationModel>;
  getNotificationById(id: string): Promise<INotificationModel>;
  getNotificationsByUserId(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<INotificationModel[]>;
  updateNotificationStatus(
    id: string,
    status: INotificationModel['status'],
    additionalData?: Partial<INotificationModel>
  ): Promise<boolean>;
  deleteNotification(id: string): Promise<boolean>;

  // Template CRUD
  createTemplate(
    template: Partial<INotificationTemplateModel>
  ): Promise<INotificationTemplateModel>;
  getTemplateById(id: string): Promise<INotificationTemplateModel>;
  getTemplateByName(name: string): Promise<INotificationTemplateModel>;
  getTemplatesByType(
    type: INotificationTemplateModel['type']
  ): Promise<INotificationTemplateModel[]>;
  updateTemplate(
    id: string,
    template: Partial<INotificationTemplateModel>
  ): Promise<boolean>;
  deleteTemplate(id: string): Promise<boolean>;

  // Statistics
  getNotificationStats(userId?: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    failed: number;
    delivered: number;
    read: number;
  }>;
}
