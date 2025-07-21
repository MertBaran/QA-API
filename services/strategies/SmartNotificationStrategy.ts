import { injectable } from 'tsyringe';
import {
  INotificationStrategy,
  NotificationContext,
  SystemMetrics,
} from '../contracts/INotificationStrategy';

@injectable()
export class SmartNotificationStrategy implements INotificationStrategy {
  shouldUseQueue(
    context: NotificationContext,
    metrics: SystemMetrics
  ): boolean {
    // Kritik bildirimler her zaman direct
    if (context.notificationType === 'CRITICAL') {
      return false;
    }

    // Premium kullanıcılar için hızlı response
    if (context.userType === 'premium' && context.priority === 'urgent') {
      return false;
    }

    // Sistem yüksek yükte ise queue kullan
    if (metrics.queueSize > 1000 || metrics.responseTime > 5000) {
      return true;
    }

    // Hata oranı yüksekse queue kullan (retry mekanizması için)
    if (metrics.errorRate > 5) {
      return true;
    }

    // Peak saatlerde queue kullan
    if (context.timeOfDay === 'peak' && metrics.activeConnections > 100) {
      return true;
    }

    // Normal durumda queue kullan (güvenilirlik için)
    return true;
  }

  getStrategy(
    context: NotificationContext,
    metrics: SystemMetrics
  ): 'direct' | 'queue' {
    return this.shouldUseQueue(context, metrics) ? 'queue' : 'direct';
  }

  getRetryAttempts(context: NotificationContext): number {
    switch (context.notificationType) {
      case 'CRITICAL':
        return 5;
      case 'HIGH':
        return 3;
      case 'NORMAL':
        return 2;
      case 'LOW':
        return 1;
      default:
        return 2;
    }
  }

  getTimeout(context: NotificationContext): number {
    switch (context.priority) {
      case 'urgent':
        return 5000; // 5 saniye
      case 'high':
        return 10000; // 10 saniye
      case 'normal':
        return 30000; // 30 saniye
      case 'low':
        return 60000; // 1 dakika
      default:
        return 30000;
    }
  }

  private getTimeOfDay(): 'peak' | 'normal' | 'off-peak' {
    const hour = new Date().getHours();

    if (hour >= 9 && hour <= 17) {
      return 'peak'; // İş saatleri
    } else if (hour >= 18 && hour <= 22) {
      return 'normal'; // Akşam
    } else {
      return 'off-peak'; // Gece
    }
  }

  createContext(
    userId: string,
    userType: 'premium' | 'standard' | 'admin',
    notificationType: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW',
    priority: 'urgent' | 'high' | 'normal' | 'low'
  ): NotificationContext {
    return {
      userId,
      userType,
      notificationType,
      priority,
      timeOfDay: this.getTimeOfDay(),
    };
  }
}
