"use client";

import { useEffect, useRef, useState } from "react";
import { Brush, Sparkles, Type } from "lucide-react";
import type { ShowcaseProps } from "./registry";

const WORDS = ["Частицы", "Портфолио", "Привет!", "2026"];

type P = { x: number; y: number; vx: number; vy: number; hx: number; hy: number; c: number };

/**
 * Particle type: a word made of thousands of particles on a 2D canvas. Each particle springs
 * to its place in the letters and flees the pointer; a new word re-targets the same
 * particles so they flow from one shape into the next, and "burst" throws them all apart.
 */
export default function ParticleType({ mode }: ShowcaseProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [word, setWord] = useState(WORDS[0]);
  const [drawing, setDrawing] = useState(false);
  const drawingRef = useRef(false);
  useEffect(() => { drawingRef.current = drawing; }, [drawing]);
  const api = useRef<{ setText: (text: string) => void; burst: () => void; clearSketch: () => void }>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const particles: P[] = [];
    let w = 0, h = 0, dpr = 1;
    const pointer = { x: -9999, y: -9999 };
    let text = WORDS[0];

    // Draw the word off screen and keep every n-th lit pixel as a target.
    const targets = (value: string) => {
      const off = document.createElement("canvas");
      off.width = w; off.height = h;
      const o = off.getContext("2d")!;
      let size = Math.min(h * 0.42, (w * 1.5) / Math.max(4, value.length));
      o.font = `800 ${size}px Unbounded, "Unbounded Fallback", sans-serif`;
      const measured = o.measureText(value).width;
      if (measured > w * 0.9) { size *= (w * 0.9) / measured; o.font = `800 ${size}px Unbounded, "Unbounded Fallback", sans-serif`; }
      o.fillStyle = "#fff"; o.textAlign = "center"; o.textBaseline = "middle";
      o.fillText(value, w / 2, h * 0.44);
      return sample(off);
    };
    // Keep every n-th lit pixel of an off-screen canvas as a target.
    const sample = (off: HTMLCanvasElement) => {
      const data = off.getContext("2d")!.getImageData(0, 0, w, h).data;
      const gap = Math.max(3, Math.round(Math.sqrt((w * h) / 70000)));
      const points: [number, number][] = [];
      for (let y = 0; y < h; y += gap) for (let x = 0; x < w; x += gap) if (data[(y * w + x) * 4 + 3] > 128) points.push([x, y]);
      return points;
    };
    const retarget = (value: string) => { text = value; aim(targets(value)); };
    const aim = (points: [number, number][]) => {
      if (!points.length) return;
      // Shuffle so particles cross the stage instead of sliding sideways in rows.
      for (let i = points.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [points[i], points[j]] = [points[j], points[i]]; }
      while (particles.length < points.length) particles.push({ x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, hx: 0, hy: 0, c: Math.random() });
      particles.length = points.length;
      points.forEach(([x, y], i) => { particles[i].hx = x; particles[i].hy = y; });
      if (reduced) particles.forEach((p) => { p.x = p.hx; p.y = p.hy; });
    };
    // The sketch: strokes drawn by the reader, kept off screen and sampled like a word.
    const sketch = document.createElement("canvas");
    let strokes: [number, number][][] = [];
    const paintSketch = () => {
      sketch.width = w; sketch.height = h;
      const s2 = sketch.getContext("2d")!;
      s2.strokeStyle = "#fff"; s2.lineCap = "round"; s2.lineJoin = "round"; s2.lineWidth = Math.max(18, Math.min(w, h) * 0.045);
      for (const line of strokes) { s2.beginPath(); line.forEach(([x, y], i) => (i ? s2.lineTo(x, y) : s2.moveTo(x, y))); if (line.length === 1) s2.lineTo(line[0][0] + 0.1, line[0][1]); s2.stroke(); }
    };
    let pen: [number, number][] | null = null;
    const resize = () => {
      dpr = Math.min(devicePixelRatio, 2);
      w = el.clientWidth; h = el.clientHeight;
      el.width = Math.round(w * dpr); el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (drawingRef.current && strokes.length) { paintSketch(); aim(sample(sketch)); } else retarget(text);
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // The stroke being drawn shows as a faint guide until the particles take its shape.
      if (pen && pen.length > 1) {
        ctx.save(); ctx.strokeStyle = "rgb(255 255 255 / 0.18)"; ctx.lineWidth = Math.max(18, Math.min(w, h) * 0.045); ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath(); pen.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore();
      }
      for (const p of particles) {
        if (!reduced) {
          const dx = p.x - pointer.x, dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 9000) { const f = (9000 - d2) / 9000 * 2.2; const d = Math.sqrt(d2) || 1; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
          p.vx += (p.hx - p.x) * 0.012; p.vy += (p.hy - p.y) * 0.012;
          p.vx *= 0.88; p.vy *= 0.88;
          p.x += p.vx; p.y += p.vy;
        }
        const speed = Math.min(1, Math.hypot(p.vx, p.vy) / 8);
        ctx.fillStyle = `hsl(${220 + p.c * 110 + speed * 40} 90% ${62 + speed * 25}%)`;
        ctx.fillRect(p.x, p.y, 2.4, 2.4);
      }
    };
    let frame = 0, visible = true;
    const loop = () => { draw(); frame = visible ? requestAnimationFrame(loop) : 0; };
    const at = (e: PointerEvent): [number, number] => { const b = el.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    const down = (e: PointerEvent) => { if (!drawingRef.current) return; el.setPointerCapture(e.pointerId); pen = [at(e)]; };
    const move = (e: PointerEvent) => {
      const [x, y] = at(e);
      if (pen) { pen.push([x, y]); if (reduced) draw(); return; }
      if (!drawingRef.current) { pointer.x = x; pointer.y = y; }
    };
    const up = () => {
      if (!pen) return;
      strokes.push(pen); pen = null;
      paintSketch(); aim(sample(sketch));
      if (reduced) draw();
    };
    const leave = () => { pointer.x = -9999; pointer.y = -9999; };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointerleave", leave);
    const ro = new ResizeObserver(() => { resize(); if (reduced) draw(); });
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !frame && !reduced) frame = requestAnimationFrame(loop); });
    io.observe(el);
    // The display face may still be loading: re-target once it is ready so letters keep their shape.
    document.fonts?.ready.then(() => { retarget(text); if (reduced) draw(); });
    resize();
    if (reduced) draw(); else frame = requestAnimationFrame(loop);
    api.current = {
      setText: (value) => { strokes = []; retarget(value); if (reduced) draw(); },
      clearSketch: () => { strokes = []; pen = null; retarget(text); if (reduced) draw(); },
      burst: () => particles.forEach((p) => { const a = Math.random() * Math.PI * 2, s = 10 + Math.random() * 22; p.vx += Math.cos(a) * s; p.vy += Math.sin(a) * s; }),
    };
    return () => { cancelAnimationFrame(frame); ro.disconnect(); io.disconnect(); el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointerleave", leave); api.current = null; };
  }, []);

  const choose = (value: string) => { setDrawing(false); setWord(value); api.current?.setText(value.trim() || " "); };

  return <div className={`pt pt-${mode}`} data-drawing={drawing || undefined}>
    <canvas ref={canvas} className="pt-canvas" role="img" aria-label={drawing ? "Рисунок из частиц" : `Слово из частиц: ${word}`} />
    {drawing && <p className="pt-hint" aria-hidden="true">Рисуйте — частицы соберутся в ваш рисунок</p>}
    <div className="pt-panel" data-lg="surface">
      <input value={word} maxLength={14} aria-label="Слово" onChange={(e) => choose(e.target.value)} />
      <div className="pt-words">{WORDS.map((item) => <button key={item} type="button" aria-pressed={word === item} onClick={() => choose(item)}>{item}</button>)}</div>
      <button type="button" className="pt-mode" aria-pressed={drawing} onClick={() => { if (drawing) { setDrawing(false); api.current?.clearSketch(); } else setDrawing(true); }}>{drawing ? <><Type aria-hidden="true" />Слово</> : <><Brush aria-hidden="true" />Рисовать</>}</button>
      <button type="button" className="button button-primary" data-lg="button" data-lg-variant="prominent" onClick={() => api.current?.burst()}><Sparkles aria-hidden="true" />Взрыв</button>
    </div>
  </div>;
}
