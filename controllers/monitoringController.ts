import { Request, Response } from 'express';
import asyncErrorWrapper from 'express-async-handler';
import { container } from '../services/container';
import { WebSocketMonitorService } from '../services/WebSocketMonitorService';

export class MonitoringController {
  private connectionMonitor = container.resolve<WebSocketMonitorService>(
    'WebSocketMonitorService'
  );

  // Connection status endpoint
  getConnectionStatus = asyncErrorWrapper(
    async (req: Request, res: Response): Promise<void> => {
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
    }
  );

  // Alert history endpoint
  getAlertHistory = asyncErrorWrapper(
    async (req: Request, res: Response): Promise<void> => {
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
    }
  );

  // Monitoring stats endpoint
  getMonitoringStats = asyncErrorWrapper(
    async (req: Request, res: Response): Promise<void> => {
      const stats = this.connectionMonitor.getMonitoringStats();

      res.json({
        success: true,
        data: stats,
      });
    }
  );

  // Start monitoring endpoint
  startMonitoring = asyncErrorWrapper(
    async (req: Request, res: Response): Promise<void> => {
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
    }
  );

  // Stop monitoring endpoint
  stopMonitoring = asyncErrorWrapper(
    async (req: Request, res: Response): Promise<void> => {
      this.connectionMonitor.stopMonitoring();

      res.json({
        success: true,
        message: 'Connection monitoring stopped',
        data: {
          isActive: this.connectionMonitor.isMonitoringActive(),
        },
      });
    }
  );
}
