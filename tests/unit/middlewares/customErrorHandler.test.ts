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
    container.registerInstance('LoggerProvider', fakeLogger);
  });

  it('should handle CustomError and log it', () => {
    const err = new CustomError('Test error', 418);
    customErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Test error' });
    expect(fakeLogger.error).toHaveBeenCalledWith('Error: Test error', { statusCode: 418 });
  });

  it('should handle CastError', () => {
    const err = { name: 'CastError' };
    customErrorHandler(err as any, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'please provide a valid id' });
  });

  it('should handle SyntaxError', () => {
    const err = { name: 'SyntaxError' };
    customErrorHandler(err as any, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unexpected Syntax' });
  });

  it('should handle ValidationError', () => {
    const err = { name: 'ValidationError' };
    customErrorHandler(err as any, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Please provide a valid email or password' });
  });

  it('should handle duplicate key error', () => {
    const err = { code: 11000 };
    customErrorHandler(err as any, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Duplicate Key Found : Check Your Input' });
  });

  it('should handle unknown error', () => {
    const err = { message: 'Unknown', statusCode: undefined };
    customErrorHandler(err as any, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unknown' });
  });
}); 