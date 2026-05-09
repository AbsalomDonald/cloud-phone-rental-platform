import type { Dictionary } from "@/lib/i18n";

type LegalKey = keyof Dictionary["legal"];

export function LegalContent({ dictionary, pageKey }: { dictionary: Dictionary; pageKey: LegalKey }) {
  const content = dictionary.legal[pageKey];

  return (
    <>
      <section className="section page-title">
        <h1>{content.title}</h1>
        <p>{content.subtitle}</p>
      </section>
      <section className="section compact">
        <div className="legal-layout">
          {content.sections.map((section) => (
            <article className="legal-section" key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
