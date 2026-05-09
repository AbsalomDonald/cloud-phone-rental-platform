import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { localizedPath } from "@/lib/i18n";

type Plan = {
  name: string;
  label: string;
  price: string;
  period: string;
  badge: string;
  description: string;
  features: string[];
};

type PlanCardProps = {
  cta: string;
  featured?: boolean;
  locale: Locale;
  plan: Plan;
};

export function PlanCard({ cta, featured = false, locale, plan }: PlanCardProps) {
  return (
    <article className={`plan-card ${featured ? "featured" : ""}`}>
      <div className="plan-header">
        <div>
          <span className={`badge ${featured ? "" : "blue"}`}>{plan.badge}</span>
          <h3>{plan.label}</h3>
          <p>{plan.description}</p>
        </div>
      </div>
      <div className="plan-price">
        <strong>{plan.price}</strong>
        <span className="small-muted">/ {plan.period}</span>
      </div>
      <ul className="feature-list">
        {plan.features.map((feature) => (
          <li key={feature}>
            <Check size={17} color="var(--accent)" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link className={featured ? "primary-button" : "secondary-button"} href={localizedPath(locale, "/register")}>
        {cta}
        <ArrowRight size={17} />
      </Link>
    </article>
  );
}
