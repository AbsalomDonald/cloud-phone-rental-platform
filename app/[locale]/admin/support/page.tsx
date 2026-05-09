import { MessageCircle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { closeTicketAction, replyTicketAction } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { statusLabel } from "@/lib/status-labels";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const admin = dictionary.admin;
  const labels = {
    desc: uiText(locale, "客户提交的工单会保存在数据库。回复后客户个人中心可见。", "お客様が送信したチケットはデータベースに保存されます。返信後はマイページにも表示されます。", "Customer tickets are saved to the database; replies are visible in the user dashboard."),
    close: uiText(locale, "关闭工单", "チケットを閉じる", "Close Ticket"),
    replied: uiText(locale, "已回复：", "返信済み：", "Replied: "),
    replyContent: uiText(locale, "回复内容", "返信内容", "Reply")
  };
  const tickets = await prisma.supportTicket.findMany({
    include: { user: true },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>{admin.tables.tickets}</h1>
          <p className="small-muted">{labels.desc}</p>
        </div>
      </div>
      <div className="ticket-stack">
        {tickets.map((ticket: any) => (
          <article className="support-card" key={ticket.id}>
            <div className="device-title-row">
              <div>
                <StatusBadge status={statusLabel(ticket.status, locale)} />
                <h2 className="panel-title">{ticket.title}</h2>
                <p className="small-muted">{ticket.user.email} · {formatDate(ticket.updatedAt, locale)}</p>
              </div>
              <form action={closeTicketAction}>
                <input name="locale" type="hidden" value={locale} />
                <input name="id" type="hidden" value={ticket.id} />
                <button className="secondary-button" type="submit">{labels.close}</button>
              </form>
            </div>
            <p>{ticket.message}</p>
            {ticket.adminReply ? <p className="small-muted">{labels.replied}{ticket.adminReply}</p> : null}
            <form action={replyTicketAction} className="form-stack">
              <input name="locale" type="hidden" value={locale} />
              <input name="id" type="hidden" value={ticket.id} />
              <div className="field">
                <label>{labels.replyContent}</label>
                <textarea defaultValue={ticket.adminReply ?? ""} name="adminReply" required />
              </div>
              <button className="primary-button" type="submit">
                <MessageCircle size={17} />
                {admin.actions.reply}
              </button>
            </form>
          </article>
        ))}
      </div>
    </>
  );
}
