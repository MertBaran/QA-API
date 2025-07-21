import { Request, Response } from 'express';
import { container } from '../services/container';
import { WebSocketMonitorService } from '../services/WebSocketMonitorService';

export class MonitoringController {
  private connectionMonitor = container.resolve<WebSocketMonitorService>(
    'WebSocketMonitorService'
  );

  // Connection status endpoint
  getConnectionStatus(req: Request, res: Response): void {
    try {
      const status = this.connectionMonitor.getConnectionStatus();
      const statusArray = Array.from(status.values());

      res.json({
        success: true,
        data: {
          connections: statusArray,
          monitoring: this.connectionMonitor.isMonitoringActive(),
          lastUpdate: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get connection status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Alert history endpoint
  getAlertHistory(req: Request, res: Response): void {
    try {
      const limit = parseInt(req.query['limit'] as string) || 50;
      const alerts = this.connectionMonitor.getRecentAlerts(limit);

      res.json({
        success: true,
        data: {
          alerts,
          total: this.connectionMonitor.getAlertHistory().length,
          limit,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get alert history',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Monitoring stats endpoint
  getMonitoringStats(req: Request, res: Response): void {
    try {
      const stats = this.connectionMonitor.getMonitoringStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get monitoring stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Start monitoring endpoint
  startMonitoring(req: Request, res: Response): void {
    try {
      const interval = parseInt(req.body.interval) || 30000;
      this.connectionMonitor.startMonitoring(interval);

      res.json({
        success: true,
        message: 'Connection monitoring started',
        data: {
          interval,
          isActive: this.connectionMonitor.isMonitoringActive(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to start monitoring',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Stop monitoring endpoint
  stopMonitoring(req: Request, res: Response): void {
    try {
      this.connectionMonitor.stopMonitoring();

      res.json({
        success: true,
        message: 'Connection monitoring stopped',
        data: {
          isActive: this.connectionMonitor.isMonitoringActive(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to stop monitoring',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
