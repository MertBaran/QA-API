import CustomError from '../../../helpers/error/CustomError';

describe('CustomError Unit Tests', () => {
  it('should create an error with message and statusCode', () => {
    const err = new CustomError('Test error', 404);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(CustomError);
    expect(err.message).toBe('Test error');
    expect(err.statusCode).toBe(404);
  });
});
