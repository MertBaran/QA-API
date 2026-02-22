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
  const secret =
    process.env['JWT_SECRET_KEY'] || process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error(
      'JWT_SECRET_KEY or JWT_SECRET is required. Set it in config/env.'
    );
  }
  return jwt.sign(payload, secret, { expiresIn: '24h' });
};

export const verifyToken = (token: string): UserWithJWT => {
  const secret =
    process.env['JWT_SECRET_KEY'] || process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error(
      'JWT_SECRET_KEY or JWT_SECRET is required. Set it in config/env.'
    );
  }
  const _JWT_COOKIE = process.env['JWT_COOKIE'] || 'token';
  const _NODE_ENV = process.env['NODE_ENV'] || 'development';

  return jwt.verify(token, secret) as UserWithJWT;
};

export const sendJwtToClient = (
  token: string,
  user: any,
  res: Response,
  rememberMe: boolean = false
) => {
  const _JWT_COOKIE = process.env['JWT_COOKIE'] || 'token';
  const _NODE_ENV = process.env['NODE_ENV'] || 'development';

  // Remember me durumuna göre cookie süresini ayarla
  const cookieExpires = rememberMe
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 gün
    : new Date(
        Date.now() + parseInt(process.env['JWT_COOKIE'] || '60') * 1000 * 60
      ); // 1 saat

  // Never expose sensitive user fields in token responses
  const {
    password,
    resetPasswordToken,
    resetPasswordExpire,
    passwordChangeCode,
    passwordChangeCodeExpire,
    passwordChangeVerificationToken,
    passwordChangeVerificationTokenExpire,
    ...safeUser
  } = user ?? {};

  return res
    .status(200)
    .cookie('access_token', token, {
      httpOnly: true,
      expires: cookieExpires,
      secure: process.env['NODE_ENV'] === 'development' ? false : true,
    })
    .json({
      success: true,
      access_token: token,
      message: 'Authentication successful',
      data: {
        _id: safeUser._id,
        name: safeUser.name,
        email: safeUser.email,
        role: safeUser.role,
        ...safeUser,
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
