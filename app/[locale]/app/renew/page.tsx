import { createOrderAction } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { planDescription, planName } from "@/lib/plan-display";
import { prisma } from "@/lib/prisma";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function RenewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const labels = {
    desc: uiText(locale, "选择套餐后继续使用当前云手机。", "プランを選んで現在のクラウドスマホを継続利用します。", "Choose a plan to continue using your cloud phone."),
    day: uiText(locale, "天", "日", "days"),
    business: uiText(locale, "商务", "法人", "Business"),
    custom: uiText(locale, "单独报价", "個別見積もり", "custom")
  };
  const plans = await prisma.plan.findMany({
    orderBy: { price: "asc" },
    where: { isActive: true }
  });

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>{dictionary.dashboard.renew}</h1>
          <p className="small-muted">{labels.desc}</p>
        </div>
      </div>
      <div className="grid-3">
        {plans.map((plan: any) => (
          <article className="plan-card" key={plan.id}>
            <span className="badge">{plan.durationDays ? `${plan.durationDays}${labels.day}` : labels.business}</span>
            <h3>{planName(plan, locale)}</h3>
            <div className="plan-price">
              <strong>{formatMoney(plan.price, plan.currency, locale)}</strong>
              <span className="small-muted">/ {plan.durationDays ? `${plan.durationDays}${labels.day}` : labels.custom}</span>
            </div>
            <p>{planDescription(plan, locale)}</p>
            <form action={createOrderAction}>
              <input name="locale" type="hidden" value={locale} />
              <input name="planId" type="hidden" value={plan.id} />
              <button className="primary-button" type="submit">
              {dictionary.pricing.cta}
              </button>
            </form>
          </article>
        ))}
      </div>
    </>
  );
}
