import { Send } from "lucide-react";
import { createTicketAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { statusLabel } from "@/lib/status-labels";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const user = await requireUser(locale);
  const dashboard = dictionary.dashboard;
  const form = dashboard.supportForm;
  const labels = {
    myTickets: uiText(locale, "我的工单", "マイチケット", "My tickets"),
    supportReply: uiText(locale, "客服回复：", "サポート返信：", "Support reply: ")
  };
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    where: { userId: user.id }
  });

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>{dashboard.support}</h1>
          <p className="small-muted">{dashboard.subtitle}</p>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="support-card">
          <h2 className="panel-title">{form.title}</h2>
          <form action={createTicketAction} className="form-stack">
            <input name="locale" type="hidden" value={locale} />
            <div className="field">
              <label htmlFor="title">{form.subject}</label>
              <input id="title" name="title" required type="text" />
            </div>
            <div className="field">
              <label htmlFor="message">{form.message}</label>
              <textarea id="message" name="message" required />
            </div>
            <button className="primary-button" type="submit">
              <Send size={17} />
              {form.submit}
            </button>
          </form>
        </section>
        <section className="ticket-stack">
          <h2 className="panel-title">{labels.myTickets}</h2>
          {tickets.map((ticket: any) => (
            <article className="support-card" key={ticket.id}>
              <div className="device-title-row">
                <div>
                  <span className="badge">{statusLabel(ticket.status, locale)}</span>
                  <h3>{ticket.title}</h3>
                </div>
                <span className="table-meta">{formatDate(ticket.updatedAt, locale)}</span>
              </div>
              <p>{ticket.message}</p>
              {ticket.adminReply ? <p className="small-muted">{labels.supportReply}{ticket.adminReply}</p> : null}
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
