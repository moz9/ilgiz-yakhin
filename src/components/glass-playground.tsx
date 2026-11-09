"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_GLASS_DENSITY, GLASS_DENSITY_KEY, loadGlassKit, useGlassTabs } from "@/components/glass/glass-runtime";

const shapes = [
  { label: "Капля", size: (w: number) => { const s = Math.min(220, w * 0.42); return { w: s, h: s, r: s / 2 }; } },
  { label: "Капсула", size: (w: number) => { const s = Math.min(340, w * 0.7); return { w: s, h: s * 0.38, r: s * 0.19 }; } },
  { label: "Панель", size: (w: number) => { const s = Math.min(380, w * 0.78); return { w: s, h: s * 0.56, r: 34 }; } },
];

/**
 * The case's live proof: the real kit over a real scene. The reader drags the lens across
 * text, a map and screens of the case and sees them bend at the rim, changes its shape and
 * moves the same density slider the whole site uses. Without a pointer the lens drifts on
 * a slow loop; with reduced motion it rests and only moves where it is dragged.
 */
export function GlassPlayground() {
  const stage = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const density = useRef<HTMLInputElement>(null);
  const [shape, setShape] = useState(0);
  const [value, setValue] = useState(DEFAULT_GLASS_DENSITY);
  const shapeRef = useRef(shape);
  const apply = useRef<() => void>(() => {});
  useGlassTabs(tabs, shape, setShape);

  useEffect(() => { shapeRef.current = shape; apply.current(); }, [shape]);

  useEffect(() => {
    const host = stage.current;
    const input = density.current;
    if (!host || !input) return;
    let cancelled = false;
    let cleanup = () => {};
    Promise.all([loadGlassKit(), import("@/lib/liquid-glass/liquid-glass.js")]).then(([kit, core]) => {
      if (cancelled) return;
      const slider = kit.mountDensity(input, { storageKey: GLASS_DENSITY_KEY, defaultValue: DEFAULT_GLASS_DENSITY });
      const lens = kit.createLens(host, { className: "playground-lens" });
      const reduced = matchMedia("(prefers-reduced-motion: reduce)");
      const spring = { response: 0.5, dampingRatio: 0.78 };
      const x = new core.Spring(0, spring);
      const y = new core.Spring(0, spring);
      const w = new core.Spring(0, spring);
      const h = new core.Spring(0, spring);
      const r = new core.Spring(0, spring);
      const grow = new core.Spring(0, { response: 0.35, dampingRatio: 0.7 });
      let dragging = false;
      let touched = false;
      let visible = false;
      let idle = 0;
      const start = performance.now();

      const render = () => {
        const speed = Math.min(1, (Math.abs(x.velocity) + Math.abs(y.velocity)) / 2600);
        const stretch = 1 + speed * 0.14;
        const scale = 1 + grow.value * 0.08;
        const lw = w.value * scale * stretch;
        const lh = h.value * scale / Math.sqrt(stretch);
        lens.set({
          x: x.value - lw / 2, y: y.value - lh / 2, w: lw, h: lh, r: Math.min(r.value * scale, lw / 2, lh / 2),
          lift: 0.4 + grow.value * 0.4, strength: 36 + grow.value * 10, bezel: Math.min(44, Math.min(lw, lh) * 0.24), magnify: 1.2 + grow.value * 0.06, blur: 0,
        });
      };
      const driver = core.springDriver(render);
      driver.add(x, y, w, h, r, grow);
      const settle = (instant: boolean) => {
        if (instant || reduced.matches) { for (const s of [x, y, w, h, r]) s.set(s.target); render(); } else driver.kick();
      };
      const resize = (instant = false) => {
        const size = shapes[shapeRef.current].size(host.clientWidth);
        w.target = size.w; h.target = size.h; r.target = size.r;
        settle(instant);
      };
      const clampPoint = (px: number, py: number) => ({
        x: Math.max(w.target / 2, Math.min(host.clientWidth - w.target / 2, px)),
        y: Math.max(h.target / 2, Math.min(host.clientHeight - h.target / 2, py)),
      });
      const place = (px: number, py: number, instant = false) => {
        const point = clampPoint(px, py);
        x.target = point.x; y.target = point.y;
        settle(instant);
      };
      apply.current = () => { resize(); place(x.target, y.target); };

      resize(true);
      place(host.clientWidth * 0.3, host.clientHeight * 0.42, true);

      // Until the reader takes the lens, it wanders over the scene on a slow loop.
      const drift = (now: number) => {
        idle = 0;
        if (cancelled || touched || !visible || reduced.matches) return;
        const t = (now - start) / 1000;
        place(host.clientWidth * (0.5 + Math.sin(t * 0.33) * 0.3), host.clientHeight * (0.5 + Math.sin(t * 0.51 + 0.8) * 0.26));
        idle = requestAnimationFrame(drift);
      };
      const startDrift = () => { if (!idle && !touched && !reduced.matches) idle = requestAnimationFrame(drift); };

      const point = (event: PointerEvent) => {
        const box = host.getBoundingClientRect();
        return [event.clientX - box.left, event.clientY - box.top] as const;
      };
      const onDown = (event: PointerEvent) => {
        if (event.button !== 0) return;
        touched = true; dragging = true;
        host.setPointerCapture(event.pointerId);
        grow.target = 1;
        place(...point(event));
        host.dataset.dragging = "true";
      };
      const onMove = (event: PointerEvent) => { if (dragging) place(...point(event)); };
      const onUp = () => {
        if (!dragging) return;
        dragging = false; grow.target = 0; driver.kick();
        delete host.dataset.dragging;
      };
      const onKey = (event: KeyboardEvent) => {
        const step = event.shiftKey ? 64 : 24;
        const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        const move = moves[event.key];
        if (!move) return;
        event.preventDefault();
        touched = true;
        place(x.target + move[0], y.target + move[1]);
      };
      const onResize = () => { resize(true); place(x.target, y.target, true); };
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) startDrift(); });
      observer.observe(host);
      host.addEventListener("pointerdown", onDown);
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerup", onUp);
      host.addEventListener("pointercancel", onUp);
      host.addEventListener("keydown", onKey);
      window.addEventListener("resize", onResize);
      const offGlass = kit.onGlassChange(render);
      const sync = () => setValue(Number(input.value));
      input.addEventListener("input", sync);
      sync();

      cleanup = () => {
        cancelAnimationFrame(idle);
        driver.stop();
        observer.disconnect();
        offGlass();
        host.removeEventListener("pointerdown", onDown);
        host.removeEventListener("pointermove", onMove);
        host.removeEventListener("pointerup", onUp);
        host.removeEventListener("pointercancel", onUp);
        host.removeEventListener("keydown", onKey);
        window.removeEventListener("resize", onResize);
        input.removeEventListener("input", sync);
        apply.current = () => {};
        lens.destroy();
        slider.destroy();
      };
    });
    return () => { cancelled = true; cleanup(); };
  }, []);

  return <section id="playground" className="case-section playground" aria-labelledby="playground-title">
    <div className="case-section-head">
      <h2 id="playground-title">Попробуйте сами</h2>
      <p>Это настоящий кит, а не запись. Перетащите линзу по сцене: под ней обычный HTML — текст, карта и экраны кейса.</p>
    </div>
    <div className="playground-controls" data-lg="surface">
      <div className="playground-shapes" ref={tabs} role="tablist" aria-label="Форма линзы">
        {shapes.map((item, index) => <button key={item.label} type="button" role="tab" aria-selected={shape === index} tabIndex={shape === index ? 0 : -1}>{item.label}</button>)}
      </div>
      <label className="playground-density">
        <span>Плотность стекла <output>{value}%</output></span>
        <input ref={density} type="range" min="0" max="100" step="1" defaultValue={DEFAULT_GLASS_DENSITY} aria-describedby="playground-density-note" />
        <small id="playground-density-note">Та же настройка, что в «Внешнем виде»: она меняет стекло на всём сайте.</small>
      </label>
    </div>
    <div className="playground-stage" ref={stage} tabIndex={0} role="application" aria-roledescription="Площадка для линзы" aria-label="Площадка с линзой. Стрелки двигают линзу, с Shift — быстрее.">
      <div className="playground-scene" aria-hidden="true">
        <span className="playground-blob is-a" /><span className="playground-blob is-b" /><span className="playground-blob is-c" />
        <p className="playground-word">Стекло</p>
        <p className="playground-word is-outline">видит мир</p>
        <svg className="playground-map" viewBox="0 0 600 260" preserveAspectRatio="none">
          <path d="M0 200 C120 120 200 230 320 150 S520 60 600 110" />
          <path d="M0 60 C140 90 260 20 380 70 S540 200 600 170" className="is-dashed" />
        </svg>
        <ul className="playground-lines">{Array.from({ length: 5 }, (_, i) => <li key={i}>Маршрут {i + 1} · {12 + i * 6} мин · набережная, мост, вершина 2 140 м</li>)}</ul>
      </div>
      <p className="playground-hint" aria-hidden="true">Тяните</p>
    </div>
  </section>;
}
