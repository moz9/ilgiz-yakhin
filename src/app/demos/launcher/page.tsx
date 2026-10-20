import type { Metadata } from "next";
import { LauncherDemo } from "@/components/demos/launcher-demo";

export const metadata: Metadata = {
  title: "Демо нативной оболочки лаунчера",
  description: "Обезличенная интерактивная реконструкция нативного Windows-продукта: навигация, запуск, профили, видео, обновления и журналы.",
  robots: { index: false, follow: false },
};

export default function LauncherDemoPage() {
  return <main><LauncherDemo /></main>;
}
