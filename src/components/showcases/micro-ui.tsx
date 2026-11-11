"use client";

import { useRef, useState } from "react";
import { Draggable } from "gsap/Draggable";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { Heart, Minus, Plus, RotateCcw } from "lucide-react";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import type { ShowcaseProps } from "./registry";

gsap.registerPlugin(Draggable, DrawSVGPlugin, InertiaPlugin, MorphSVGPlugin, Physics2DPlugin);

const SUN = "M50 22a28 28 0 1 1 0 56a28 28 0 1 1 0-56z";
const MOON = "M62 20a30 30 0 1 0 18 52a24 24 0 1 1-18-52z";
const PRICE = 12990;
const COLORS = [{ name: "Графит", value: "#3b4252", glow: "#7b8cff" }, { name: "Лаванда", value: "#a78bfa", glow: "#d5c4ff" }, { name: "Мята", value: "#4fd1a5", glow: "#b6f5dc" }, { name: "Коралл", value: "#ff7a66", glow: "#ffc9bf" }] as const;
const EXTRAS = [{ name: "Чехол для зарядки", price: 990 }, { name: "Гарантия на 2 года", price: 1490 }, { name: "Доставка завтра", price: 390 }] as const;
const CONFETTI = ["#5b7bff", "#2fd3a0", "#ff6b8b", "#ffc23d", "#b46bff"];
const rub = (value: number) => `${Math.round(value).toLocaleString("ru-RU")} ₽`;

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
 * One checkout screen where every control answers the hand that uses it: the product card
 * tilts under a light, the colour repaints the product, the promo sticker is magnetic, the
 * extras draw their ticks, the total counts to its new value, the theme morphs the sun into
 * the moon, and the payment is a swipe with inertia that ends in confetti and a receipt.
 * Built on GSAP's Draggable, Inertia, MorphSVG, DrawSVG and Physics2D plugins. The shop is invented.
 */
export default function MicroUi({ mode }: ShowcaseProps) {
  const board = useRef<HTMLDivElement>(null);
  const shown = useRef({ value: PRICE });
  const [night, setNight] = useState(true);
  const [color, setColor] = useState(1);
  const [count, setCount] = useState(1);
  const [extras, setExtras] = useState<boolean[]>([true, false, false]);
  const [promo, setPromo] = useState(false);
  const [paid, setPaid] = useState(false);
  const [liked, setLiked] = useState(false);
  const full = PRICE * count + EXTRAS.reduce((sum, extra, i) => sum + (extras[i] ? extra.price : 0), 0);
  const total = promo ? Math.round(full * 0.9) : full;

  // Magnet, spotlight tilt and swipe-to-pay live for the whole life of the screen.
  const { contextSafe } = useGSAP((_, safe) => {
    const root = board.current!;
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      // Magnetic sticker: it and its label lean toward the pointer at different strengths.
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

      // Product card: a light follows the pointer, the card tilts toward it and the product floats above it.
      const card = root.querySelector<HTMLElement>(".mu-spot")!;
      const rx = gsap.quickTo(card, "rotateX", { duration: 0.5 });
      const ry = gsap.quickTo(card, "rotateY", { duration: 0.5 });
      const light = (e: PointerEvent) => {
        const b = card.getBoundingClientRect();
        const x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
        card.style.setProperty("--x", `${x * 100}%`); card.style.setProperty("--y", `${y * 100}%`);
        ry((x - 0.5) * 20); rx(-(y - 0.5) * 16);
      };
      const off = () => { rx(0); ry(0); };
      card.addEventListener("pointermove", light);
      card.addEventListener("pointerleave", off);
      const float = gsap.to(".mu-art", { y: -8, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
      return () => {
        float.kill();
        field.removeEventListener("pointermove", pull); field.removeEventListener("pointerleave", release);
        card.removeEventListener("pointermove", light); card.removeEventListener("pointerleave", off);
      };
    });

    // Swipe to pay: drag with inertia; past 85% it locks and celebrates, otherwise springs back.
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
          setPaid(true);
          burst(track, 48);
          self.disable();
        } else gsap.to(knob, { x: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
      }),
    });
    return () => { drag.kill(); mm.revert(); };
  }, { scope: board });

  // The total counts to its new value instead of jumping.
  useGSAP(() => {
    const node = board.current!.querySelector<HTMLElement>(".mu-sum")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(shown.current, { value: total, duration: still ? 0 : 0.6, ease: "power3.out", overwrite: true, onUpdate: () => { node.textContent = rub(shown.current.value); } });
  }, { scope: board, dependencies: [total] });

  const toggleNight = contextSafe(() => {
    const next = !night;
    setNight(next);
    gsap.to(".mu-orb", { morphSVG: next ? MOON : SUN, duration: 0.8, ease: "power3.inOut" });
    gsap.to(".mu-rays line", { scale: next ? 0 : 1, opacity: next ? 0 : 1, transformOrigin: "50% 50%", duration: 0.5, stagger: 0.03 });
  });

  const pickColor = contextSafe((i: number) => {
    setColor(i);
    gsap.fromTo(".mu-art", { scale: 0.86, rotate: -8 }, { scale: 1, rotate: 0, duration: 0.7, ease: "elastic.out(1, 0.5)" });
  });

  const step = contextSafe((by: number) => {
    const next = Math.max(1, Math.min(9, count + by));
    if (next === count) { gsap.fromTo(".mu-count", { x: -5 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" }); return; }
    setCount(next);
    gsap.fromTo(".mu-count b", { y: by > 0 ? 16 : -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" });
  });

  const toggleExtra = contextSafe((i: number) => {
    const next = extras.map((v, j) => (j === i ? !v : v));
    setExtras(next);
    gsap.fromTo(`.mu-extra-${i} .mu-tick`, { drawSVG: next[i] ? "0%" : "100%", opacity: 1 }, { drawSVG: next[i] ? "100%" : "0%", opacity: next[i] ? 1 : 0, duration: 0.45, ease: "power2.out" });
  });

  const togglePromo = contextSafe((event: React.MouseEvent<HTMLButtonElement>) => {
    const next = !promo;
    setPromo(next);
    gsap.fromTo(event.currentTarget, { rotate: next ? -24 : 12 }, { rotate: 0, duration: 0.9, ease: "elastic.out(1, 0.35)" });
    if (next) burst(event.currentTarget, 14);
  });

  const like = contextSafe((event: React.MouseEvent<HTMLButtonElement>) => {
    const next = !liked;
    setLiked(next);
    gsap.fromTo(event.currentTarget.querySelector("svg"), { scale: 0.5 }, { scale: 1, duration: 0.6, ease: "elastic.out(1.2, 0.4)" });
    if (next) burst(event.currentTarget, 18);
  });

  const reset = contextSafe(() => {
    setPaid(false);
    gsap.to(".mu-knob", { x: 0, duration: 0.5, ease: "power3.out", onComplete: () => Draggable.get(".mu-knob")?.enable() });
  });

  const tint = COLORS[color];
  return <div className={`mu mu-${mode}`} ref={board} data-night={night || undefined} style={{ "--prod": tint.value, "--glow": tint.glow } as React.CSSProperties}>
    <header className="mu-bar">
      <p><b>Aura</b>Оформление заказа · демонстрационный магазин</p>
      <button type="button" className="mu-sky" onClick={toggleNight} aria-pressed={night} aria-label={night ? "Включить дневную тему" : "Включить ночную тему"}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <g className="mu-rays">{Array.from({ length: 8 }, (_, i) => <line key={i} x1="50" y1="6" x2="50" y2="15" transform={`rotate(${i * 45} 50 50)`} style={{ opacity: 0, transform: "scale(0)", transformOrigin: "50% 50%" }} />)}</g>
          <path className="mu-orb" d={MOON} />
        </svg>
      </button>
    </header>

    <div className="mu-scene">
      <section className="mu-product" aria-label="Товар">
        <div className="mu-spot-wrap">
          <div className="mu-spot">
            <svg className="mu-art" viewBox="0 0 200 200" role="img" aria-label={`Наушники Aura One, цвет ${tint.name.toLowerCase()}`}>
              <path className="mu-band" d="M42 118V96a58 58 0 0 1 116 0v22" />
              <rect className="mu-cup" x="24" y="104" width="40" height="64" rx="18" /><rect className="mu-cup" x="136" y="104" width="40" height="64" rx="18" />
              <rect className="mu-pad" x="58" y="112" width="12" height="48" rx="6" /><rect className="mu-pad" x="130" y="112" width="12" height="48" rx="6" />
            </svg>
            <button type="button" className="mu-like" aria-pressed={liked} aria-label={liked ? "Убрать из избранного" : "В избранное"} onClick={like}><Heart aria-hidden="true" /></button>
          </div>
        </div>
        <div className="mu-opts">
          <div className="mu-colors" role="radiogroup" aria-label="Цвет">
            {COLORS.map((item, i) => <button key={item.name} type="button" role="radio" aria-checked={color === i} aria-label={item.name} style={{ "--c": item.value } as React.CSSProperties} onClick={() => pickColor(i)} />)}
            <span>{tint.name}</span>
          </div>
          <div className="mu-count" role="group" aria-label="Количество">
            <button type="button" aria-label="Меньше" onClick={() => step(-1)}><Minus aria-hidden="true" /></button>
            <b aria-live="polite">{count}</b>
            <button type="button" aria-label="Больше" onClick={() => step(1)}><Plus aria-hidden="true" /></button>
          </div>
        </div>
      </section>

      <section className="mu-order" aria-label="Заказ">
        <div className="mu-name"><h3>Aura One</h3><p>Беспроводные наушники с шумоподавлением · {rub(PRICE)}</p></div>
        <ul className="mu-tasks">
          {EXTRAS.map((extra, i) => <li key={extra.name} className={`mu-extra-${i}`}>
            <button type="button" role="checkbox" aria-checked={extras[i]} onClick={() => toggleExtra(i)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="6" /><path className="mu-tick" d="M7 12.5l3.2 3.2L17 8.8" style={{ strokeDasharray: extras[i] ? undefined : "0 100", opacity: extras[i] ? 1 : 0 }} /></svg>
              <span>{extra.name}</span><em>+ {rub(extra.price)}</em>
            </button>
          </li>)}
        </ul>
        <div className="mu-promo">
          <div className="mu-field"><button type="button" className="mu-magnet" aria-pressed={promo} aria-label={promo ? "Убрать промокод DEMO10" : "Применить промокод DEMO10"} onClick={togglePromo}><span>−10%</span></button></div>
          <p>{promo ? "Промокод DEMO10 применён" : "Наведите на стикер и нажмите: промокод DEMO10"}</p>
        </div>
        <div className="mu-total">
          <span>Итого</span>
          {promo && <s>{rub(full)}</s>}
          <strong className="mu-sum" aria-live="polite">{rub(PRICE)}</strong>
        </div>
        <div className="mu-track" data-done={paid || undefined}>
          <span className="mu-track-label">{paid ? "Оплачено · заказ № 2048" : "Потяните, чтобы оплатить"}</span>
          <div className="mu-knob" aria-hidden="true">→</div>
        </div>
        <button type="button" className="mu-link" onClick={reset} disabled={!paid}><RotateCcw aria-hidden="true" />Оформить ещё раз</button>
      </section>
    </div>
  </div>;
}
