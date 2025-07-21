import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { IAuditProvider } from '../../infrastructure/audit/IAuditProvider';

// Hassas bilgileri filtrele
function sanitizeRequestBody(body: any, action: string): any {
  if (!body) return body;

  const sanitized = { ...body };

  // Login ve register işlemlerinde hassas bilgileri kaldır
  if (action === 'USER_LOGIN' || action === 'USER_CREATE') {
    delete sanitized.password;
    delete sanitized.email;
  }

  // Şifre sıfırlama işlemlerinde hassas bilgileri kaldır
  if (action === 'PASSWORD_UPDATE') {
    delete sanitized.password;
    delete sanitized.newPassword;
    delete sanitized.confirmPassword;
  }

  return sanitized;
}

export function auditMiddleware(
  action: string,
  options?: { tags?: string[]; targetExtractor?: (req: Request) => any }
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', async () => {
      try {
        const audit = container.resolve<IAuditProvider>('IAuditProvider');
        const user = (req as any).user || {};
        const target = options?.targetExtractor
          ? options.targetExtractor(req)
          : undefined;
        const isSuccess = res.statusCode < 400;
        // Hassas bilgileri filtrele
        const sanitizedBody = sanitizeRequestBody(req.body, action);

        // Kullanıcı bilgisini al
        let actor = user.id
          ? {
              id: user.id,
              email: user.email,
              role: user.role,
            }
          : undefined;

        // Login işleminde response'dan kullanıcı bilgisini al
        if (action === 'USER_LOGIN' && isSuccess && (res as any).locals?.user) {
          const responseUser = (res as any).locals.user;
          actor = {
            id: responseUser.id,
            email: responseUser.email,
            role: responseUser.role,
          };
        }

        await audit.log({
          action,
          actor,
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
            body: sanitizedBody,
            referer: req.headers['referer'],
            origin: req.headers['origin'],
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
