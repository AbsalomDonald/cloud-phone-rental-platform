import { redirect } from "next/navigation";
import { clearSession } from "@/lib/auth";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function LogoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  await clearSession();
  redirect(`/${locale}/login`);
}
