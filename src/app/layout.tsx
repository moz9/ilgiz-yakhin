import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { GlassRuntime } from "@/components/glass/glass-runtime";
import { LightField } from "@/components/light-field";
import { themeScript } from "@/lib/theme";
import "./fonts.css";
import "../styles/liquid-glass.css";
import "../styles/liquid-glass-kit.css";
import "../styles/base.css";
import "../styles/chrome.css";
import "../styles/home.css";
import "../styles/pages.css";
import "../styles/case.css";
import "../styles/resume.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ilgiz-yakhin.vercel.app"),
  title: { default: "Ильгиз Яхин — Full-stack / AI-разработчик", template: "%s — Ильгиз Яхин" },
  description: "Портфолио Ильгиза Яхина: web-продукты, desktop- и Android-приложения, автоматизация и production-инфраструктура.",
  alternates: { canonical: "/" },
  openGraph: { title: "Ильгиз Яхин — Full-stack / AI-разработчик", description: "Web-продукты, Android- и desktop-приложения, автоматизация и инфраструктура.", type: "website", locale: "ru_RU", url: "/", siteName: "Ильгиз Яхин", images: [{ url: "/og-v2.jpg", width: 1200, height: 630, alt: "Ильгиз Яхин — Full-stack / AI-разработчик" }] },
  twitter: { card: "summary_large_image", title: "Ильгиз Яхин", description: "Full-stack / AI-разработчик", images: ["/og-v2.jpg"] },
};

export const viewport: Viewport = { themeColor: "#06070b", colorScheme: "dark light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-theme="dark" data-theme-pref="dark" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Applies the saved theme before the first paint, so a light choice never flashes dark. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <LightField />
        {/* The display face carries the headline, so it is fetched first and early. */}
        <link rel="preload" as="font" type="font/woff2" href="/fonts/unbounded-800-cyrillic.woff2" crossOrigin="anonymous" />
        <SiteNav />{children}<SiteFooter /><GlassRuntime />
      </body>
    </html>
  );
}
