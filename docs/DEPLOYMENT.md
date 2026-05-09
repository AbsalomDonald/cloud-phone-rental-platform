# 部署说明

## 1. 当前版本状态

当前项目是可部署运营 MVP：

- Next.js App Router
- PostgreSQL / Prisma
- 邮箱注册 / 登录
- 管理员后台权限保护
- 套餐、订单、VMOS 手机、分配、客服工单数据库读写
- VMOSCloud 临时 Token 后端中转接口
- VMOS API 设置加密保存

支付和邮件已经预留配置位，但正式收款前仍需要接你的真实支付账号和邮件账号。

## 2. 本地演示部署

确认电脑已经安装 Node.js。

Windows PowerShell：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-preview.ps1
```

或者双击：

```text
scripts/start-preview.bat
```

打开：

```text
http://127.0.0.1:4173/zh
```

注意：运行预览时要保持命令窗口打开。

## 3. 本地正式开发部署

安装依赖：

```powershell
npm.cmd install
```

复制环境变量：

```powershell
Copy-Item .env.example .env
```

编辑 `.env`：

```text
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_EMAIL="your-admin-email@example.com"
ADMIN_PASSWORD="change-me"
AUTH_SECRET="change-this-long-random-secret-at-least-32-chars"
SETTINGS_SECRET="change-this-other-long-random-secret"
VMOS_API_BASE_URL="..."
VMOS_H5_BASE_URL="..."
VMOS_ACCESS_KEY="..."
VMOS_SECRET_KEY="..."
VMOS_TOKEN_PATH="/vcpcloud/api/padApi/stsTokenByPadCode"
ALLOW_VMOS_MOCK="false"
```

生成数据库客户端：

```powershell
npm.cmd run prisma:generate
```

创建数据库表：

```powershell
npm.cmd run prisma:migrate
```

导入测试数据：

```powershell
npm.cmd run prisma:seed
```

启动开发服务：

```powershell
npm.cmd run dev
```

打开：

```text
http://localhost:3000/zh
```

## 4. Vercel 部署思路

1. 把项目上传到 GitHub。
2. 在 Vercel 导入项目。
3. 绑定 PostgreSQL 数据库。
4. 在 Vercel 环境变量里填写 `.env.example` 里的所有正式配置。
5. 部署命令使用 `npm run build`。
6. 首次上线前执行 `npm run prisma:deploy`。
7. 部署完成后检查 `/zh`、`/zh/app`、`/zh/admin`。

注意：这个项目不是纯静态网站，不能只用 GitHub Pages 运营。注册、登录、后台、数据库写入、VMOS Token 中转都需要 Next.js 服务端和 PostgreSQL。

线上注册报错时，优先检查这 4 项：

```text
DATABASE_URL 是否存在并能连接 PostgreSQL
AUTH_SECRET 是否设置为 32 位以上随机字符串
SETTINGS_SECRET 是否设置为 32 位以上随机字符串
数据库是否已经执行 npm run prisma:deploy
```

## 5. Coolify 部署思路

Coolify 建议使用仓库里的 `Dockerfile` 部署。

```text
Build Pack: Dockerfile
Base Directory: /
Port / Exposed Port: 3000
Start Command: 留空，或者填 npm run start
```

不要填 `next start` 或 `npm run start:next`，否则不会执行数据库迁移，注册会失败。

详细步骤看：

```text
docs/COOLIFY.md
```

如果只是用 `http://服务器IP` 临时测试，Coolify 环境变量请设置：

```text
AUTH_COOKIE_SECURE=false
```

正式 HTTPS 域名请留空或设为 `true`。

## 6. 服务器部署思路

服务器安装 Node.js 20+、PostgreSQL、反向代理 Nginx。

```powershell
npm.cmd install
npm.cmd run prisma:generate
npm.cmd run prisma:deploy
npm.cmd run build
npm.cmd run start
```

生产环境建议使用 PM2 或系统服务守护 Node 进程，并配置 HTTPS。

## 7. 正式运营前必须完成

代码层已经具备 MVP 基础，但运营前你必须确认：

- 支付账号已开通
- VMOSCloud 商业合作和 API 权限已确认
- VMOS AK/SK 已填写
- 邮件服务已配置
- 日本法律页面内容已由你确认
- 数据库备份已开启
- 管理员密码已修改
- `AUTH_SECRET` 和 `SETTINGS_SECRET` 已设置为长随机字符串

## 8. 不能上线的判断标准

只要下面任何一项还是假的，就不能正式运营：

- 用户注册后没有真实保存到数据库
- 后台操作刷新后会消失
- 支付只是 mock
- VMOSCloud Token 是 mock
- 管理员权限没有保护
- 客户能绕过后台直接访问他人 padCode

当前代码已经不是纯原型，但如果你没有接真实支付、真实 VMOS API、真实邮件和正式法务内容，就不要公开收款运营。
