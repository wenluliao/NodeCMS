import {Router, Request, Response} from "express";
import {getPool} from "../config/database";
import {generateToken} from "../middleware/auth";
import type {LoginRequest, ApiResponse, LoginResponse} from "../types";

const router = Router();

// Login
router.post("/login", async (req: Request, res: Response) => {
  const {username, password} = req.body as LoginRequest;

  if (!username || !password) {
    res.json({code: 400, message: "用户名和密码不能为空", data: null} as ApiResponse);
    return;
  }

  try {
    const db = getPool();
    const [rows] = await db.execute(
      "SELECT * FROM admin_users WHERE username = ? AND password = ?",
      [username, password],
    );
    const users = rows as any[];

    if (users.length === 0) {
      res.json({code: 401, message: "用户名或密码错误", data: null} as ApiResponse);
      return;
    }

    const user = users[0];
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
router.post("/change-password", async (req: Request, res: Response) => {
  const {oldPassword, newPassword} = req.body;
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.json({code: 401, message: "未登录", data: null});
    return;
  }

  try {
    const db = getPool();
    const [rows] = await db.execute("SELECT * FROM admin_users WHERE username = ?", ["admin"]);
    const users = rows as any[];

    if (users.length === 0 || users[0].password !== oldPassword) {
      res.json({code: 400, message: "原密码错误", data: null});
      return;
    }

    await db.execute("UPDATE admin_users SET password = ? WHERE id = ?", [
      newPassword,
      users[0].id,
    ]);
    res.json({code: 0, message: "密码修改成功", data: null});
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null});
  }
});

export default router;
