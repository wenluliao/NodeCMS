# NodeCMS - 律师事务所内容管理系统

基于 Vue 3 + TypeScript + Express + MySQL 的全栈 CMS 管理系统，专为律师事务所设计，支持文章管理、分类管理、留言管理、AI 智能客服等功能。

## 技术栈

| 层级         | 技术                        |
| ------------ | --------------------------- |
| 前端框架     | Vue 3 + TypeScript          |
| 构建工具     | Vite                        |
| UI 组件库    | Element Plus                |
| 富文本编辑器 | wangEditor 5                |
| 路由         | Vue Router 4                |
| HTTP 客户端  | Axios                       |
| 后端框架     | Express + TypeScript        |
| 数据库       | MySQL (mysql2)              |
| 认证         | JWT (jsonwebtoken)          |
| AI 客服      | 百炼 DashScope (qwen-turbo) |
| 文件上传     | Multer                      |

## 功能特性

### 前台功能

- **首页展示** - 按分类展示各板块文章，支持封面图显示
- **分类浏览** - 按分类查看文章列表（关于我们、真实案例、律师随笔、律师风采等）
- **文章详情** - 富文本内容展示，支持图文混排
- **在线留言** - 访客可提交姓名、电话、邮箱和留言内容
- **AI 智能客服** - 右下角浮动聊天气泡，支持多轮对话，实时回答法律咨询

### 后台管理

- **文章管理** - 文章增删改查、富文本编辑、图片上传、显示/隐藏切换
- **分类管理** - 分类增删改，支持自定义 slug 和排序，分类可扩展
- **留言管理** - 查看访客留言、标记已读/未读、删除留言
- **AI 客服记录** - 查看所有 AI 对话会话、浏览完整对话记录、删除会话
- **文件上传** - 封面图和富文本内图片上传，统一存储管理

## 项目结构

```
nodeCMS/
├── client/                        # 前端项目
│   ├── src/
│   │   ├── api/                   # API 接口层 (Axios)
│   │   ├── components/            # 公共组件
│   │   │   └── ChatWidget.vue     # AI 客服聊天气泡
│   │   ├── router/                # 路由配置
│   │   ├── types/                 # TypeScript 类型定义
│   │   ├── utils/                 # 工具函数 (request 拦截器)
│   │   ├── views/
│   │   │   ├── front/             # 前台页面
│   │   │   │   ├── Layout.vue     # 前台布局
│   │   │   │   ├── Home.vue       # 首页
│   │   │   │   ├── CategoryList.vue # 分类列表
│   │   │   │   ├── ArticleDetail.vue # 文章详情
│   │   │   │   └── Message.vue    # 在线留言
│   │   │   └── admin/             # 后台页面
│   │   │       ├── Login.vue      # 登录页
│   │   │       ├── Layout.vue     # 后台布局
│   │   │       ├── Articles.vue   # 文章管理
│   │   │       ├── ArticleEdit.vue # 文章编辑 (富文本)
│   │   │       ├── Categories.vue # 分类管理
│   │   │       ├── Messages.vue   # 留言管理
│   │   │       └── Chats.vue      # AI 客服记录
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── vite.config.ts
│   └── tsconfig.json
├── server/                        # 后端项目
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts        # 数据库配置与初始化
│   │   ├── middleware/
│   │   │   └── auth.ts            # JWT 认证中间件
│   │   ├── routes/
│   │   │   ├── auth.ts            # 认证路由 (登录/改密)
│   │   │   ├── categories.ts      # 分类路由
│   │   │   ├── articles.ts        # 文章路由
│   │   │   ├── messages.ts        # 留言路由
│   │   │   └── chat.ts            # AI 客服路由
│   │   ├── types/
│   │   │   └── index.ts           # 类型定义
│   │   └── app.ts                 # Express 入口
│   ├── tsconfig.json
│   └── package.json
└── package.json                   # 根配置
```

## 快速开始

### 环境要求

- Node.js >= 18
- MySQL >= 5.7
- npm >= 9

### 1. 配置数据库

确保 MySQL 已安装并运行，然后修改 `server/src/config/database.ts` 中的数据库连接信息：

```typescript
const DB_CONFIG = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "123456", // 修改为你的 MySQL 密码
  database: "nodecms", // 数据库会自动创建
};
```

### 2. 安装依赖

```bash
# 一键安装所有依赖
npm run install:all

# 或分别安装
npm install
cd server && npm install
cd ../client && npm install
```

### 3. 启动开发服务器

```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run dev:server   # 后端 http://localhost:3000
npm run dev:client   # 前端 http://localhost:5173
```

### 4. 访问系统

| 页面     | 地址                                |
| -------- | ----------------------------------- |
| 前台首页 | http://localhost:5173               |
| 后台管理 | http://localhost:5173/#/admin/login |

**默认管理员账号：** `admin` / `admin123`

### 5. AI 客服配置

AI 客服使用阿里云百炼 DashScope API，配置位于 `server/src/routes/chat.ts`：

```typescript
const BAILIAN_API_KEY = "your-api-key"; // 替换为你的百炼 API Key
const BAILIAN_MODEL = "qwen-turbo"; // 可替换为其他模型
```

## 生产部署

```bash
# 构建前端
npm run build

# 启动生产服务器（自动服务前端静态文件）
npm start
```

生产环境下，Express 会同时提供 API 和前端静态文件服务，只需运行一个端口即可。

## API 接口

| 方法   | 路径                            | 说明                 | 权限   |
| ------ | ------------------------------- | -------------------- | ------ |
| POST   | /api/auth/login                 | 管理员登录           | 公开   |
| GET    | /api/categories                 | 获取分类列表         | 公开   |
| GET    | /api/categories/slug/:slug      | 按 slug 获取分类     | 公开   |
| POST   | /api/categories                 | 创建分类             | 需认证 |
| PUT    | /api/categories/:id             | 更新分类             | 需认证 |
| DELETE | /api/categories/:id             | 删除分类             | 需认证 |
| GET    | /api/articles/public            | 获取公开文章列表     | 公开   |
| GET    | /api/articles/public/:id        | 获取公开文章详情     | 公开   |
| GET    | /api/articles                   | 获取所有文章(含隐藏) | 需认证 |
| GET    | /api/articles/:id               | 获取文章详情         | 需认证 |
| POST   | /api/articles                   | 创建文章             | 需认证 |
| PUT    | /api/articles/:id               | 更新文章             | 需认证 |
| PATCH  | /api/articles/:id/visibility    | 切换文章显示/隐藏    | 需认证 |
| DELETE | /api/articles/:id               | 删除文章             | 需认证 |
| POST   | /api/messages                   | 提交留言             | 公开   |
| GET    | /api/messages                   | 获取留言列表         | 需认证 |
| PATCH  | /api/messages/:id/read          | 标记留言已读         | 需认证 |
| PATCH  | /api/messages/read-all          | 全部标记已读         | 需认证 |
| DELETE | /api/messages/:id               | 删除留言             | 需认证 |
| POST   | /api/chat/send                  | AI 客服对话          | 公开   |
| GET    | /api/chat/sessions              | 获取会话列表         | 需认证 |
| GET    | /api/chat/sessions/:id/messages | 获取会话消息         | 需认证 |
| DELETE | /api/chat/sessions/:id          | 删除会话             | 需认证 |
| POST   | /api/upload                     | 上传文件             | 需认证 |

## 数据库表结构

- **admin_users** - 管理员账户
- **categories** - 内容分类（可扩展）
- **articles** - 文章（含富文本内容、封面图、显示状态）
- **messages** - 访客留言
- **chat_sessions** - AI 客服会话
- **chat_messages** - AI 客服消息记录

## 默认分类

| 分类名称 | Slug     | 说明     |
| -------- | -------- | -------- |
| 关于我们 | about    | 律所介绍 |
| 真实案例 | cases    | 案例展示 |
| 律师随笔 | essays   | 律师文章 |
| 律师风采 | lawyers  | 律师介绍 |
| 在线留言 | messages | 留言表单 |

所有分类均可在后台管理中新增、编辑或删除。
