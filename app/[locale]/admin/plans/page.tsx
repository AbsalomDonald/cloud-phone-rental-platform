import { Plus } from "lucide-react";
import { createPlanAction, togglePlanAction, updatePlanAction } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { planDescription, planName } from "@/lib/plan-display";
import { prisma } from "@/lib/prisma";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const admin = dictionary.admin;
  const labels = {
    desc: uiText(locale, "套餐会真实保存到数据库，前台和续费页面会读取已上架套餐。", "プランはデータベースに保存され、公開中のプランが前台と更新ページに表示されます。", "Plans are saved to the database and active plans appear on public and renewal pages."),
    code: uiText(locale, "套餐代码", "プランコード", "Plan Code"),
    nameZh: uiText(locale, "中文名称", "中国語名", "Chinese Name"),
    nameJa: uiText(locale, "日文名称", "日本語名", "Japanese Name"),
    nameEn: uiText(locale, "英文名称", "英語名", "English Name"),
    price: uiText(locale, "价格", "価格", "Price"),
    currency: uiText(locale, "币种", "通貨", "Currency"),
    durationDays: uiText(locale, "周期天数", "期間（日数）", "Duration Days"),
    stock: uiText(locale, "库存数量", "在庫数", "Stock"),
    regions: uiText(locale, "地区，逗号分隔", "地域（カンマ区切り）", "Regions, comma separated"),
    descZh: uiText(locale, "中文说明", "中国語説明", "Chinese Description"),
    descJa: uiText(locale, "日文说明", "日本語説明", "Japanese Description"),
    descEn: uiText(locale, "英文说明", "英語説明", "English Description"),
    active: uiText(locale, "上架", "公開", "Active"),
    inactive: uiText(locale, "下架", "非公開", "Inactive"),
    activeBadge: uiText(locale, "已上架", "公開中", "Active"),
    inactiveBadge: uiText(locale, "已下架", "非公開", "Inactive"),
    newPlan: uiText(locale, "新增套餐", "プランを追加", "Add Plan"),
    saveChanges: uiText(locale, "保存修改", "変更を保存", "Save Changes"),
    day: uiText(locale, "天", "日", "days"),
    custom: uiText(locale, "单独报价", "個別見積もり", "custom")
  };
  const plans = await prisma.plan.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>{admin.tables.plans}</h1>
          <p className="small-muted">{labels.desc}</p>
        </div>
      </div>

      <section className="support-card" style={{ marginBottom: 18 }}>
        <h2 className="panel-title">
          <Plus size={17} />
          {admin.actions.addPlan}
        </h2>
        <form action={createPlanAction} className="form-stack">
          <input name="locale" type="hidden" value={locale} />
          <div className="grid-3">
            <div className="field"><label>{labels.code}</label><input name="code" placeholder="standard_30d" required /></div>
            <div className="field"><label>{labels.nameZh}</label><input name="nameZh" required /></div>
            <div className="field"><label>{labels.nameJa}</label><input name="nameJa" /></div>
            <div className="field"><label>{labels.nameEn}</label><input name="nameEn" /></div>
            <div className="field"><label>{labels.price}</label><input name="price" placeholder="3980" required /></div>
            <div className="field"><label>{labels.currency}</label><input defaultValue="JPY" name="currency" /></div>
            <div className="field"><label>{labels.durationDays}</label><input name="durationDays" placeholder="30" type="number" /></div>
            <div className="field"><label>{labels.stock}</label><input name="stockQuantity" placeholder="20" type="number" /></div>
            <div className="field"><label>{labels.regions}</label><input name="availableRegions" placeholder="Japan,Hong Kong" /></div>
          </div>
          <div className="field"><label>{labels.descZh}</label><textarea name="descriptionZh" required /></div>
          <div className="field"><label>{labels.descJa}</label><textarea name="descriptionJa" /></div>
          <div className="field"><label>{labels.descEn}</label><textarea name="descriptionEn" /></div>
          <label className="small-muted"><input defaultChecked name="isActive" type="checkbox" /> {labels.active}</label>
          <button className="primary-button" type="submit">{labels.newPlan}</button>
        </form>
      </section>

      <div className="grid-3">
        {plans.map((plan: any) => (
          <article className="plan-card" key={plan.id}>
            <span className={`badge ${plan.isActive ? "" : "danger"}`}>{plan.isActive ? labels.activeBadge : labels.inactiveBadge}</span>
            <h3>{planName(plan, locale)}</h3>
            <div className="plan-price">
              <strong>{formatMoney(plan.price, plan.currency, locale)}</strong>
              <span className="small-muted">/ {plan.durationDays ? `${plan.durationDays}${labels.day}` : labels.custom}</span>
            </div>
            <p>{planDescription(plan, locale)}</p>
            <form action={togglePlanAction} className="button-row" style={{ marginTop: 12 }}>
              <input name="locale" type="hidden" value={locale} />
              <input name="id" type="hidden" value={plan.id} />
              <button className="secondary-button" type="submit">{plan.isActive ? labels.inactive : labels.active}</button>
            </form>
            <form action={updatePlanAction} className="form-stack" style={{ marginTop: 14 }}>
              <input name="locale" type="hidden" value={locale} />
              <input name="id" type="hidden" value={plan.id} />
              <div className="field"><label>{labels.nameZh}</label><input defaultValue={plan.nameZh} name="nameZh" required /></div>
              <div className="field"><label>{labels.price}</label><input defaultValue={plan.price.toString()} name="price" required /></div>
              <div className="field"><label>{labels.currency}</label><input defaultValue={plan.currency} name="currency" /></div>
              <div className="field"><label>{labels.durationDays}</label><input defaultValue={plan.durationDays ?? ""} name="durationDays" type="number" /></div>
              <div className="field"><label>{labels.stock}</label><input defaultValue={plan.stockQuantity ?? ""} name="stockQuantity" type="number" /></div>
              <div className="field"><label>{labels.regions}</label><input defaultValue={plan.availableRegions.join(",")} name="availableRegions" /></div>
              <input name="nameJa" type="hidden" value={plan.nameJa} />
              <input name="nameEn" type="hidden" value={plan.nameEn} />
              <input name="descriptionJa" type="hidden" value={plan.descriptionJa} />
              <input name="descriptionEn" type="hidden" value={plan.descriptionEn} />
              <div className="field"><label>{labels.descZh}</label><textarea defaultValue={plan.descriptionZh} name="descriptionZh" required /></div>
              <label className="small-muted"><input defaultChecked={plan.isActive} name="isActive" type="checkbox" /> {labels.active}</label>
              <button className="primary-button" type="submit">{labels.saveChanges}</button>
            </form>
          </article>
        ))}
      </div>
    </>
  );
}
