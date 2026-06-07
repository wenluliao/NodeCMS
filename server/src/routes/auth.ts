import {Router, Response} from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import {getPool} from "../config/database";
import {generateToken, authMiddleware, AuthRequest} from "../middleware/auth";
import type {LoginRequest, ApiResponse, LoginResponse} from "../types";

const router = Router();

// 登录限流：15 分钟内最多 10 次尝试
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {code: 429, message: "登录尝试过于频繁，请 15 分钟后再试", data: null},
  standardHeaders: true,
  legacyHeaders: false,
});

// Login
router.post("/login", loginLimiter, async (req: AuthRequest, res: Response) => {
  const {username, password} = req.body as LoginRequest;

  if (!username || !password) {
    res.json({code: 400, message: "用户名和密码不能为空", data: null} as ApiResponse);
    return;
  }

  try {
    const db = getPool();
    const [rows] = await db.execute("SELECT * FROM admin_users WHERE username = ?", [username]);
    const users = rows as any[];

    if (users.length === 0) {
      res.json({code: 401, message: "用户名或密码错误", data: null} as ApiResponse);
      return;
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.json({code: 401, message: "用户名或密码错误", data: null} as ApiResponse);
      return;
    }

    const token = generateToken({id: user.id, username: user.username});
    res.json({
      code: 0,
      message: "登录成功",
      data: {token, username: user.username} as LoginResponse,
    } as ApiResponse<LoginResponse>);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

// Change password
router.post("/change-password", authMiddleware, async (req: AuthRequest, res: Response) => {
  const {oldPassword, newPassword} = req.body;

  if (!oldPassword || !newPassword) {
    res.json({code: 400, message: "请填写原密码和新密码", data: null});
    return;
  }

  try {
    const db = getPool();
    const [rows] = await db.execute("SELECT * FROM admin_users WHERE id = ?", [req.user!.id]);
    const users = rows as any[];

    if (users.length === 0) {
      res.json({code: 400, message: "用户不存在", data: null});
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, users[0].password);
    if (!isMatch) {
      res.json({code: 400, message: "原密码错误", data: null});
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute("UPDATE admin_users SET password = ? WHERE id = ?", [
      hashedPassword,
      users[0].id,
    ]);
    res.json({code: 0, message: "密码修改成功", data: null});
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null});
  }
});

export default router;
