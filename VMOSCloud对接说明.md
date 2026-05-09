# VMOSCloud 对接说明

## 1. 安全边界

客户浏览器不能直接拿到 VMOSCloud 的 AccessKey / SecretKey。

正确链路：

```text
客户云手机控制台
↓
POST /api/me/phones/:id/open
↓
服务器检查登录、绑定关系、到期时间、设备状态
↓
服务器使用 VMOSCloud AK/SK 签名请求临时 Token
↓
浏览器只拿临时 Token 打开云手机画面
```

## 2. 后台需要填写

管理员后台：

```text
/zh/admin/settings/vmos
```

字段：

```text
API Base URL: https://api.vmoscloud.com
Token Path: /vcpcloud/api/padApi/stsTokenByPadCode
网页连接 baseUrl: https://api.vmoscloud.com
AccessKey / AK: 从 VMOSCloud 后台获取
SecretKey / SK: 从 VMOSCloud 后台获取
```

AK/SK 会加密保存到数据库，不会显示给客户。

## 3. Coolify 环境变量

也可以通过环境变量预设：

```env
VMOS_API_BASE_URL=https://api.vmoscloud.com
VMOS_H5_BASE_URL=https://api.vmoscloud.com
VMOS_ACCESS_KEY=你的 AK
VMOS_SECRET_KEY=你的 SK
VMOS_TOKEN_PATH=/vcpcloud/api/padApi/stsTokenByPadCode
ALLOW_VMOS_MOCK=false
```

## 4. 手机库存字段

管理员需要先在：

```text
/zh/admin/phones
```

导入 VMOSCloud 的 `padCode`，例如：

```text
内部名称: JP-001
padCode: 从 VMOSCloud 后台或 API 获得
地区: Japan
VMOS 到期时间: 上游到期时间
```

然后在：

```text
/zh/admin/assignments
```

把这台手机分配给某个用户和订单。

## 5. 客户打开云手机

客户进入：

```text
/zh/app/phones
```

点击自己的云手机。页面会请求：

```text
POST /api/me/phones/:id/open
```

这个接口会检查：

```text
1. 用户是否登录
2. 云手机是否属于该用户
3. 分配是否 active
4. 到期时间是否还有效
5. 手机状态是否 assigned
```

通过后才会向 VMOSCloud 获取临时 Token。

## 6. H5 SDK 文件

当前代码会优先尝试加载：

```text
/vendor/armcloud/index.es.js
```

正式接入 H5 画面时，把 VMOSCloud 官方 H5 SDK 的浏览器端构建文件放到：

```text
public/vendor/armcloud/index.es.js
```

没有放 SDK 文件时，后端 Token 仍然可以测试，但浏览器会提示连接组件未安装。

## 7. 官方文档参考

- OpenAPI 签名和服务端接口：https://cloud.vmoscloud.com/vmoscloud/doc/zh/server/
- H5 SDK 示例：https://cloud.vmoscloud.com/vmoscloud/doc/zh/client/h5/example.html
