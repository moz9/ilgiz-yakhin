"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { gsap, MOTION, SCRUB, STILL, useGSAP } from "@/lib/gsap";
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

  useGSAP(() => {
    const element = hero.current;
    const stage = pin.current;
    if (!element || !stage) return;
    const mm = gsap.matchMedia();
    mm.add(STILL, () => {
      element.dataset.still = "true";
      for (const name of ["--p", "--rise", "--split"]) element.style.setProperty(name, "0");
      return () => { delete element.dataset.still; };
    });
    mm.add(MOTION, () => {
      // One scrubbed value drives the whole shot; GSAP adds the catch-up that makes it glide.
      const shot = { p: 0 };
      const paint = () => {
        const p = shot.p;
        element.style.setProperty("--p", p.toFixed(4));
        element.style.setProperty("--rise", easeOut(clamp(p / 0.55)).toFixed(4));
        element.style.setProperty("--split", easeInOut(clamp((p - 0.42) / 0.45)).toFixed(4));
      };
      gsap.to(shot, { p: 1, ease: "none", onUpdate: paint, scrollTrigger: { trigger: element, start: "top top", end: "bottom bottom", scrub: SCRUB } });
      // The pointer tilt eases toward the cursor instead of snapping to it.
      const tilt = { x: 0, y: 0 };
      const toX = gsap.quickTo(tilt, "x", { duration: 0.8, ease: "power3.out", onUpdate: () => stage.style.setProperty("--px", tilt.x.toFixed(3)) });
      const toY = gsap.quickTo(tilt, "y", { duration: 0.8, ease: "power3.out", onUpdate: () => stage.style.setProperty("--py", tilt.y.toFixed(3)) });
      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        toX(event.clientX / innerWidth - 0.5);
        toY(event.clientY / innerHeight - 0.5);
      };
      addEventListener("pointermove", onMove, { passive: true });
      return () => removeEventListener("pointermove", onMove);
    });
    return () => mm.revert();
  }, { scope: hero });

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
