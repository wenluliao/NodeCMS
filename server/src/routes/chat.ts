import {Router, Request, Response} from "express";
import {getPool} from "../config/database";
import {authMiddleware, AuthRequest} from "../middleware/auth";
import type {ApiResponse, PaginatedData} from "../types";
import axios from "axios";

const router = Router();

// Bailian (DashScope) API config - compatible with OpenAI format
const BAILIAN_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const BAILIAN_API_KEY = "sk-36aa145646ea41789a78a18243a1fee8";
const BAILIAN_MODEL = "qwen-turbo";

// System prompt for the AI assistant
const SYSTEM_PROMPT = `你是一个专业的律师事务所AI客服助手。你的职责是：
1. 回答访客关于法律服务的常见问题
2. 介绍律师事务所的业务范围：民事诉讼、刑事辩护、合同纠纷、婚姻家庭、劳动争议、知识产权等
3. 引导访客留下联系方式以便律师进一步沟通
4. 对于复杂法律问题，建议访客预约线下咨询
请用专业、友善的语气回答，回答要简洁明了。`;

// Send message (public)
router.post("/send", async (req: Request, res: Response) => {
  const {session_id, message} = req.body;

  if (!message || !message.trim()) {
    res.json({code: 400, message: "消息不能为空", data: null} as ApiResponse);
    return;
  }

  let sid = session_id;
  if (!sid) {
    // Generate a new session ID
    sid = "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);
  }

  try {
    const db = getPool();

    // Ensure session exists
    const [sessRows] = await db.execute(
      "SELECT session_id FROM chat_sessions WHERE session_id = ?",
      [sid],
    );
    if ((sessRows as any[]).length === 0) {
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
      await db.execute("INSERT INTO chat_sessions (session_id, visitor_ip) VALUES (?, ?)", [
        sid,
        ip,
      ]);
    }

    // Save user message
    await db.execute("INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)", [
      sid,
      "user",
      message,
    ]);

    // Load chat history for context (last 20 messages)
    const [historyRows] = await db.execute(
      "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 20",
      [sid],
    );
    const history = historyRows as {role: string; content: string}[];

    // Build messages array for Bailian API
    const messages = [
      {role: "system", content: SYSTEM_PROMPT},
      ...history.map((m) => ({role: m.role as string, content: m.content})),
    ];

    // Call Bailian API
    let aiReply = "抱歉，我暂时无法回答您的问题，请稍后再试或拨打我们的咨询电话。";
    try {
      const apiRes = await axios.post(
        BAILIAN_API_URL,
        {
          model: BAILIAN_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${BAILIAN_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      if (apiRes.data?.choices?.[0]?.message?.content) {
        aiReply = apiRes.data.choices[0].message.content;
      }
    } catch (apiErr: any) {
      console.error("Bailian API error:", apiErr?.response?.data || apiErr?.message);
    }

    // Save AI reply
    await db.execute("INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)", [
      sid,
      "assistant",
      aiReply,
    ]);

    res.json({
      code: 0,
      message: "success",
      data: {session_id: sid, reply: aiReply},
    } as ApiResponse);
  } catch (err) {
    console.error("Chat error:", err);
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

// Get all chat sessions (admin)
router.get("/sessions", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const {page = "1", pageSize = "10"} = req.query;

    const p = parseInt(page as string, 10);
    const ps = parseInt(pageSize as string, 10);
    const offset = (p - 1) * ps;

    const [countRows] = await db.execute("SELECT COUNT(*) as total FROM chat_sessions");
    const total = (countRows as any[])[0].total;

    const [sessions] = await db.execute(
      `SELECT s.*,
        (SELECT COUNT(*) FROM chat_messages m WHERE m.session_id = s.session_id) AS message_count
       FROM chat_sessions s
       ORDER BY s.updated_at DESC LIMIT ? OFFSET ?`,
      [ps, offset],
    );

    res.json({
      code: 0,
      message: "success",
      data: {list: sessions, total, page: p, pageSize: ps} as PaginatedData<any>,
    } as ApiResponse);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

// Get messages for a session (admin)
router.get(
  "/sessions/:sessionId/messages",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const db = getPool();
      const [messages] = await db.execute(
        "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
        [req.params.sessionId],
      );
      res.json({code: 0, message: "success", data: messages} as ApiResponse);
    } catch (err) {
      res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
    }
  },
);

// Get recent messages for a session (public, for restoring chat history)
router.get("/history/:sessionId", async (req: Request, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(
      "SELECT session_id FROM chat_sessions WHERE session_id = ?",
      [req.params.sessionId],
    );
    if ((rows as any[]).length === 0) {
      res.json({code: 404, message: "会话不存在", data: null} as ApiResponse);
      return;
    }
    const [messages] = await db.execute(
      "SELECT role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 50",
      [req.params.sessionId],
    );
    res.json({code: 0, message: "success", data: messages} as ApiResponse);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

// Delete a chat session (admin)
router.delete("/sessions/:sessionId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.execute("SELECT id FROM chat_sessions WHERE session_id = ?", [
      req.params.sessionId,
    ]);
    if ((rows as any[]).length === 0) {
      res.json({code: 404, message: "会话不存在", data: null} as ApiResponse);
      return;
    }
    await db.execute("DELETE FROM chat_sessions WHERE session_id = ?", [req.params.sessionId]);
    res.json({code: 0, message: "删除成功", data: null} as ApiResponse);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

export default router;
