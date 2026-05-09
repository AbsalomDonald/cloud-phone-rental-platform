import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { localizedPath } from "@/lib/i18n";

export function Footer({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span>
          {dictionary.meta.product} · {dictionary.meta.tagline}
        </span>
        <div className="footer-links">
          <Link href={localizedPath(locale, "/terms")}>{dictionary.legal.terms.title}</Link>
          <Link href={localizedPath(locale, "/privacy")}>{dictionary.legal.privacy.title}</Link>
          <Link href={localizedPath(locale, "/legal")}>{dictionary.legal.legal.title}</Link>
          <Link href={localizedPath(locale, "/refund")}>{dictionary.legal.refund.title}</Link>
        </div>
      </div>
    </footer>
  );
}
