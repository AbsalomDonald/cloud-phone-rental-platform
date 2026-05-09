# Coolify 部署说明

这个项目在 Coolify 上建议使用 **Dockerfile Build Pack** 部署。原因很简单：项目不是静态网页，注册、登录、后台、VMOS Token 中转都需要 Next.js 服务端；同时 Prisma 需要在容器启动时执行数据库迁移。

## 1. Coolify 应用设置

在 Coolify 里创建应用：

```text
New Resource
选择 GitHub 仓库
Build Pack 选择 Dockerfile
Base Directory 填 /
Port / Exposed Port 填 3000
Start Command 留空，或者填 npm run start
```

如果页面出现 `No Available Server`，优先检查：

```text
应用是否监听 0.0.0.0
Coolify Network Port 是否是 3000
容器 Health Check 是否失败
数据库是否连不上
```

本项目的 Dockerfile 已经设置：

```text
HOSTNAME=0.0.0.0
PORT=3000
启动命令 npm run start
健康检查 /api/version
```

## 2. PostgreSQL

你需要在 Coolify 里创建 PostgreSQL 数据库，或者连接外部 PostgreSQL。

注意：容器里面不能用 `localhost` 连接数据库。`localhost` 代表应用容器自己，不是数据库容器。

请使用 Coolify 给你的数据库 Internal URL，格式通常类似：

```text
postgresql://postgres:password@postgres:5432/database?schema=public
```

如果你想让网站和数据库一起由项目启动，也可以改用仓库里的 `docker-compose.yml`。详细看：

```text
docs/DATABASE-SETUP.md
```

## 3. 必填环境变量

在 Coolify 应用的 Environment Variables 里添加：

```text
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://你的域名
AUTH_SECRET=至少32位随机字符串
SETTINGS_SECRET=另一个至少32位随机字符串
ADMIN_EMAIL=你的管理员邮箱
ADMIN_PASSWORD=你的管理员密码
COOLIFY_INIT_ON_START=true
ALLOW_VMOS_MOCK=true
```

如果暂时不填 `DATABASE_URL`，新版启动脚本会让前台先启动，方便你看页面；但注册、登录、后台、订单、分配都会不可用，`/api/health` 会提示数据库未配置。真正运营必须配置 PostgreSQL。

如果你是用正式域名和 HTTPS：

```text
NEXT_PUBLIC_APP_URL=https://你的域名
AUTH_COOKIE_SECURE=留空 或 true
```

如果你只是临时用 `http://服务器IP:端口` 测试：

```text
NEXT_PUBLIC_APP_URL=http://你的服务器IP
AUTH_COOKIE_SECURE=false
```

否则可能出现“注册后又像没登录”的情况，因为浏览器不会在 HTTP 页面保存 secure cookie。

第一次部署建议先保留：

```text
COOLIFY_INIT_ON_START=true
ALLOW_VMOS_MOCK=true
```

确认后台可以登录、套餐和数据库正常后，再把真实 VMOS 配置填进去，并把 mock 改掉。

## 4. 首次启动会做什么

容器启动时会自动执行：

```text
npx prisma migrate deploy
npm run prisma:init
npx next start -H 0.0.0.0 -p 3000
```

不要把 Coolify 的启动命令覆盖成：

```text
npm run start:next
next start
```

这两种只会启动网站，不会先创建数据库表，注册就会失败。

`prisma:init` 是安全初始化：

```text
创建/更新默认套餐
创建管理员账号
保存 VMOS 基础设置
不会删除客户、订单、手机、工单数据
```

不要在正式数据库里随便运行：

```text
npm run prisma:seed
```

因为 seed 是演示数据脚本，会清空现有数据。

## 5. 部署后检查

部署成功后先打开：

```text
https://你的域名/api/version
```

如果 `/api/version` 能打开，说明网站服务本身已经启动。然后再打开：

```text
https://你的域名/api/health
```

正常应该看到：

```json
{
  "database": "ok",
  "service": "ouyang-cloud-phone-platform",
  "status": "ok"
}
```

然后测试：

```text
/zh
/zh/register
/zh/login
/zh/admin
```

管理员登录：

```text
邮箱：ADMIN_EMAIL
密码：ADMIN_PASSWORD
```

## 6. 常见问题

### 点击注册报错

基本就是数据库问题：

```text
DATABASE_URL 错了
数据库还没启动
应用和数据库不在同一个网络
Prisma migration 没有执行成功
```

看 Coolify 的应用日志，应该能看到 `Running Prisma migrations`。

### 打开域名显示 No Available Server

检查：

```text
Port 是否是 3000
容器是否 Healthy
启动日志里 Next 是否显示 0.0.0.0:3000
/api/version 是否返回 200
```

### 本地 4173 可以，Coolify 不行

`4173` 是画布演示服务，不需要真实数据库。Coolify 跑的是正式 Next.js 服务，必须配置 PostgreSQL、密钥和迁移。
