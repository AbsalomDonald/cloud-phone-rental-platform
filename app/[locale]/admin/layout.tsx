import { AppShell } from "@/components/AppShell";
import { requireAdmin } from "@/lib/auth";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { uiText } from "@/lib/ui-text";

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
  const menu = [
    ...dictionary.admin.menu.slice(0, 6),
    uiText(locale, "测试手机入口", "テスト端末入口", "Test Phone"),
    ...dictionary.admin.menu.slice(6)
  ];

  return (
    <AppShell basePath="admin" locale={locale} menu={menu} title={dictionary.admin.title}>
      {children}
    </AppShell>
  );
}
