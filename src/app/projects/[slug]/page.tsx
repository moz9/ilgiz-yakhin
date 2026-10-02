import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { getProject, projects } from "@/lib/projects";
import { ProjectStage } from "@/components/project-stage";
import { ProjectGallery } from "@/components/project-gallery";
import { RevealSection } from "@/components/reveal-section";
import { CaseNavigation } from "@/components/case-navigation";

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = getProject((await params).slug);
  return project ? { title: project.title, description: project.summary, alternates: { canonical: `/projects/${project.slug}` } } : {};
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const index = projects.findIndex((item) => item.slug === project.slug);
  const next = projects[(index + 1) % projects.length];

  return <main className="redesign-case">
    <div className="redesign-case-wrap">
      <div className="redesign-case-top redesign-mono">
        <Link href="/projects"><ArrowLeft aria-hidden="true" /> Все проекты</Link>
        <span>Кейс {String(index + 1).padStart(2, "0")} из {projects.length}</span>
      </div>
      <header className="redesign-case-hero">
        <span className="redesign-case-status redesign-mono"><i />{project.status}</span>
        <h1 className={project.title.length > 24 ? "redesign-case-title long" : "redesign-case-title"}>{project.title}</h1>
        <p className="redesign-case-lead">{project.summary}</p>
        <div className="redesign-case-meta">
          <div><span>Категория</span><strong>{project.category.join(" · ")}</strong></div>
          <div><span>Роль</span><strong>{project.role}</strong></div>
          <div><span>Основа</span><strong>{project.stack.slice(0, 3).join(" · ")}</strong></div>
          <div><span>Доступ</span><strong>{project.access === "public" ? "Публичный" : project.access === "mixed" ? "Смешанный" : "Обезличенное демо"}</strong></div>
        </div>
      </header>
      <RevealSection className="case-presentation">
        {project.slug === "launcher" ?
          <div className="redesign-case-winui">
            <div className="redesign-case-chrome"><i /><i /><i /><span>Схема текущей WinUI 3 оболочки · не скриншот</span></div>
            <div><aside>{["Старт", "Статус", "Конфиги", "Бинды", "Видео", "Настройки", "Обновления", "Логи"].map((item) => <span key={item}>{item}</span>)}</aside>
              <section><small>Launcher / WinUI 3</small><h2>Управление запуском</h2><p>Настройки, диагностика и обновления в нативной Windows-оболочке.</p>
                <div><span>Конфигурация</span><span>Видео</span><span>Статус</span></div>
              </section></div>
          </div> :
          <ProjectStage project={project} priority />}
      </RevealSection>
      <CaseNavigation sections={[
        { id: "overview", label: "Коротко" },
        ...(project.capabilities ? [{ id: "capabilities", label: "Возможности" }] : []),
        ...(project.media?.length ? [{ id: "interfaces", label: "Интерфейсы" }] : []),
        { id: "decisions", label: "Решения" },
        { id: "results", label: "Результаты" },
      ]} />
      <section id="overview" className="redesign-case-tldr" aria-label="Коротко о проекте">
        <div><span>Задача</span><p>{project.task}</p></div>
        <div><span>Моя работа</span><p>{project.decisions.map((item) => item.title).join("; ")}.</p></div>
        <div><span>Результат</span><p>{project.results[0]}</p></div>
      </section>
      {project.capabilities && <section id="capabilities" className="redesign-case-flow" aria-labelledby="capabilities-title">
        <div className="redesign-case-section-head"><h2 id="capabilities-title">Функциональные контуры</h2><p>Как устроены основные пользовательские и операционные сценарии.</p></div>
        <div className="redesign-case-flow-grid">
          {project.capabilities.map((group, step) => <article key={group.title}>
            <span className="redesign-mono">0{step + 1}</span>
            <h3>{group.title}</h3>
            <p>{group.summary}</p>
            <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>)}
        </div>
      </section>}
      {Boolean(project.media?.length) && <div id="interfaces"><ProjectGallery media={project.media!} /></div>}
      <section id="decisions" className="redesign-case-decisions" aria-labelledby="decisions-title">
        <h2 id="decisions-title">Ключевые решения</h2>
        <div>{project.decisions.map((decision, decisionIndex) => <article key={decision.title}>
          <span className="redesign-mono">0{decisionIndex + 1}</span><h3>{decision.title}</h3><p>{decision.text}</p>
        </article>)}</div>
      </section>
      <section id="results" className="redesign-case-proof" aria-labelledby="results-title">
        <h2 id="results-title">Результаты и проверки</h2>
        <div className="redesign-case-evidence">
          {project.evidence.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
        </div>
        <ul className="redesign-case-results">{project.results.map((result) => <li key={result}><Check aria-hidden="true" />{result}</li>)}</ul>
        <div className="redesign-case-stack" aria-label="Стек">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
        <div className="redesign-case-limits"><span>Честные границы</span><div>{project.limitations.map((item) => <p key={item}>{item}</p>)}</div></div>
        {project.links && <div className="redesign-case-links">{project.links.map((link) =>
          <a key={link.href} href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined}>{link.label} <ArrowUpRight aria-hidden="true" /></a>)}</div>}
      </section>
      <Link className="redesign-case-next" href={`/projects/${next.slug}`}>
        <span><small>Следующий кейс</small><strong>{next.title}</strong><em>Открыть кейс <ArrowUpRight aria-hidden="true" /></em></span>
        {next.slug === "launcher" ? <span className="redesign-next-placeholder">WinUI 3<br />Launcher</span> :
          <Image src={next.cover} alt="" width={640} height={420} loading="lazy" />}
      </Link>
    </div>
  </main>;
}
