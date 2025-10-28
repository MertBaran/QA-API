import { getAccessToRoute } from '../../../middlewares/authorization/authMiddleware';
import { ApplicationError } from '../../../infrastructure/error/ApplicationError';
import jwt from 'jsonwebtoken';

describe('authMiddleware - getAccessToRoute', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;
  const OLD_ENV = process.env;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();
    process.env = { ...OLD_ENV, JWT_SECRET_KEY: 'testsecret' };
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it('should call next with error if token is missing', () => {
    getAccessToRoute(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApplicationError));
    expect((next.mock.calls[0][0] as ApplicationError).statusCode).toBe(401);
  });

  it('should call next with error if token is invalid', () => {
    req.headers.authorization = 'Bearer invalidtoken';
    jest.spyOn(jwt, 'verify').mockImplementation((_token, _secret, cb) => {
      (cb as Function)(new Error('invalid'), undefined);
    });
    getAccessToRoute(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApplicationError));
    expect((next.mock.calls[0][0] as ApplicationError).statusCode).toBe(401);
  });

  it('should attach user and call next if token is valid', () => {
    req.headers.authorization = 'Bearer validtoken';
    jest.spyOn(jwt, 'verify').mockImplementation((_token, _secret, cb) => {
      (cb as Function)(null, { id: 'user1', name: 'Test User' });
    });
    getAccessToRoute(req, res, next);
    expect(req.user).toEqual({ id: 'user1', name: 'Test User' });
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with error if JWT_SECRET_KEY is missing', () => {
    process.env['JWT_SECRET_KEY'] = '';
    req.headers.authorization = 'Bearer sometoken';
    getAccessToRoute(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApplicationError));
    expect((next.mock.calls[0][0] as ApplicationError).statusCode).toBe(500);
  });
});
