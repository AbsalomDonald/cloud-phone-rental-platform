import { AppShell } from "@/components/AppShell";
import { requireAdmin } from "@/lib/auth";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  await requireAdmin(locale);

  return (
    <AppShell basePath="admin" locale={locale} menu={dictionary.admin.menu} title={dictionary.admin.title}>
      {children}
    </AppShell>
  );
}
