import {Router, Request, Response} from "express";
import {getPool} from "../config/database";
import {authMiddleware, AuthRequest} from "../middleware/auth";
import type {ApiResponse, Category, CreateCategoryRequest, UpdateCategoryRequest} from "../types";

const router = Router();

// Get all categories (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.execute("SELECT * FROM categories ORDER BY sort_order ASC, id ASC");
    res.json({code: 0, message: "success", data: rows} as ApiResponse<Category[]>);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

// Get single category by slug (public)
router.get("/slug/:slug", async (req: Request, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.execute("SELECT * FROM categories WHERE slug = ?", [req.params.slug]);
    const categories = rows as Category[];
    if (categories.length === 0) {
      res.json({code: 404, message: "分类不存在", data: null} as ApiResponse);
      return;
    }
    res.json({code: 0, message: "success", data: categories[0]} as ApiResponse<Category>);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

// Create category (admin)
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const {name, slug, sort_order} = req.body as CreateCategoryRequest;
  if (!name || !slug) {
    res.json({code: 400, message: "分类名称和标识不能为空", data: null} as ApiResponse);
    return;
  }

  try {
    const db = getPool();
    const [result] = await db.execute(
      "INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)",
      [name, slug, sort_order || 0],
    );
    const insertId = (result as any).insertId;
    res.json({code: 0, message: "创建成功", data: {id: insertId}} as ApiResponse);
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      res.json({code: 400, message: "分类标识已存在", data: null} as ApiResponse);
    } else {
      res.json({code: 500, message: "创建失败", data: null} as ApiResponse);
    }
  }
});

// Update category (admin)
router.put("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const {name, slug, sort_order} = req.body as UpdateCategoryRequest;

  try {
    const db = getPool();
    const [rows] = await db.execute("SELECT * FROM categories WHERE id = ?", [req.params.id]);
    if ((rows as any[]).length === 0) {
      res.json({code: 404, message: "分类不存在", data: null} as ApiResponse);
      return;
    }

    const existing = (rows as any[])[0];
    await db.execute("UPDATE categories SET name = ?, slug = ?, sort_order = ? WHERE id = ?", [
      name || existing.name,
      slug || existing.slug,
      sort_order ?? existing.sort_order,
      req.params.id,
    ]);
    res.json({code: 0, message: "更新成功", data: null} as ApiResponse);
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      res.json({code: 400, message: "分类标识已存在", data: null} as ApiResponse);
    } else {
      res.json({code: 500, message: "更新失败", data: null} as ApiResponse);
    }
  }
});

// Delete category (admin)
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.execute("SELECT * FROM categories WHERE id = ?", [req.params.id]);
    if ((rows as any[]).length === 0) {
      res.json({code: 404, message: "分类不存在", data: null} as ApiResponse);
      return;
    }

    await db.execute("DELETE FROM categories WHERE id = ?", [req.params.id]);
    res.json({code: 0, message: "删除成功", data: null} as ApiResponse);
  } catch (err) {
    res.json({code: 500, message: "服务器错误", data: null} as ApiResponse);
  }
});

export default router;
