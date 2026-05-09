import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function UserAppLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  await requireUser(locale);

  return (
    <AppShell basePath="app" locale={locale} menu={dictionary.dashboard.menu} title={dictionary.dashboard.title}>
      {children}
    </AppShell>
  );
}
