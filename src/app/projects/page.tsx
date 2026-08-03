import type { Metadata } from "next";
import { ProjectExplorer } from "@/components/project-explorer";

export const metadata: Metadata = { title: "Проекты", description: "Шесть кейсов web-, desktop-, automation- и infrastructure-разработки." };

export default function ProjectsPage() {
  return (
    <main className="inner-page">
      <section className="page-hero">
        <div className="eyebrow"><span>PROJECT INDEX</span><span>2023—2026</span></div>
        <h1>Проекты</h1>
        <p>Шесть систем: от публичных web-продуктов до обезличенных внутренних инструментов. Внутри — роль, архитектура, компромиссы и доказательства.</p>
      </section>
      <section className="section project-index-section"><ProjectExplorer /></section>
    </main>
  );
}
