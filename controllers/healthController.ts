import { Request, Response } from 'express';
import asyncErrorWrapper from 'express-async-handler';
import { container } from '../services/container';
import { HealthCheckService } from '../services/HealthCheckService';
import { ApplicationState } from '../services/ApplicationState';

export class HealthCheckController {
  private appState = ApplicationState.getInstance();

  quickHealthCheck = asyncErrorWrapper(
    async (req: Request, res: Response): Promise<void> => {
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
  );

  fullHealthCheck = asyncErrorWrapper(
    async (req: Request, res: Response): Promise<void> => {
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
    }
  );
}
