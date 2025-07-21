import { injectable, inject } from 'tsyringe';
import { SystemMetrics } from '../contracts/INotificationStrategy';
import { IQueueProvider } from '../contracts/IQueueProvider';

@injectable()
export class SystemMetricsCollector {
  private metricsCache: SystemMetrics | null = null;
  private lastUpdate = 0;
  private readonly CACHE_DURATION = 5000; // 5 saniye cache

  constructor(
    @inject('IQueueProvider') private queueProvider: IQueueProvider
  ) {}

  async getMetrics(): Promise<SystemMetrics> {
    const now = Date.now();

    // Cache'den döndür eğer yeterince yeni ise
    if (this.metricsCache && now - this.lastUpdate < this.CACHE_DURATION) {
      return this.metricsCache;
    }

    // Yeni metrics topla
    const metrics = await this.collectMetrics();

    this.metricsCache = metrics;
    this.lastUpdate = now;

    return metrics;
  }

  private async collectMetrics(): Promise<SystemMetrics> {
    try {
      // Queue size
      const queueInfo = await this.queueProvider.getQueueInfo('notifications');
      const queueSize = queueInfo?.messageCount || 0;

      // Memory usage
      const memoryUsage = process.memoryUsage();
      const memoryUsagePercent =
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      // Response time (simulated - gerçek uygulamada monitoring'den alınır)
      const responseTime = this.getSimulatedResponseTime();

      // Error rate (simulated - gerçek uygulamada monitoring'den alınır)
      const errorRate = this.getSimulatedErrorRate();

      // Active connections (simulated - gerçek uygulamada monitoring'den alınır)
      const activeConnections = this.getSimulatedActiveConnections();

      return {
        queueSize,
        responseTime,
        errorRate,
        activeConnections,
        memoryUsage: memoryUsagePercent,
      };
    } catch (error) {
      // Hata durumunda default değerler döndür
      return {
        queueSize: 0,
        responseTime: 1000,
        errorRate: 0,
        activeConnections: 10,
        memoryUsage: 50,
      };
    }
  }

  private getSimulatedResponseTime(): number {
    // Gerçek uygulamada bu değer monitoring sisteminden alınır
    const baseTime = 500;
    const variation = Math.random() * 1000;
    return baseTime + variation;
  }

  private getSimulatedErrorRate(): number {
    // Gerçek uygulamada bu değer monitoring sisteminden alınır
    return Math.random() * 10; // 0-10% arası
  }

  private getSimulatedActiveConnections(): number {
    // Gerçek uygulamada bu değer monitoring sisteminden alınır
    const baseConnections = 50;
    const variation = Math.random() * 100;
    return Math.floor(baseConnections + variation);
  }

  // Cache'i temizle (test için)
  clearCache(): void {
    this.metricsCache = null;
    this.lastUpdate = 0;
  }
}
