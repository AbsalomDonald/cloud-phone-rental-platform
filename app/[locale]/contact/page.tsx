import { Send } from "lucide-react";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { uiText } from "@/lib/ui-text";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const desc = uiText(locale, "套餐、开通、续费或云手机使用问题，都可以从这里联系。", "プラン、開通、更新、クラウドスマホの利用についてはこちらからお問い合わせできます。", "Contact us about plans, activation, renewal, or cloud phone use.");

  return (
    <section className="auth-page">
      <div className="auth-card">
        <span className="badge blue">{dictionary.nav.contact}</span>
        <h1>{dictionary.nav.contact}</h1>
        <p className="small-muted">
          {desc}
        </p>
        <form className="form-stack">
          <div className="field">
            <label htmlFor="email">{dictionary.auth.email}</label>
            <input id="email" type="email" />
          </div>
          <div className="field">
            <label htmlFor="message">{dictionary.dashboard.supportForm.message}</label>
            <textarea id="message" />
          </div>
          <button className="primary-button" type="button">
            <Send size={17} />
            {dictionary.dashboard.supportForm.submit}
          </button>
        </form>
      </div>
    </section>
  );
}
