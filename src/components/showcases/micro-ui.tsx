"use client";

import { useRef, useState } from "react";
import { Draggable } from "gsap/Draggable";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { Heart } from "lucide-react";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import type { ShowcaseProps } from "./registry";

gsap.registerPlugin(Draggable, DrawSVGPlugin, InertiaPlugin, MorphSVGPlugin, Physics2DPlugin);

const SUN = "M50 22a28 28 0 1 1 0 56a28 28 0 1 1 0-56z";
const MOON = "M62 20a30 30 0 1 0 18 52a24 24 0 1 1-18-52z";
const TASKS = ["Сверстать макет", "Подключить API", "Прогнать тесты", "Выкатить релиз"];
const CONFETTI = ["#5b7bff", "#2fd3a0", "#ff6b8b", "#ffc23d", "#b46bff"];

/** Confetti thrown up from a host and falling under gravity; each bit removes itself when it lands. */
function burst(host: HTMLElement, count = 36) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < count; i++) {
    const dot = document.createElement("i");
    dot.className = "mu-bit";
    dot.style.background = CONFETTI[i % CONFETTI.length];
    host.append(dot);
    gsap.to(dot, { physics2D: { velocity: gsap.utils.random(260, 620), angle: gsap.utils.random(200, 340), gravity: 900 }, rotation: gsap.utils.random(-360, 360), opacity: 0, duration: 1.6, ease: "power1.in", onComplete: () => dot.remove() });
  }
}

/**
 * A board of micro-interactions, each answering a person's action: a magnetic button,
 * a spotlight card that tilts, a sun that morphs into the moon, slide to confirm with
 * inertia and confetti, a checklist that draws its ticks, and a like that bursts.
 * Built on GSAP's Draggable, Inertia, MorphSVG, DrawSVG and Physics2D plugins.
 */
export default function MicroUi({ mode }: ShowcaseProps) {
  const board = useRef<HTMLDivElement>(null);
  const [night, setNight] = useState(false);
  const [done, setDone] = useState<boolean[]>([true, false, false, false]);
  const [confirmed, setConfirmed] = useState(false);
  const [likes, setLikes] = useState(128);
  const [liked, setLiked] = useState(false);

  // Magnet, spotlight tilt and slide-to-confirm live for the whole life of the board.
  const { contextSafe } = useGSAP((_, safe) => {
    const root = board.current!;
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      // Magnetic button: the button and its label lean toward the pointer at different strengths.
      const magnet = root.querySelector<HTMLElement>(".mu-magnet")!;
      const label = magnet.querySelector<HTMLElement>("span")!;
      const mx = gsap.quickTo(magnet, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const my = gsap.quickTo(magnet, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const lx = gsap.quickTo(label, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const ly = gsap.quickTo(label, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const field = magnet.parentElement!;
      const pull = (e: PointerEvent) => {
        const b = magnet.getBoundingClientRect();
        const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
        mx(dx * 0.35); my(dy * 0.35); lx(dx * 0.18); ly(dy * 0.18);
      };
      const release = () => { mx(0); my(0); lx(0); ly(0); };
      field.addEventListener("pointermove", pull);
      field.addEventListener("pointerleave", release);

      // Spotlight card: a light follows the pointer and the card tilts toward it.
      const card = root.querySelector<HTMLElement>(".mu-spot")!;
      const rx = gsap.quickTo(card, "rotateX", { duration: 0.5 });
      const ry = gsap.quickTo(card, "rotateY", { duration: 0.5 });
      const light = (e: PointerEvent) => {
        const b = card.getBoundingClientRect();
        const x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
        card.style.setProperty("--x", `${x * 100}%`); card.style.setProperty("--y", `${y * 100}%`);
        ry((x - 0.5) * 18); rx(-(y - 0.5) * 14);
      };
      const off = () => { rx(0); ry(0); };
      card.addEventListener("pointermove", light);
      card.addEventListener("pointerleave", off);
      return () => {
        field.removeEventListener("pointermove", pull); field.removeEventListener("pointerleave", release);
        card.removeEventListener("pointermove", light); card.removeEventListener("pointerleave", off);
      };
    });

    // Slide to confirm: drag with inertia; past 85% it locks and celebrates, otherwise springs back.
    const knob = root.querySelector<HTMLElement>(".mu-knob")!;
    const track = knob.parentElement!;
    const [drag] = Draggable.create(knob, {
      type: "x", bounds: track, inertia: true, edgeResistance: 0.9,
      // contextSafe does not keep Draggable's "this": read the position from the instance itself.
      onDragEnd: safe!(() => {
        const self = Draggable.get(knob);
        const max = track.clientWidth - knob.offsetWidth - 8;
        if (self.x > max * 0.85) {
          gsap.to(knob, { x: max, duration: 0.25 });
          setConfirmed(true);
          burst(track);
          self.disable();
        } else gsap.to(knob, { x: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
      }),
    });
    return () => { drag.kill(); mm.revert(); };
  }, { scope: board });


  const toggleNight = contextSafe(() => {
    const next = !night;
    setNight(next);
    gsap.to(".mu-orb", { morphSVG: next ? MOON : SUN, duration: 0.8, ease: "power3.inOut" });
    gsap.to(".mu-rays line", { scale: next ? 0 : 1, opacity: next ? 0 : 1, transformOrigin: "50% 50%", duration: 0.5, stagger: 0.03 });
  });

  const toggleTask = contextSafe((i: number) => {
    const next = done.map((v, j) => (j === i ? !v : v));
    setDone(next);
    gsap.fromTo(`.mu-task-${i} .mu-tick`, { drawSVG: next[i] ? "0%" : "100%", opacity: 1 }, { drawSVG: next[i] ? "100%" : "0%", opacity: next[i] ? 1 : 0, duration: 0.45, ease: "power2.out" });
    gsap.fromTo(`.mu-task-${i} .mu-strike`, { scaleX: next[i] ? 0 : 1 }, { scaleX: next[i] ? 1 : 0, duration: 0.35, delay: next[i] ? 0.25 : 0, transformOrigin: "0 50%" });
  });

  const like = contextSafe((event: React.MouseEvent<HTMLButtonElement>) => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    gsap.fromTo(event.currentTarget.querySelector("svg"), { scale: 0.6 }, { scale: 1, duration: 0.6, ease: "elastic.out(1.2, 0.4)" });
    if (next) burst(event.currentTarget, 18);
  });

  const reset = contextSafe(() => {
    setConfirmed(false);
    gsap.to(".mu-knob", { x: 0, duration: 0.5, ease: "power3.out", onComplete: () => Draggable.get(".mu-knob")?.enable() });
  });

  return <div className={`mu mu-${mode}`} ref={board} data-night={night || undefined}>
    <section className="mu-tile mu-tile-magnet" aria-label="Магнитная кнопка">
      <h3>Магнит</h3>
      <div className="mu-field"><button type="button" className="mu-magnet"><span>Наведите</span></button></div>
    </section>

    <section className="mu-tile mu-tile-spot" aria-label="Карточка с подсветкой">
      <h3>Свет и наклон</h3>
      <div className="mu-spot-wrap"><div className="mu-spot"><b>Pro</b><strong>990 ₽</strong><small>в месяц</small></div></div>
    </section>

    <section className="mu-tile" aria-label="Переключатель темы">
      <h3>День и ночь</h3>
      <button type="button" className="mu-sky" onClick={toggleNight} aria-pressed={night} aria-label={night ? "Включить день" : "Включить ночь"}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <g className="mu-rays">{Array.from({ length: 8 }, (_, i) => <line key={i} x1="50" y1="8" x2="50" y2="16" transform={`rotate(${i * 45} 50 50)`} />)}</g>
          <path className="mu-orb" d={SUN} />
        </svg>
      </button>
    </section>

    <section className="mu-tile mu-tile-wide" aria-label="Подтверждение свайпом">
      <h3>Свайп для подтверждения</h3>
      <div className="mu-track" data-done={confirmed || undefined}>
        <span className="mu-track-label">{confirmed ? "Оплачено" : "Потяните, чтобы оплатить"}</span>
        <div className="mu-knob" aria-hidden="true">→</div>
      </div>
      <button type="button" className="mu-link" onClick={reset} disabled={!confirmed}>Ещё раз</button>
    </section>

    <section className="mu-tile" aria-label="Список задач">
      <h3>Чек-лист</h3>
      <ul className="mu-tasks">
        {TASKS.map((task, i) => <li key={task} className={`mu-task-${i}`}>
          <button type="button" role="checkbox" aria-checked={done[i]} onClick={() => toggleTask(i)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="6" /><path className="mu-tick" d="M7 12.5l3.2 3.2L17 8.8" style={{ strokeDasharray: done[i] ? undefined : "0 100", opacity: done[i] ? 1 : 0 }} /></svg>
            <span>{task}<i className="mu-strike" style={{ transform: `scaleX(${done[i] ? 1 : 0})` }} /></span>
          </button>
        </li>)}
      </ul>
    </section>

    <section className="mu-tile" aria-label="Лайк">
      <h3>Лайк</h3>
      <button type="button" className="mu-like" aria-pressed={liked} onClick={like}>
        <Heart aria-hidden="true" /><span>{likes}</span>
      </button>
    </section>
  </div>;
}
