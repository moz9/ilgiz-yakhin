"use client";

import { plural } from "@/lib/plural";
import { useRef, useState } from "react";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { gsap, MOTION, ScrollTrigger, STILL, useGSAP } from "@/lib/gsap";
import type { ShowcaseProps } from "./registry";

gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin);

/**
 * The real history of this site, from `git log --shortstat` of its repository:
 * commits, lines added and removed per working day, grouped into the chapters they belong to.
 */
const CHAPTERS = [
  { date: "3 августа", title: "Первый день", text: "Из шаблона Next.js — в портфолио с анимированным индексом проектов и шоурилом. Десять коммитов за один день.", commits: 10, added: 10488, removed: 859, cases: 12 },
  { date: "4 августа", title: "Правда в кейсах", text: "Аудит всех формулировок: кейсы переписаны так, чтобы каждое заявление можно было проверить. Резюме стало экраном, а не PDF.", commits: 11, added: 1213, removed: 191, cases: 12 },
  { date: "27 сентября", title: "Редизайн с Claude", text: "Новая подача и точные описания кейсов. Два коммита — но почти четыре с половиной тысячи строк.", commits: 2, added: 4493, removed: 283, cases: 12 },
  { date: "2–3 октября", title: "Стекло и интерактив", text: "Первая навигация на преломляющем стекле, интерактивные витрины проектов, обезличенная контентная платформа.", commits: 6, added: 1658, removed: 369, cases: 13 },
  { date: "20 октября", title: "Живые демо", text: "Двадцать коммитов за день: реконструкции лаунчера, стриминга и RouterDesk, галереи из живых кадров.", commits: 20, added: 1819, removed: 670, cases: 14 },
  { date: "21 октября", title: "Атмосфера и шрифты", text: "Свои шрифты вместо Google Fonts, метрически совместимые запасные гарнитуры, ноль сдвигов макета.", commits: 19, added: 1025, removed: 150, cases: 14 },
  { date: "7 ноября", title: "Архив и контакты", text: "Интерактивный архив работ и подвал с контактами — один точный коммит.", commits: 1, added: 345, removed: 14, cases: 14 },
  { date: "9 ноября", title: "Кинематограф", text: "Тёмный кинематографичный сайт: живой WebGL-свет, GSAP, переходы между страницами и шоукейсы с живыми демо.", commits: 9, added: 9048, removed: 5184, cases: 21 },
];
const TOTAL = CHAPTERS.reduce((a, c) => ({ commits: a.commits + c.commits, added: a.added + c.added, removed: a.removed + c.removed }), { commits: 0, added: 0, removed: 0 });
const MAX = Math.max(...CHAPTERS.map((c) => c.commits));
// The path winds left to right through one point per chapter.
const POINTS = CHAPTERS.map((_, i) => ({ x: 60 + i * (880 / (CHAPTERS.length - 1)), y: i % 2 ? 70 : 170 }));
const PATH = POINTS.reduce((d, p, i) => (i ? `${d} C ${POINTS[i - 1].x + 55} ${POINTS[i - 1].y}, ${p.x - 55} ${p.y}, ${p.x} ${p.y}` : `M ${p.x} ${p.y}`), "");
const n = (v: number) => Math.round(v).toLocaleString("ru-RU");

/**
 * «Как рос этот сайт»: the history of this portfolio told by scrolling, on real data from
 * its git repository. A path draws itself through the chapters, the running totals count
 * commits and lines as they pass, and the active chapter tells what changed and why.
 * One scrubbed ScrollTrigger inside the demo's own scroller drives all of it.
 */
export default function ScrollStory({ mode }: ShowcaseProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useGSAP(() => {
    const root = scroller.current!;
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.querySelector(".ss-track"), scroller: root, start: "top top", end: "bottom bottom", scrub: 0.6,
          onUpdate: (self) => {
            setProgress(self.progress);
            setActive(Math.min(CHAPTERS.length - 1, Math.floor(self.progress * CHAPTERS.length * 0.999)));
          },
        },
      });
      tl.fromTo(".ss-path", { drawSVG: "0%" }, { drawSVG: "100%", duration: 1 }, 0)
        .to(".ss-head", { duration: 1, motionPath: { path: ".ss-path", align: ".ss-path", alignOrigin: [0.5, 0.5] }, immediateRender: true }, 0);
      ScrollTrigger.refresh();
    });
    mm.add(STILL, () => { setProgress(1); setActive(CHAPTERS.length - 1); });
    return () => mm.revert();
  }, { scope: scroller });

  // Totals count up to the chapter in progress: whole chapters behind, the current one in part.
  const within = progress * CHAPTERS.length - active;
  const sum = (key: "commits" | "added" | "removed") => CHAPTERS.slice(0, active).reduce((a, c) => a + c[key], 0) + CHAPTERS[active][key] * Math.max(0, Math.min(1, within * 1.6));
  const chapter = CHAPTERS[active];

  return <div className={`ss ss-${mode}`} ref={scroller} tabIndex={0} aria-label="История сайта: листайте внутри блока">
    <div className="ss-track">
      <div className="ss-stage">
        <header className="ss-top">
          <h3>Как рос этот сайт<small>Реальные данные git этого портфолио</small></h3>
          <dl className="ss-totals">
            <div><dt>Коммитов</dt><dd>{n(sum("commits"))}</dd></div>
            <div><dt>Строк добавлено</dt><dd className="is-add">+{n(sum("added"))}</dd></div>
            <div><dt>Строк удалено</dt><dd className="is-del">−{n(sum("removed"))}</dd></div>
            <div><dt>Кейсов</dt><dd>{chapter.cases}</dd></div>
          </dl>
        </header>

        <svg className="ss-map" viewBox="0 0 1000 240" aria-hidden="true">
          <path className="ss-ghost" d={PATH} />
          <path className="ss-path" d={PATH} />
          {POINTS.map((p, i) => <g key={i} className="ss-stop" data-state={i < active ? "past" : i === active ? "now" : undefined}>
            <circle cx={p.x} cy={p.y} r={6 + (CHAPTERS[i].commits / MAX) * 14} />
            <text x={p.x} y={p.y + (i % 2 ? -34 : 44)} textAnchor="middle">{CHAPTERS[i].date}</text>
          </g>)}
          <circle className="ss-head" r="7" cx="0" cy="0" />
        </svg>

        <article className="ss-chapter" key={active} aria-live="polite">
          <p className="ss-index">Глава {active + 1} из {CHAPTERS.length} · {chapter.date}</p>
          <h4>{chapter.title}</h4>
          <p>{chapter.text}</p>
          <p className="ss-diff"><b>{chapter.commits} {chapter.commits === 1 ? "коммит" : chapter.commits < 5 ? "коммита" : "коммитов"}</b><span className="is-add">+{n(chapter.added)}</span><span className="is-del">−{n(chapter.removed)}</span></p>
        </article>

        <div className="ss-bars" aria-hidden="true">
          {CHAPTERS.map((c, i) => <span key={i} data-state={i < active ? "past" : i === active ? "now" : undefined} style={{ height: `${12 + (c.commits / MAX) * 88}%` }}><i>{c.commits}</i></span>)}
        </div>
        <p className="ss-hint" aria-hidden="true">{progress > 0.98 ? `Итого: ${TOTAL.commits} ${plural(TOTAL.commits, "коммит", "коммита", "коммитов")} за 98 дней` : "Листайте внутри блока ↓"}</p>
      </div>
    </div>
  </div>;
}
