import { Response } from "express";

interface UserWithJWT {
  generateJWTFromUser(): string;
  name: string;
  email: string;
  [key: string]: any; // Allow additional properties
}

interface Request {
  headers: {
    authorization?: string;
  };
}

const sendJwtToClient = (token: string, user: any, res: Response) => {
  const { JWT_COOKIE, NODE_ENV } = process.env;
  return res
    .status(200)
    .cookie("access_token", token, {
      httpOnly: true,
      expires: new Date(
        Date.now() + parseInt(process.env["JWT_COOKIE"] || "60") * 1000 * 60
      ),
      secure: process.env["NODE_ENV"] === "development" ? false : true,
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

const isTokenIncluded = (req: Request): boolean => {
  return !!(
    req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
  );
};

const getAccessTokenFromHeader = (req: Request): string | undefined => {
  const authorization = req.headers.authorization;

  // Only return token if it's a Bearer token
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.split(" ")[1];
  }

  return undefined;
};

export { sendJwtToClient, isTokenIncluded, getAccessTokenFromHeader };
