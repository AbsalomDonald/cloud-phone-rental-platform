import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { logoutAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import type { Dictionary, Locale } from "@/lib/i18n";
import { localizedPath } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

type SiteHeaderProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export async function SiteHeader({ dictionary, locale }: SiteHeaderProps) {
  const nav = dictionary.nav;
  const currentUser = await getCurrentUser();
  const dashboardPath = currentUser?.role === "admin" ? localizedPath(locale, "/admin") : localizedPath(locale, "/app");

  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link className="brand" href={localizedPath(locale)}>
          <span className="brand-mark" aria-hidden="true">
            OY
          </span>
          <span className="brand-text">{dictionary.meta.product}</span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          <Link className="nav-link" href={localizedPath(locale)}>
            {nav.home}
          </Link>
          <Link className="nav-link" href={localizedPath(locale, "/pricing")}>
            {nav.pricing}
          </Link>
          <Link className="nav-link" href={localizedPath(locale, "/faq")}>
            {nav.faq}
          </Link>
          <Link className="nav-link" href={localizedPath(locale, "/contact")}>
            {nav.contact}
          </Link>
          {currentUser ? (
            <>
              <Link className="secondary-button" href={dashboardPath}>
                <LogIn size={17} />
                {currentUser.role === "admin" ? nav.admin : nav.dashboard}
              </Link>
              <form action={logoutAction}>
                <input name="locale" type="hidden" value={locale} />
                <button className="primary-button" type="submit">
                  {locale === "zh" ? "退出" : locale === "ja" ? "ログアウト" : "Logout"}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link className="secondary-button" href={localizedPath(locale, "/login")}>
                <LogIn size={17} />
                {nav.login}
              </Link>
              <Link className="primary-button" href={localizedPath(locale, "/register")}>
                <UserPlus size={17} />
                {nav.register}
              </Link>
            </>
          )}
          <LocaleSwitcher locale={locale} />
        </nav>
      </div>
    </header>
  );
}
