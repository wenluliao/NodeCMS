import {Router, Request, Response} from "express";
import {getPool} from "../config/database";
import {authMiddleware, AuthRequest} from "../middleware/auth";
import type {
  ApiResponse,
  Article,
  PaginatedData,
  CreateArticleRequest,
  UpdateArticleRequest,
} from "../types";

const router = Router();

// Get articles (public - only visible)
router.get("/public", async (req: Request, res: Response) => {
  try {
    const db = getPool();
    const {category_id, slug, page = "1", pageSize = "10"} = req.query;

    let whereClause = "WHERE a.is_visible = 1";
    const params: any[] = [];

    if (category_id) {
      whereClause += " AND a.category_id = ?";
      params.push(category_id);
    }
    if (slug) {
      whereClause += " AND c.slug = ?";
      params.push(slug);
    }

    const p = parseInt(page as string, 10);
    const ps = parseInt(pageSize as string, 10);
    const offset = (p - 1) * ps;

    const [countRows] = await db.execute(
      `SELECT COUNT(*) as total FROM articles a LEFT JOIN categories c ON a.category_id = c.id ${whereClause}`,
      params,
    );
    const total = (countRows as any[])[0].total;

    const [articles] = await db.execute(
      `SELECT a.*, c.name as category_name FROM articles a LEFT JOIN categories c ON a.category_id = c.id ${whereClause} ORDER BY a.sort_order ASC, a.created_at DESC LIMIT ? OFFSET ?`,
      [...params, ps, offset],
    );

    res.json({
      code: 0,
      message: "success",
      data: {list: articles, total, page: p, pageSize: ps} as PaginatedData<Article>,
    } as ApiResponse<PaginatedData<Article>>);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

// Get single article (public)
router.get("/public/:id", async (req: Request, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(
      "SELECT a.*, c.name as category_name FROM articles a LEFT JOIN categories c ON a.category_id = c.id WHERE a.id = ? AND a.is_visible = 1",
      [req.params.id],
    );
    const articles = rows as Article[];

    if (articles.length === 0) {
      res.json({code: 404, message: "文章不存在", data: null} as ApiResponse);
      return;
    }
    res.json({code: 0, message: "success", data: articles[0]} as ApiResponse<Article>);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

// Get all articles (admin - including hidden)
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const {category_id, keyword, page = "1", pageSize = "10"} = req.query;

    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (category_id) {
      whereClause += " AND a.category_id = ?";
      params.push(category_id);
    }
    if (keyword) {
      whereClause += " AND a.title LIKE ?";
      params.push(`%${keyword}%`);
    }

    const p = parseInt(page as string, 10);
    const ps = parseInt(pageSize as string, 10);
    const offset = (p - 1) * ps;

    const [countRows] = await db.execute(
      `SELECT COUNT(*) as total FROM articles a ${whereClause}`,
      params,
    );
    const total = (countRows as any[])[0].total;

    const [articles] = await db.execute(
      `SELECT a.*, c.name as category_name FROM articles a LEFT JOIN categories c ON a.category_id = c.id ${whereClause} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
      [...params, ps, offset],
    );

    res.json({
      code: 0,
      message: "success",
      data: {list: articles, total, page: p, pageSize: ps} as PaginatedData<Article>,
    } as ApiResponse<PaginatedData<Article>>);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

// Get single article (admin)
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(
      "SELECT a.*, c.name as category_name FROM articles a LEFT JOIN categories c ON a.category_id = c.id WHERE a.id = ?",
      [req.params.id],
    );
    const articles = rows as Article[];

    if (articles.length === 0) {
      res.json({code: 404, message: "文章不存在", data: null} as ApiResponse);
      return;
    }
    res.json({code: 0, message: "success", data: articles[0]} as ApiResponse<Article>);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

// Create article (admin)
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const {category_id, title, summary, content, cover_image, is_visible, sort_order} =
    req.body as CreateArticleRequest;

  if (!category_id || !title || !content) {
    res.json({code: 400, message: "分类、标题和内容不能为空", data: null} as ApiResponse);
    return;
  }

  try {
    const db = getPool();
    const [result] = await db.execute(
      "INSERT INTO articles (category_id, title, summary, content, cover_image, is_visible, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        category_id,
        title,
        summary || "",
        content,
        cover_image || "",
        is_visible ?? 1,
        sort_order || 0,
      ],
    );
    const insertId = (result as any).insertId;
    res.json({code: 0, message: "创建成功", data: {id: insertId}} as ApiResponse);
  } catch (err) {
    res.json({code: 500, message: "创建失败", data: null} as ApiResponse);
  }
});

// Update article (admin)
router.put("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.execute("SELECT * FROM articles WHERE id = ?", [req.params.id]);
    if ((rows as any[]).length === 0) {
      res.json({code: 404, message: "文章不存在", data: null} as ApiResponse);
      return;
    }

    const existing = (rows as any[])[0];
    const {category_id, title, summary, content, cover_image, is_visible, sort_order} =
      req.body as UpdateArticleRequest;

    await db.execute(
      "UPDATE articles SET category_id = ?, title = ?, summary = ?, content = ?, cover_image = ?, is_visible = ?, sort_order = ? WHERE id = ?",
      [
        category_id ?? existing.category_id,
        title ?? existing.title,
        summary ?? existing.summary,
        content ?? existing.content,
        cover_image ?? existing.cover_image,
        is_visible ?? existing.is_visible,
        sort_order ?? existing.sort_order,
        req.params.id,
      ],
    );

    res.json({code: 0, message: "更新成功", data: null} as ApiResponse);
  } catch (err) {
    res.json({code: 500, message: "更新失败", data: null} as ApiResponse);
  }
});

// Toggle article visibility (admin)
router.patch("/:id/visibility", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.execute("SELECT * FROM articles WHERE id = ?", [req.params.id]);
    if ((rows as any[]).length === 0) {
      res.json({code: 404, message: "文章不存在", data: null} as ApiResponse);
      return;
    }

    const existing = (rows as any[])[0];
    const newVisibility = existing.is_visible ? 0 : 1;
    await db.execute("UPDATE articles SET is_visible = ? WHERE id = ?", [
      newVisibility,
      req.params.id,
    ]);
    res.json({
      code: 0,
      message: newVisibility ? "已显示" : "已隐藏",
      data: {is_visible: newVisibility},
    } as ApiResponse);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

// Delete article (admin)
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.execute("SELECT * FROM articles WHERE id = ?", [req.params.id]);
    if ((rows as any[]).length === 0) {
      res.json({code: 404, message: "文章不存在", data: null} as ApiResponse);
      return;
    }

    await db.execute("DELETE FROM articles WHERE id = ?", [req.params.id]);
    res.json({code: 0, message: "删除成功", data: null} as ApiResponse);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

export default router;
