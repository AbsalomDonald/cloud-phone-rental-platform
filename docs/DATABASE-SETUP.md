# Coolify 数据库配置

你现在服务器报错的原因是：

```text
DATABASE_URL is missing
```

也就是说网站已经部署到了服务器，但应用没有连接 PostgreSQL 数据库。注册、登录、后台、订单、分配云手机都必须依赖数据库。

## 方案 A：继续使用 Dockerfile 部署

在 Coolify 里给当前项目加一个 PostgreSQL 数据库资源：

```text
Project
↓
New Resource
↓
Database
↓
PostgreSQL
```

数据库创建完成后，进入数据库的连接信息页面，复制 **Internal Database URL**，一般长这样：

```text
postgresql://postgres:密码@postgres:5432/cloud_phone_rental?schema=public
```

然后进入你的网站应用：

```text
Application
↓
Environment Variables
```

添加或修改：

```text
DATABASE_URL=postgresql://postgres:密码@postgres:5432/cloud_phone_rental?schema=public
NEXT_PUBLIC_APP_URL=https://你的域名
AUTH_SECRET=至少32位随机字符串
SETTINGS_SECRET=另一个至少32位随机字符串
ADMIN_EMAIL=你的管理员邮箱
ADMIN_PASSWORD=你的管理员密码
COOLIFY_INIT_ON_START=true
ALLOW_VMOS_MOCK=true
```

保存后重新部署。启动时会自动执行：

```text
npx prisma migrate deploy
npm run prisma:init
```

这会自动创建所有数据库表、默认套餐和管理员账号。

## 方案 B：改用 Docker Compose 一起部署数据库

我已经在项目里加入了：

```text
docker-compose.yml
```

如果你在 Coolify 里把 Build Pack 改成 Docker Compose，它会同时启动：

```text
app       网站
postgres  PostgreSQL 数据库
```

这种方式不需要你单独创建数据库资源，`DATABASE_URL` 会自动指向 compose 里的 `postgres` 服务。

建议仍然在 Coolify 环境变量里设置：

```text
POSTGRES_PASSWORD=一个强密码
NEXT_PUBLIC_APP_URL=https://你的域名
AUTH_SECRET=至少32位随机字符串
SETTINGS_SECRET=另一个至少32位随机字符串
ADMIN_EMAIL=你的管理员邮箱
ADMIN_PASSWORD=你的管理员密码
COOLIFY_INIT_ON_START=true
ALLOW_VMOS_MOCK=true
```

## 部署后检查

打开：

```text
https://你的域名/api/health
```

正常结果应该包含：

```json
{
  "database": "ok",
  "status": "ok"
}
```

再打开：

```text
/zh/register
/zh/login
/zh/admin
```

如果 `/api/health` 仍然提示 `database_missing_url`，说明 `DATABASE_URL` 没有填到应用环境变量里，或者 Docker Compose 没有启用。

## 必须确认的环境变量

部署后打开 `/api/health`，里面有一个 `config` 对象。不要看密码值，只看 true / false：

```json
{
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

这些如果有 `false`，对应功能就可能出问题：

```text
databaseUrl=false       注册、登录、后台全部不能用
appUrl=false            跳转和 Cookie 容易异常
authSecret=false        登录 Cookie 不能正常签名
settingsSecret=false    供应商 API 密钥不能安全加密
adminEmail=false        初始化管理员账号会跳过
adminPassword=false     初始化管理员账号会跳过
coolifyInitOnStart=false 数据库有表，但默认套餐和管理员可能没有创建
```
