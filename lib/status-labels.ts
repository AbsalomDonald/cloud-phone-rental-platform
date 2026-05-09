import type { Locale } from "@/lib/locales";

const labels = {
  zh: {
    active: "正常",
    assigned: "已分配",
    available: "空闲",
    banned: "已封禁",
    cancelled: "已取消",
    closed: "已关闭",
    disabled: "已禁用",
    expired: "已过期",
    fulfilled: "已开通",
    open: "待回复",
    paid: "已付款",
    pending: "待付款",
    refunded: "已退款",
    replied: "已回复",
    suspended: "已暂停"
  },
  ja: {
    active: "正常",
    assigned: "割り当て済み",
    available: "空き",
    banned: "停止",
    cancelled: "キャンセル済み",
    closed: "クローズ済み",
    disabled: "無効",
    expired: "期限切れ",
    fulfilled: "開通済み",
    open: "未返信",
    paid: "支払い済み",
    pending: "支払い待ち",
    refunded: "返金済み",
    replied: "返信済み",
    suspended: "停止中"
  },
  en: {
    active: "Active",
    assigned: "Assigned",
    available: "Available",
    banned: "Banned",
    cancelled: "Cancelled",
    closed: "Closed",
    disabled: "Disabled",
    expired: "Expired",
    fulfilled: "Fulfilled",
    open: "Open",
    paid: "Paid",
    pending: "Pending",
    refunded: "Refunded",
    replied: "Replied",
    suspended: "Suspended"
  }
};

export function statusLabel(status: string, locale: Locale) {
  return labels[locale][status as keyof (typeof labels)["zh"]] ?? status;
}
