import { HelpCircle } from "lucide-react";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const faq = dictionary.faq;

  return (
    <>
      <section className="section page-title">
        <h1>{faq.title}</h1>
        <p>{faq.subtitle}</p>
      </section>
      <section className="section compact">
        <div className="grid-2">
          {faq.items.map((item) => (
            <article className="faq-item" key={item.question}>
              <div className="value-icon">
                <HelpCircle size={22} />
              </div>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
