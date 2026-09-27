import type { Metadata } from "next";
import { ContentPlatformDemo } from "@/components/demos/content-platform-demo";

export const metadata: Metadata = {
  title: "Демо стриминговой web-платформы",
  description: "Обезличенная интерактивная демонстрация двух витрин, каталога, парсинга, новостей, AI-поиска и релизов.",
  robots: { index: false, follow: false },
};

export default function ContentPlatformDemoPage() {
  return <main><ContentPlatformDemo /></main>;
}
