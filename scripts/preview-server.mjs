import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);
const locales = ["ja", "zh", "en"];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };
    return entities[char];
  });
}

async function readDictionary(locale) {
  return JSON.parse(await fs.readFile(path.join(root, "messages", `${locale}.json`), "utf8"));
}

function tr(locale, zh, ja, en = ja) {
  if (locale === "zh") return zh;
  if (locale === "ja") return ja;
  return en;
}

function localeSwitcher(locale, suffix = "") {
  const normalizedSuffix = suffix ? `/${suffix.split("/").filter(Boolean).join("/")}` : "";
  return `<div class="locale-switcher">
    ${locales.map((target) => `<a class="locale-link ${target === locale ? "active" : ""}" href="/${target}${normalizedSuffix}">${target.toUpperCase()}</a>`).join("")}
  </div>`;
}

const valueTranslations = {
  "7日体验": { ja: "7日間トライアル", en: "7-Day Trial" },
  "30日标准": { ja: "30日間スタンダード", en: "30-Day Standard" },
  "商务批量": { ja: "法人・一括利用", en: "Business Bulk" },
  "7天": { ja: "7日", en: "7 days" },
  "30天": { ja: "30日", en: "30 days" },
  "月付": { ja: "月額", en: "monthly" },
  "体验": { ja: "お試し", en: "Trial" },
  "推荐": { ja: "おすすめ", en: "Recommended" },
  "多台": { ja: "複数台", en: "Multi-device" },
  "第一次用云手机，先轻松试一下。": { ja: "初めての方が気軽に試しやすいプランです。", en: "A light plan for first-time testing." },
  "适合日常使用的一台云手机。": { ja: "日常利用に使いやすいクラウドスマホ1台です。", en: "One cloud phone for everyday use." },
  "适合多台设备或长期使用需求。": { ja: "複数台や長期利用を相談したい方向けです。", en: "For multi-device or long-term needs." },
  "已分配": { ja: "割り当て済み", en: "Assigned" },
  "空闲": { ja: "空き", en: "Available" },
  "已过期": { ja: "期限切れ", en: "Expired" },
  "已暂停": { ja: "停止中", en: "Suspended" },
  "已付款": { ja: "支払い済み", en: "Paid" },
  "待付款": { ja: "支払い待ち", en: "Pending" },
  "已开通": { ja: "開通済み", en: "Fulfilled" },
  "已完成": { ja: "完了", en: "Completed" },
  "待回复": { ja: "未返信", en: "Open" },
  "已回复": { ja: "返信済み", en: "Replied" },
  "已关闭": { ja: "クローズ済み", en: "Closed" },
  "正常": { ja: "正常", en: "Active" },
  "用户": { ja: "ユーザー", en: "User" },
  "管理员": { ja: "管理者", en: "Admin" },
  "运营者": { ja: "運営者", en: "Operator" },
  "日本语": { ja: "日本語", en: "Japanese" },
  "中文": { ja: "中国語", en: "Chinese" },
  "已加密，不可查看": { ja: "暗号化済み・表示不可", en: "Encrypted, hidden" },
  "已加密保存": { ja: "暗号化して保存済み", en: "Encrypted and saved" },
  "已更新并加密保存": { ja: "更新して暗号化保存済み", en: "Updated and encrypted" },
  "高清": { ja: "高画質", en: "HD" },
  "流畅": { ja: "スムーズ", en: "Smooth" },
  "超清": { ja: "超高画質", en: "Ultra HD" },
  "每用户每分钟 10 次 Token 请求": { ja: "ユーザーごとに1分10回までTokenリクエスト", en: "10 token requests per user per minute" },
  "30日标准机": { ja: "30日スタンダード端末", en: "30-day standard device" },
  "备用库存": { ja: "予備在庫", en: "Backup inventory" },
  "登录地址打不开": { ja: "ログインURLが開けません", en: "Login URL does not open" },
  "点击打开云手机后页面一直转圈，请帮我看一下。": { ja: "クラウドスマホを開いた後、画面が読み込み中のままです。確認をお願いします。", en: "After opening the cloud phone, the page keeps loading. Please check it." },
  "想续费 30 天": { ja: "30日更新したいです", en: "I want to renew for 30 days" },
  "现在这台机器用得可以，想继续续费一个月。": { ja: "今の端末は問題なく使えています。もう1か月更新したいです。", en: "This device works well. I want to renew for another month." },
  "可以，续费入口已经帮你开好了，付款后会自动延长到期时间。": { ja: "承知しました。更新入口を開放しました。お支払い後に有効期限が延長されます。", en: "Sure. Renewal is enabled; the expiration will extend after payment." }
};

function valueText(locale, value) {
  if (locale === "zh") return value;
  return valueTranslations[value]?.[locale] ?? value;
}

function localizedPlan(locale, dictionary, plan) {
  const planIndexes = { trial_7d: 0, standard_30d: 1, business_bulk: 2 };
  const dictionaryPlan = dictionary.pricing.plans[planIndexes[plan.code]];
  if (dictionaryPlan) {
    return {
      ...plan,
      label: dictionaryPlan.label,
      price: dictionaryPlan.price,
      period: dictionaryPlan.period,
      badge: dictionaryPlan.badge,
      description: dictionaryPlan.description
    };
  }
  return {
    ...plan,
    label: valueText(locale, plan.label),
    period: valueText(locale, plan.period),
    badge: valueText(locale, plan.badge),
    description: valueText(locale, plan.description)
  };
}

function localizedPhone(locale, phone) {
  return {
    ...phone,
    region: valueText(locale, phone.region),
    status: valueText(locale, phone.status),
    notes: valueText(locale, phone.notes)
  };
}

function localizedUser(locale, user) {
  return {
    ...user,
    name: valueText(locale, user.name),
    language: valueText(locale, user.language),
    role: valueText(locale, user.role),
    status: valueText(locale, user.status),
    passwordStatus: valueText(locale, user.passwordStatus)
  };
}

function localizedTicket(locale, ticket) {
  return {
    ...ticket,
    title: valueText(locale, ticket.title),
    message: valueText(locale, ticket.message),
    status: valueText(locale, ticket.status),
    adminReply: valueText(locale, ticket.adminReply)
  };
}

function localizedSettings(locale, settings) {
  return {
    ...settings,
    accessKeyStatus: valueText(locale, settings.accessKeyStatus),
    secretKeyStatus: valueText(locale, settings.secretKeyStatus),
    quality: valueText(locale, settings.quality),
    rateLimit: valueText(locale, settings.rateLimit)
  };
}

const previewState = globalThis.__ouyangPreviewState ?? {
  plans: [
    {
      code: "trial_7d",
      label: "7日体验",
      price: "¥980",
      period: "7天",
      badge: "体验",
      description: "第一次用云手机，先轻松试一下。",
      active: true
    },
    {
      code: "standard_30d",
      label: "30日标准",
      price: "¥3,980",
      period: "30天",
      badge: "推荐",
    description: "适合日常使用的一台云手机。",
      active: true
    },
    {
      code: "business_bulk",
      label: "商务批量",
      price: "咨询",
      period: "月付",
      badge: "多台",
      description: "适合多台设备或长期使用需求。",
      active: true
    }
  ],
  phones: [
    { internalName: "JP-001", padCode: "PAD-JP-001", region: "日本", status: "已分配", user: "tanaka@example.jp", userExpire: "2026-06-05", vmosExpire: "2026-06-10", notes: "30日标准机" },
    { internalName: "JP-002", padCode: "PAD-JP-002", region: "日本", status: "空闲", user: "-", userExpire: "-", vmosExpire: "2026-06-10", notes: "备用库存" },
    { internalName: "HK-003", padCode: "PAD-HK-003", region: "香港", status: "空闲", user: "-", userExpire: "-", vmosExpire: "2026-06-12", notes: "备用库存" }
  ],
  users: [
    { email: "tanaka@example.jp", name: "Tanaka", language: "日本语", role: "用户", status: "正常", passwordStatus: "已加密，不可查看", createdAt: "2026-05-01 10:24", lastLoginAt: "2026-05-05 09:18", lastLoginIp: "203.0.113.24" },
    { email: "li@example.com", name: "Li", language: "中文", role: "用户", status: "正常", passwordStatus: "已加密，不可查看", createdAt: "2026-05-02 14:06", lastLoginAt: "2026-05-04 22:40", lastLoginIp: "198.51.100.18" },
    { email: "admin@example.com", name: "运营者", language: "中文", role: "管理员", status: "正常", passwordStatus: "已加密，不可查看", createdAt: "2026-04-28 08:00", lastLoginAt: "2026-05-05 11:02", lastLoginIp: "192.0.2.9" }
  ],
  assignments: [
    { id: "ASN-001", user: "tanaka@example.jp", internalName: "JP-001", padCode: "PAD-JP-001", order: "ORD-20260505-003", userExpire: "2026-06-05" }
  ],
  supportTickets: [
    { id: "SUP-1024", user: "tanaka@example.jp", title: "登录地址打不开", message: "点击打开云手机后页面一直转圈，请帮我看一下。", status: "待回复", updated: "2026-05-05 11:30", adminReply: "" },
    { id: "SUP-1023", user: "li@example.com", title: "想续费 30 天", message: "现在这台机器用得可以，想继续续费一个月。", status: "已回复", updated: "2026-05-04 22:20", adminReply: "可以，续费入口已经帮你开好了，付款后会自动延长到期时间。" }
  ],
  vmosSettings: {
    apiBaseUrl: "https://api.vmoscloud.example",
    accessKeyStatus: "已加密保存",
    secretKeyStatus: "已加密保存",
    h5BaseUrl: "https://h5.vmoscloud.example",
    quality: "高清",
    bitrate: "4 Mbps",
    fps: "30 FPS",
    rateLimit: "每用户每分钟 10 次 Token 请求"
  }
};

globalThis.__ouyangPreviewState = previewState;

async function readForm(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk.toString();
  }
  return new URLSearchParams(body);
}

function redirect(response, location) {
  const locale = location.split("/").filter(Boolean)[0] || "ja";
  const backText = tr(locale, "返回", "戻る", "Back");
  if (!response.headersSent) {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  }
  response.end(`<!doctype html><html><head><meta charset="utf-8" /><meta http-equiv="refresh" content="0; url=${escapeHtml(location)}" /></head><body><a href="${escapeHtml(location)}">${escapeHtml(backText)}</a></body></html>`);
}

function nextAssignmentId() {
  return `ASN-${String(previewState.assignments.length + 1).padStart(3, "0")}`;
}

function nextSupportTicketId() {
  const lastNumber = previewState.supportTickets.reduce((max, ticket) => {
    const match = ticket.id.match(/SUP-(\d+)/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 1023);
  return `SUP-${String(lastNumber + 1).padStart(4, "0")}`;
}

async function handleAdminPost(request, response, locale, adminRoute) {
  const form = await readForm(request);
  return handleAdminForm(response, locale, adminRoute, form);
}

function handleAppForm(response, locale, appRoute, form) {
  const base = `/${locale}/app`;

  if (appRoute === "support/create") {
    const title = String(form.get("title") || "").trim();
    const message = String(form.get("message") || "").trim();
    if (title && message) {
      previewState.supportTickets.unshift({
        id: nextSupportTicketId(),
        user: "tanaka@example.jp",
        title,
        message,
        status: "待回复",
        updated: "2026-05-05 12:00",
        adminReply: ""
      });
    }
    redirect(response, `${base}/support`);
    return true;
  }

  return false;
}

function handleAdminForm(response, locale, adminRoute, form) {
  const base = `/${locale}/admin`;

  if (adminRoute === "plans/create") {
    const code = String(form.get("code") || "").trim();
    if (code && !previewState.plans.some((plan) => plan.code === code)) {
      previewState.plans.push({
        code,
        label: String(form.get("label") || "").trim(),
        price: String(form.get("price") || "").trim(),
        period: String(form.get("period") || "").trim(),
        badge: String(form.get("badge") || "").trim(),
        description: String(form.get("description") || "").trim(),
        active: form.get("active") === "true"
      });
    }
    redirect(response, `${base}/plans`);
    return true;
  }

  if (adminRoute === "plans/update") {
    const code = String(form.get("code") || "").trim();
    const plan = previewState.plans.find((item) => item.code === code);
    if (plan) {
      plan.label = String(form.get("label") || "").trim();
      plan.price = String(form.get("price") || "").trim();
      plan.period = String(form.get("period") || "").trim();
      plan.badge = String(form.get("badge") || "").trim();
      plan.description = String(form.get("description") || "").trim();
      plan.active = form.get("active") === "true";
    }
    redirect(response, `${base}/plans`);
    return true;
  }

  if (adminRoute === "plans/toggle") {
    const code = String(form.get("code") || "").trim();
    const plan = previewState.plans.find((item) => item.code === code);
    if (plan) {
      plan.active = !plan.active;
    }
    redirect(response, `${base}/plans`);
    return true;
  }

  if (adminRoute === "phones/create") {
    const padCode = String(form.get("padCode") || "").trim();
    const internalName = String(form.get("internalName") || "").trim();
    if (padCode && internalName && !previewState.phones.some((phone) => phone.padCode === padCode)) {
      previewState.phones.push({
        internalName,
        padCode,
        region: String(form.get("region") || "").trim(),
        status: "空闲",
        user: "-",
        userExpire: "-",
        vmosExpire: String(form.get("vmosExpire") || "").trim(),
        notes: String(form.get("notes") || "").trim()
      });
    }
    redirect(response, `${base}/phones`);
    return true;
  }

  if (adminRoute === "assignments/create") {
    const padCode = String(form.get("padCode") || "").trim();
    const phone = previewState.phones.find((item) => item.padCode === padCode && item.status === "空闲");
    const user = String(form.get("user") || "").trim();
    const order = String(form.get("order") || "").trim();
    const userExpire = String(form.get("userExpire") || "").trim();
    if (phone && user) {
      phone.status = "已分配";
      phone.user = user;
      phone.userExpire = userExpire;
      previewState.assignments.push({
        id: nextAssignmentId(),
        user,
        internalName: phone.internalName,
        padCode: phone.padCode,
        order,
        userExpire
      });
    }
    redirect(response, `${base}/assignments`);
    return true;
  }

  if (adminRoute === "support/reply") {
    const id = String(form.get("id") || "").trim();
    const ticket = previewState.supportTickets.find((item) => item.id === id);
    if (ticket) {
      ticket.adminReply = String(form.get("reply") || "").trim();
      ticket.status = ticket.adminReply ? "已回复" : ticket.status;
      ticket.updated = "2026-05-05 12:05";
    }
    redirect(response, `${base}/support`);
    return true;
  }

  if (adminRoute === "support/close") {
    const id = String(form.get("id") || "").trim();
    const ticket = previewState.supportTickets.find((item) => item.id === id);
    if (ticket) {
      ticket.status = "已关闭";
      ticket.updated = "2026-05-05 12:06";
    }
    redirect(response, `${base}/support`);
    return true;
  }

  if (adminRoute === "settings/vmos/save") {
    const settings = previewState.vmosSettings;
    settings.apiBaseUrl = String(form.get("apiBaseUrl") || settings.apiBaseUrl).trim();
    settings.h5BaseUrl = String(form.get("h5BaseUrl") || settings.h5BaseUrl).trim();
    settings.quality = String(form.get("quality") || settings.quality).trim();
    settings.bitrate = String(form.get("bitrate") || settings.bitrate).trim();
    settings.fps = String(form.get("fps") || settings.fps).trim();
    settings.rateLimit = String(form.get("rateLimit") || settings.rateLimit).trim();
    if (String(form.get("accessKey") || "").trim()) {
      settings.accessKeyStatus = "已更新并加密保存";
    }
    if (String(form.get("secretKey") || "").trim()) {
      settings.secretKeyStatus = "已更新并加密保存";
    }
    redirect(response, `${base}/settings/vmos`);
    return true;
  }

  return false;
}

function render(locale, dictionary, css) {
  const home = dictionary.home;
  const pricing = dictionary.pricing;

  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(dictionary.meta.product)} | ${escapeHtml(dictionary.meta.tagline)}</title>
  <style>${css}</style>
  <style>
    .icon-dot{width:22px;height:22px;border-radius:6px;background:var(--accent);display:inline-block;position:relative;flex:0 0 auto}
    .icon-dot:after{content:"";position:absolute;inset:6px;border:2px solid #fff;border-radius:3px}
    .preview-note{position:fixed;right:16px;bottom:16px;z-index:40;background:#10262b;color:#fff;border-radius:8px;padding:10px 12px;font-size:13px;box-shadow:var(--shadow)}
    .phone-app{font-weight:800;font-size:12px}
    .hero-dock{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
    .hero-dock div{border:1px solid rgba(125,253,234,.16);border-radius:8px;background:rgba(3,9,12,.52);padding:10px}
    .hero-dock span{display:block;color:var(--muted);font-size:12px}
    .hero-dock strong{display:block;margin-top:4px;color:var(--accent-strong);font-size:14px}
    @media(max-width:640px){.preview-note{left:12px;right:12px;text-align:center}}
  </style>
</head>
<body>
  <div class="page-shell">
    <header class="site-header">
      <div class="nav-wrap">
        <a class="brand" href="/${locale}">
          <span class="brand-mark">OY</span>
          <span class="brand-text">${escapeHtml(dictionary.meta.product)}</span>
        </a>
        <nav class="nav-links">
          <a class="nav-link" href="/${locale}">${escapeHtml(dictionary.nav.home)}</a>
          <a class="nav-link" href="/${locale}#pricing">${escapeHtml(dictionary.nav.pricing)}</a>
          <a class="nav-link" href="/${locale}#faq">${escapeHtml(dictionary.nav.faq)}</a>
          <a class="nav-link" href="/${locale}/contact">${escapeHtml(dictionary.nav.contact)}</a>
          <a class="secondary-button" href="/${locale}/login">${escapeHtml(dictionary.nav.login)}</a>
          <a class="primary-button" href="/${locale}/register">${escapeHtml(dictionary.nav.register)}</a>
          ${localeSwitcher(locale)}
        </nav>
      </div>
    </header>

    <section class="section hero">
      <div>
        <p class="eyebrow"><span class="icon-dot"></span>${escapeHtml(home.eyebrow)}</p>
        <h1>${escapeHtml(home.title)}</h1>
        <p class="hero-copy">${escapeHtml(home.subtitle)}</p>
        <div class="button-row">
          <a class="primary-button" href="#pricing">${escapeHtml(home.primary)} -></a>
          <a class="secondary-button" href="/${locale}/register">${escapeHtml(home.secondary)}</a>
        </div>
        <div class="trust-row">
          ${home.trust.map((item) => `<div class="trust-item"><strong>${escapeHtml(item.value)}</strong><span>${escapeHtml(item.label)}</span></div>`).join("")}
        </div>
      </div>

      <div class="product-visual">
        <div class="visual-toolbar">
          <div class="visual-title"><span class="icon-dot"></span>${escapeHtml(home.visual.title)}</div>
          <span class="badge blue">${escapeHtml(home.visual.status)}</span>
        </div>
        <div class="visual-body">
          <div class="phone-frame">
            <div class="phone-status"><span>9:41</span><span>5G</span></div>
            <div class="phone-app-grid">
              ${["Cloud", "Login", "Time", "OK", "Data", "Safe"].map((label) => `<div class="phone-app">${label}</div>`).join("")}
            </div>
            <div class="small-muted">Android Cloud Environment</div>
          </div>
          <div class="visual-panel">
            <div class="visual-record"><span>${escapeHtml(home.visual.device)}</span><strong>Cloud Phone #001</strong><span class="badge">${escapeHtml(home.visual.status)}</span></div>
            <div class="visual-record"><span>${escapeHtml(home.visual.expires)}</span><strong>2026-06-05</strong></div>
            <div class="visual-record"><span>${escapeHtml(home.visual.order)}</span><strong>ORD-20260505-001</strong></div>
            <div class="visual-record"><span>${escapeHtml(home.visual.support)}</span><strong>#SUP-1024</strong></div>
            <div class="hero-dock">
              <div><span>Secure</span><strong>Server</strong></div>
              <div><span>Web</span><strong>Access</strong></div>
              <div><span>Keys</span><strong>Hidden</strong></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section compact">
      <div class="section-heading">
        <div>
          <h2>${escapeHtml(home.valuesTitle)}</h2>
          <p>${escapeHtml(home.valuesSubtitle)}</p>
        </div>
      </div>
      <div class="grid-3">
        ${home.values.map((value) => `<article class="value-card"><div class="value-icon"><span class="icon-dot"></span></div><h3>${escapeHtml(value.title)}</h3><p>${escapeHtml(value.body)}</p></article>`).join("")}
      </div>
    </section>

    <section class="section compact" id="pricing">
      <div class="section-heading">
        <div>
          <h2>${escapeHtml(pricing.title)}</h2>
          <p>${escapeHtml(pricing.subtitle)}</p>
        </div>
      </div>
      <div class="grid-3">
        ${pricing.plans.map((plan, index) => `<article class="plan-card ${index === 1 ? "featured" : ""}"><div class="plan-header"><div><span class="badge ${index === 1 ? "" : "blue"}">${escapeHtml(plan.badge)}</span><h3>${escapeHtml(plan.label)}</h3><p>${escapeHtml(plan.description)}</p></div></div><div class="plan-price"><strong>${escapeHtml(plan.price)}</strong><span class="small-muted">/ ${escapeHtml(plan.period)}</span></div><ul class="feature-list">${plan.features.map((feature) => `<li><span>✓</span><span>${escapeHtml(feature)}</span></li>`).join("")}</ul><a class="${index === 1 ? "primary-button" : "secondary-button"}" href="/${locale}/register">${escapeHtml(index === 2 ? pricing.contact : pricing.cta)} -></a></article>`).join("")}
      </div>
    </section>

    <section class="section compact">
      <div class="section-heading"><div><h2>${escapeHtml(home.flowTitle)}</h2></div></div>
      <div class="grid-2">
        ${home.flow.map((step, index) => `<article class="step-card"><div class="step-number">${index + 1}</div><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.body)}</p></article>`).join("")}
      </div>
    </section>

    <section class="section compact">
      <div class="notice-card">
        <div class="section-heading"><div><h2>${escapeHtml(home.noticeTitle)}</h2></div></div>
        <ul class="simple-list">${home.notices.map((notice) => `<li><span>✓</span><span>${escapeHtml(notice)}</span></li>`).join("")}</ul>
      </div>
    </section>

    <footer class="footer">
      <div class="footer-inner">
        <span>${escapeHtml(dictionary.meta.product)} · ${escapeHtml(dictionary.meta.tagline)}</span>
        <div class="footer-links">
          <a>${escapeHtml(dictionary.legal.terms.title)}</a>
          <a>${escapeHtml(dictionary.legal.privacy.title)}</a>
          <a>${escapeHtml(dictionary.legal.legal.title)}</a>
          <a>${escapeHtml(dictionary.legal.refund.title)}</a>
        </div>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

function renderAuth(locale, dictionary, css, mode) {
  const auth = dictionary.auth;
  const isLogin = mode === "login";
  const title = isLogin ? auth.loginTitle : auth.registerTitle;
  const subtitle = isLogin ? auth.loginSubtitle : auth.registerSubtitle;
  const buttonText = isLogin ? auth.loginButton : auth.registerButton;

  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} | ${escapeHtml(dictionary.meta.product)}</title>
  <style>${css}</style>
  <style>
    .auth-card{box-shadow:var(--shadow);border-color:rgba(125,253,234,.28)}
    .auth-card h1{font-size:34px}
    .auth-links{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px}
  </style>
</head>
<body>
  <div class="page-shell">
    <header class="site-header">
      <div class="nav-wrap">
        <a class="brand" href="/${locale}">
          <span class="brand-mark">OY</span>
          <span class="brand-text">${escapeHtml(dictionary.meta.product)}</span>
        </a>
        <nav class="nav-links">
          <a class="nav-link" href="/${locale}">${escapeHtml(dictionary.nav.home)}</a>
          <a class="nav-link" href="/${locale}#pricing">${escapeHtml(dictionary.nav.pricing)}</a>
          <a class="nav-link" href="/${locale}/contact">${escapeHtml(dictionary.nav.contact)}</a>
          <a class="secondary-button" href="/${locale}/${isLogin ? "register" : "login"}">${escapeHtml(isLogin ? dictionary.nav.register : dictionary.nav.login)}</a>
          ${localeSwitcher(locale, mode)}
        </nav>
      </div>
    </header>

    <section class="auth-page">
      <div class="auth-card">
        <span class="badge blue">${escapeHtml(dictionary.meta.tagline)}</span>
        <h1>${escapeHtml(title)}</h1>
        <p class="small-muted">${escapeHtml(subtitle)}</p>
        <form class="form-stack">
          ${isLogin ? "" : `<div class="field"><label for="name">${escapeHtml(auth.name)}</label><input id="name" name="name" type="text" autocomplete="name" /></div>`}
          <div class="field">
            <label for="email">${escapeHtml(auth.email)}</label>
            <input id="email" name="email" type="email" autocomplete="email" />
          </div>
          <div class="field">
            <label for="password">${escapeHtml(auth.password)}</label>
            <input id="password" name="password" type="password" autocomplete="${isLogin ? "current-password" : "new-password"}" />
          </div>
          ${isLogin ? "" : `<div class="field"><label for="language">${escapeHtml(auth.language)}</label><select id="language" name="language">${locales.map((target) => `<option value="${target}" ${target === locale ? "selected" : ""}>${target.toUpperCase()}</option>`).join("")}</select></div>`}
          <a class="primary-button" href="/${locale}/app">${escapeHtml(buttonText)}</a>
          <div class="auth-links">
            ${isLogin ? `<a class="small-muted" href="/${locale}/forgot-password">${escapeHtml(auth.forgot)}</a><a class="small-muted" href="/${locale}/register">${escapeHtml(dictionary.nav.register)}</a>` : `<a class="small-muted" href="/${locale}/login">${escapeHtml(dictionary.nav.login)}</a>`}
          </div>
          <span class="small-muted">${escapeHtml(auth.demoNote)}</span>
        </form>
      </div>
    </section>
  </div>
</body>
</html>`;
}

function renderApp(locale, dictionary, css, route = "") {
  const dashboard = dictionary.dashboard;
  const appRoutes = ["", "phones", "orders", "renew", "support"];
  const userEmail = "tanaka@example.jp";
  const userPhones = previewState.phones.filter((phone) => phone.user === userEmail).map((phone) => localizedPhone(locale, phone));
  const activePhone = userPhones[0] ?? localizedPhone(locale, previewState.phones[0]);
  const userTickets = previewState.supportTickets.filter((ticket) => ticket.user === userEmail).map((ticket) => localizedTicket(locale, ticket));
  const appPlans = previewState.plans.filter((plan) => plan.active).map((plan) => localizedPlan(locale, dictionary, plan));
  const settings = localizedSettings(locale, previewState.vmosSettings);
  const orders = [
    ["ORD-20260505-003", dictionary.pricing.plans[1].label, "¥3,980", valueText(locale, "已付款"), "2026-05-05 10:22"],
    ["ORD-20260428-001", dictionary.pricing.plans[0].label, "¥980", valueText(locale, "已完成"), "2026-04-28 18:08"]
  ];
  const labels = {
    cloudPhone: tr(locale, "云手机", "クラウドスマホ", "Cloud Phone"),
    expires: tr(locale, "到期", "有効期限", "Expires"),
    openPhone: tr(locale, "打开云手机", "クラウドスマホを開く", "Open Cloud Phone"),
    openCurrentPhone: tr(locale, "打开当前云手机", "現在のクラウドスマホを開く", "Open Current Phone"),
    tempAuth: tr(locale, "临时授权", "一時認証", "Temporary Auth"),
    enterView: tr(locale, "进入画面", "画面を開く", "Enter View"),
    connection: tr(locale, "连接方式", "接続方式", "Connection"),
    quality: tr(locale, "默认画质", "標準画質", "Default Quality"),
    authStatus: tr(locale, "授权状态", "認証状態", "Auth Status"),
    serverSigned: tr(locale, "服务器临时签发", "サーバーで一時発行", "Server-issued temporary token"),
    phonesTitle: tr(locale, "我的云手机", "マイクラウドスマホ", "My Cloud Phones"),
    phonesDesc: tr(locale, "这里是客户登录以后真正使用云手机的地方。每一台机器只显示自己的到期时间和打开入口。", "ログイン後にクラウドスマホを利用する画面です。各端末には自分の有効期限と起動入口だけが表示されます。", "This is where users access their assigned cloud phones after login."),
    phoneDesc: tr(locale, "打开时会由欧阳日本事业部服务器生成临时授权。客户只能打开自己名下的云手机。", "起動時は欧陽日本事業部のサーバーが一時認証を発行します。お客様は自分に割り当てられたクラウドスマホだけを開けます。", "The server issues temporary access, and users can only open their assigned cloud phone."),
    ordersTitle: tr(locale, "订单记录", "注文履歴", "Orders"),
    ordersDesc: tr(locale, "客户可以看到自己买过什么套餐、什么时候付款、现在是否已经开通。", "購入したプラン、支払い日時、開通状況を確認できます。", "Users can see purchased plans, payment time, and fulfillment status."),
    renewTitle: tr(locale, "续费", "更新", "Renew"),
    renewDesc: tr(locale, "第一版先做一次性付款续费。付款完成后，后台可以手动或自动延长这台云手机的用户到期时间。", "初期版では都度払い更新に対応します。支払い後、このクラウドスマホの有効期限を手動または自動で延長できます。", "The MVP supports one-time renewals; after payment, the cloud phone expiration can be extended."),
    chooseRenew: tr(locale, "选择续费", "更新を選ぶ", "Choose Renewal"),
    supportTitle: tr(locale, "客服工单", "サポートチケット", "Support Tickets"),
    supportDesc: tr(locale, "客户遇到打不开、卡顿、续费、到期这些问题，可以在这里提交。后台会看到同一条工单。", "開けない、重い、更新、有効期限などの問題はこちらから送信できます。運営管理にも同じチケットが表示されます。", "Users can submit issues with access, performance, renewal, or expiration."),
    newTicket: tr(locale, "提交新工单", "新しいチケットを送信", "Submit New Ticket"),
    title: tr(locale, "标题", "タイトル", "Title"),
    issue: tr(locale, "问题说明", "問題の説明", "Issue Description"),
    titlePlaceholder: tr(locale, "例如：云手机打不开", "例：クラウドスマホが開けません", "Example: cloud phone will not open"),
    issuePlaceholder: tr(locale, "请简单写一下发生了什么", "発生した内容を簡単に入力してください", "Briefly describe what happened"),
    submitTicket: tr(locale, "提交工单", "チケットを送信", "Submit Ticket"),
    myTickets: tr(locale, "我的工单", "マイチケット", "My Tickets"),
    supportReply: tr(locale, "客服回复：", "サポート返信：", "Support reply: "),
    noReply: tr(locale, "客服还没有回复，后台处理后这里会同步显示。", "まだ返信はありません。運営側で対応するとここに表示されます。", "No reply yet; updates will appear here after admin response."),
    secureProxy: tr(locale, "你的手机权限由欧阳日本事业部服务器安全中转。", "クラウドスマホ権限は欧陽日本事業部のサーバーで安全に中継されます。", "Cloud phone access is securely proxied by the Ouyang Japan server."),
    openHelp: tr(locale, "点击打开时，系统会先检查订单、绑定关系、到期时间和设备状态，然后生成临时连接授权。客户不会接触供应商账号或密钥。", "起動時は注文、割り当て、有効期限、端末状態を確認してから一時接続認証を発行します。お客様に提供元アカウントや秘密鍵は表示されません。", "Before opening, the system checks order, assignment, expiration, and device status before issuing temporary access."),
    enterH5: tr(locale, "进入云手机画面", "クラウドスマホ画面へ", "Enter Cloud Phone View"),
    extendAccess: tr(locale, "延长当前云手机权限", "現在のクラウドスマホ権限を延長", "Extend current cloud phone access"),
    contactSupport: tr(locale, "联系客服", "サポートに連絡", "Contact Support"),
    submitIssue: tr(locale, "提交使用问题", "利用中の問題を送信", "Submit usage issue"),
    secureFlow: tr(locale, "安全链路", "安全な接続", "Secure Flow"),
    beforeOpen: tr(locale, "打开前会检查", "起動前チェック", "Checks Before Opening"),
    loginState: tr(locale, "登录状态", "ログイン状態", "Login Status"),
    ownerAccount: tr(locale, "确认是本人账号", "本人アカウントであることを確認", "Confirm account ownership"),
    padOwner: tr(locale, "设备归属", "端末の割り当て", "Device Ownership"),
    ownPhoneOnly: tr(locale, "只能打开自己绑定的手机", "自分に割り当てられた端末のみ起動", "Only assigned phones can be opened"),
    riskCheck: tr(locale, "到期和风控", "有効期限とリスク確認", "Expiration and Risk Check"),
    riskBlocked: tr(locale, "过期、禁用、频繁请求会拦截", "期限切れ、停止、頻繁なリクエストはブロック", "Expired, disabled, or frequent requests are blocked"),
    tempToken: tr(locale, "临时 Token", "一時Token", "Temporary Token"),
    tokenRequest: tr(locale, "由服务器安全签发", "サーバーが安全に発行", "Issued securely by the server"),
    orderNo: tr(locale, "订单编号", "注文番号", "Order ID"),
    plan: tr(locale, "套餐", "プラン", "Plan"),
    amount: tr(locale, "金额", "金額", "Amount"),
    status: tr(locale, "状态", "状態", "Status"),
    time: tr(locale, "时间", "日時", "Time")
  };

  function appPath(index) {
    return `/${locale}/app${appRoutes[index] ? `/${appRoutes[index]}` : ""}`;
  }

  function miniTable(columns, rows, statusIndex = -1) {
    const template = `repeat(${columns.length}, minmax(130px, 1fr))`;
    return `<div class="table-card">
      <div class="table-head" style="grid-template-columns:${template};min-width:${columns.length * 150}px">${columns.map((column) => `<span>${escapeHtml(column)}</span>`).join("")}</div>
      ${rows.map((row) => `<div class="table-row" style="grid-template-columns:${template};min-width:${columns.length * 150}px">${row.map((cell, index) => `<div>${index === statusIndex ? `<span class="badge ${String(cell).includes("待") ? "amber" : ""}">${escapeHtml(cell)}</span>` : escapeHtml(cell)}</div>`).join("")}</div>`).join("")}
    </div>`;
  }

  function phoneCards() {
    return userPhones.map((phone) => `<article class="control-card">
      <div class="control-card-inner">
        <div>
          <div class="device-title-row">
            <div>
              <span class="badge">${escapeHtml(phone.status)}</span>
              <h2>${escapeHtml(phone.internalName)} ${escapeHtml(labels.cloudPhone)}</h2>
              <div class="device-subline">
                <span class="badge amber">${escapeHtml(labels.expires)}: ${escapeHtml(phone.userExpire)} 23:59</span>
              </div>
            </div>
            <a class="primary-button" href="/${locale}/app/phones/${encodeURIComponent(phone.internalName)}">${escapeHtml(labels.openPhone)}</a>
          </div>
          <p class="small-muted">${escapeHtml(labels.phoneDesc)}</p>
          <div class="signal-strip">
            <div class="signal-item"><span>${escapeHtml(labels.connection)}</span><strong>网页远程连接</strong></div>
            <div class="signal-item"><span>${escapeHtml(labels.quality)}</span><strong>${escapeHtml(settings.quality)} · ${escapeHtml(settings.fps)}</strong></div>
            <div class="signal-item"><span>${escapeHtml(labels.authStatus)}</span><strong>${escapeHtml(labels.serverSigned)}</strong></div>
          </div>
        </div>
        <div class="mini-phone">
          <div class="mini-phone-top"><span>9:41</span><span>Cloud</span></div>
          <div class="mini-app-grid"><span>APP</span><span>WEB</span><span>VIEW</span><span>CPU</span><span>FPS</span><span>NET</span></div>
          <div class="small-muted">Remote Android · Online</div>
        </div>
      </div>
    </article>`).join("");
  }

  function appContent() {
    if (route === "phones") {
      return `<section>
        <div class="section-heading">
          <div><h2>${escapeHtml(labels.phonesTitle)}</h2><p>${escapeHtml(labels.phonesDesc)}</p></div>
          <a class="primary-button" href="/${locale}/app/phones/${encodeURIComponent(activePhone.internalName)}">${escapeHtml(labels.openCurrentPhone)}</a>
        </div>
        ${phoneCards()}
      </section>`;
    }

    if (route === "orders") {
      return `<section>
        <div class="section-heading"><div><h2>${escapeHtml(labels.ordersTitle)}</h2><p>${escapeHtml(labels.ordersDesc)}</p></div></div>
        ${miniTable([labels.orderNo, labels.plan, labels.amount, labels.status, labels.time], orders, 3)}
      </section>`;
    }

    if (route === "renew") {
      return `<section>
        <div class="section-heading"><div><h2>${escapeHtml(labels.renewTitle)}</h2><p>${escapeHtml(labels.renewDesc)}</p></div></div>
        <div class="grid-3">${appPlans.map((plan) => `<article class="plan-card">
          <span class="badge">${escapeHtml(plan.badge || labels.plan)}</span>
          <h3>${escapeHtml(plan.label)}</h3>
          <div class="plan-price"><strong>${escapeHtml(plan.price)}</strong><span class="small-muted">/ ${escapeHtml(plan.period)}</span></div>
          <p>${escapeHtml(plan.description)}</p>
          <button class="primary-button" type="button">${escapeHtml(labels.chooseRenew)}</button>
        </article>`).join("")}</div>
      </section>`;
    }

    if (route === "support") {
      return `<section>
        <div class="section-heading"><div><h2>${escapeHtml(labels.supportTitle)}</h2><p>${escapeHtml(labels.supportDesc)}</p></div></div>
        <div class="dashboard-grid">
          <form class="support-card form-stack" method="get" action="/${locale}/app/support/create">
            <h2 class="panel-title">${escapeHtml(labels.newTicket)}</h2>
            <div class="field"><label>${escapeHtml(labels.title)}</label><input name="title" placeholder="${escapeHtml(labels.titlePlaceholder)}" required /></div>
            <div class="field"><label>${escapeHtml(labels.issue)}</label><textarea name="message" placeholder="${escapeHtml(labels.issuePlaceholder)}" required></textarea></div>
            <button class="primary-button" type="submit">${escapeHtml(labels.submitTicket)}</button>
          </form>
          <div class="ticket-stack">
            <h2 class="panel-title">${escapeHtml(labels.myTickets)}</h2>
            ${userTickets.map((ticket) => `<article class="support-card">
                <div class="device-title-row">
                  <div><span class="badge ${ticket.status === "待回复" ? "amber" : ""}">${escapeHtml(ticket.status)}</span><h3>${escapeHtml(ticket.title)}</h3></div>
                  <span class="table-meta">${escapeHtml(ticket.id)}</span>
                </div>
                <p>${escapeHtml(ticket.message)}</p>
                ${ticket.adminReply ? `<p class="small-muted">${escapeHtml(labels.supportReply)}${escapeHtml(ticket.adminReply)}</p>` : `<p class="small-muted">${escapeHtml(labels.noReply)}</p>`}
              </article>`).join("")}
          </div>
        </div>
      </section>`;
    }

    return `<div class="metric-row">
          ${dashboard.metrics.map((metric) => `<div class="metric-card"><span>${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value)}</strong></div>`).join("")}
        </div>

        <section class="command-hero">
          <div class="control-card">
            <div class="control-card-inner">
              <div>
                <div class="device-title-row">
                  <div>
                    <span class="badge">${escapeHtml(activePhone.status)}</span>
                    <h2>${escapeHtml(activePhone.internalName)} ${escapeHtml(labels.cloudPhone)}</h2>
                    <div class="device-subline">
                      <span class="badge">${escapeHtml(labels.tempAuth)}</span>
                      <span class="badge amber">${escapeHtml(labels.expires)}: ${escapeHtml(activePhone.userExpire)} 23:59</span>
                    </div>
                  </div>
                  <a class="primary-button" href="/${locale}/app/phones/${encodeURIComponent(activePhone.internalName)}">${escapeHtml(labels.enterView)}</a>
                </div>
                <p class="small-muted">${escapeHtml(labels.openHelp)}</p>
                <div class="signal-strip">
                  <div class="signal-item"><span>${escapeHtml(labels.connection)}</span><strong>网页远程连接</strong></div>
                  <div class="signal-item"><span>${escapeHtml(labels.quality)}</span><strong>${escapeHtml(settings.quality)} · ${escapeHtml(settings.fps)}</strong></div>
                  <div class="signal-item"><span>${escapeHtml(labels.authStatus)}</span><strong>${escapeHtml(labels.serverSigned)}</strong></div>
                </div>
                <div class="action-grid">
                  <a class="action-tile" href="/${locale}/app/phones/${encodeURIComponent(activePhone.internalName)}"><strong>${escapeHtml(labels.openPhone)}</strong><span class="small-muted">${escapeHtml(labels.enterH5)}</span></a>
                  <a class="action-tile" href="/${locale}/app/renew"><strong>${escapeHtml(labels.renewTitle)}</strong><span class="small-muted">${escapeHtml(labels.extendAccess)}</span></a>
                  <a class="action-tile" href="/${locale}/app/support"><strong>${escapeHtml(labels.contactSupport)}</strong><span class="small-muted">${escapeHtml(labels.submitIssue)}</span></a>
                </div>
              </div>
              <div class="mini-phone">
                <div class="mini-phone-top"><span>9:41</span><span>Cloud</span></div>
                <div class="mini-app-grid"><span>APP</span><span>WEB</span><span>VIEW</span><span>CPU</span><span>FPS</span><span>NET</span></div>
                <div class="small-muted">Remote Android · Online</div>
              </div>
            </div>
          </div>

          <aside class="control-card">
            <div class="control-card-inner" style="grid-template-columns:1fr">
              <div><span class="badge blue">${escapeHtml(labels.secureFlow)}</span><h2 class="panel-title">${escapeHtml(labels.beforeOpen)}</h2></div>
              <div class="token-flow">
                <div class="token-step"><div class="token-step-number">1</div><div><strong>${escapeHtml(labels.loginState)}</strong><span>${escapeHtml(labels.ownerAccount)}</span></div></div>
                <div class="token-step"><div class="token-step-number">2</div><div><strong>${escapeHtml(labels.padOwner)}</strong><span>${escapeHtml(labels.ownPhoneOnly)}</span></div></div>
                <div class="token-step"><div class="token-step-number">3</div><div><strong>${escapeHtml(labels.riskCheck)}</strong><span>${escapeHtml(labels.riskBlocked)}</span></div></div>
                <div class="token-step"><div class="token-step-number">4</div><div><strong>${escapeHtml(labels.tempToken)}</strong><span>${escapeHtml(labels.tokenRequest)}</span></div></div>
              </div>
            </div>
          </aside>
        </section>`;
  }

  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(dashboard.title)} | ${escapeHtml(dictionary.meta.product)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="page-shell">
    <header class="site-header">
      <div class="nav-wrap">
        <a class="brand" href="/${locale}/app">
          <span class="brand-mark">OY</span>
          <span class="brand-text">${escapeHtml(dictionary.meta.product)}</span>
        </a>
        <nav class="nav-links">
          <a class="nav-link" href="/${locale}">${escapeHtml(dictionary.nav.home)}</a>
          <a class="secondary-button" href="/${locale}/login">${escapeHtml(dictionary.nav.login)}</a>
          ${localeSwitcher(locale, `app${route ? `/${route}` : ""}`)}
        </nav>
      </div>
    </header>
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-title">${escapeHtml(dashboard.title)}</div>
        <nav class="side-nav">
          ${dashboard.menu.map((item, index) => `<a class="side-link ${route === appRoutes[index] ? "active" : ""}" href="${appPath(index)}"><span>${escapeHtml(item)}</span></a>`).join("")}
        </nav>
      </aside>
      <main class="app-main">
        <div class="app-topbar">
          <div>
            <span class="badge blue">云手机网页接入</span>
            <h1>${escapeHtml(dashboard.title)}</h1>
            <p class="small-muted">${escapeHtml(dashboard.subtitle)} · ${escapeHtml(labels.secureProxy)}</p>
          </div>
          <a class="primary-button" href="/${locale}/app/phones/${encodeURIComponent(activePhone.internalName)}">${escapeHtml(labels.openPhone)}</a>
        </div>
        ${appContent()}
      </main>
    </div>
  </div>
</body>
</html>`;
}

function renderPhoneView(locale, dictionary, css) {
  const labels = {
    back: tr(locale, "返回我的后台", "マイページに戻る", "Back to Dashboard"),
    contact: tr(locale, "联系客服", "サポートに連絡", "Contact Support"),
    cloudPhone: tr(locale, "云手机", "クラウドスマホ", "Cloud Phone"),
    expires: tr(locale, "到期", "有効期限", "Expires"),
    disconnect: tr(locale, "断开连接", "切断", "Disconnect"),
    reconnect: tr(locale, "重新连接", "再接続", "Reconnect"),
    rotate: tr(locale, "横屏/竖屏", "横向き/縦向き", "Rotate"),
    fullscreen: tr(locale, "全屏", "全画面", "Fullscreen"),
    viewTitle: tr(locale, "云手机画面区域", "クラウドスマホ画面エリア", "Cloud Phone View Area"),
    viewDesc: tr(locale, "正式接入时，这里由后端申请临时授权，然后初始化云手机画面。", "正式接続時は、バックエンドが一時認証を取得してクラウドスマホ画面を初期化します。", "In production, the backend requests temporary access and initializes the cloud phone view.")
  };
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>JP-001 | ${escapeHtml(dictionary.meta.product)}</title>
  <style>${css}</style>
  <style>
    .phone-stage{min-height:calc(100vh - 68px);display:grid;grid-template-rows:auto 1fr;background:#03070a}
    .phone-controlbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-bottom:1px solid var(--line);background:rgba(5,10,14,.92)}
    .h5-view{display:grid;place-items:center;margin:18px;border:1px solid rgba(125,253,234,.28);border-radius:8px;background:radial-gradient(circle at 50% 30%,rgba(37,224,196,.16),transparent 34%),#071116;box-shadow:var(--shadow);position:relative;overflow:hidden}
    .h5-view:before{content:"Cloud Phone Web View";position:absolute;top:16px;left:16px;color:var(--accent-strong);font-size:13px}
    .h5-phone{width:min(360px,76vw);aspect-ratio:9/16;border:10px solid #020405;border-radius:28px;background:linear-gradient(180deg,#0b2428,#071015);display:grid;place-items:center;color:var(--accent-strong);text-align:center;padding:24px}
  </style>
</head>
<body>
  <div class="page-shell">
    <header class="site-header">
      <div class="nav-wrap">
        <a class="brand" href="/${locale}/app"><span class="brand-mark">OY</span><span class="brand-text">${escapeHtml(dictionary.dashboard.cloudPhones)}</span></a>
        <nav class="nav-links">
          <a class="secondary-button" href="/${locale}/app">${escapeHtml(labels.back)}</a>
          <a class="secondary-button" href="/${locale}/app/support">${escapeHtml(labels.contact)}</a>
          ${localeSwitcher(locale, "app/phones/JP-001")}
        </nav>
      </div>
    </header>
    <main class="phone-stage">
      <div class="phone-controlbar">
        <div>
          <strong>JP-001 ${escapeHtml(labels.cloudPhone)}</strong>
          <span class="small-muted"> ${escapeHtml(labels.expires)}: 2026-06-05 23:59</span>
        </div>
        <div class="button-row" style="margin-top:0">
          <button class="secondary-button" type="button">${escapeHtml(labels.disconnect)}</button>
          <button class="secondary-button" type="button">${escapeHtml(labels.reconnect)}</button>
          <button class="secondary-button" type="button">${escapeHtml(labels.rotate)}</button>
          <button class="primary-button" type="button">${escapeHtml(labels.fullscreen)}</button>
        </div>
      </div>
      <section class="h5-view">
        <div class="h5-phone">
          <div>
            <h2>${escapeHtml(labels.viewTitle)}</h2>
            <p class="small-muted">${escapeHtml(labels.viewDesc)}</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</body>
</html>`;
}

function renderContact(locale, dictionary, css) {
  const labels = {
    title: tr(locale, "联系我们", "お問い合わせ", "Contact Us"),
    desc: tr(locale, "有套餐、开通、续费或云手机使用问题，可以先提交信息，我们会尽快回复。", "プラン、開通、更新、クラウドスマホの利用についてのご相談はこちらから送信できます。できるだけ早く返信します。", "Send us questions about plans, activation, renewal, or cloud phone usage."),
    email: tr(locale, "邮箱", "メールアドレス", "Email"),
    issue: tr(locale, "问题说明", "お問い合わせ内容", "Message"),
    send: tr(locale, "发送", "送信", "Send")
  };
  return `<!doctype html>
<html lang="${locale}">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(dictionary.nav.contact)} | ${escapeHtml(dictionary.meta.product)}</title><style>${css}</style></head>
<body>
  <div class="page-shell">
    <header class="site-header"><div class="nav-wrap"><a class="brand" href="/${locale}"><span class="brand-mark">OY</span><span class="brand-text">${escapeHtml(dictionary.meta.product)}</span></a><nav class="nav-links"><a class="nav-link" href="/${locale}">${escapeHtml(dictionary.nav.home)}</a><a class="secondary-button" href="/${locale}/login">${escapeHtml(dictionary.nav.login)}</a><a class="primary-button" href="/${locale}/register">${escapeHtml(dictionary.nav.register)}</a>${localeSwitcher(locale, "contact")}</nav></div></header>
    <section class="auth-page">
      <div class="auth-card">
        <span class="badge blue">${escapeHtml(dictionary.nav.contact)}</span>
        <h1>${escapeHtml(labels.title)}</h1>
        <p class="small-muted">${escapeHtml(labels.desc)}</p>
        <form class="form-stack">
          <div class="field"><label>${escapeHtml(labels.email)}</label><input type="email" /></div>
          <div class="field"><label>${escapeHtml(labels.issue)}</label><textarea></textarea></div>
          <button class="primary-button" type="button">${escapeHtml(labels.send)}</button>
        </form>
      </div>
    </section>
  </div>
</body></html>`;
}

function renderAdmin(locale, dictionary, css, route = "") {
  const admin = dictionary.admin;
  const adminRoutes = ["", "users", "orders", "plans", "phones", "assignments", "support", "settings/vmos", "logs"];
  const labels = {
    order: tr(locale, "订单编号", "注文番号", "Order"),
    user: tr(locale, "用户邮箱", "ユーザーメール", "User"),
    plan: tr(locale, "套餐", "プラン", "Plan"),
    amount: tr(locale, "金额", "金額", "Amount"),
    status: tr(locale, "状态", "状態", "Status"),
    passwordStatus: tr(locale, "密码状态", "パスワード状態", "Password Status"),
    passwordAction: tr(locale, "密码操作", "パスワード操作", "Password Action"),
    createdAt: tr(locale, "注册时间", "登録日時", "Registered At"),
    lastLoginAt: tr(locale, "最后登录时间", "最終ログイン", "Last Login"),
    lastLoginIp: tr(locale, "最后登录 IP", "最終ログインIP", "Last Login IP"),
    device: tr(locale, "设备名称", "端末名", "Device"),
    provider: tr(locale, "供应商", "提供元", "Provider"),
    padCode: tr(locale, "供应商设备编号", "提供元端末番号", "Provider Device Code"),
    vmosExpire: tr(locale, "供应商到期时间", "提供元有効期限", "Provider Expires"),
    userExpire: tr(locale, "用户到期时间", "ユーザー有効期限", "User Expires"),
    region: tr(locale, "地区", "地域", "Region"),
    expires: tr(locale, "到期时间", "有効期限", "Expires"),
    role: tr(locale, "角色", "権限", "Role"),
    language: tr(locale, "语言", "言語", "Language"),
    action: tr(locale, "操作", "操作", "Action"),
    note: tr(locale, "备注", "メモ", "Note"),
    email: tr(locale, "邮箱", "メール", "Email"),
    name: tr(locale, "姓名", "名前", "Name"),
    internalName: tr(locale, "内部编号", "内部番号", "Internal ID"),
    assignmentId: tr(locale, "分配编号", "割り当て番号", "Assignment ID"),
    ticketId: tr(locale, "工单编号", "チケット番号", "Ticket ID"),
    ticketTitle: tr(locale, "问题标题", "件名", "Subject"),
    updatedAt: tr(locale, "更新时间", "更新日時", "Updated At"),
    time: tr(locale, "时间", "日時", "Time"),
    result: tr(locale, "结果", "結果", "Result"),
    activeOn: tr(locale, "已上架", "公開中", "Active"),
    activeOff: tr(locale, "已下架", "非公開", "Inactive"),
    editPlan: tr(locale, "编辑套餐", "プラン編集", "Edit Plan"),
    newPlan: tr(locale, "新增套餐", "プラン追加", "New Plan"),
    savePlan: tr(locale, "保存套餐", "プランを保存", "Save Plan"),
    back: tr(locale, "返回", "戻る", "Back"),
    on: tr(locale, "上架", "公開", "Publish"),
    off: tr(locale, "下架", "非公開", "Unpublish"),
    resetPassword: tr(locale, "重置密码", "パスワード再設定", "Reset Password")
  };
  const statuses = {
    paid: valueText(locale, "已付款"),
    pending: valueText(locale, "待付款"),
    fulfilled: valueText(locale, "已开通"),
    assigned: valueText(locale, "已分配"),
    available: valueText(locale, "空闲"),
    active: valueText(locale, "正常"),
    open: valueText(locale, "待回复"),
    replied: valueText(locale, "已回复")
  };
  const ui = {
    standaloneQuote: tr(locale, "单独报价", "個別見積もり", "Custom quote"),
    usersDesc: tr(locale, "查看用户语言、角色、登录记录和账号状态。客户忘记密码时，请点“重置密码”，不要查看旧密码。", "ユーザーの言語、権限、ログイン履歴、アカウント状態を確認します。パスワードを忘れた場合は「パスワード再設定」を使い、旧パスワードは表示しません。", "View user language, role, login records, and account status. Use reset password instead of viewing old passwords."),
    exportUsers: tr(locale, "导出用户", "ユーザーをエクスポート", "Export Users"),
    passwordWhy: tr(locale, "为什么不显示原始密码？", "なぜ元のパスワードを表示しないのですか？", "Why are original passwords hidden?"),
    passwordDesc: tr(locale, "正式系统必须把用户密码加密保存。后台看不到原始密码才安全；客户忘记密码时，由运营者发送重置链接或设置临时密码，并记录操作日志。", "正式システムではパスワードを暗号化保存します。管理画面で元のパスワードが見えない状態が安全です。忘れた場合は運営者が再設定リンクまたは一時パスワードを発行し、操作ログを残します。", "Passwords are encrypted in production. Operators should send reset links or temporary passwords and keep audit logs."),
    ordersDesc: tr(locale, "查看付款状态、套餐和开通进度。支付回调成功后订单会变成已付款。", "支払い状態、プラン、開通状況を確認します。決済コールバック成功後、注文は支払い済みになります。", "View payment status, plan, and fulfillment progress."),
    filterOrders: tr(locale, "筛选订单", "注文を絞り込む", "Filter Orders"),
    plansDesc: tr(locale, "套餐现在可以新增、编辑和上下架。这里是预览内存数据，正式版会保存到 PostgreSQL。", "プランは追加、編集、公開/非公開の切り替えができます。ここはプレビュー用の一時データで、正式版ではPostgreSQLに保存します。", "Plans can be created, edited, published, and unpublished. Preview data is in memory; production saves to PostgreSQL."),
    planFormDesc: tr(locale, "填写套餐名称、价格、周期和说明。保存后会返回套餐列表。", "プラン名、価格、期間、説明を入力します。保存後はプラン一覧に戻ります。", "Enter plan name, price, period, and description."),
    code: tr(locale, "套餐代码", "プランコード", "Plan Code"),
    planName: tr(locale, "套餐名称", "プラン名", "Plan Name"),
    price: tr(locale, "价格", "価格", "Price"),
    period: tr(locale, "周期", "期間", "Period"),
    badge: tr(locale, "角标", "ラベル", "Badge"),
    desc: tr(locale, "说明", "説明", "Description"),
    phonesDesc: tr(locale, "手动导入你在上游云手机供应商购买到的设备编号。客户不能看到 AK/SK 或供应商信息，只能通过你的后台打开自己绑定的手机。", "上流クラウドスマホ提供元で購入した端末番号を手動で登録します。お客様にAK/SKや提供元情報は表示されず、自分に割り当てられた端末だけを開けます。", "Manually import provider device codes. Customers cannot see AK/SK or provider details and can only open their assigned phone."),
    vmosExpires: tr(locale, "供应商到期时间", "提供元有効期限", "Provider Expires"),
    assignmentsDesc: tr(locale, "把已付款订单和空闲供应商设备编号绑定。绑定后客户才能在我的后台打开对应云手机。", "支払い済み注文と空き提供元端末番号を紐づけます。紐づけ後、お客様はマイページから対象クラウドスマホを開けます。", "Bind a paid order to an available provider device code so the user can open the assigned phone."),
    chooseUser: tr(locale, "选择用户", "ユーザーを選択", "Choose User"),
    choosePad: tr(locale, "选择空闲供应商设备", "空き提供元端末を選択", "Choose Available Provider Device"),
    supportDesc: tr(locale, "查看客户问题、回复工单，并保留沟通记录。回复后客户个人中心会同步显示。", "お客様の問い合わせを確認し、返信して、対応履歴を残します。返信後はマイページにも表示されます。", "View and reply to customer tickets; replies appear in the user dashboard."),
    closeTicket: tr(locale, "关闭工单", "チケットを閉じる", "Close Ticket"),
    repliedPrefix: tr(locale, "已回复：", "返信済み：", "Replied: "),
    noReply: tr(locale, "还没有回复客户。", "まだお客様へ返信していません。", "No reply yet."),
    replyContent: tr(locale, "回复内容", "返信内容", "Reply"),
    replyPlaceholder: tr(locale, "输入给客户看的回复", "お客様に表示する返信を入力", "Enter the reply shown to the customer"),
    settingsDesc: tr(locale, "这些是运营者专用配置。AccessKey / SecretKey 必须加密保存，不能出现在客户前端。", "これは運営者専用設定です。AccessKey / SecretKeyは暗号化保存し、お客様側の画面には表示しません。", "Operator-only settings. AccessKey / SecretKey must be encrypted and never shown to the customer frontend."),
    adminOnly: tr(locale, "仅管理员可见", "管理者のみ表示", "Admin only"),
    apiBase: tr(locale, "API Base URL（接口基础地址）", "API Base URL（API基本URL）", "API Base URL"),
    h5Base: tr(locale, "网页连接 baseUrl", "Web接続 baseUrl", "Web access baseUrl"),
    akLabel: tr(locale, "AccessKey / AK（留空表示不修改）", "AccessKey / AK（空欄なら変更なし）", "AccessKey / AK (leave blank to keep)"),
    skLabel: tr(locale, "SecretKey / SK（留空表示不修改）", "SecretKey / SK（空欄なら変更なし）", "SecretKey / SK (leave blank to keep)"),
    defaultQuality: tr(locale, "默认清晰度", "標準画質", "Default Quality"),
    bitrate: tr(locale, "默认码率", "標準ビットレート", "Default Bitrate"),
    fps: tr(locale, "默认帧率", "標準フレームレート", "Default FPS"),
    rateLimit: tr(locale, "限流策略", "レート制限", "Rate Limit"),
    saveSettings: tr(locale, "保存设置", "設定を保存", "Save Settings"),
    viewLogs: tr(locale, "查看 API 日志", "APIログを見る", "View API Logs"),
    akStatus: tr(locale, "AK 状态", "AK状態", "AK Status"),
    skStatus: tr(locale, "SK 状态", "SK状態", "SK Status"),
    logsDesc: tr(locale, "记录谁打开了哪台手机、供应商 API 是否成功、失败原因和管理员操作。", "誰がどの端末を開いたか、提供元APIの成功/失敗、失敗理由、管理者操作を記録します。", "Record phone access, provider API results, failures, and admin operations."),
    exportLogs: tr(locale, "导出日志", "ログをエクスポート", "Export Logs"),
    tokenAction: tr(locale, "申请临时 Token", "一時Token申請", "Request temporary token"),
    success: tr(locale, "成功", "成功", "Success"),
    openPhone: tr(locale, "打开云手机", "クラウドスマホを開く", "Open cloud phone"),
    assignPad: tr(locale, "分配供应商设备", "提供元端末を割り当て", "Assign Provider Device"),
    safetyTitle: tr(locale, "供应商 API 安全中转", "提供元API安全中継", "Provider API Secure Proxy"),
    safetyDesc: tr(locale, "客户浏览器只请求你的服务器。你的服务器检查登录、归属、付款、到期、禁用状态后，再向上游供应商申请临时网页连接授权。", "お客様のブラウザは自社サーバーだけにリクエストします。サーバー側でログイン、割り当て、支払い、有効期限、停止状態を確認してから上流提供元へ一時Web接続認証を申請します。", "Customer browsers call your server only; your server checks permissions before requesting temporary web access from the upstream provider."),
    reserved: tr(locale, "已预留", "実装枠あり", "Reserved")
  };
  const adminPlans = previewState.plans.map((plan) => localizedPlan(locale, dictionary, plan));
  const adminPhones = previewState.phones.map((phone) => localizedPhone(locale, phone));
  const adminUsers = previewState.users.map((user) => localizedUser(locale, user));
  const adminTickets = previewState.supportTickets.map((ticket) => localizedTicket(locale, ticket));
  const orderRows = [
    ["ORD-20260505-003", "tanaka@example.jp", dictionary.pricing.plans[1].label, dictionary.pricing.plans[1].price, statuses.paid],
    ["ORD-20260505-002", "li@example.com", dictionary.pricing.plans[0].label, dictionary.pricing.plans[0].price, statuses.pending],
    ["ORD-20260504-008", "ops@example.com", dictionary.pricing.plans[2].label, ui.standaloneQuote, statuses.fulfilled]
  ];
  const inventoryRows = adminPhones.map((phone) => [
    phone.internalName,
    phone.padCode,
    phone.region,
    phone.status,
    phone.user,
    phone.userExpire,
    phone.vmosExpire
  ]);
  const userRows = adminUsers.map((user) => [
    user.email,
    user.name,
    user.language,
    user.role,
    user.status,
    user.passwordStatus,
    user.createdAt,
    user.lastLoginAt,
    user.lastLoginIp,
    labels.resetPassword
  ]);
  const ticketRows = adminTickets.map((ticket) => [
    ticket.id,
    ticket.user,
    ticket.title,
    ticket.status,
    ticket.updated
  ]);

  function table(columns, rows, statusIndex = -1) {
    const template = `repeat(${columns.length}, minmax(130px, 1fr))`;
    return `<div class="table-card">
      <div class="table-head" style="grid-template-columns:${template};min-width:${columns.length * 150}px">${columns.map((column) => `<span>${escapeHtml(column)}</span>`).join("")}</div>
      ${rows.map((row) => `<div class="table-row" style="grid-template-columns:${template};min-width:${columns.length * 150}px">${row.map((cell, index) => `<div>${index === statusIndex ? `<span class="badge ${String(cell).includes("待") || String(cell).includes("未") || String(cell).includes("pending") || String(cell).includes("Open") ? "amber" : ""}">${escapeHtml(cell)}</span>` : cell === labels.resetPassword ? `<button class="secondary-button" type="button">${escapeHtml(labels.resetPassword)}</button>` : escapeHtml(cell)}</div>`).join("")}</div>`).join("")}
    </div>`;
  }

  function adminContent() {
    if (route === "users") {
      return `<section>
        <div class="section-heading">
          <div>
            <h2>${escapeHtml(admin.tables.users)}</h2>
            <p>${escapeHtml(ui.usersDesc)}</p>
          </div>
          <button class="secondary-button" type="button">${escapeHtml(ui.exportUsers)}</button>
        </div>
        <div class="notice-card" style="margin-bottom:18px">
          <h2 class="panel-title">${escapeHtml(ui.passwordWhy)}</h2>
          <p>${escapeHtml(ui.passwordDesc)}</p>
        </div>
        ${table([labels.email, labels.name, labels.language, labels.role, labels.status, labels.passwordStatus, labels.createdAt, labels.lastLoginAt, labels.lastLoginIp, labels.passwordAction], userRows, 4)}
      </section>`;
    }
    if (route === "orders") {
      return `<section><div class="section-heading"><div><h2>${escapeHtml(admin.tables.latestOrders)}</h2><p>${escapeHtml(ui.ordersDesc)}</p></div><button class="secondary-button" type="button">${escapeHtml(ui.filterOrders)}</button></div>${table([labels.order, labels.user, labels.plan, labels.amount, labels.status], orderRows, 4)}</section>`;
    }
    if (route === "plans") {
      return `<section>
        <div class="section-heading">
          <div>
            <h2>${escapeHtml(admin.tables.plans)}</h2>
            <p>${escapeHtml(ui.plansDesc)}</p>
          </div>
          <a class="primary-button" href="/${locale}/admin/plans/new">${escapeHtml(admin.actions.addPlan)}</a>
        </div>
        <div class="grid-3">${adminPlans.map((plan) => `<article class="plan-card">
          <span class="badge ${plan.active ? "" : "danger"}">${escapeHtml(plan.active ? labels.activeOn : labels.activeOff)}</span>
          <h3>${escapeHtml(plan.label)}</h3>
          <div class="plan-price"><strong>${escapeHtml(plan.price)}</strong><span class="small-muted">/ ${escapeHtml(plan.period)}</span></div>
          <p>${escapeHtml(plan.description)}</p>
          <div class="button-row">
            <a class="secondary-button" href="/${locale}/admin/plans/edit/${encodeURIComponent(plan.code)}">${escapeHtml(labels.editPlan)}</a>
            <form method="get" action="/${locale}/admin/plans/toggle" style="margin:0">
              <input type="hidden" name="code" value="${escapeHtml(plan.code)}" />
              <button class="${plan.active ? "secondary-button" : "primary-button"}" type="submit">${escapeHtml(plan.active ? labels.off : labels.on)}</button>
            </form>
          </div>
        </article>`).join("")}</div>
      </section>`;
    }
    if (route === "plans/new" || route.startsWith("plans/edit/")) {
      const code = route.split("/").slice(2).join("/");
      const rawPlan = previewState.plans.find((item) => item.code === decodeURIComponent(code)) ?? {
        code: "",
        label: "",
        price: "",
        period: "",
        badge: "",
        description: "",
        active: true
      };
      const plan = localizedPlan(locale, dictionary, rawPlan);
      const isEdit = route.startsWith("plans/edit/");
      return `<section>
        <div class="section-heading"><div><h2>${escapeHtml(isEdit ? labels.editPlan : labels.newPlan)}</h2><p>${escapeHtml(ui.planFormDesc)}</p></div></div>
        <form class="support-card form-stack" method="get" action="/${locale}/admin/plans/${isEdit ? "update" : "create"}">
          <div class="grid-2">
            <div class="field"><label>${escapeHtml(ui.code)}</label><input name="code" value="${escapeHtml(plan.code)}" ${isEdit ? "readonly" : ""} required /></div>
            <div class="field"><label>${escapeHtml(ui.planName)}</label><input name="label" value="${escapeHtml(plan.label)}" required /></div>
            <div class="field"><label>${escapeHtml(ui.price)}</label><input name="price" value="${escapeHtml(plan.price)}" required /></div>
            <div class="field"><label>${escapeHtml(ui.period)}</label><input name="period" value="${escapeHtml(plan.period)}" required /></div>
            <div class="field"><label>${escapeHtml(ui.badge)}</label><input name="badge" value="${escapeHtml(plan.badge)}" /></div>
            <div class="field"><label>${escapeHtml(labels.status)}</label><select name="active"><option value="true" ${plan.active ? "selected" : ""}>${escapeHtml(labels.on)}</option><option value="false" ${!plan.active ? "selected" : ""}>${escapeHtml(labels.off)}</option></select></div>
          </div>
          <div class="field"><label>${escapeHtml(ui.desc)}</label><textarea name="description">${escapeHtml(plan.description)}</textarea></div>
          <div class="button-row"><button class="primary-button" type="submit">${escapeHtml(labels.savePlan)}</button><a class="secondary-button" href="/${locale}/admin/plans">${escapeHtml(labels.back)}</a></div>
        </form>
      </section>`;
    }
    if (route === "phones" || route === "cloud-phones") {
      return `<section>
        <div class="section-heading"><div><h2>${escapeHtml(admin.tables.inventory)}</h2><p>${escapeHtml(ui.phonesDesc)}</p></div></div>
        <form class="support-card form-stack" method="get" action="/${locale}/admin/phones/create" style="margin-bottom:18px">
          <div class="grid-3">
            <div class="field"><label>${escapeHtml(labels.internalName)}</label><input name="internalName" placeholder="JP-004" required /></div>
            <div class="field"><label>${escapeHtml(labels.padCode)}</label><input name="padCode" placeholder="PAD-JP-004" required /></div>
            <div class="field"><label>${escapeHtml(labels.region)}</label><input name="region" placeholder="${escapeHtml(valueText(locale, "日本"))}" required /></div>
            <div class="field"><label>${escapeHtml(ui.vmosExpires)}</label><input name="vmosExpire" placeholder="2026-06-30" required /></div>
            <div class="field"><label>${escapeHtml(labels.note)}</label><input name="notes" placeholder="${escapeHtml(valueText(locale, "备用库存"))}" /></div>
          </div>
          <button class="primary-button" type="submit">${escapeHtml(admin.actions.addDevice)}</button>
        </form>
        ${table([labels.internalName, labels.padCode, labels.region, labels.status, labels.user, labels.userExpire, labels.vmosExpire], inventoryRows, 3)}
      </section>`;
    }
    if (route === "assignments") {
      return `<section>
        <div class="section-heading"><div><h2>${escapeHtml(admin.tables.assignments)}</h2><p>${escapeHtml(ui.assignmentsDesc)}</p></div></div>
        <form class="support-card form-stack" method="get" action="/${locale}/admin/assignments/create" style="margin-bottom:18px">
          <div class="grid-3">
            <div class="field"><label>${escapeHtml(ui.chooseUser)}</label><select name="user">${previewState.users.filter((user) => user.role !== "管理员").map((user) => `<option value="${escapeHtml(user.email)}">${escapeHtml(user.email)}</option>`).join("")}</select></div>
            <div class="field"><label>${escapeHtml(ui.choosePad)}</label><select name="padCode">${previewState.phones.filter((phone) => phone.status === "空闲").map((phone) => `<option value="${escapeHtml(phone.padCode)}">${escapeHtml(phone.internalName)} / ${escapeHtml(phone.padCode)}</option>`).join("")}</select></div>
            <div class="field"><label>${escapeHtml(labels.order)}</label><input name="order" value="ORD-20260505-NEW" required /></div>
            <div class="field"><label>${escapeHtml(labels.userExpire)}</label><input name="userExpire" value="2026-06-05" required /></div>
          </div>
          <button class="primary-button" type="submit">${escapeHtml(admin.actions.assign)}</button>
        </form>
        ${table([labels.assignmentId, labels.user, labels.internalName, labels.padCode, labels.order, labels.userExpire], previewState.assignments.map((item) => [item.id, item.user, item.internalName, item.padCode, item.order, item.userExpire]))}
      </section>`;
    }
    if (route === "support") {
      return `<section>
        <div class="section-heading"><div><h2>${escapeHtml(admin.tables.tickets)}</h2><p>${escapeHtml(ui.supportDesc)}</p></div></div>
        ${table([labels.ticketId, labels.user, labels.ticketTitle, labels.status, labels.updatedAt], ticketRows, 3)}
        <div class="ticket-stack" style="margin-top:18px">
          ${adminTickets.map((ticket) => `<article class="support-card">
            <div class="device-title-row">
              <div>
                <span class="badge ${ticket.status === valueText(locale, "待回复") ? "amber" : ticket.status === valueText(locale, "已关闭") ? "danger" : ""}">${escapeHtml(ticket.status)}</span>
                <h2 class="panel-title">${escapeHtml(ticket.title)}</h2>
                <p class="small-muted">${escapeHtml(ticket.id)} · ${escapeHtml(ticket.user)} · ${escapeHtml(ticket.updated)}</p>
              </div>
              <form method="get" action="/${locale}/admin/support/close" style="margin:0">
                <input type="hidden" name="id" value="${escapeHtml(ticket.id)}" />
                <button class="secondary-button" type="submit">${escapeHtml(ui.closeTicket)}</button>
              </form>
            </div>
            <p>${escapeHtml(ticket.message)}</p>
            ${ticket.adminReply ? `<p class="small-muted">${escapeHtml(ui.repliedPrefix)}${escapeHtml(ticket.adminReply)}</p>` : `<p class="small-muted">${escapeHtml(ui.noReply)}</p>`}
            <form class="form-stack" method="get" action="/${locale}/admin/support/reply">
              <input type="hidden" name="id" value="${escapeHtml(ticket.id)}" />
              <div class="field"><label>${escapeHtml(ui.replyContent)}</label><textarea name="reply" placeholder="${escapeHtml(ui.replyPlaceholder)}">${escapeHtml(ticket.adminReply)}</textarea></div>
              <button class="primary-button" type="submit">${escapeHtml(admin.actions.reply)}</button>
            </form>
          </article>`).join("")}
        </div>
      </section>`;
    }
    if (route === "settings/vmos") {
      const settings = localizedSettings(locale, previewState.vmosSettings);
      return `<section>
        <div class="section-heading">
          <div>
            <h2>${escapeHtml(admin.tables.vmosSettings || tr(locale, "供应商 API 设置", "提供元API設定", "Provider API Settings"))}</h2>
            <p>${escapeHtml(ui.settingsDesc)}</p>
          </div>
          <span class="badge blue">${escapeHtml(ui.adminOnly)}</span>
        </div>
        <form class="support-card form-stack" method="get" action="/${locale}/admin/settings/vmos/save">
          <div class="grid-2">
            <div class="field"><label>${escapeHtml(ui.apiBase)}</label><input name="apiBaseUrl" value="${escapeHtml(settings.apiBaseUrl)}" /></div>
            <div class="field"><label>${escapeHtml(ui.h5Base)}</label><input name="h5BaseUrl" value="${escapeHtml(settings.h5BaseUrl)}" /></div>
            <div class="field"><label>${escapeHtml(ui.akLabel)}</label><input name="accessKey" placeholder="${escapeHtml(settings.accessKeyStatus)}" /></div>
            <div class="field"><label>${escapeHtml(ui.skLabel)}</label><input name="secretKey" placeholder="${escapeHtml(settings.secretKeyStatus)}" /></div>
            <div class="field"><label>${escapeHtml(ui.defaultQuality)}</label><select name="quality"><option ${settings.quality === valueText(locale, "流畅") ? "selected" : ""}>${escapeHtml(valueText(locale, "流畅"))}</option><option ${settings.quality === valueText(locale, "高清") ? "selected" : ""}>${escapeHtml(valueText(locale, "高清"))}</option><option ${settings.quality === valueText(locale, "超清") ? "selected" : ""}>${escapeHtml(valueText(locale, "超清"))}</option></select></div>
            <div class="field"><label>${escapeHtml(ui.bitrate)}</label><input name="bitrate" value="${escapeHtml(settings.bitrate)}" /></div>
            <div class="field"><label>${escapeHtml(ui.fps)}</label><input name="fps" value="${escapeHtml(settings.fps)}" /></div>
            <div class="field"><label>${escapeHtml(ui.rateLimit)}</label><input name="rateLimit" value="${escapeHtml(settings.rateLimit)}" /></div>
          </div>
          <div class="button-row">
            <button class="primary-button" type="submit">${escapeHtml(ui.saveSettings)}</button>
            <a class="secondary-button" href="/${locale}/admin/logs">${escapeHtml(ui.viewLogs)}</a>
          </div>
        </form>
        <div class="grid-2" style="margin-top:18px">
          <div class="settings-row"><span class="table-meta">${escapeHtml(ui.akStatus)}</span><h3>${escapeHtml(settings.accessKeyStatus)}</h3></div>
          <div class="settings-row"><span class="table-meta">${escapeHtml(ui.skStatus)}</span><h3>${escapeHtml(settings.secretKeyStatus)}</h3></div>
        </div>
      </section>`;
    }
    if (route === "logs") {
      return `<section><div class="section-heading"><div><h2>${escapeHtml(admin.tables.logs || tr(locale, "操作日志", "操作ログ", "Operation Logs"))}</h2><p>${escapeHtml(ui.logsDesc)}</p></div><button class="secondary-button" type="button">${escapeHtml(ui.exportLogs)}</button></div>${table([labels.time, labels.user, labels.internalName, labels.padCode, labels.action, labels.result, labels.note], [["2026-05-05 11:20", "tanaka@example.jp", "JP-001", "PAD-JP-001", ui.tokenAction, ui.success, ui.openPhone], ["2026-05-05 11:18", valueText(locale, "运营者"), "JP-001", "PAD-JP-001", ui.assignPad, ui.success, `${labels.order} ORD-20260505-003`]])}</section>`;
    }
    return `<div class="metric-row">
          ${admin.metrics.map((metric) => `<div class="metric-card"><span>${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value)}</strong></div>`).join("")}
        </div>
        <div class="dashboard-grid">
          <section>
            <div class="section-heading"><div><h2>${escapeHtml(admin.tables.latestOrders)}</h2></div></div>
            ${table([labels.order, labels.user, labels.plan, labels.amount, labels.status], orderRows, 4)}
          </section>
          <section>
            <div class="section-heading"><div><h2>${escapeHtml(admin.tables.inventory)}</h2></div></div>
            ${table([labels.internalName, labels.padCode, labels.region, labels.status, labels.user, labels.userExpire, labels.vmosExpire], inventoryRows, 3)}
          </section>
        </div>
        <section class="support-card" style="margin-top:18px">
          <div class="section-heading">
            <div>
              <h2>${escapeHtml(ui.safetyTitle)}</h2>
              <p>${escapeHtml(ui.safetyDesc)}</p>
            </div>
            <span class="badge blue">${escapeHtml(ui.reserved)}</span>
          </div>
        </section>`;
  }

  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(admin.title)} | ${escapeHtml(dictionary.meta.product)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="page-shell">
    <header class="site-header">
      <div class="nav-wrap">
        <a class="brand" href="/${locale}/admin">
          <span class="brand-mark">OY</span>
          <span class="brand-text">${escapeHtml(dictionary.meta.product)}</span>
        </a>
        <nav class="nav-links">
          <a class="nav-link" href="/${locale}">${escapeHtml(dictionary.nav.home)}</a>
          <a class="secondary-button" href="/${locale}/app">${escapeHtml(dictionary.nav.dashboard)}</a>
          ${localeSwitcher(locale, `admin${route ? `/${route}` : ""}`)}
        </nav>
      </div>
    </header>
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-title">${escapeHtml(admin.title)}</div>
        <nav class="side-nav">
          ${admin.menu.map((item, index) => `<a class="side-link ${route === adminRoutes[index] ? "active" : ""}" href="/${locale}/admin${adminRoutes[index] ? `/${adminRoutes[index]}` : ""}"><span>${escapeHtml(item)}</span></a>`).join("")}
        </nav>
      </aside>
      <main class="app-main">
        <div class="app-topbar">
          <div>
            <h1>${escapeHtml(admin.title)}</h1>
            <p class="small-muted">${escapeHtml(admin.subtitle)}</p>
          </div>
          <div class="button-row" style="margin-top:0">
            <button class="secondary-button" type="button">${escapeHtml(admin.actions.addDevice)}</button>
            <button class="primary-button" type="button">${escapeHtml(admin.actions.assign)}</button>
          </div>
        </div>
        ${adminContent()}
      </main>
    </div>
  </div>
</body>
</html>`;
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
    const segments = url.pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];
    const hasLocale = locales.includes(firstSegment);
    const locale = hasLocale ? firstSegment : firstSegment === "admin" ? "zh" : "ja";
    const route = hasLocale ? segments[1] || "home" : segments[0] || "home";
    const [css, dictionary] = await Promise.all([
      fs.readFile(path.join(root, "app", "globals.css"), "utf8"),
      readDictionary(locale)
    ]);

    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    if (route === "login" || route === "register") {
      response.end(renderAuth(locale, dictionary, css, route));
      return;
    }
    if (route === "contact") {
      response.end(renderContact(locale, dictionary, css));
      return;
    }
    if (route === "app" || route === "dashboard") {
      const appSegments = hasLocale ? segments.slice(2) : segments.slice(1);
      const appRoute = appSegments.join("/");
      const appSection = appSegments[0] || "";
      const phoneId = appSegments[1] || "";
      if (request.method === "GET" && ["support/create"].includes(appRoute)) {
        const handled = handleAppForm(response, locale, appRoute, url.searchParams);
        if (handled) {
          return;
        }
      }
      if (appSection === "phones" && phoneId) {
        response.end(renderPhoneView(locale, dictionary, css));
        return;
      }
      response.end(renderApp(locale, dictionary, css, appSection));
      return;
    }
    if (route === "admin") {
      const adminRoute = (hasLocale ? segments.slice(2) : segments.slice(1)).join("/");
      const adminActionRoutes = ["plans/create", "plans/update", "plans/toggle", "phones/create", "assignments/create", "support/reply", "support/close", "settings/vmos/save"];
      if (request.method === "GET" && adminActionRoutes.includes(adminRoute)) {
        const handled = handleAdminForm(response, locale, adminRoute, url.searchParams);
        if (handled) {
          return;
        }
      }
      if (request.method === "POST") {
        const handled = await handleAdminPost(request, response, locale, adminRoute);
        if (handled) {
          return;
        }
      }
      response.end(renderAdmin(locale, dictionary, css, adminRoute));
      return;
    }
    response.end(render(locale, dictionary, css));
  } catch (error) {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end(error?.stack || String(error));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Preview server running at http://127.0.0.1:${port}/zh`);
});
