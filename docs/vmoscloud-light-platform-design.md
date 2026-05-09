# VMOSCloud H5 轻量接入版设计

## 产品定位

欧阳日本事业部只做三件事：

1. 前台广告页：介绍服务、套餐、FAQ、联系入口。
2. 用户后台：查看自己的 VMOS 云手机、到期时间、订单、续费、客服。
3. 运营后台：管理用户、订单、VMOS padCode、分配、API 设置、操作日志。

云手机底层、画面、运行和控制尽量交给 VMOSCloud。平台负责权限、付款、到期和安全中转。

## 核心安全边界

客户浏览器不能拿到 VMOSCloud AK/SK，也不能直接调用 VMOSCloud 主 OpenAPI。

正确链路：

```text
客户浏览器
↓
你的后端 API
↓
检查登录、归属、付款、到期、禁用状态
↓
调用 VMOSCloud OpenAPI 获取临时 H5 Token
↓
返回前端可用的短期 Token
↓
前端用 VMOSCloud H5 SDK 打开云手机
```

## 页面结构

公开页面：

```text
/{locale}
/{locale}/pricing
/{locale}/faq
/{locale}/contact
/{locale}/login
/{locale}/register
```

用户后台：

```text
/{locale}/app
/{locale}/app/phones
/{locale}/app/phones/[id]
/{locale}/app/orders
/{locale}/app/renew
/{locale}/app/support
```

运营后台：

```text
/{locale}/admin
/{locale}/admin/users
/{locale}/admin/orders
/{locale}/admin/plans
/{locale}/admin/phones
/{locale}/admin/assignments
/{locale}/admin/support
/{locale}/admin/settings/vmos
/{locale}/admin/logs
```

## 用户打开云手机流程

```text
用户登录
↓
进入 /zh/app
↓
点击“打开云手机”
↓
POST /api/me/phones/:id/open
↓
后端检查：
- 当前用户是否登录
- 用户是否拥有该 phone
- assignment 是否 active
- expires_at 是否大于当前时间
- phone 是否 disabled / expired
- 请求频率是否过高
↓
后端调用 VMOSCloud 获取临时 H5 Token
↓
记录 vmos_api_logs
↓
前端用 H5 SDK 打开 /zh/app/phones/:id
```

## 第一版开放给用户的操作

开放：

```text
打开云手机
断开连接
重新连接
全屏
横屏/竖屏
续费
联系客服
```

不开放给普通用户：

```text
一键新机
ADB
GPS 修改
SIM 修改
批量控制
直接调用 VMOSCloud API
```

## 数据库表

核心表：

```text
users
orders
phones
assignments
support_tickets
settings
vmos_api_logs
admin_logs
password_reset_tokens
```

phones：

```text
id
internal_name
vmos_pad_code
region
status
vmos_expire_at
notes
created_at
updated_at
```

settings：

```text
id
key
encrypted_value
created_at
updated_at
```

保存内容示例：

```text
vmos_api_base_url
vmos_access_key
vmos_secret_key
vmos_h5_base_url
default_quality
default_bitrate
default_fps
```

vmos_api_logs：

```text
id
user_id
phone_id
action
request_status
error_message
metadata
created_at
```

## 后端 API

用户 API：

```text
GET  /api/me/phones
POST /api/me/phones/:id/open
POST /api/me/phones/:id/stop
GET  /api/me/orders
POST /api/me/support
```

运营 API：

```text
POST /api/admin/phones
POST /api/admin/phones/:id/assign
POST /api/admin/phones/:id/disable
POST /api/admin/users/:id/ban
POST /api/admin/settings/vmos
GET  /api/admin/logs
```

## VMOSCloud Adapter

业务代码不要直接写死 VMOSCloud 调用。建议做一层 adapter：

```ts
interface VmosCloudProvider {
  getTemporaryH5Token(input: { padCode: string; userId: string }): Promise<TokenResult>;
  getPhoneStatus(input: { padCode: string }): Promise<PhoneStatusResult>;
  stopPhone(input: { padCode: string }): Promise<void>;
}
```

后面 VMOSCloud 接口变化时，只改 adapter，不改用户后台和订单逻辑。

## 开发顺序

1. 三语前台和暗黑科技 UI。
2. 注册登录、用户角色和 Session。
3. 运营后台导入 VMOS padCode。
4. 运营后台手动分配 padCode 给用户。
5. 用户后台展示“我的云手机”。
6. `/api/me/phones/:id/open` 权限检查。
7. VMOSCloud 临时 Token 接口。
8. H5 SDK 页面接入。
9. 操作日志、API 日志、限流。
10. 支付和续费。
