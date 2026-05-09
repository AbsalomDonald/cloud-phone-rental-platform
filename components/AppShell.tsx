"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  Headphones,
  Home,
  LayoutDashboard,
  Package,
  Smartphone,
  Users
} from "lucide-react";
import type { Locale } from "@/lib/locales";
import { uiText } from "@/lib/ui-text";

type AppShellProps = {
  basePath: "app" | "dashboard" | "admin";
  children: React.ReactNode;
  locale: Locale;
  menu: string[];
  title: string;
};

const iconSets = {
  app: [LayoutDashboard, Smartphone, ClipboardList, Package, Headphones],
  dashboard: [LayoutDashboard, Smartphone, ClipboardList, Headphones],
  admin: [Home, Users, ClipboardList, Package, Boxes, Smartphone, Headphones, Package, ClipboardList]
};

const routeSets = {
  app: ["", "/phones", "/orders", "/renew", "/support"],
  dashboard: ["", "/cloud-phones", "/orders", "/support"],
  admin: ["", "/users", "/orders", "/plans", "/phones", "/assignments", "/support", "/settings/vmos", "/logs"]
};

export function AppShell({ basePath, children, locale, menu, title }: AppShellProps) {
  const pathname = usePathname();
  const routes = routeSets[basePath];
  const icons = iconSets[basePath];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-title">
          <LayoutDashboard size={18} />
          {title}
        </div>
        <nav className="side-nav" aria-label={title}>
          {menu.map((label, index) => {
            const href = `/${locale}/${basePath}${routes[index]}`;
            const Icon = icons[index] ?? LayoutDashboard;
            const active = pathname === href;

            return (
              <Link className={`side-link ${active ? "active" : ""}`} href={href} key={label}>
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="app-main">{children}</main>
      <a className="preview-note" href={`/${locale}/logout`}>
        {uiText(locale, "退出登录", "ログアウト", "Logout")}
      </a>
    </div>
  );
}
