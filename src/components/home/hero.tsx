"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { HeroLens } from "@/components/glass/hero-lens";
import { getProject, type Project } from "@/lib/projects";

function phoneOf(project: Project) {
  for (const item of project.media ?? []) {
    if (item.presentation === "phone") return item.src;
    const frame = item.frames?.find((entry) => typeof entry !== "string" && entry.presentation === "phone");
    if (frame && typeof frame !== "string") return frame.src;
  }
  return project.cover;
}

const chess = getProject("chessrise")!;
const pioner = getProject("pioner")!;
const worktime = getProject("worktime-reporting")!;
const revalib = getProject("revalib")!;

// Each letter scatters along its own path as the name is pulled apart.
const scatter = [-0.5, 0.35, -0.2, 0.6, -0.45, 0.25, 0.5, -0.35, 0.15, -0.6];
const lines = ["Ильгиз", "Яхин"];

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The opening shot. The name fills the screen while the work lies tilted on a table
 * beneath it. Scrolling pulls the name apart letter by letter, the table rises to face
 * the reader and the product splits into its layers: an exploded view of what was built.
 * Everything moves by transform, driven by one scroll value.
 */
export function Hero() {
  const hero = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = hero.current;
    const stage = pin.current;
    if (!element || !stage) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      if (reduced.matches) {
        element.dataset.still = "true";
        for (const name of ["--p", "--rise", "--split"]) element.style.setProperty(name, "0");
        return;
      }
      delete element.dataset.still;
      const travel = Math.max(1, element.offsetHeight - innerHeight);
      const p = clamp(-element.getBoundingClientRect().top / travel);
      element.style.setProperty("--p", p.toFixed(4));
      element.style.setProperty("--rise", easeOut(clamp(p / 0.55)).toFixed(4));
      element.style.setProperty("--split", easeInOut(clamp((p - 0.42) / 0.45)).toFixed(4));
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reduced.matches) return;
      stage.style.setProperty("--px", (event.clientX / innerWidth - 0.5).toFixed(3));
      stage.style.setProperty("--py", (event.clientY / innerHeight - 0.5).toFixed(3));
    };
    update();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    addEventListener("pointermove", onMove, { passive: true });
    reduced.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      removeEventListener("pointermove", onMove);
      reduced.removeEventListener("change", schedule);
    };
  }, []);

  const layers = [
    { className: "hero-layer hero-layer-back", src: worktime.cover, width: 1440, height: 900, phone: false },
    { className: "hero-layer hero-layer-main", src: chess.cover, width: 1440, height: 900, phone: false },
    { className: "hero-layer hero-layer-phone", src: phoneOf(pioner), width: 390, height: 844, phone: true },
    { className: "hero-layer hero-layer-phone hero-layer-phone-b", src: phoneOf(revalib), width: 390, height: 844, phone: true },
  ];
  let letter = 0;

  return <section className="hero" id="top" ref={hero} aria-labelledby="hero-title" data-field="#4a5cff #21c6a4 0.62">
    <div className="hero-pin" ref={pin}>
      <div className="hero-stack" aria-hidden="true">
        <span className="hero-plate" />
        {layers.map((layer, index) =>
          <div key={layer.src} className={layer.className}>
            <span className="hero-layer-face" style={{ "--i": index } as CSSProperties}>
              {!layer.phone && <span className="stage-chrome"><i /><i /><i /></span>}
              <Image src={layer.src} alt="" width={layer.width} height={layer.height} priority={index < 2} sizes={layer.phone ? "200px" : "(max-width: 760px) 86vw, 900px"} />
            </span>
          </div>)}
      </div>

      <h1 id="hero-title" className="hero-name" aria-label="Ильгиз Яхин">
        {lines.map((line, row) =>
          <span className="hero-name-line" key={line} aria-hidden="true">
            {[...line].map((char) => {
              const i = letter++;
              return <span className="hero-letter" key={i} style={{ "--i": i, "--w": scatter[i % scatter.length] } as CSSProperties}>
                <span className="hero-letter-in">{char}</span>
              </span>;
            })}
            {row === 0 && <span className="hero-name-gap" />}
          </span>)}
      </h1>

      <div className="hero-copy">
        <p className="hero-status"><i aria-hidden="true" />Открыт к удалённой работе</p>
        <p className="hero-lead">Full-stack и AI-разработчик. Делаю web-продукты, Android- и desktop-приложения и сам довожу их от интерфейса до релиза и поддержки.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#work" data-lg="button" data-lg-variant="prominent">Смотреть работы</a>
          <Link className="button" href="/resume" data-lg="button">Резюме</Link>
        </div>
      </div>
      <p className="hero-cue" aria-hidden="true"><span />Листайте</p>
      <HeroLens host={pin} />
    </div>
  </section>;
}
