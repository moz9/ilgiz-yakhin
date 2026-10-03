"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, FileSpreadsheet, LibraryBig, LoaderCircle, MonitorPlay } from "lucide-react";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { getProject } from "@/lib/projects";
import { GlassLayer } from "@/components/glass-layer";

const scenes = [
  { slug: "worktime-reporting", label: "Отчётность", icon: FileSpreadsheet, title: "От выгрузки до Excel", note: "Импорт, проверка расчёта и готовый документ.", labels: ["Импорт", "Проверка", "Экспорт"], indices: [0, 1, 2], tone: "mint" },
  { slug: "revalib", label: "База знаний", icon: LibraryBig, title: "Библиотека и связанные материалы", note: "От общего каталога к подробному гайду, на компьютере и телефоне.", labels: ["Библиотека", "Гайд", "Телефон"], indices: [0, 2, 3], tone: "ice" },
  { slug: "streaming-web-platform", label: "Стриминг", icon: MonitorPlay, title: "Расписание, профиль и AI-подбор", note: "Пользовательские сценарии стриминговой платформы. Обезличенное демо.", labels: ["Расписание", "Профиль", "AI-подбор"], indices: [2, 7, 8], tone: "lilac" },
];

export function Workbench() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const reduced = useReducedMotion();
  const scene = scenes[sceneIndex];
  const project = getProject(scene.slug)!;
  const item = project.media![scene.indices[step]];

  return <section className="workbench" aria-labelledby="workbench-title" data-tone={scene.tone}>
    <div className="workbench-heading"><span className="redesign-mono">Пользовательские сценарии / 03</span><h2 id="workbench-title">От действия<br /><span>к результату.</span></h2></div>
    <div className="workbench-body">
      <div className="workbench-copy"><div className="scenario-counter" aria-hidden="true"><span key={`${sceneIndex}-${step}`}>0{step + 1}</span><small>/ 03</small></div><h3>{scene.title}</h3><p>{scene.note}</p>
        <div className="workbench-steps" role="group" aria-label="Этап сценария">{scene.labels.map((label, index) => <button type="button" key={label} aria-pressed={step === index} onClick={() => setStep(index)}><span>0{index + 1}</span>{label}<ArrowUpRight aria-hidden="true" /></button>)}</div>
        <Link href={`/projects/${project.slug}`}>Весь кейс <ArrowUpRight aria-hidden="true" /></Link>
      </div>
      <div className="workbench-viewer scenario-deck">
        {scene.indices.map((mediaIndex, index) => {
          const media = project.media![mediaIndex];
          const phone = media.presentation === "phone";
          const depth = (index - step + 3) % 3;
          return <motion.div key={media.src} aria-hidden={depth !== 0} aria-busy={!loaded[media.src] && !failed[media.src]} data-loaded={Boolean(loaded[media.src])} className={`scenario-screen ${depth === 0 ? "workbench-frame" : "scenario-peek"}${phone ? " is-phone" : ""}`} style={{ zIndex: 3 - depth, pointerEvents: depth ? "none" : "auto" }}
            initial={false} animate={{ x: depth * 15, y: depth * -28, rotateX: depth * 3, rotateY: depth === 0 ? -3 : -7, rotateZ: depth * -3, scale: 1 - depth * .07, opacity: depth ? .38 - depth * .09 : 1 }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 26, mass: .9, opacity: { duration: 0 } }}>
            {!phone && <div className="gallery-shot-bar" aria-hidden="true"><i /><i /><i /><span>{scene.labels[index]}</span></div>}
            <Image src={media.src} alt={depth === 0 ? media.alt : ""} width={phone ? 390 : 1440} height={phone ? 844 : 900} sizes="(max-width: 860px) 86vw, 900px" loading={depth === 0 ? "eager" : "lazy"} onLoad={() => setLoaded((current) => ({ ...current, [media.src]: true }))} onError={() => setFailed((current) => ({ ...current, [media.src]: true }))} />
            {!loaded[media.src] && <span className="scenario-loading" role="status" aria-label={failed[media.src] ? "Не удалось загрузить экран" : "Загрузка экрана"}>{failed[media.src] ? <><span>Не удалось загрузить экран</span><a href={media.src} target="_blank" rel="noreferrer">Открыть изображение <ArrowUpRight aria-hidden="true" /></a></> : <LoaderCircle aria-hidden="true" />}</span>}
          </motion.div>;
        })}
        <div className="workbench-modes liquid-surface" role="group" aria-label="Проект в деталях">
          <GlassLayer />
          {scenes.map((entry, index) => <button type="button" key={entry.slug} aria-pressed={sceneIndex === index} onClick={() => { setSceneIndex(index); setStep(0); }}>{sceneIndex === index && <motion.i className="scenario-selection" layoutId="scenario-selection" transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 }} />}<entry.icon aria-hidden="true" /><span>{entry.label}</span></button>)}
        </div>
      </div>
    </div>
    <div className="workbench-bottom"><p aria-live="polite">{item.caption}</p><span className="workbench-stack">{project.stack.slice(0, 3).join(" · ")}</span><div>
      <button type="button" aria-label="Предыдущий этап" title="Предыдущий этап" onClick={() => setStep((step + 2) % 3)}><ArrowLeft /></button>
      <button type="button" aria-label="Следующий этап" title="Следующий этап" onClick={() => setStep((step + 1) % 3)}><ArrowRight /></button>
    </div></div>
  </section>;
}
