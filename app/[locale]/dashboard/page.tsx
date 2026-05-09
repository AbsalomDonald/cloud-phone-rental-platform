import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  redirect(`/${locale}/app`);
}
