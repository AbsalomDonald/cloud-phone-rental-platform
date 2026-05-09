import type { Locale } from "@/lib/locales";

export function uiText(locale: Locale, zh: string, ja: string, en = ja) {
  if (locale === "zh") return zh;
  if (locale === "ja") return ja;
  return en;
}
