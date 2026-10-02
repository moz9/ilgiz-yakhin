import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { RedesignDock } from "@/components/redesign-dock";
import "./globals.css";
import "./redesign.css";
import "./showcase.css";
import "./motion-glass.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ilgiz-yakhin.vercel.app"),
  title: { default: "ILGIZ YAKHIN — Full-stack / AI-разработчик", template: "%s — ILGIZ YAKHIN" },
  description: "Портфолио Ильгиза Яхина: full-stack разработка, внутренние инструменты, автоматизация и production-инфраструктура.",
  alternates: { canonical: "/" },
  openGraph: { title: "ILGIZ YAKHIN — Full-stack / AI-разработчик", description: "Web-продукты, Android- и desktop-приложения, автоматизация и инфраструктура.", type: "website", locale: "ru_RU", url: "/", siteName: "ILGIZ YAKHIN", images: [{ url: "/og-v2.jpg", width: 1200, height: 630, alt: "ILGIZ YAKHIN — Full-stack / AI-разработчик" }] },
  twitter: { card: "summary_large_image", title: "ILGIZ YAKHIN", description: "Full-stack / AI-разработчик", images: ["/og-v2.jpg"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning data-scroll-behavior="smooth">
      <body><SiteHeader />{children}<SiteFooter /><RedesignDock /></body>
    </html>
  );
}
