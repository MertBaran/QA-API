import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { IAuditProvider } from '../../infrastructure/audit/IAuditProvider';

export function auditMiddleware(
  action: string,
  options?: { tags?: string[]; targetExtractor?: (req: Request) => any }
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', async () => {
      try {
        const audit = container.resolve<IAuditProvider>('AuditProvider');
        const user = (req as any).user || {};
        const target = options?.targetExtractor
          ? options.targetExtractor(req)
          : undefined;
        const responseTime = Date.now() - start;
        const isSuccess = res.statusCode < 400;
        await audit.log({
          action,
          actor: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          target,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          requestId: req.headers['x-request-id'] as string,
          sessionId: (req as any).sessionID,
          tags: options?.tags,
          context: req.route?.path,
          error: isSuccess ? null : (res as any).locals?.error,
          timestamp: new Date(),
          details: {
            method: req.method,
            url: req.originalUrl,
            params: req.params,
            query: req.query,
            body: req.body,
            referer: req.headers['referer'],
            origin: req.headers['origin'],
            host: req.headers['host'],
            status: res.statusCode,
            responseTime,
            headers: {
              'user-agent': req.headers['user-agent'],
              referer: req.headers['referer'],
              origin: req.headers['origin'],
              host: req.headers['host'],
              'x-request-id': req.headers['x-request-id'],
            },
            isSuccess,
          },
        });
      } catch (_e) {
        // Log error but don't fail the request
        console.error('Audit logging failed:', _e);
      }
    });
    next();
  };
}
