import { LegalContent } from "@/components/LegalContent";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export default async function LegalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);

  return <LegalContent dictionary={dictionary} pageKey="legal" />;
}
