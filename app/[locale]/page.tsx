import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarDays, MonitorSmartphone, ShieldCheck, Wifi } from "lucide-react";
import { ProductVisual } from "@/components/ProductVisual";
import { getDictionary, isLocale, localizedPath, type Locale } from "@/lib/i18n";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const home = dictionary.home;
  const icons = [MonitorSmartphone, Wifi, CalendarDays];

  return (
    <>
      <section className="section hero">
        <div>
          <p className="eyebrow">
            <ShieldCheck size={18} />
            {home.eyebrow}
          </p>
          <h1>{home.title}</h1>
          <p className="hero-copy">{home.subtitle}</p>
          <div className="button-row">
            <Link className="primary-button" href={localizedPath(locale, "/pricing")}>
              {home.primary}
              <ArrowRight size={18} />
            </Link>
            <Link className="secondary-button" href={localizedPath(locale, "/register")}>
              {home.secondary}
            </Link>
          </div>
          <div className="trust-row">
            {home.trust.map((item) => (
              <div className="trust-item" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <ProductVisual dictionary={dictionary} />
      </section>

      <section className="section compact">
        <div className="section-heading">
          <div>
            <h2>{home.valuesTitle}</h2>
            <p>{home.valuesSubtitle}</p>
          </div>
        </div>
        <div className="grid-3">
          {home.values.map((value, index) => {
            const Icon = icons[index] ?? MonitorSmartphone;
            return (
              <article className="value-card" key={value.title}>
                <div className="value-icon">
                  <Icon size={22} />
                </div>
                <h3>{value.title}</h3>
                <p>{value.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section compact">
        <div className="section-heading">
          <div>
            <h2>{home.flowTitle}</h2>
          </div>
        </div>
        <div className="grid-2">
          {home.flow.map((step, index) => (
            <article className="step-card" key={step.title}>
              <div className="step-number">{index + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section compact">
        <div className="notice-card">
          <div className="section-heading">
            <div>
              <h2>{home.noticeTitle}</h2>
            </div>
            <AlertTriangle color="var(--amber)" size={28} />
          </div>
          <ul className="simple-list">
            {home.notices.map((notice) => (
              <li key={notice}>
                <ShieldCheck color="var(--accent)" size={17} />
                <span>{notice}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
