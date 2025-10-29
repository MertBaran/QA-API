import { appErrorHandler } from '../../../middlewares/errors/appErrorHandler';
import { ApplicationError } from '../../../infrastructure/error/ApplicationError';
import { container } from 'tsyringe';
import { FakeEnvironmentProvider } from '../../mocks/providers/FakeEnvironmentProvider';
import { FakeExceptionTracker } from '../../mocks/error/FakeExceptionTracker';

class FakeLogger {
  error = jest.fn();
}

describe('appErrorHandler', () => {
  let req: any;
  let res: any;
  let next: any;
  let fakeLogger: FakeLogger;

  beforeEach(() => {
    req = {};
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    fakeLogger = new FakeLogger();
    container.registerInstance('ILoggerProvider', fakeLogger);
    container.registerInstance(
      'IEnvironmentProvider',
      new FakeEnvironmentProvider()
    );
    container.registerInstance('IExceptionTracker', new FakeExceptionTracker());
  });

  it('should handle ApplicationError and log it', () => {
    const err = ApplicationError.notFoundError('Test error');
    appErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test error',
      statusCode: 404,
      debug: expect.any(Object),
    });
  });

  it('should handle CastError', () => {
    const err = { name: 'CastError' };
    appErrorHandler(err as any, req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Please provide a valid id',
      statusCode: 422,
      debug: expect.any(Object),
    });
  });

  it('should handle SyntaxError', () => {
    const err = { name: 'SyntaxError' };
    appErrorHandler(err as any, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid JSON syntax',
      statusCode: 400,
      debug: expect.any(Object),
    });
  });

  it('should handle ValidationError', () => {
    const err = {
      name: 'ValidationError',
      errors: {
        field1: { message: 'Field 1 error' },
        field2: { message: 'Field 2 error' },
      },
    };
    appErrorHandler(err as any, req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Field 1 error, Field 2 error',
      statusCode: 422,
      debug: expect.any(Object),
    });
  });

  it('should handle duplicate key error', () => {
    const err = { code: 11000, keyValue: { email: 'test@example.com' } };
    appErrorHandler(err as any, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'email already exists',
      statusCode: 409,
      debug: expect.any(Object),
    });
  });

  it('should handle unknown error', () => {
    const err = { message: 'Unknown', statusCode: undefined };
    appErrorHandler(err as any, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unknown',
      statusCode: 500,
      debug: expect.any(Object),
    });
  });
});
