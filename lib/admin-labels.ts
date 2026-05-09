import type { Locale } from "@/lib/locales";

export function adminLabels(locale: Locale) {
  if (locale === "zh") {
    return {
      action: "操作",
      amount: "金额",
      assignment: "分配编号",
      date: "日期",
      device: "设备名称",
      email: "邮箱",
      expires: "到期时间",
      language: "语言",
      name: "姓名",
      order: "订单编号",
      padCode: "供应商设备编号",
      password: "密码",
      passwordAction: "密码操作",
      passwordStatus: "密码状态",
      plan: "套餐",
      provider: "供应商",
      region: "地区",
      role: "角色",
      status: "状态",
      ticket: "工单编号",
      title: "标题",
      updated: "更新时间",
      user: "用户邮箱",
      createdAt: "注册时间",
      lastLoginAt: "最后登录时间",
      lastLoginIp: "最后登录 IP",
      vmosExpires: "供应商到期时间"
    };
  }

  if (locale === "ja") {
    return {
      action: "操作",
      amount: "金額",
      assignment: "割り当てID",
      date: "日付",
      device: "端末名",
      email: "メール",
      expires: "有効期限",
      language: "言語",
      name: "名前",
      order: "注文番号",
      padCode: "提供元端末番号",
      password: "パスワード",
      passwordAction: "パスワード操作",
      passwordStatus: "パスワード状態",
      plan: "プラン",
      provider: "サプライヤー",
      region: "地域",
      role: "権限",
      status: "状態",
      ticket: "チケット番号",
      title: "タイトル",
      updated: "更新日",
      user: "ユーザー",
      createdAt: "登録日時",
      lastLoginAt: "最終ログイン",
      lastLoginIp: "最終ログインIP",
      vmosExpires: "提供元有効期限"
    };
  }

  return {
    action: "Action",
    amount: "Amount",
    assignment: "Assignment",
    date: "Date",
    device: "Device",
    email: "Email",
    expires: "Expires",
    language: "Language",
    name: "Name",
    order: "Order",
    padCode: "Provider Device Code",
    password: "Password",
    passwordAction: "Password Action",
    passwordStatus: "Password Status",
    plan: "Plan",
    provider: "Provider",
    region: "Region",
    role: "Role",
    status: "Status",
    ticket: "Ticket",
    title: "Title",
    updated: "Updated",
    user: "User",
    createdAt: "Registered At",
    lastLoginAt: "Last Login",
    lastLoginIp: "Last Login IP",
    vmosExpires: "Provider Expires"
  };
}
