# Coolify 部署说明

本项目的目标部署环境是：

```text
Coolify + Nixpacks + Next.js + PostgreSQL
```

不要只用本地 `npm run dev` 判断是否可部署。Coolify 上必须确认端口、启动命令、数据库环境变量和健康检查。

## 1. Coolify 基本设置

在 Coolify 应用里选择：

```text
Build Pack: Nixpacks
Base Directory: /
Ports Exposes: 3000
```

如果 Coolify 有 Health Check Path，填：

```text
/api/version
```

不要填 `/api/health` 作为健康检查。`/api/health` 会检查数据库，如果数据库临时连不上，Coolify 会把容器判定为不健康，外部就容易显示 Bad Gateway。

## 2. Build Command

推荐填：

```text
npm run prisma:generate && npm run build
```

项目里已经有 `nixpacks.toml`，如果 Coolify 正确读取它，也可以留空让 Nixpacks 使用仓库配置。

## 3. Start Command

必须填：

```text
npm run start:coolify
```

不要填：

```text
next start
npm run start:next
```

原因：`npm run start:coolify` 会先执行数据库 migration 和安全初始化，然后再启动 Next.js。直接 `next start` 不会创建数据库表，注册和后台会报错。

## 4. Environment Variables

最少必须填这些：

```text
DATABASE_URL=postgresql://用户名:密码@数据库内部Host:5432/数据库名?schema=public
NEXT_PUBLIC_APP_URL=https://你的域名
AUTH_SECRET=至少32位随机字符串
SETTINGS_SECRET=另一个至少32位随机字符串
ADMIN_EMAIL=你的管理员邮箱
ADMIN_PASSWORD=你的管理员密码
COOLIFY_INIT_ON_START=true
RESET_ADMIN_PASSWORD_ON_INIT=false
ALLOW_VMOS_MOCK=true
PRISMA_MIGRATE_RETRIES=12
PRISMA_MIGRATE_DELAY_MS=5000
```

重要：

```text
DATABASE_URL 必须使用 PostgreSQL 的 Internal URL
不能用 localhost
不能用你电脑本地数据库地址
```

如果你是正式 HTTPS 域名：

```text
AUTH_COOKIE_SECURE=true
```

如果你只是用 HTTP/IP 测试：

```text
NEXT_PUBLIC_APP_URL=http://你的服务器IP或测试域名
AUTH_COOKIE_SECURE=false
```

VMOS/上游供应商还没正式接入时可以先留空：

```text
VMOS_API_BASE_URL=
VMOS_H5_BASE_URL=
VMOS_ACCESS_KEY=
VMOS_SECRET_KEY=
VMOS_TOKEN_PATH=/vcpcloud/api/padApi/stsTokenByPadCode
```

等供应商正式给你 AK/SK 后，再填到后台或环境变量。

## 5. PostgreSQL 要怎么连

你已经创建 PostgreSQL 后，进入 Coolify 的 PostgreSQL 资源页面，复制：

```text
Internal Database URL
```

格式一般类似：

```text
postgresql://postgres:密码@postgres:5432/postgres?schema=public
```

把它放到应用的 `DATABASE_URL`。

保存环境变量后必须 Redeploy。

## 6. 部署后检查顺序

第一步，打开：

```text
https://你的域名/api/version
```

如果这个打不开，说明 Next.js 服务没有正常启动，优先看 Coolify Logs。

第二步，打开：

```text
https://你的域名/api/health
```

正常应该看到：

```json
{
  "database": "ok",
  "status": "ok",
  "config": {
    "databaseUrl": true,
    "appUrl": true,
    "authSecret": true,
    "settingsSecret": true,
    "adminEmail": true,
    "adminPassword": true,
    "coolifyInitOnStart": true
  }
}
```

如果 `database` 不是 `ok`，看 `hint`。它会告诉你是数据库地址、账号密码、数据库不存在，还是表没创建。

## 7. Bad Gateway 怎么查日志

Coolify 出现 Bad Gateway 时按这个顺序查：

1. 打开 Coolify 项目里的应用
2. 进入 `Logs`
3. 看启动日志里有没有：

```text
Running Prisma migrations
Ready in
Next.js
0.0.0.0:3000
```

如果看到：

```text
DATABASE_URL is missing
```

说明应用环境变量没填 `DATABASE_URL`。

如果看到：

```text
P1001
Can't reach database server
```

说明 `DATABASE_URL` 的 host 不对，通常是用了 localhost 或外部地址，应该改成 Coolify PostgreSQL 的 Internal URL。

如果看到：

```text
P1000
```

说明数据库用户名或密码错。

如果看到：

```text
P1003
```

说明数据库名不存在。

如果看到：

```text
P2021
P2022
```

说明表没创建。确认 Start Command 是：

```text
npm run start:coolify
```

然后重新部署。

## 8. 常见错误配置

不要这样填：

```text
Ports Exposes: 3001
Start Command: next start
DATABASE_URL=postgresql://localhost:5432/...
Health Check Path=/api/health
```

应该这样填：

```text
Ports Exposes: 3000
Start Command: npm run start:coolify
DATABASE_URL=Coolify PostgreSQL Internal URL
Health Check Path=/api/version
```

