"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, FileSpreadsheet, MapPin, Network, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { projects, type Project } from "@/lib/projects";

const featuredSlugs = ["chessrise", "pioner", "worktime-reporting", "infrastructure-inventory"];
const featuredProjects = featuredSlugs.map((slug) => projects.find((project) => project.slug === slug)).filter((project): project is Project => Boolean(project));
const archiveProjects = projects.filter((project) => !featuredSlugs.includes(project.slug));

function BrowserBar({ label }: { label: string }) {
  return <div className="scene-browser-bar"><span /><span /><span /><strong>{label}</strong></div>;
}

function ChessScene({ project }: { project: Project }) {
  return (
    <div className="case-scene chess-scene">
      <div className="chess-pattern" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
      <div className="device-laptop">
        <div className="device-screen"><BrowserBar label="chessrise.ru" /><div className="scene-image"><Image src={project.cover} alt={project.coverAlt} fill sizes="(max-width: 760px) 92vw, 58vw" /></div></div>
        <div className="laptop-base" />
      </div>
      <div className="scene-detail chess-detail"><span>Интерактивная задача</span><strong>Заявка → БД → уведомление</strong></div>
    </div>
  );
}

function PionerScene({ project }: { project: Project }) {
  return (
    <div className="case-scene pioner-scene">
      <div className="pioner-display"><BrowserBar label="pioner-site.vercel.app" /><div className="scene-image"><Image src={project.cover} alt={project.coverAlt} fill sizes="(max-width: 760px) 92vw, 58vw" /></div></div>
      <div className="device-phone"><div className="phone-speaker" /><Image src={project.cover} alt="Мобильное представление сайта ТРЦ Пионер" fill sizes="180px" /></div>
      <div className="scene-route glass-surface"><MapPin aria-hidden="true" /><div><span>Посетительский маршрут</span><strong>Каталог · карта · события</strong></div></div>
    </div>
  );
}

function WorktimeScene({ project }: { project: Project }) {
  return (
    <div className="case-scene worktime-scene">
      <div className="windows-app"><div className="windows-title"><span>Расчёт рабочего времени</span><i>—</i><i>□</i><i>×</i></div><div className="scene-image"><Image src={project.cover} alt={project.coverAlt} fill sizes="(max-width: 760px) 92vw, 62vw" /></div></div>
      <div className="workflow-strip" aria-label="Импорт, проверка, экспорт">
        <span><Check aria-hidden="true" /> Импорт</span><i /><span><Search aria-hidden="true" /> Проверка</span><i /><span><FileSpreadsheet aria-hidden="true" /> Excel</span>
      </div>
      <div className="sheet-detail" aria-hidden="true"><b>Итого</b><span>160:00</span><span>168:30</span><span>08:30</span></div>
    </div>
  );
}

function SysinventScene({ project }: { project: Project }) {
  return (
    <div className="case-scene sysinvent-scene">
      <div className="sys-window sys-window-back"><BrowserBar label="Синтетический профиль" /><div /></div>
      <div className="sys-window sys-window-main"><BrowserBar label="Sysinvent · demo" /><div className="scene-image"><Image src={project.cover} alt={project.coverAlt} fill sizes="(max-width: 760px) 92vw, 62vw" /></div></div>
      <div className="sys-status glass-surface"><Network aria-hidden="true" /><div><span>Desktop demo</span><strong>Typed IPC · encrypted data · E2E</strong></div></div>
    </div>
  );
}

function ProjectScene({ project }: { project: Project }) {
  if (project.slug === "chessrise") return <ChessScene project={project} />;
  if (project.slug === "pioner") return <PionerScene project={project} />;
  if (project.slug === "worktime-reporting") return <WorktimeScene project={project} />;
  return <SysinventScene project={project} />;
}

export function AnimatedProjectList() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="project-showreel" id="projects" aria-labelledby="work-title">
      <header className="showreel-heading">
        <p>Selected work / 04</p>
        <h2 id="work-title">Избранные проекты</h2>
        <Link href="/projects">Все проекты <ArrowUpRight aria-hidden="true" /></Link>
      </header>

      <div className="showreel-list">
        {featuredProjects.map((project, index) => (
          <article className={`showreel-case showreel-${project.slug}`} key={project.slug}>
            <motion.div className="showreel-copy" initial={false} whileInView={reduceMotion ? undefined : { y: [18, 0] }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}>
              <div className="showreel-meta"><span>{String(index + 1).padStart(2, "0")}</span><span>{project.category.join(" · ")}</span></div>
              <h3><Link href={`/projects/${project.slug}`}>{project.title}</Link></h3>
              <p>{project.summary}</p>
              <div className="showreel-stack">{project.stack.slice(0, 4).map((item) => <span key={item}>{item}</span>)}</div>
              <Link className="showreel-link" href={`/projects/${project.slug}`} aria-label={`Открыть кейс ${project.title}`}><ArrowUpRight aria-hidden="true" /></Link>
            </motion.div>
            <motion.div className="showreel-visual" initial={false} whileInView={reduceMotion ? undefined : { clipPath: ["inset(5% 0 5% 0)", "inset(0% 0 0% 0)"] }} viewport={{ once: true, amount: 0.22 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
              <ProjectScene project={project} />
            </motion.div>
          </article>
        ))}
      </div>

      <div className="project-archive">
        <div><p>Archive / production</p><h2>Ещё два full-stack кейса</h2></div>
        {archiveProjects.map((project) => (
          <Link key={project.slug} href={`/projects/${project.slug}`}>
            <span>{project.category.join(" · ")}</span>
            <h3>{project.title}</h3>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
