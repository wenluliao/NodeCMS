import {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn("[安全警告] 未配置 JWT_SECRET 环境变量，正在使用随机生成的密钥。服务重启后所有已签发的 token 将失效。请在环境变量中配置 JWT_SECRET。");
  return crypto.randomBytes(32).toString("hex");
})();

export interface AuthRequest extends Request {
  user?: {id: number; username: string};
}

export function generateToken(user: {id: number; username: string}): string {
  return jwt.sign(user, JWT_SECRET, {expiresIn: "24h"});
}

export function verifyToken(token: string): {id: number; username: string} | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {id: number; username: string};
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({code: 401, message: "未登录或token已过期", data: null});
    return;
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({code: 401, message: "token无效或已过期", data: null});
    return;
  }

  req.user = user;
  next();
}
