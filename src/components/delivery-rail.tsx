"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Braces, Database, Layers3, Rocket, ShieldCheck, Undo2 } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const motionSnapshot = () => window.matchMedia(motionQuery).matches;
const serverMotionSnapshot = () => false;

const steps = [
  { title: "Интерфейс", description: "Сценарии, адаптивность, доступность", tools: "Next.js · React · Electron", icon: Layers3 },
  { title: "API", description: "Контракты и валидация входных данных", tools: "Zod · Pydantic · FastAPI", icon: Braces },
  { title: "Данные", description: "Миграции, модели и права доступа", tools: "PostgreSQL · SQLite", icon: Database },
  { title: "Проверки", description: "Unit, интеграционные и браузерные тесты", tools: "Vitest · Playwright", icon: ShieldCheck },
  { title: "Релиз", description: "Сборка, health-check и smoke", tools: "Docker · GitHub Actions", icon: Rocket },
  { title: "Поддержка", description: "Бэкапы и возврат к прошлой версии", tools: "Restore · Rollback", icon: Undo2 },
];

export function DeliveryRail() {
  const ref = useRef<HTMLOListElement>(null);
  const reduced = useSyncExternalStore(subscribeMotion, motionSnapshot, serverMotionSnapshot);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  useMotionValueEvent(scrollYProgress, "change", (value) => setActive(Math.min(5, Math.floor(value * 6))));

  return <ol className="delivery-rail" ref={ref}>
    <li className="delivery-progress" aria-hidden="true"><motion.i style={{ scaleY: reduced ? 1 : scrollYProgress }} /></li>
    {steps.map((step, index) => <li className="delivery-step" key={step.title} data-active={reduced || active === index} data-complete={reduced || active >= index}>
      <span className="delivery-number redesign-mono">0{index + 1}</span>
      <step.icon aria-hidden="true" />
      <div><h3>{step.title}</h3><p>{step.description}</p><small>{step.tools}</small></div>
    </li>)}
  </ol>;
}
