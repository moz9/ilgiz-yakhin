"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, FileSpreadsheet, LibraryBig, MonitorPlay } from "lucide-react";
import { useRef, useState } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { getProject } from "@/lib/projects";
import { caseHueStyle } from "@/lib/case-hues";
import { useGlassTabs } from "@/components/glass/glass-runtime";

const scenes = [
  { slug: "worktime-reporting", label: "Отчётность", icon: FileSpreadsheet, title: "От выгрузки до готового Excel", note: "Импорт, проверка расчёта и документ, который можно сразу отправлять.", labels: ["Импорт", "Проверка", "Экспорт"], indices: [0, 1, 2] },
  { slug: "revalib", label: "База знаний", icon: LibraryBig, title: "Библиотека и связанные материалы", note: "От общего каталога к подробному гайду, на компьютере и телефоне.", labels: ["Библиотека", "Гайд", "Телефон"], indices: [0, 1, 3] },
  { slug: "streaming-web-platform", label: "Стриминг", icon: MonitorPlay, title: "Расписание, списки и AI-контур", note: "Пользовательские сценарии стриминговой платформы на обезличенном демо.", labels: ["Расписание", "Списки", "AI-контур"], indices: [2, 6, 8] },
];

export function Workbench() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [step, setStep] = useState(0);
  const reduced = useReducedMotion();
  const modes = useRef<HTMLDivElement>(null);
  const steps = useRef<HTMLDivElement>(null);
  const scene = scenes[sceneIndex];
  const project = getProject(scene.slug)!;
  const frames = project.media!.flatMap((media) => (media.frames ?? [media.src]).map((frame) => typeof frame === "string"
    ? { src: frame, alt: media.alt, caption: media.caption, presentation: media.presentation }
    : { ...frame, caption: media.caption, presentation: frame.presentation ?? media.presentation }));
  const current = frames[scene.indices[step]];
  useGlassTabs(modes, sceneIndex, (index) => { setSceneIndex(index); setStep(0); });
  useGlassTabs(steps, step, setStep, sceneIndex);

  return <section className="scenes" aria-labelledby="scenes-title" style={caseHueStyle(scene.slug)}>
    <div className="section-head">
      <h2 id="scenes-title">Как это работает изнутри</h2>
      <p>Три сценария из настоящих продуктов: что делает человек и что он получает на выходе.</p>
    </div>
    <div className="scenes-modes" data-lg="surface">
      <div className="scenes-modes-tabs" ref={modes} role="tablist" aria-label="Продукт">
        {scenes.map((entry, index) => <button type="button" role="tab" key={entry.slug} aria-selected={sceneIndex === index} tabIndex={sceneIndex === index ? 0 : -1}><entry.icon aria-hidden="true" /><span>{entry.label}</span></button>)}
      </div>
    </div>
    <div className="scenes-body">
      <div className="scenes-copy">
        <h3>{scene.title}</h3>
        <p>{scene.note}</p>
        <div className="scenes-steps" ref={steps} role="tablist" aria-label="Этап сценария" key={sceneIndex}>
          {scene.labels.map((label, index) => <button type="button" role="tab" key={label} aria-selected={step === index} tabIndex={step === index ? 0 : -1}><span className="scenes-step-n">{index + 1}</span>{label}</button>)}
        </div>
        <p className="scenes-caption" aria-live="polite">{current.caption}</p>
        <div className="scenes-nav">
          <button type="button" data-lg="button" aria-label="Предыдущий этап" title="Предыдущий этап" onClick={() => setStep((step + 2) % 3)}><ArrowLeft aria-hidden="true" /></button>
          <button type="button" data-lg="button" aria-label="Следующий этап" title="Следующий этап" onClick={() => setStep((step + 1) % 3)}><ArrowRight aria-hidden="true" /></button>
          <Link className="text-link" href={`/projects/${project.slug}`}>Весь кейс <ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="scenes-deck">
        <span className="stage-light" aria-hidden="true" />
        {scene.indices.map((frameIndex, index) => {
          const media = frames[frameIndex];
          const phone = media.presentation === "phone";
          const depth = (index - step + 3) % 3;
          return <motion.div key={`${scene.slug}-${media.src}`} aria-hidden={depth !== 0} className={`scenes-card${phone ? " is-phone" : ""}`} style={{ zIndex: 3 - depth, pointerEvents: depth ? "none" : "auto" }}
            initial={reduced ? false : { y: 80, rotate: 4, scale: 0.9 }}
            animate={{ x: depth * 28, y: depth * -34, rotate: depth * 2.5, scale: 1 - depth * 0.08, filter: `brightness(${1 - depth * 0.08}) saturate(${1 - depth * 0.2})` }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 24, mass: 0.9 }}>
            {!phone && <span className="stage-chrome" aria-hidden="true"><i /><i /><i /></span>}
            <Image src={media.src} alt={depth === 0 ? media.alt : ""} width={phone ? 390 : 1440} height={phone ? 844 : 900} sizes="(max-width: 860px) 90vw, 760px" loading={depth === 0 ? "eager" : "lazy"} />
          </motion.div>;
        })}
      </div>
    </div>
  </section>;
}
