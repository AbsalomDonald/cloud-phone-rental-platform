import { notFound } from "next/navigation";
import "../globals.css";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }

  const dictionary = await getDictionary(rawLocale);

  return {
    title: `${dictionary.meta.product} | ${dictionary.meta.tagline}`,
    description: dictionary.home.subtitle
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const dictionary = await getDictionary(locale);

  return (
    <html lang={locale}>
      <body>
        <div className="page-shell">
          <SiteHeader dictionary={dictionary} locale={locale} />
          {children}
          <Footer dictionary={dictionary} locale={locale} />
        </div>
      </body>
    </html>
  );
}
