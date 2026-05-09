# 欧阳日本事业部云手机平台

这是一个面向日本用户的三语云手机运营 MVP，定位是：

```text
前台广告页
+ 用户登录后的个人中心
+ 运营者后台
+ 上游云手机供应商网页接入预留
```

## 当前结论

**当前代码已经从演示原型升级为可部署运营 MVP。**

已经具备：

- 三语前台页面：`/ja`、`/zh`、`/en`
- 邮箱注册 / 登录
- 密码哈希保存
- Cookie 会话
- 用户个人中心：云手机、订单、续费、客服
- 运营者后台：用户、订单、套餐、云手机库存、分配、客服、供应商设置、日志
- PostgreSQL / Prisma 数据库
- 上游供应商临时授权后端中转接口
- 供应商 API 设置加密保存
- 管理员权限保护

正式收款运营前，你还需要准备真实外部账号和资料：

- 域名
- PostgreSQL 数据库
- 上游云手机供应商 OpenAPI / 网页接入正式 AK/SK
- 支付商账号和回调密钥
- 邮件服务账号
- 日本法律页面正式内容
- 上线前完整测试

## 本地运行

安装依赖：

```powershell
npm.cmd install
```

如果 Windows 本地安装遇到 npm cache 或 Prisma postinstall 权限问题，可以用：

```powershell
npm.cmd install --cache .\.npm-cache --ignore-scripts
npm.cmd run prisma:generate
```

复制环境变量：

```powershell
Copy-Item .env.example .env
```

编辑 `.env` 后执行：

```powershell
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run prisma:seed
npm.cmd run dev
```

生产构建检查：

```powershell
npm.cmd run build
```

打开：

```text
http://localhost:3000/zh
```

如果只是想看静态演示，运行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-preview.ps1
```

然后打开：

```text
http://127.0.0.1:4173/zh
```

常用页面：

```text
/zh                  中文前台
/zh/login            登录页
/zh/register         注册页
/zh/app              用户个人中心
/zh/app/phones       我的云手机
/zh/app/orders       订单记录
/zh/app/renew        续费页面
/zh/app/support      客服工单
/zh/admin            运营者后台
/zh/admin/users      用户管理
/zh/admin/plans      套餐管理
/zh/admin/phones     云手机库存管理
/zh/admin/assignments 分配供应商设备
/zh/admin/support    客服工单
/zh/admin/settings/vmos 供应商 API 设置
```

## 源码位置

核心源码在这些目录：

```text
app/                 Next.js 页面
components/          复用 UI 组件
messages/            日语 / 中文 / 英语文案
lib/                 多语言、示例数据、数据库客户端
prisma/schema.prisma 数据库表结构
scripts/preview-server.mjs 本地演示服务器
docs/                设计、部署和使用说明
```

## 默认测试账号

执行 seed 后：

```text
管理员：admin@example.com / Admin12345!
测试用户：tanaka@example.jp / User12345!
```

生产环境请立刻修改 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD`。

## 部署文档

请阅读：

```text
docs/DEPLOYMENT.md
docs/USAGE.md
docs/ADMIN-PROVIDER-SETUP.md
docs/DATABASE-SETUP.md
Coolify部署说明.md
docs/PRODUCTION-CHECKLIST.md
```
