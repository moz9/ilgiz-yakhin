"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { RotateCw } from "lucide-react";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";

type Offer = { shop: string; color: string; price: number; bank: number | null; seller: string; city: boolean; stock: boolean };
const BASE: Offer[] = [
  { shop: "DNS", color: "#ff8a3d", price: 54999, bank: null, seller: "DNS", city: true, stock: true },
  { shop: "Ozon", color: "#3b82f6", price: 56240, bank: 52790, seller: "Партнёр Ozon", city: false, stock: true },
  { shop: "Яндекс Маркет", color: "#f5c518", price: 55870, bank: 53490, seller: "Партнёр Маркета", city: false, stock: false },
];
const rub = (v: number) => `${Math.round(v).toLocaleString("ru-RU")} ₽`;
/** Ninety days of a believable price walk that ends at today's best ordinary price. */
function history(end: number, seed: number) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const out = [end * 1.12];
  for (let i = 1; i < 30; i++) out.push(out[i - 1] * (0.985 + rnd() * 0.028));
  const k = end / out[out.length - 1];
  return out.map((v) => v * k);
}

/**
 * Act two of the PCStudio case: how a price reaches a build. Three shop cards are checked in
 * turn by the browser extension; their prices travel along the wires into the build item,
 * which picks the best ordinary price, keeps the bank-card price apart and draws the history.
 * Prices are demo values in the product's real format.
 */
export function PricePath() {
  const root = useRef<HTMLElement>(null);
  const [offers, setOffers] = useState(BASE);
  const [round, setRound] = useState(0);
  const [checked, setChecked] = useState(-1);
  const [seed, setSeed] = useState(7);
  // The best ordinary price wins; a bank-card price is shown, never silently used instead.
  const ordinary = offers.filter((o, i) => i <= checked && o.stock);
  const best = ordinary.length ? ordinary.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const points = best ? history(best.price, seed) : [];
  const min = Math.min(...points), max = Math.max(...points);
  const line = points.map((v, i) => `${i ? "L" : "M"}${(i / (points.length - 1)) * 300} ${70 - ((v - min) / (max - min || 1)) * 60}`).join(" ");

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      // One check: shops light up in turn, a pulse runs along each wire, the build item updates.
      const tl = gsap.timeline({ scrollTrigger: round === 0 ? { trigger: root.current, start: "top 65%", once: true } : undefined, onStart: () => setChecked(-1) });
      BASE.forEach((_, i) => {
        tl.fromTo(`.pp-shop-${i}`, { scale: 0.96, boxShadow: "0 0 0 0 rgb(255 138 92 / 0)" }, { scale: 1, boxShadow: "0 0 0 2px rgb(255 138 92 / 0.9)", duration: 0.35, ease: "power2.out" }, i * 0.9)
          .fromTo(`.pp-pulse-${i}`, { attr: { "stroke-dashoffset": 320 } }, { attr: { "stroke-dashoffset": 0 }, duration: 0.6, ease: "power1.in", onComplete: () => setChecked(i) }, i * 0.9 + 0.2)
          .to(`.pp-shop-${i}`, { boxShadow: "0 0 0 1px rgb(255 255 255 / 0.12)", duration: 0.4 }, i * 0.9 + 0.8);
      });
      tl.fromTo(".pp-spark", { attr: { "stroke-dashoffset": 600 } }, { attr: { "stroke-dashoffset": 0 }, duration: 1.1, ease: "power2.out" }, ">-0.1");
    });
    mm.add("(prefers-reduced-motion: reduce)", () => setChecked(BASE.length - 1));
    return () => mm.revert();
  }, { scope: root, dependencies: [round], revertOnUpdate: true });

  const again = () => {
    // A new check: prices move a little, as they do between two real visits.
    setOffers(BASE.map((o) => {
      const k = 0.96 + Math.random() * 0.07;
      return { ...o, price: Math.round((o.price * k) / 10) * 10, bank: o.bank ? Math.round((o.bank * k) / 10) * 10 : null };
    }));
    setSeed((s) => s + 11);
    setRound((r) => r + 1);
  };

  return <section id="prices" className="case-section pp" aria-labelledby="pp-title" ref={root}>
    <div className="case-section-head">
      <h2 id="pp-title">Цена приходит к вам</h2>
      <p>Расширение проверяет карточки магазинов в вашем браузере — с вашим городом — и приносит в сборку только цену, продавца, артикул и наличие. Цены здесь демонстрационные, формат — как в PCStudio.</p>
    </div>
    <div className="pp-stage">
      <ol className="pp-shops">
        {offers.map((o, i) => <li key={o.shop} className={`pp-shop pp-shop-${i}`} data-done={i <= checked || undefined}>
          <span className="pp-dot" style={{ background: o.color }} aria-hidden="true" />
          <b>{o.shop}</b>
          <strong>{i <= checked ? rub(o.price) : "…"}</strong>
          <small>{i > checked ? "ждёт проверки" : o.stock ? (o.city ? "в вашем городе" : "город не подтверждён") : "нет в наличии"}</small>
          {o.bank && i <= checked && <small className="pp-bank">с картой банка: {rub(o.bank)}</small>}
        </li>)}
      </ol>
      <svg className="pp-wires" viewBox="0 0 320 300" preserveAspectRatio="none" aria-hidden="true">
        {[50, 150, 250].map((y, i) => <g key={y}>
          <path d={`M0 ${y} C 160 ${y}, 160 150, 320 150`} className="pp-wire" />
          <path d={`M0 ${y} C 160 ${y}, 160 150, 320 150`} className={`pp-pulse pp-pulse-${i}`} style={{ stroke: BASE[i].color }} />
        </g>)}
      </svg>
      <article className="pp-item" aria-live="polite">
        <p className="pp-kicker">Деталь сборки</p>
        <h3>Видеокарта<br /><span>Sapphire Pulse RX 7800 XT</span></h3>
        <p className="pp-best">{best ? rub(best.price) : "—"}<small>{best ? `лучшая обычная цена · ${best.shop}` : "проверяю магазины"}</small></p>
        <svg className="pp-chart" viewBox="0 0 300 80" aria-hidden="true">{best && <path className="pp-spark" d={line} />}</svg>
        <p className="pp-note">{best ? "История за 90 дней · цена «с картой банка» хранится отдельно и не подменяет обычную" : "Город и наличие помечаются, а не угадываются"}</p>
        <button type="button" className="pp-again" onClick={again}><RotateCw aria-hidden="true" />Проверить ещё раз</button>
      </article>
    </div>
  </section>;
}

/**
 * Act three: the two showcase workplaces, rendered in Blender from the product's own geometry,
 * under one before/after handle. Drag, tap or use the arrow keys.
 */
export function TwoSides() {
  const [split, setSplit] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = (e: React.PointerEvent) => {
    if (e.type === "pointerdown") (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    else if (!(e.buttons & 1)) return;
    const r = box.current!.getBoundingClientRect();
    setSplit(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
  };
  return <section id="sides" className="case-section ts" aria-labelledby="ts-title">
    <div className="case-section-head">
      <h2 id="ts-title">Светлая и тёмная сторона</h2>
      <p>Две витринные сборки — студийные рендеры Blender из той же геометрии, что крутится на сайте в three.js. Тяните ручку.</p>
    </div>
    <div className="ts-stage" ref={box} onPointerDown={drag} onPointerMove={drag} style={{ "--split": `${split}%` } as React.CSSProperties}>
      <Image src="/cases/pcstudio-setup-white.webp" alt="Светлое рабочее место: белый корпус с вентиляторами, монитор, клавиатура и мышь на белом столе" fill sizes="(max-width: 900px) 94vw, 1200px" />
      <Image className="ts-top" src="/cases/pcstudio-setup-dark.webp" alt="Тёмное рабочее место: корпус с деревянными рейками, монитор, клавиатура и мышь на тёмном столе" fill sizes="(max-width: 900px) 94vw, 1200px" />
      <span className="ts-tag ts-tag-dark">Тёмная<small>Fractal North · Ryzen 7 7800X3D · RX 7800 XT</small></span>
      <span className="ts-tag ts-tag-light">Светлая<small>JONSBO TK-5 White · Core Ultra 9 · RTX 5090</small></span>
      <span className="ts-handle" aria-hidden="true" />
      <input className="ts-range" type="range" min="0" max="100" value={split} onChange={(e) => setSplit(Number(e.target.value))} aria-label="Граница между тёмной и светлой сборкой" />
    </div>
  </section>;
}
