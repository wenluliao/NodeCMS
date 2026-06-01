import express from "express";
import cors from "cors";
import path from "path";
import {initDatabase} from "./config/database";
import authRoutes from "./routes/auth";
import categoryRoutes from "./routes/categories";
import articleRoutes from "./routes/articles";
import messageRoutes from "./routes/messages";
import chatRoutes from "./routes/chat";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

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

// Upload endpoint
const multer = require("multer");
const uploadDir = path.join(__dirname, "../uploads");
const fs = require("fs");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {recursive: true});
}

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, uploadDir),
  filename: (req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`);
  },
});

const upload = multer({storage, limits: {fileSize: 5 * 1024 * 1024}});

app.post("/api/upload", upload.single("file"), (req: any, res: any) => {
  if (!req.file) {
    return res.json({code: 400, message: "请选择文件", data: null});
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({code: 0, message: "上传成功", data: {url}});
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
