import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { getDictionary, isLocale, localizedPath, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

type PricingCard = {
  description: string;
  id: string;
  label: string;
  period: string;
  price: string;
};

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const pricing = dictionary.pricing;
  const labels = {
    day: uiText(locale, "天", "日", "days"),
    custom: uiText(locale, "单独报价", "個別見積もり", "custom")
  };
  let plans: PricingCard[] = pricing.plans.map((plan) => ({
    description: plan.description,
    id: plan.name,
    label: plan.label,
    period: plan.period,
    price: plan.price
  }));

  try {
    const databasePlans = await prisma.plan.findMany({
      orderBy: { price: "asc" },
      where: { isActive: true }
    });

    if (databasePlans.length > 0) {
      plans = databasePlans.map((plan: any) => ({
        description: locale === "zh" ? plan.descriptionZh : locale === "en" ? plan.descriptionEn : plan.descriptionJa,
        id: plan.id,
        label: locale === "zh" ? plan.nameZh : locale === "en" ? plan.nameEn : plan.nameJa,
        period: plan.durationDays ? `${plan.durationDays}${labels.day}` : labels.custom,
        price: formatMoney(plan.price, plan.currency, locale)
      }));
    }
  } catch {
    console.warn("Pricing page is using dictionary fallback because database plans are unavailable.");
  }

  return (
    <>
      <section className="section page-title">
        <h1>{pricing.title}</h1>
        <p>{pricing.subtitle}</p>
      </section>
      <section className="section compact">
        <div className="grid-3">
          {plans.map((plan: any, index: number) => (
            <article className={`plan-card ${index === 1 ? "featured" : ""}`} key={plan.id}>
              <span className="badge">{plan.period || pricing.contact}</span>
              <h3>{plan.label}</h3>
              <div className="plan-price">
                <strong>{plan.price}</strong>
                <span className="small-muted">/ {plan.period || labels.custom}</span>
              </div>
              <p>{plan.description}</p>
              <Link className="primary-button" href={localizedPath(locale, "/register")}>
                {pricing.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
