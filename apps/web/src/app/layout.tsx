import type { ReactNode } from "react";
import "./globals.css";

import { AppFrame } from "@/components/app-frame";
import { DEFAULT_LOCALE } from "@/i18n/locale";
import { I18nProvider } from "@/i18n/provider";

export const metadata = {
  title: "Image Set Studio",
  description: "轻量级套图生成工作台"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={DEFAULT_LOCALE}>
      <body>
        <I18nProvider>
          <AppFrame>{children}</AppFrame>
        </I18nProvider>
      </body>
    </html>
  );
}
