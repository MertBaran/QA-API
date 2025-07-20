import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

interface UserWithJWT {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: TokenPayload): string => {
  const secret = process.env['JWT_SECRET'] || 'fallback-secret';
  return jwt.sign(payload, secret, { expiresIn: '24h' });
};

export const verifyToken = (token: string): UserWithJWT => {
  const secret = process.env['JWT_SECRET'] || 'fallback-secret';
  const _JWT_COOKIE = process.env['JWT_COOKIE'] || 'token';
  const _NODE_ENV = process.env['NODE_ENV'] || 'development';

  return jwt.verify(token, secret) as UserWithJWT;
};

export const sendJwtToClient = (token: string, user: any, res: Response) => {
  const _JWT_COOKIE = process.env['JWT_COOKIE'] || 'token';
  const _NODE_ENV = process.env['NODE_ENV'] || 'development';
  return res
    .status(200)
    .cookie('access_token', token, {
      httpOnly: true,
      expires: new Date(
        Date.now() + parseInt(process.env['JWT_COOKIE'] || '60') * 1000 * 60
      ),
      secure: process.env['NODE_ENV'] === 'development' ? false : true,
    })
    .json({
      success: true,
      access_token: token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...user, // Diğer alanlar da dahil olsun (güvenli alanlar)
      },
    });
};

export const isTokenIncluded = (req: Request): boolean => {
  return !!(
    req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
  );
};

export const getAccessTokenFromHeader = (req: Request): string | undefined => {
  const authorization = req.headers.authorization;

  // Only return token if it's a Bearer token
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.split(' ')[1];
  }

  return undefined;
};
