# 展厅登记系统

基于 Taro（React）+ Express + MySQL 的展厅人员进出登记系统。

## 功能特点

- 人员进出登记
- 样衣借用管理
- 邮件通知
- 历史记录查询
- 审批流程管理

## 技术栈

### 前端
- Taro (React)
- TypeScript
- SCSS

### 后端
- Node.js
- Express
- MySQL
- Nodemailer

## 项目结构

```
showroom-system/
├── src/                    # 前端源码
│   ├── pages/             # 页面组件
│   │   ├── index/        # 表单提交页
│   │   └── history/      # 历史记录页
│   ├── app.config.ts     # 应用配置
│   └── app.ts            # 应用入口
├── server/                # 后端源码
│   ├── index.js          # 服务器入口
│   └── .env              # 环境变量
└── README.md             # 项目说明
```

## 安装和运行

### 前端（Taro）

1. 安装依赖：
```bash
pnpm install
```

2. 开发模式：
```bash
pnpm dev:h5
```

3. 打包：
```bash
pnpm build:h5
```

### 后端（Express）

1. 进入后端目录：
```bash
cd server
```

2. 安装依赖：
```bash
pnpm install
```

3. 配置环境变量：
```bash
cp .env.example .env
# 编辑 .env 文件，填写必要的配置信息
```

4. 运行服务：
```bash
# 开发模式
pnpm dev

# 生产模式
pnpm start
```

## 环境变量配置

### 数据库配置
- `DB_HOST`: MySQL 主机地址
- `DB_USER`: 数据库用户名
- `DB_PASSWORD`: 数据库密码
- `DB_NAME`: 数据库名称

### 邮件配置
- `MAIL_HOST`: SMTP 服务器地址
- `MAIL_PORT`: SMTP 端口
- `MAIL_USER`: 邮箱账号
- `MAIL_PASS`: 邮箱密码
- `MAIL_TO`: 管理员邮箱

### API配置
- `API_BASE_URL`: API基础URL

## 部署说明

1. 前端部署：
   - 使用 `pnpm build:h5` 构建项目
   - 将构建后的文件部署到Web服务器

2. 后端部署：
   - 安装 Node.js 环境
   - 配置 MySQL 数据库
   - 设置环境变量
   - 使用 PM2 或其他进程管理工具运行服务

## 注意事项

1. 首次运行需要在 MySQL 中创建数据库：
```sql
CREATE DATABASE showroom_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 确保 MySQL 服务已启动并可访问

3. 建议在生产环境使用 HTTPS 