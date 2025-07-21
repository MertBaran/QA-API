import { Request, Response } from 'express';
import { container } from '../services/container';
import { HealthCheckService } from '../services/HealthCheckService';
import { ApplicationState } from '../services/ApplicationState';

export class HealthCheckController {
  private appState = ApplicationState.getInstance();

  quickHealthCheck(req: Request, res: Response): void {
    const memory = this.appState.getMemoryUsage();

    res.json({
      status: this.appState.isReady ? 'healthy' : 'starting',
      timestamp: new Date().toISOString(),
      uptime: this.appState.getUptime(),
      memory,
      message: this.appState.isReady
        ? 'Server is ready'
        : 'Server is starting up',
    });
  }

  async fullHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      if (!this.appState.isReady) {
        const memory = this.appState.getMemoryUsage();

        res.json({
          status: 'starting',
          timestamp: new Date().toISOString(),
          environment: process.env['NODE_ENV'] || 'unknown',
          services: {
            database: 'unknown',
            cache: 'unknown',
            email: 'unknown',
          },
          uptime: this.appState.getUptime(),
          memory,
          message: 'Server is starting up, services are being initialized',
        });
        return;
      }

      const healthCheckService =
        container.resolve<HealthCheckService>('HealthCheckService');
      const health = await healthCheckService.checkHealth();
      res.json(health);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
