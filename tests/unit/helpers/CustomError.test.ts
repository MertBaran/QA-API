import { ApplicationError } from '../../../infrastructure/error/ApplicationError';

describe('ApplicationError Unit Tests', () => {
  it('should create an error with message and statusCode', () => {
    const err = ApplicationError.notFoundError('Test error');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApplicationError);
    expect(err.message).toBe('Test error');
    expect(err.statusCode).toBe(404);
  });
});
