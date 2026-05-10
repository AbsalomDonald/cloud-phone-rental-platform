import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#03070a"
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }

  const dictionary = await getDictionary(rawLocale);

  return {
    title: `${dictionary.meta.product} | ${dictionary.meta.tagline}`,
    description: dictionary.home.subtitle,
    manifest: "/manifest.webmanifest",
    applicationName: dictionary.meta.product,
    icons: {
      icon: "/icon.svg",
      apple: "/icon.svg"
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: dictionary.meta.product
    },
    formatDetection: {
      telephone: false
    }
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
