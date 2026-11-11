import type { Metadata } from "next";
import { plural } from "@/lib/plural";
import { ProjectExplorer } from "@/components/project-explorer";
import { ContactBlock } from "@/components/contact-block";
import { projects } from "@/lib/projects";

export const metadata: Metadata = { title: "Работы", description: "Четырнадцать кейсов: web, Android, desktop, автоматизация и инфраструктура." };

export default function ProjectsPage() {
  return <main className="page">
    <header className="page-head">
      <div className="page-lights" aria-hidden="true"><i /><i /></div>
      <h1>Работы</h1>
      <p>{projects.length} {plural(projects.length, "проект", "проекта", "проектов")} с 2023 года: сайты и web-платформы, Android-приложение, desktop-инструменты для Windows, автоматизация и инфраструктура. У каждого есть разбор задачи, решений и того, как я проверял результат.</p>
    </header>
    <section className="page-section"><ProjectExplorer /></section>
    <ContactBlock />
  </main>;
}
