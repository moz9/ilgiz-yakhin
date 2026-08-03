import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/lib/projects";

export function generateStaticParams() { return projects.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = getProject((await params).slug);
  return project ? { title: project.title, description: project.summary } : {};
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const currentIndex = projects.findIndex((item) => item.slug === project.slug);
  const next = projects[(currentIndex + 1) % projects.length];

  return (
    <main className="inner-page case-page">
      <section className={`case-hero accent-${project.accent}`}>
        <Link className="back-link" href="/projects"><ArrowLeft aria-hidden="true" /> Все проекты</Link>
        <div className="case-number">CASE {project.index} / 06</div>
        <div className="case-title-row"><div><p className="kicker">{project.shortTitle}</p><h1>{project.title}</h1></div><span>{project.status}</span></div>
        <p className="case-lead">{project.summary}</p>
        <div className="case-facts"><div><span>Роль</span><strong>{project.role}</strong></div><div><span>Доступ</span><strong>{project.access === "public" ? "Публичный проект" : project.access === "mixed" ? "Смешанный" : "Обезличенное демо"}</strong></div></div>
      </section>

      <section className="case-layout section">
        <aside className="case-nav"><span>В этом кейсе</span><a href="#context">Контекст</a><a href="#solution">Решения</a><a href="#results">Результат</a><a href="#limits">Границы</a></aside>
        <div className="case-content">
          <section id="context"><p className="kicker">01 / Контекст</p><h2>Задача</h2><p className="large-copy">{project.task}</p></section>
          <section id="solution"><p className="kicker">02 / Технический разбор</p><h2>Ключевые решения</h2><div className="decision-list">{project.decisions.map((decision, index) => <article key={decision.title}><span>0{index + 1}</span><div><h3>{decision.title}</h3><p>{decision.text}</p></div></article>)}</div><ul className="tag-list large-tags">{project.stack.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section id="results"><p className="kicker">03 / Результат</p><h2>Результаты и проверки</h2><div className="evidence-grid">{project.evidence.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong></article>)}</div><ul className="result-list">{project.results.map((result) => <li key={result}><ShieldCheck aria-hidden="true" />{result}</li>)}</ul></section>
          <section id="limits" className="limits-block"><LockKeyhole aria-hidden="true" /><div><p className="kicker">04 / Честные границы</p><h2>Что не заявляется</h2>{project.limitations.map((item) => <p key={item}>{item}</p>)}</div></section>
          {project.links && <div className="case-links">{project.links.map((link) => <a className="button button-primary" key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight aria-hidden="true" /></a>)}</div>}
        </div>
      </section>
      <Link className="next-case" href={`/projects/${next.slug}`}><span>Следующий кейс</span><strong>{next.title}</strong><ArrowUpRight aria-hidden="true" /></Link>
    </main>
  );
}
