# 展厅系统 Docker 镜像

## 镜像说明

- `showroom-backend`: 展厅系统后端服务
- `showroom-mysql-init`: 展厅系统数据库初始化服务

## 快速开始

1. 创建 `.env` 文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置邮件服务：
```
MAIL_HOST=your-smtp-host
MAIL_PORT=465
MAIL_USER=your-email
MAIL_PASS=your-password
MAIL_TO=admin-email
```

3. 启动服务：
```bash
docker-compose up -d
```

## 环境变量

### 数据库配置
- `MYSQL_ROOT_PASSWORD`: MySQL root 密码
- `MYSQL_DATABASE`: 数据库名称
- `MYSQL_USER`: 数据库用户
- `MYSQL_PASSWORD`: 数据库密码

### 后端服务配置
- `DB_HOST`: 数据库主机
- `DB_USER`: 数据库用户
- `DB_PASSWORD`: 数据库密码
- `DB_NAME`: 数据库名称
- `MAIL_HOST`: SMTP 服务器
- `MAIL_PORT`: SMTP 端口
- `MAIL_USER`: 邮箱账号
- `MAIL_PASS`: 邮箱密码
- `MAIL_TO`: 管理员邮箱

## 数据持久化

数据库数据存储在 Docker 卷中：
```bash
# 查看卷
docker volume ls

# 备份数据
docker exec showroom-mysql mysqldump -u root -p123456 showroom_system > backup.sql

# 恢复数据
docker exec -i showroom-mysql mysql -u root -p123456 showroom_system < backup.sql
```

## 更新服务

```bash
# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose up -d
```

## 故障排除

1. 查看日志：
```bash
docker-compose logs -f
```

2. 检查服务状态：
```bash
docker-compose ps
```

3. 进入容器：
```bash
# 进入后端容器
docker exec -it showroom-backend bash

# 进入数据库容器
docker exec -it showroom-mysql bash
``` 