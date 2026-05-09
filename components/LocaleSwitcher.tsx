"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/locales";

const labels: Record<Locale, string> = {
  en: "EN",
  ja: "JA",
  zh: "ZH"
};

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const firstPart = parts[0] as Locale | undefined;
  const rest = firstPart && locales.includes(firstPart) ? parts.slice(1) : parts;

  return (
    <div className="locale-switcher" aria-label="Language switcher">
      {locales.map((targetLocale) => {
        const href = `/${targetLocale}${rest.length ? `/${rest.join("/")}` : ""}`;

        return (
          <Link
            aria-current={targetLocale === locale ? "page" : undefined}
            className={`locale-link ${targetLocale === locale ? "active" : ""}`}
            href={href}
            key={targetLocale}
          >
            {labels[targetLocale]}
          </Link>
        );
      })}
    </div>
  );
}
