import { AuditMiddleware } from '../../../middlewares/audit/auditMiddleware';
import { container } from 'tsyringe';

class FakeAuditProvider {
  log = jest.fn();
}

describe('auditMiddleware', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;
  let fakeAudit: FakeAuditProvider;

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/test',
      params: {},
      query: {},
      body: {},
      headers: { 'user-agent': 'jest', 'x-request-id': 'reqid' },
      ip: '127.0.0.1',
      route: { path: '/test' },
      user: { id: 'u1', email: 'u@a.com', role: 'user' },
    };
    res = {
      statusCode: 200,
      on: jest.fn((event, cb) => {
        if (event === 'finish') res._finish = cb;
      }),
      locals: {},
    };
    next = jest.fn();
    fakeAudit = new FakeAuditProvider();
    container.registerInstance('IAuditProvider', fakeAudit);
  });

  it('should call auditProvider.log on response finish', async () => {
    const auditMiddleware = container.resolve(AuditMiddleware);
    const mw = auditMiddleware.createMiddleware('TEST_ACTION');
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
    // Simulate response finish
    await res._finish();
    expect(fakeAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TEST_ACTION',
        actor: { id: 'u1', email: 'u@a.com', role: 'user' },
      })
    );
  });

  it('should include tags and target if provided', async () => {
    const auditMiddleware = container.resolve(AuditMiddleware);
    const mw = auditMiddleware.createMiddleware('TAGGED', {
      tags: ['t1'],
      targetExtractor: (_r: any) => ({ id: 'target' }),
    });
    mw(req, res, next);
    await res._finish();
    expect(fakeAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['t1'], target: { id: 'target' } })
    );
  });

  it('should set isSuccess false if statusCode >= 400', async () => {
    res.statusCode = 404;
    const auditMiddleware = container.resolve(AuditMiddleware);
    const mw = auditMiddleware.createMiddleware('FAIL_ACTION');
    mw(req, res, next);
    await res._finish();
    expect(fakeAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ isSuccess: false }),
      })
    );
  });
});
