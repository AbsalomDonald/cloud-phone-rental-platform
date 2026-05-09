import en from "@/messages/en.json";
import ja from "@/messages/ja.json";
import zh from "@/messages/zh.json";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/locales";

export { defaultLocale, isLocale, locales, type Locale };

const dictionaries = {
  en,
  ja,
  zh
};

export type Dictionary = typeof ja;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export function localizedPath(locale: Locale, path = "") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${cleanPath === "/" ? "" : cleanPath}`;
}
