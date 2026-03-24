"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LOCALE_NATIVE_LABELS,
  SUPPORTED_LOCALES,
  type LocaleCode
} from "@/i18n/locale";
import { useI18n } from "@/i18n/use-i18n";

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
  const nav = [
    { label: t.header.nav.create, href: "/" },
    { label: t.header.nav.jobs, href: "/jobs" },
    { label: t.header.nav.settings, href: "/settings" }
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <strong style={{ fontSize: "1.2rem", letterSpacing: "-0.02em" }}>
            {t.header.productName}
          </strong>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 500 }}>
            {t.header.slogan}
          </div>
        </div>
        <div className="header-actions">
          <nav className="app-nav">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActivePath(pathname, item.href) ? "nav-link active" : "nav-link"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <label className="locale-switcher">
            <span>{t.common.languageLabel}</span>
            <select
              aria-label={t.common.localeSelectAria}
              value={locale}
              onChange={(event) => setLocale(event.target.value as LocaleCode)}
            >
              {SUPPORTED_LOCALES.map((code) => (
                <option key={code} value={code}>
                  {LOCALE_NATIVE_LABELS[code]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
