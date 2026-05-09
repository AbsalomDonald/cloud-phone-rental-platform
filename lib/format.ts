import type { Locale } from "@/lib/locales";

export function formatDate(value: Date | string | null | undefined, locale: Locale) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatShortDate(value: Date | string | null | undefined, locale: Locale) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : "en-US", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function formatMoney(value: { toString(): string } | number | string, currency = "JPY", locale: Locale = "ja") {
  const numeric = typeof value === "number" ? value : Number(value.toString());

  if (!Number.isFinite(numeric)) {
    return `${value} ${currency}`;
  }

  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : "en-US", {
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
    style: "currency"
  }).format(numeric);
}
