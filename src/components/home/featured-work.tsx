"use client";

import { plural } from "@/lib/plural";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import { gsap, MOTION, SCRUB, ScrollTrigger, STILL, useGSAP } from "@/lib/gsap";
import { ArrowUpRight } from "lucide-react";
import { projects, type Project } from "@/lib/projects";
import { featured } from "@/lib/featured";
import { caseHue, caseHueStyle } from "@/lib/case-hues";
import { useGlassTabs } from "@/components/glass/glass-runtime";
import { CaseMorph } from "@/components/case-morph";
import { CaseVideo } from "@/components/case-video";


const labels: Record<string, string> = {
  chessrise: "ChessRise",
  pcstudio: "PCStudio",
  "liquid-glass-kit": "Glass Kit",
  glassrates: "GlassRates",
  "globe-routes": "Перелёты",
  "gradient-studio": "Градиенты",
  "gravity-tags": "Гравитация",
  "kinetic-type": "Кинетика",
  "shader-gallery": "Переходы",
  "micro-ui": "Микро-UI",
  "particle-type": "Частицы",
  "scroll-story": "История",
  "analytics-dashboard": "Дашборд",
  "kanban-board": "Канбан",
  "document-factory": "Документы",
  "booking-flow": "Запись",
  "drum-machine": "Ритм-16",
  pioner: "Пионер",
  "worktime-reporting": "Отчётность",
  "infrastructure-inventory": "Учёт ИТ",
  "content-platform": "Платформа",
  revalib: "RevaLib",
};
const statuses: Record<string, string> = {
  chessrise: "Принят и оплачен",
  pcstudio: "Закрытая проверка",
  "liquid-glass-kit": "Публичное демо",
  glassrates: "В разработке, 2.2",
  "globe-routes": "Живое демо, three.js",
  "gradient-studio": "Живое демо, WebGL2",
  "gravity-tags": "Живое демо, Matter.js",
  "kinetic-type": "Живое демо, GSAP",
  "shader-gallery": "Живое демо, WebGL2",
  "micro-ui": "Живое демо, GSAP",
  "particle-type": "Живое демо, Canvas",
  "scroll-story": "Живое демо, ScrollTrigger",
  "analytics-dashboard": "Живое демо, SVG",
  "kanban-board": "Живое демо, GSAP Flip",
  "document-factory": "Живое демо, .xlsx → .docx",
  "booking-flow": "Живое демо, React",
  "drum-machine": "Живое демо, Web Audio",
  pioner: "Публичный preview",
  "worktime-reporting": "Windows, демо",
  "infrastructure-inventory": "Windows, демо",
  "content-platform": "Production, обезличен",
  revalib: "Production",
};

type Shot = { src: string; phone: boolean };
/** The layers of one case: its cover, a second real screen and a phone view when there is one. */
function shotsOf(project: Project) {
  const all: Shot[] = [];
  for (const item of project.media ?? []) {
    if (item.presentation === "phone") all.push({ src: item.src, phone: true });
    else if (!item.presentation || ["browser", "desktop", "live", "detail"].includes(item.presentation)) all.push({ src: item.src, phone: false });
    for (const frame of item.frames ?? []) {
      if (typeof frame === "string") all.push({ src: frame, phone: false });
      else all.push({ src: frame.src, phone: frame.presentation === "phone" });
    }
  }
  const back = all.find((shot) => !shot.phone && shot.src !== project.cover);
  const phone = all.find((shot) => shot.phone);
  return { back: back?.src, phone: phone?.src };
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Scroll position inside a chapter where it is fully built and opened up. */
const SHOWN_AT = 0.74;

/**
 * Selected work as six full-screen chapters. Each one is pinned while the reader scrolls
 * through it: the product flies in from depth, settles to face the reader, then opens into
 * an exploded view of its layers. The light of the whole page takes the case's colours.
 */
export function FeaturedWork() {
  const list = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(() => {
    const root = list.current;
    if (!root) return;
    const chapters = Array.from(root.querySelectorAll<HTMLElement>(".chapter"));
    const mm = gsap.matchMedia();
    mm.add(STILL, () => {
      for (const chapter of chapters) {
        chapter.style.setProperty("--in", "1");
        chapter.style.setProperty("--split", "0.5");
        chapter.style.setProperty("--out", "0");
        chapter.style.setProperty("--p", "0.5");
      }
    });
    mm.add(MOTION, () => {
      chapters.forEach((chapter) => {
        // 0 when the chapter's top meets the bottom of the screen, 1 when its end leaves.
        const run = { p: 0 };
        const paint = () => {
          const p = run.p;
          const mobile = innerWidth <= 860;
          chapter.style.setProperty("--p", p.toFixed(4));
          chapter.style.setProperty("--in", easeOut(clamp(p / (mobile ? 0.6 : 0.46))).toFixed(4));
          chapter.style.setProperty("--split", mobile ? "0" : easeInOut(clamp((p - 0.48) / 0.3)).toFixed(4));
          chapter.style.setProperty("--out", mobile ? "0" : clamp((p - 0.9) / 0.1).toFixed(4));
        };
        gsap.to(run, { p: 1, ease: "none", onUpdate: paint, scrollTrigger: { trigger: chapter, start: "top bottom", end: "bottom bottom", scrub: SCRUB } });
      });
    });
    // The picker follows the chapter that holds the middle of the screen.
    chapters.forEach((chapter, index) => {
      ScrollTrigger.create({ trigger: chapter, start: "top center", end: "bottom center", onToggle: (self) => { if (self.isActive) setActive(index); } });
    });
    return () => mm.revert();
  }, { scope: list });

  const jump = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const chapter = list.current?.querySelectorAll<HTMLElement>(".chapter")[index];
    if (!chapter) return;
    const box = chapter.getBoundingClientRect();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const offset = innerWidth <= 860 || reduced ? box.top - 96 : box.top - innerHeight + SHOWN_AT * box.height;
    scrollTo({ top: scrollY + offset, behavior: reduced ? "instant" : behavior });
  }, []);
  useGlassTabs(picker, active, jump);

  return <section className="work" id="work" aria-labelledby="work-title">
    <div className="work-intro">
      <h2 id="work-title">Избранные работы</h2>
      <p>{featured.length} {plural(featured.length, "проект", "проекта", "проектов")}, которые я спроектировал, написал и довёл до запуска. Ещё {projects.length - featured.length} — ниже и в каталоге.</p>
      <Link className="text-link" href="/projects">{plural(projects.length, "Весь", "Все", "Все")} {projects.length} {plural(projects.length, "проект", "проекта", "проектов")} <ArrowUpRight aria-hidden="true" /></Link>
    </div>
    <div className="chapters" ref={list}>
      {featured.map((project, index) => {
        const { back, phone } = shotsOf(project);
        const [a, b] = caseHue(project.slug);
        return <article className="chapter" key={project.slug} style={caseHueStyle(project.slug)} data-field={`${a} ${b} 0.7`} aria-labelledby={`chapter-${project.slug}`}
          onFocus={(event) => { if (event.target.matches(":focus-visible")) jump(index, "instant"); }}>
          <div className="chapter-pin">
            <p className="chapter-ghost" aria-hidden="true">{labels[project.slug]}</p>
            <div className="chapter-copy">
              <p className="chapter-count"><span>{String(index + 1).padStart(2, "0")}</span> из {String(featured.length).padStart(2, "0")}</p>
              <p className="chapter-kind">{project.category.join(", ")}</p>
              <h3 id={`chapter-${project.slug}`}><Link href={`/projects/${project.slug}`}>{project.title}</Link></h3>
              <p className="chapter-summary">{project.summary}</p>
              <ul className="chapter-results">{project.results.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
              <ul className="chips" aria-label="Технологии">{project.stack.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul>
              <Link className="button chapter-open" href={`/projects/${project.slug}`} data-lg="button">Открыть кейс <ArrowUpRight aria-hidden="true" /></Link>
            </div>
            <div className="chapter-scene">
              <Link className="chapter-stack" href={`/projects/${project.slug}`} tabIndex={-1} aria-hidden="true">
                <span className="chapter-plate" />
                {back && <span className="chapter-layer chapter-layer-back"><span className="stage-chrome"><i /><i /><i /></span><Image src={back} alt="" width={1440} height={900} sizes="(max-width: 860px) 80vw, 700px" /></span>}
                <CaseMorph slug={project.slug}><span className="chapter-layer chapter-layer-main"><span className="stage-chrome"><i /><i /><i /></span><span className="case-media"><Image src={project.cover} alt="" width={1440} height={900} sizes="(max-width: 860px) 92vw, 900px" />{project.coverVideo && <CaseVideo src={project.coverVideo} />}</span></span></CaseMorph>
                {phone && <span className="chapter-layer chapter-layer-phone"><Image src={phone} alt="" width={390} height={844} sizes="220px" /></span>}
                <span className="chapter-layer chapter-layer-note" style={{ "--n": 0 } as CSSProperties}><b>{project.results[0]}</b></span>
              </Link>
              <span className="chapter-chip" data-lg="surface"><i />{statuses[project.slug]}</span>
            </div>
          </div>
        </article>;
      })}
    </div>
    <div className="work-picker" data-lg="surface">
      <div className="work-picker-tabs" ref={picker} role="tablist" aria-label="Быстрый переход к проекту">
        {featured.map((project, index) => <button key={project.slug} type="button" role="tab" aria-selected={active === index} tabIndex={active === index ? 0 : -1}>{labels[project.slug]}</button>)}
      </div>
    </div>
  </section>;
}
