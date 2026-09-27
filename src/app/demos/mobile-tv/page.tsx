import type { Metadata } from "next";
import { MobileTvDemo } from "@/components/demos/mobile-tv-demo";

export const metadata: Metadata = {
  title: "Демо Android-приложения для смартфона и TV",
  description: "Обезличенная интерактивная демонстрация нативного Android-продукта для touch- и D-pad-интерфейсов.",
  robots: { index: false, follow: false },
};

export default function MobileTvDemoPage() {
  return <main><MobileTvDemo /></main>;
}
