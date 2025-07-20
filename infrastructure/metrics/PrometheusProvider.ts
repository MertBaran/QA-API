import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';
import { IMetricsProvider } from './IMetricsProvider';

client.collectDefaultMetrics();

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [50, 100, 200, 300, 400, 500, 1000, 2000, 5000],
});

const middleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds
      .labels(
        req.method,
        req.route ? req.route.path : req.path,
        res.statusCode.toString()
      )
      .observe(duration);
  });
  next();
};

const endpoint = (req: Request, res: Response) => {
  res.set('Content-Type', client.register.contentType);
  res.end(client.register.metrics());
};

export const PrometheusProvider: IMetricsProvider = {
  middleware,
  endpoint,
};
