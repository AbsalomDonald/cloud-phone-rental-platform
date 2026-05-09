import type { Locale } from "@/lib/locales";

type PlanText = {
  nameEn: string;
  nameJa: string;
  nameZh: string;
};

type PlanDescription = {
  descriptionEn: string;
  descriptionJa: string;
  descriptionZh: string;
};

export function planName(plan: PlanText, locale: Locale) {
  if (locale === "zh") {
    return plan.nameZh;
  }

  if (locale === "en") {
    return plan.nameEn;
  }

  return plan.nameJa;
}

export function planDescription(plan: PlanDescription, locale: Locale) {
  if (locale === "zh") {
    return plan.descriptionZh;
  }

  if (locale === "en") {
    return plan.descriptionEn;
  }

  return plan.descriptionJa;
}
