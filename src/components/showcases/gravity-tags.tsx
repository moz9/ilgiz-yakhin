"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { Orbit, RotateCcw, Waves } from "lucide-react";
import { allProjects } from "@/lib/projects";
import type { ShowcaseProps } from "./registry";

// Every technology named in the case catalogue, so the pile is the real stack, not filler.
const TAGS = [...new Set(allProjects.flatMap((project) => project.stack.map((item) => item.split(" (")[0])))].slice(0, 34);
const HUES = ["#5b7bff", "#2fd3a0", "#ff6b8b", "#ffc23d", "#b46bff", "#3ba8ff"];

/**
 * Gravity: the stack as physical objects. Tags drop in when the scene comes into view,
 * collide, can be grabbed and thrown; "shake" kicks them, "zero gravity" lets them float,
 * and on a phone tilting the device turns gravity. Matter.js simulates, the DOM draws:
 * each tag is a real element moved by transform, so text stays crisp and selectable.
 */
export default function GravityTags({ mode }: ShowcaseProps) {
  const box = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLSpanElement | null)[]>([]);
  const api = useRef<{ shake: () => void; reset: () => void; float: (on: boolean) => void }>(null);
  const [floating, setFloating] = useState(false);

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const { Engine, Bodies, Body, Composite, Constraint, Query } = Matter;
    const engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.0011 } });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = host.clientWidth;
    let height = host.clientHeight;
    let walls: Matter.Body[] = [];
    const build = () => {
      Composite.remove(engine.world, walls);
      const t = 200;
      walls = [
        Bodies.rectangle(width / 2, height + t / 2, width * 3, t, { isStatic: true }),
        Bodies.rectangle(-t / 2, height / 2, t, height * 4, { isStatic: true }),
        Bodies.rectangle(width + t / 2, height / 2, t, height * 4, { isStatic: true }),
        Bodies.rectangle(width / 2, -height * 1.5 - t / 2, width * 3, t, { isStatic: true }),
      ];
      Composite.add(engine.world, walls);
    };
    build();

    const elements = items.current.filter(Boolean) as HTMLSpanElement[];
    const bodies = elements.map((el, i) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const x = 40 + ((i * 97) % Math.max(1, width - 80));
      const y = -60 - i * 38;
      const body = Bodies.rectangle(x, y, w, h, { chamfer: { radius: h / 2 }, restitution: 0.35, friction: 0.08, frictionAir: 0.012, angle: ((i % 5) - 2) * 0.2 });
      return { body, el, w, h };
    });
    Composite.add(engine.world, bodies.map((b) => b.body));

    const place = () => {
      for (const { body, el, w, h } of bodies) {
        el.style.transform = `translate(${body.position.x - w / 2}px, ${body.position.y - h / 2}px) rotate(${body.angle}rad)`;
      }
    };
    const scatter = () => bodies.forEach(({ body }, i) => {
      Body.setPosition(body, { x: 40 + ((i * 97) % Math.max(1, width - 80)), y: -60 - i * 38 });
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngle(body, ((i % 5) - 2) * 0.2);
    });
    // Without motion the pile is laid out at rest: run the simulation ahead instantly.
    const settle = () => { for (let i = 0; i < 600; i++) Engine.update(engine, 1000 / 60); place(); };

    // Grab and throw: a soft spring from the pointer to the grabbed point of the tag.
    let grab: Matter.Constraint | null = null;
    const local = (event: PointerEvent) => { const r = host.getBoundingClientRect(); return { x: event.clientX - r.left, y: event.clientY - r.top }; };
    const down = (event: PointerEvent) => {
      if ((event.target as HTMLElement).closest("button")) return;
      const point = local(event);
      const [hit] = Query.point(bodies.map((b) => b.body), point);
      if (!hit) return;
      event.preventDefault();
      (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
      grab = Constraint.create({ pointA: point, bodyB: hit, pointB: { x: point.x - hit.position.x, y: point.y - hit.position.y }, stiffness: 0.18, damping: 0.08, length: 0 });
      Composite.add(engine.world, grab);
      host.dataset.grabbing = "true";
    };
    const move = (event: PointerEvent) => { if (grab) grab.pointA = local(event); };
    const up = () => { if (grab) { Composite.remove(engine.world, grab); grab = null; delete host.dataset.grabbing; } };
    host.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    // A tilted phone turns gravity (Android grants orientation without a prompt).
    const tilt = (event: DeviceOrientationEvent) => {
      if (event.gamma == null || event.beta == null || engine.gravity.scale === 0) return;
      engine.gravity.x = Math.max(-1, Math.min(1, event.gamma / 45));
      engine.gravity.y = Math.max(-1, Math.min(1, event.beta / 45));
    };
    window.addEventListener("deviceorientation", tilt);

    api.current = {
      shake: () => {
        bodies.forEach(({ body }) => Body.setVelocity(body, { x: (Math.random() - 0.5) * 30, y: -10 - Math.random() * 18 }));
        if (reduced) settle();
      },
      reset: () => { scatter(); if (reduced) settle(); },
      float: (on) => {
        engine.gravity.scale = on ? 0 : 0.0011;
        engine.gravity.x = 0;
        engine.gravity.y = 1;
        if (on) bodies.forEach(({ body }) => Body.setVelocity(body, { x: (Math.random() - 0.5) * 4, y: -2 - Math.random() * 4 }));
      },
    };

    let frame = 0;
    let visible = false;
    let started = false;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      Engine.update(engine, dt);
      place();
      frame = visible ? requestAnimationFrame(loop) : 0;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible || reduced) return;
      // The pile drops in the first time the scene is seen.
      if (!started) { started = true; scatter(); }
      if (!frame) { last = performance.now(); frame = requestAnimationFrame(loop); }
    }, { threshold: 0.25 });
    observer.observe(host);
    if (reduced) settle(); else place();

    const ro = new ResizeObserver(() => {
      width = host.clientWidth;
      height = host.clientHeight;
      build();
      // Keep every tag inside the new box.
      bodies.forEach(({ body }) => Body.setPosition(body, { x: Math.min(Math.max(body.position.x, 40), width - 40), y: Math.min(body.position.y, height - 40) }));
      if (reduced) settle();
    });
    ro.observe(host);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      ro.disconnect();
      host.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("deviceorientation", tilt);
      Engine.clear(engine);
      api.current = null;
    };
  }, []);

  return <div className={`gt gt-${mode}`} ref={box}>
    <p className="gt-title" aria-hidden="true">Стек<br />в невесомости</p>
    <ul className="gt-pile" aria-label="Технологии из кейсов">
      {TAGS.map((tag, i) => <li key={tag}>
        <span ref={(el) => { items.current[i] = el; }} className="gt-tag" style={{ "--tag": HUES[i % HUES.length] } as React.CSSProperties} data-shape={i % 7 === 3 ? "round" : undefined}>{tag}</span>
      </li>)}
    </ul>
    <div className="gt-actions" data-lg="surface">
      <button type="button" className="button" data-lg="button" onClick={() => api.current?.shake()}><Waves aria-hidden="true" />Встряхнуть</button>
      <button type="button" className="button" data-lg="button" aria-pressed={floating} onClick={() => { setFloating(!floating); api.current?.float(!floating); }}><Orbit aria-hidden="true" />{floating ? "Вернуть гравитацию" : "Невесомость"}</button>
      <button type="button" className="button" data-lg="button" onClick={() => api.current?.reset()}><RotateCcw aria-hidden="true" />Заново</button>
    </div>
  </div>;
}
