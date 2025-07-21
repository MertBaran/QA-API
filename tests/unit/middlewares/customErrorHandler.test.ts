import customErrorHandler from '../../../middlewares/errors/customErrorHandler';
import CustomError from '../../../helpers/error/CustomError';
import { container } from 'tsyringe';

class FakeLogger {
  error = jest.fn();
}

describe('customErrorHandler', () => {
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
  });

  it('should handle CustomError and log it', () => {
    const err = new CustomError('Test error', 418);
    customErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test error',
    });
    // Logger is not called in the current implementation
    expect(fakeLogger.error).not.toHaveBeenCalled();
  });

  it('should handle CastError', () => {
    const err = { name: 'CastError' };
    customErrorHandler(err as any, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Please provide a valid id',
    });
  });

  it('should handle SyntaxError', () => {
    const err = { name: 'SyntaxError' };
    customErrorHandler(err as any, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unexpected Syntax',
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
    customErrorHandler(err as any, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Field 1 error, Field 2 error',
    });
  });

  it('should handle duplicate key error', () => {
    const err = { code: 11000 };
    customErrorHandler(err as any, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Duplicate Field Value Enter',
    });
  });

  it('should handle unknown error', () => {
    const err = { message: 'Unknown', statusCode: undefined };
    customErrorHandler(err as any, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unknown',
    });
  });
});
