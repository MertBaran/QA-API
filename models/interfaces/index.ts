/**
 * Barrel Export - Tüm model interface'leri ve EntityType metadata'larını otomatik toplar
 * Yeni bir searchable entity eklendiğinde, buraya export eklenmesi yeterlidir
 */

// EntityType metadata export'ları - Convention: *EntityTypeMetadata
export { QuestionEntityTypeMetadata } from './IQuestionModel';
export { AnswerEntityTypeMetadata } from './IAnswerModel';

// Model interface export'ları
export type { IQuestionModel } from './IQuestionModel';
export type { IAnswerModel } from './IAnswerModel';
export type { IUserModel } from './IUserModel';
export type { IBaseModel } from './IBaseModel';
export type { IBookmarkModel } from './IBookmarkModel';
export type { INotificationModel } from './INotificationModel';
export type { INotificationTemplateModel } from './INotificationTemplateModel';
export type { IPermissionModel } from './IPermissionModel';
export type { IRoleModel } from './IRoleModel';
export type { IUserRoleModel } from './IUserRoleModel';
