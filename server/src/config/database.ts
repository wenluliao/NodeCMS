import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "nodecms",
};

let pool: mysql.Pool;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      ...DB_CONFIG,
      waitForConnections: true,
      connectionLimit: 10,
      charset: "utf8mb4",
    });
  }
  return pool;
}

export async function initDatabase(): Promise<void> {
  // First connect without database to create it if needed
  const tempConn = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
  });

  await tempConn.execute(
    `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await tempConn.end();

  // Now connect with database
  const db = getPool();
  await initTables(db);
  await seedData(db);
}

async function initTables(db: mysql.Pool): Promise<void> {
  const conn = await db.getConnection();

  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) NOT NULL UNIQUE,
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        summary TEXT,
        content LONGTEXT,
        cover_image VARCHAR(500) DEFAULT '',
        is_visible TINYINT DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100) DEFAULT '',
        content TEXT NOT NULL,
        is_read TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL UNIQUE,
        visitor_name VARCHAR(50) DEFAULT '访客',
        visitor_ip VARCHAR(45) DEFAULT '',
        message_count INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        role ENUM('user', 'assistant') NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } finally {
    conn.release();
  }
}

async function seedData(db: mysql.Pool): Promise<void> {
  // Seed admin user - 使用 bcrypt 哈希密码
  const [adminRows] = await db.execute("SELECT id, password FROM admin_users WHERE username = ?", ["admin"]);
  const adminUsers = adminRows as any[];

  if (adminUsers.length === 0) {
    // 新安装：创建哈希密码
    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.execute("INSERT INTO admin_users (username, password) VALUES (?, ?)", [
      "admin",
      hashedPassword,
    ]);
  } else if (adminUsers[0].password && !adminUsers[0].password.startsWith("$2")) {
    // 已有用户但密码是明文（未以 $2 开头），自动迁移为哈希密码
    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.hash(adminUsers[0].password, 10);
    await db.execute("UPDATE admin_users SET password = ? WHERE username = ?", [
      hashedPassword,
      "admin",
    ]);
    console.log("已自动将 admin 明文密码迁移为 bcrypt 哈希");
  }

  // Seed default categories
  const defaultCategories = [
    {name: "关于我们", slug: "about", sort_order: 1},
    {name: "真实案例", slug: "cases", sort_order: 2},
    {name: "律师随笔", slug: "essays", sort_order: 3},
    {name: "律师风采", slug: "lawyers", sort_order: 4},
    {name: "在线留言", slug: "messages", sort_order: 5},
  ];

  for (const cat of defaultCategories) {
    await db.execute("INSERT IGNORE INTO categories (name, slug, sort_order) VALUES (?, ?, ?)", [
      cat.name,
      cat.slug,
      cat.sort_order,
    ]);
  }

  // Seed sample articles
  const [countRows] = await db.execute("SELECT COUNT(*) as count FROM articles");
  const count = (countRows as any[])[0].count;
  if (count === 0) {
    const [catRows] = await db.execute("SELECT id, slug FROM categories");
    const categories = catRows as {id: number; slug: string}[];

    for (const cat of categories) {
      if (cat.slug === "messages") continue;
      await db.execute(
        "INSERT INTO articles (category_id, title, summary, content, is_visible, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
        [
          cat.id,
          `${getCategoryName(cat.slug)}示例文章`,
          `这是${getCategoryName(cat.slug)}分类的示例文章摘要。`,
          `<h2>示例文章内容</h2><p>这是${getCategoryName(cat.slug)}分类的示例文章正文内容，您可以在后台管理中编辑或删除这篇文章，也可以创建新的文章。</p>`,
          1,
          1,
        ],
      );
    }
  }
}

function getCategoryName(slug: string): string {
  const map: Record<string, string> = {
    about: "关于我们",
    cases: "真实案例",
    essays: "律师随笔",
    lawyers: "律师风采",
    messages: "在线留言",
  };
  return map[slug] || slug;
}
