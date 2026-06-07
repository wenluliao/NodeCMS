import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import dotenv from "dotenv";
import {initDatabase} from "./config/database";
import {authMiddleware} from "./middleware/auth";
import authRoutes from "./routes/auth";
import categoryRoutes from "./routes/categories";
import articleRoutes from "./routes/articles";
import messageRoutes from "./routes/messages";
import chatRoutes from "./routes/chat";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // SPA 前端可能需要 inline scripts，按需调整
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS - 只允许配置的域名
const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173").split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      // 允许无 origin 的请求（如服务端内部调用、curl）
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS 不允许此域名访问"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({limit: "10mb"}));
app.use(express.urlencoded({extended: true, limit: "10mb"}));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Serve frontend static files in production
const clientDistPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chat", chatRoutes);

// Upload endpoint - 需要登录 + 文件类型白名单
const multer = require("multer");
const uploadDir = path.join(__dirname, "../uploads");
const fs = require("fs");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {recursive: true});
}

// 允许上传的文件类型白名单
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, uploadDir),
  filename: (req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {fileSize: 5 * 1024 * 1024}, // 5MB
  fileFilter: (req: any, file: any, cb: any) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("不支持的文件类型，仅允许上传图片文件"), false);
    }
  },
});

app.post(
  "/api/upload",
  authMiddleware,
  upload.single("file"),
  (req: any, res: any) => {
    if (!req.file) {
      return res.json({code: 400, message: "请选择文件", data: null});
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({code: 0, message: "上传成功", data: {url}});
  },
);

// multer 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.json({code: 400, message: "文件大小不能超过5MB", data: null});
    }
    return res.json({code: 400, message: `上传错误: ${err.message}`, data: null});
  }
  if (err) {
    return res.json({code: 400, message: err.message || "上传失败", data: null});
  }
  next();
});

// SPA fallback - serve index.html for all non-API routes
app.get("*", (req: express.Request, res: express.Response) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({code: 404, message: "API not found", data: null});
    return;
  }
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// Initialize database and start server
async function start() {
  try {
    await initDatabase();
    console.log("Database initialized successfully");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }
}

start();
