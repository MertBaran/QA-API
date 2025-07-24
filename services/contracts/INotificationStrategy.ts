// Bu import'lar kullanılmıyor, kaldırıldı

export interface SystemMetrics {
  queueSize: number;
  responseTime: number;
  errorRate: number;
  activeConnections: number;
  memoryUsage: number;
}

export interface NotificationContext {
  userId: string;
  userType: 'premium' | 'standard' | 'admin';
  notificationType: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  timeOfDay: 'peak' | 'normal' | 'off-peak';
}

export interface INotificationStrategy {
  shouldUseQueue(context: NotificationContext, metrics: SystemMetrics): boolean;
  getStrategy(
    context: NotificationContext,
    metrics: SystemMetrics
  ): 'direct' | 'queue';
  getRetryAttempts(context: NotificationContext): number;
  getTimeout(context: NotificationContext): number;
  createContext(
    userId: string,
    userType: 'premium' | 'standard' | 'admin',
    notificationType: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW',
    priority: 'urgent' | 'high' | 'normal' | 'low'
  ): NotificationContext;
}
