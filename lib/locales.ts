export const locales = ["ja", "zh", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ja";

export function isLocale(value: string | undefined): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}
