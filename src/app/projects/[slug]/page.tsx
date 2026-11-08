import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { getProject, projects } from "@/lib/projects";
import { caseHue, caseHueStyle } from "@/lib/case-hues";
import { ProjectStage } from "@/components/project-stage";
import { ProjectGallery } from "@/components/project-gallery";
import { CaseNavigation } from "@/components/case-navigation";
import { CaseHeroStage } from "@/components/case-hero-stage";

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = getProject((await params).slug);
  return project ? { title: project.title, description: project.summary, alternates: { canonical: `/projects/${project.slug}` } } : {};
}

const access = { public: "Публичный", mixed: "Частично публичный", private: "Обезличенное демо" } as const;

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const index = projects.findIndex((item) => item.slug === project.slug);
  const next = projects[(index + 1) % projects.length];

  return <main className="case" style={caseHueStyle(project.slug)} data-field={`${caseHue(project.slug).join(" ")} 0.62`}>
    <header className="case-hero">
      <div className="page-lights case-lights" aria-hidden="true"><i /><i /></div>
      <div className="case-top">
        <Link className="text-link case-back" href="/projects"><ArrowLeft aria-hidden="true" />Все работы</Link>
        <span>{index + 1} из {projects.length}</span>
      </div>
      <p className="case-status"><i aria-hidden="true" />{project.status}</p>
      <h1>{project.title}</h1>
      <p className="case-lead">{project.summary}</p>
      <dl className="case-facts">
        <div><dt>Роль</dt><dd>{project.role}</dd></div>
        <div><dt>Направление</dt><dd>{project.category.join(", ")}</dd></div>
        <div><dt>Основа</dt><dd>{project.stack.slice(0, 3).join(", ")}</dd></div>
        <div><dt>Доступ</dt><dd>{access[project.access]}</dd></div>
      </dl>
    </header>
    <CaseHeroStage><ProjectStage project={project} priority /></CaseHeroStage>

    <CaseNavigation sections={[
      { id: "overview", label: "Коротко" },
      ...(project.capabilities ? [{ id: "capabilities", label: "Возможности" }] : []),
      ...(project.media?.length ? [{ id: "interfaces", label: "Интерфейсы" }] : []),
      { id: "decisions", label: "Решения" },
      { id: "results", label: "Результаты" },
    ]} />

    <section id="overview" className="case-section case-overview" aria-label="Коротко о проекте">
      <article><h2>Задача</h2><p>{project.task}</p></article>
      <article><h2>Что я сделал</h2><ul>{project.decisions.map((item) => <li key={item.title}>{item.title}</li>)}</ul></article>
      <article className="case-overview-result"><h2>Главный результат</h2><p>{project.results[0]}</p></article>
    </section>

    {project.capabilities && <section id="capabilities" className="case-section" aria-labelledby="capabilities-title">
      <div className="case-section-head"><h2 id="capabilities-title">Что умеет продукт</h2><p>Основные пользовательские и операционные сценарии.</p></div>
      <div className="case-capabilities">
        {project.capabilities.map((group) => <article key={group.title}>
          <h3>{group.title}</h3>
          <p>{group.summary}</p>
          <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>)}
      </div>
    </section>}

    {Boolean(project.media?.length) && <section id="interfaces" className="case-section case-interfaces" aria-labelledby="interfaces-title">
      <div className="case-section-head"><h2 id="interfaces-title">Интерфейсы</h2><p>Экраны сняты с работающего продукта. Нажмите на кадр, чтобы рассмотреть его ближе.</p></div>
      <ProjectGallery media={project.media!} />
    </section>}

    <section id="decisions" className="case-section" aria-labelledby="decisions-title">
      <div className="case-section-head"><h2 id="decisions-title">Ключевые решения</h2><p>Почему продукт устроен именно так.</p></div>
      <ol className="case-decisions">
        {project.decisions.map((decision, step) => <li key={decision.title}><span aria-hidden="true">{step + 1}</span><h3>{decision.title}</h3><p>{decision.text}</p></li>)}
      </ol>
    </section>

    <section id="results" className="case-section" aria-labelledby="results-title">
      <div className="case-section-head"><h2 id="results-title">Результаты и проверки</h2></div>
      <div className="case-evidence">
        {project.evidence.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
      </div>
      <ul className="case-results">{project.results.map((result) => <li key={result}><Check aria-hidden="true" />{result}</li>)}</ul>
      <div className="case-stack"><h3>Стек</h3><ul className="chips">{project.stack.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <aside className="case-limits"><h3>Честные границы</h3>{project.limitations.map((item) => <p key={item}>{item}</p>)}</aside>
      {project.links && <div className="case-links">{project.links.map((link) =>
        <a key={link.href} className="button" data-lg="button" href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined}>{link.label}<ArrowUpRight aria-hidden="true" /></a>)}</div>}
    </section>

    <Link className="case-next" href={`/projects/${next.slug}`} style={caseHueStyle(next.slug)}>
      <span className="case-next-copy"><small>Следующий кейс</small><strong>{next.title}</strong><em>Открыть <ArrowUpRight aria-hidden="true" /></em></span>
      <span className="case-next-shot"><Image src={next.cover} alt="" width={960} height={600} sizes="(max-width: 860px) 90vw, 560px" /></span>
    </Link>
  </main>;
}
