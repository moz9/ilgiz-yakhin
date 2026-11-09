"use client";

import { useEffect, useRef, useState } from "react";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { gsap, MOTION, ScrollTrigger, STILL, useGSAP } from "@/lib/gsap";
import type { ShowcaseProps } from "./registry";

gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin);

const ROUTE = "M120 120 C 420 60, 560 260, 840 200 S 1260 120, 1300 340 S 960 560, 640 520 S 160 600, 200 760 S 820 900, 1320 820";
const STOPS = [
  { at: 0.02, x: 120, y: 120, title: "Заказ принят", text: "Корзина превращается в задачу для склада", value: 1, unit: "мин" },
  { at: 0.3, x: 1300, y: 340, title: "Собран на складе", text: "Сборщик закрывает позиции со сканера", value: 14, unit: "мин" },
  { at: 0.62, x: 200, y: 760, title: "В пути", text: "Курьер видит маршрут и окно доставки", value: 37, unit: "км" },
  { at: 0.96, x: 1320, y: 820, title: "Получено", text: "Подпись клиента — и заказ закрыт", value: 2, unit: "ч 05 мин" },
];

/** The same route for tall screens: every point mirrored across the diagonal (x and y swapped). */
const transpose = (path: string) => path.replace(/(-?\d+(?:\.\d+)?)\s*,?\s+(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${y} ${x}`);

/**
 * Scroll story: an order's path told by scrolling. The route draws itself (DrawSVG), a van
 * rides along it (MotionPath), stops light up and their numbers count in — all scrubbed by
 * one ScrollTrigger inside the demo's own scroller, so it works embedded in a page.
 */
export default function ScrollStory({ mode }: ShowcaseProps) {
  const scroller = useRef<HTMLDivElement>(null);
  // Tall stages (a phone) get the route turned on its side, so the map fills the screen.
  const [tall, setTall] = useState(false);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTall(el.clientHeight > el.clientWidth * 1.1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const route = tall ? transpose(ROUTE) : ROUTE;
  const W = tall ? 900 : 1440, H = tall ? 1440 : 900;
  const stops = STOPS.map((stop) => (tall ? { ...stop, x: stop.y, y: stop.x } : stop));

  useGSAP(() => {
    const root = scroller.current!;
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root.querySelector(".ss-track"), scroller: root, start: "top top", end: "bottom bottom", scrub: 0.8 } });
      tl.fromTo(".ss-path", { drawSVG: "0%" }, { drawSVG: "100%", duration: 1 }, 0)
        .to(".ss-van", { duration: 1, motionPath: { path: ".ss-path", align: ".ss-path", alignOrigin: [0.5, 0.5], autoRotate: true }, immediateRender: true }, 0)
        .fromTo(".ss-bar i", { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
      // The first stop is the starting point: it is on screen before any scrolling.
      STOPS.forEach((stop, i) => {
        if (i === 0) return;
        // GSAP owns the card's transform; the offset from its point stays on the outer item.
        tl.fromTo(`.ss-stop-${i} .ss-card`, { autoAlpha: 0, y: 40, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.06, ease: "power2.out" }, Math.max(0, stop.at - 0.04))
          .fromTo(`.ss-dot-${i}`, { scale: 0 }, { scale: 1, duration: 0.04, ease: "back.out(3)", transformOrigin: "50% 50%" }, Math.max(0, stop.at - 0.02))
          .from(`.ss-stop-${i} .ss-num`, { textContent: 0, snap: { textContent: 1 }, duration: 0.08 }, stop.at - 0.02);
      });
      ScrollTrigger.refresh();
    });
    mm.add(STILL, () => { gsap.set(".ss-van", { autoAlpha: 0 }); });
    return () => mm.revert();
  }, { scope: scroller, dependencies: [tall], revertOnUpdate: true });

  return <div className={`ss ss-${mode}`} ref={scroller} tabIndex={0} aria-label="История заказа: листайте внутри блока">
    <div className="ss-track">
      <div className="ss-stage">
        <div className="ss-bar" aria-hidden="true"><i /></div>
        {/* Map and stop cards share one 16:10 box, so card positions match the route at any size. */}
        <div className="ss-canvas" data-tall={tall || undefined}>
        <svg className="ss-map" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <path className="ss-ghost" d={route} />
          <path className="ss-path" d={route} />
          {stops.map((stop, i) => <circle key={stop.title} className={`ss-dot ss-dot-${i}`} cx={stop.x} cy={stop.y} r="14" />)}
          <g className="ss-van"><rect x="-26" y="-14" width="52" height="28" rx="8" /><rect x="10" y="-10" width="12" height="20" rx="3" className="ss-van-cab" /></g>
        </svg>
        <ol className="ss-stops">
          {stops.map((stop, i) => <li key={stop.title} className={`ss-stop ss-stop-${i}`} data-side={stop.x > W / 2 ? "left" : "right"} data-v={stop.y > H / 2 ? "up" : "down"} style={{ left: `${(stop.x / W) * 100}%`, top: `${(stop.y / H) * 100}%` }}>
            <div className="ss-card">
              <strong><span className="ss-num">{stop.value}</span> {stop.unit}</strong>
              <b>{stop.title}</b><small>{stop.text}</small>
            </div>
          </li>)}
        </ol>
        </div>
        <p className="ss-hint" aria-hidden="true">Листайте внутри блока ↓</p>
        <p className="ss-note">Демонстрационный сценарий</p>
      </div>
    </div>
  </div>;
}
