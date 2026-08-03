import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "ILGIZ YAKHIN — Full-stack / AI-разработчик", template: "%s — ILGIZ YAKHIN" },
  description: "Портфолио Ильгиза Яхина: full-stack разработка, внутренние инструменты, автоматизация и production-инфраструктура.",
  openGraph: { title: "ILGIZ YAKHIN — Full-stack / AI-разработчик", description: "Web-продукты, desktop-приложения, автоматизация и инфраструктура.", type: "website", locale: "ru_RU", images: [{ url: "https://raw.githubusercontent.com/moz9/ilgiz-yakhin/main/public/og.jpg", width: 1200, height: 630, alt: "ILGIZ YAKHIN — Full-stack / AI-разработчик" }] },
  twitter: { card: "summary_large_image", title: "ILGIZ YAKHIN", description: "Full-stack / AI-разработчик", images: ["https://raw.githubusercontent.com/moz9/ilgiz-yakhin/main/public/og.jpg"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning data-scroll-behavior="smooth">
      <body><SiteHeader />{children}<SiteFooter /></body>
    </html>
  );
}
