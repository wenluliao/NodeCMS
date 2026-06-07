import {Router, Request, Response} from "express";
import {getPool} from "../config/database";
import {generateToken, authMiddleware, AuthRequest} from "../middleware/auth";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import type {LoginRequest, ApiResponse, LoginResponse} from "../types";

const router = Router();

// 登录频率限制：每个 IP 15 分钟内最多尝试 10 次
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 10,
  message: {code: 429, message: "登录尝试次数过多，请15分钟后再试", data: null},
  standardHeaders: true,
  legacyHeaders: false,
});

// 改密码频率限制：每个 IP 1 小时内最多 5 次
const changePasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {code: 429, message: "修改密码操作过于频繁，请稍后再试", data: null},
  standardHeaders: true,
  legacyHeaders: false,
});

// Login
router.post("/login", loginLimiter, async (req: Request, res: Response) => {
  const {username, password} = req.body as LoginRequest;

  if (!username || !password) {
    res.json({code: 400, message: "用户名和密码不能为空", data: null} as ApiResponse);
    return;
  }

  // 基础输入校验：防止超长输入
  if (username.length > 50 || password.length > 100) {
    res.json({code: 400, message: "用户名或密码格式不正确", data: null} as ApiResponse);
    return;
  }

  try {
    const db = getPool();
    // 只按用户名查询，密码用 bcrypt 比对（防止时序攻击）
    const [rows] = await db.execute(
      "SELECT id, username, password FROM admin_users WHERE username = ?",
      [username],
    );
    const users = rows as any[];

    if (users.length === 0) {
      // 用户不存在也要做一次 hash 比对，防止用户名枚举的时序攻击
      await bcrypt.compare(password, "$2b$10$dummyhashtopreventtimingattack");
      res.json({code: 401, message: "用户名或密码错误", data: null} as ApiResponse);
      return;
    }

    const user = users[0];

    // bcrypt 密码比对
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
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

// Change password - 必须使用 authMiddleware 鉴权
router.post(
  "/change-password",
  authMiddleware,
  changePasswordLimiter,
  async (req: AuthRequest, res: Response) => {
    const {oldPassword, newPassword} = req.body;

    if (!oldPassword || !newPassword) {
      res.json({code: 400, message: "原密码和新密码不能为空", data: null});
      return;
    }

    // 新密码强度校验
    if (newPassword.length < 8) {
      res.json({code: 400, message: "新密码长度不能少于8位", data: null});
      return;
    }
    if (newPassword.length > 100) {
      res.json({code: 400, message: "新密码长度不能超过100位", data: null});
      return;
    }

    try {
      const db = getPool();
      // 根据 token 中的用户 ID 查询，不再硬编码 admin
      const [rows] = await db.execute("SELECT id, password FROM admin_users WHERE id = ?", [
        req.user!.id,
      ]);
      const users = rows as any[];

      if (users.length === 0) {
        res.json({code: 400, message: "用户不存在", data: null});
        return;
      }

      // bcrypt 验证旧密码
      const isOldPasswordValid = await bcrypt.compare(oldPassword, users[0].password);
      if (!isOldPasswordValid) {
        res.json({code: 400, message: "原密码错误", data: null});
        return;
      }

      // bcrypt 哈希新密码后存储
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await db.execute("UPDATE admin_users SET password = ? WHERE id = ?", [
        hashedNewPassword,
        users[0].id,
      ]);
      res.json({code: 0, message: "密码修改成功", data: null});
    } catch (err) {
      res.json({code: 500, message: "服务器错误", data: null});
    }
  },
);

export default router;
