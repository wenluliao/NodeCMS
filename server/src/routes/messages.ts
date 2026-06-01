import {Router, Request, Response} from "express";
import {getPool} from "../config/database";
import {authMiddleware, AuthRequest} from "../middleware/auth";
import type {ApiResponse, Message, PaginatedData, CreateMessageRequest} from "../types";

const router = Router();

// Submit message (public)
router.post("/", async (req: Request, res: Response) => {
  const {name, phone, email, content} = req.body as CreateMessageRequest;

  if (!name || !phone || !content) {
    res.json({code: 400, message: "姓名、电话和内容不能为空", data: null} as ApiResponse);
    return;
  }

  try {
    const db = getPool();
    await db.execute("INSERT INTO messages (name, phone, email, content) VALUES (?, ?, ?, ?)", [
      name,
      phone,
      email || "",
      content,
    ]);
    res.json({code: 0, message: "留言提交成功", data: null} as ApiResponse);
  } catch (err) {
    res.json({code: 500, message: "提交失败", data: null} as ApiResponse);
  }
});

// Get all messages (admin)
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const {is_read, page = "1", pageSize = "10"} = req.query;

    let whereClause = "";
    const params: any[] = [];

    if (is_read !== undefined && is_read !== "") {
      whereClause = "WHERE is_read = ?";
      params.push(is_read);
    }

    const p = parseInt(page as string, 10);
    const ps = parseInt(pageSize as string, 10);
    const offset = (p - 1) * ps;

    const [countRows] = await db.execute(
      `SELECT COUNT(*) as total FROM messages ${whereClause}`,
      params,
    );
    const total = (countRows as any[])[0].total;

    const [messages] = await db.execute(
      `SELECT * FROM messages ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, ps, offset],
    );

    res.json({
      code: 0,
      message: "success",
      data: {list: messages, total, page: p, pageSize: ps} as PaginatedData<Message>,
    } as ApiResponse<PaginatedData<Message>>);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

// Mark message as read (admin)
router.patch("/:id/read", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.execute("SELECT * FROM messages WHERE id = ?", [req.params.id]);
    if ((rows as any[]).length === 0) {
      res.json({code: 404, message: "留言不存在", data: null} as ApiResponse);
      return;
    }

    await db.execute("UPDATE messages SET is_read = 1 WHERE id = ?", [req.params.id]);
    res.json({code: 0, message: "已标记为已读", data: null} as ApiResponse);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

// Mark all as read (admin)
router.patch("/read-all", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    await db.execute("UPDATE messages SET is_read = 1 WHERE is_read = 0");
    res.json({code: 0, message: "全部标记为已读", data: null} as ApiResponse);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

// Delete message (admin)
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.execute("SELECT * FROM messages WHERE id = ?", [req.params.id]);
    if ((rows as any[]).length === 0) {
      res.json({code: 404, message: "留言不存在", data: null} as ApiResponse);
      return;
    }

    await db.execute("DELETE FROM messages WHERE id = ?", [req.params.id]);
    res.json({code: 0, message: "删除成功", data: null} as ApiResponse);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

// Get unread count (admin)
router.get("/unread-count", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.execute("SELECT COUNT(*) as count FROM messages WHERE is_read = 0");
    const count = (rows as any[])[0].count;
    res.json({code: 0, message: "success", data: {count}} as ApiResponse);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

export default router;
