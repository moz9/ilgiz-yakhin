"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, FileSpreadsheet, LibraryBig, MonitorPlay } from "lucide-react";
import { useState } from "react";
import { getProject } from "@/lib/projects";

const scenes = [
  { slug: "worktime-reporting", label: "Отчётность", icon: FileSpreadsheet, title: "От выгрузки до Excel", note: "Импорт, проверка расчёта и готовый документ.", labels: ["Импорт", "Проверка", "Экспорт"], indices: [0, 1, 2], tone: "mint" },
  { slug: "revalib", label: "База знаний", icon: LibraryBig, title: "Библиотека и связанные материалы", note: "От общего каталога к подробному гайду, на компьютере и телефоне.", labels: ["Библиотека", "Гайд", "Телефон"], indices: [0, 2, 3], tone: "ice" },
  { slug: "streaming-web-platform", label: "Стриминг", icon: MonitorPlay, title: "Расписание, профиль и AI-подбор", note: "Пользовательские сценарии стриминговой платформы. Обезличенное демо.", labels: ["Расписание", "Профиль", "AI-подбор"], indices: [2, 7, 8], tone: "lilac" },
];

export function Workbench() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [step, setStep] = useState(0);
  const scene = scenes[sceneIndex];
  const project = getProject(scene.slug)!;
  const item = project.media![scene.indices[step]];
  const phone = item.presentation === "phone";

  return <section className="workbench" aria-labelledby="workbench-title" data-tone={scene.tone}>
    <div className="workbench-heading"><span className="redesign-mono">Пользовательские сценарии / 03</span><h2 id="workbench-title">В деталях</h2><div className="workbench-modes" role="group" aria-label="Проект в деталях">
      {scenes.map((entry, index) => <button type="button" key={entry.slug} aria-pressed={sceneIndex === index} onClick={() => { setSceneIndex(index); setStep(0); }}><entry.icon aria-hidden="true" />{entry.label}</button>)}
    </div></div>
    <div className="workbench-body">
      <div className="workbench-copy"><span className="workbench-number" aria-hidden="true">0{step + 1}</span><h3>{scene.title}</h3><p>{scene.note}</p>
        <div className="workbench-steps" role="group" aria-label="Этап сценария">{scene.labels.map((label, index) => <button type="button" key={label} aria-pressed={step === index} onClick={() => setStep(index)}><span>0{index + 1}</span>{label}<ArrowUpRight aria-hidden="true" /></button>)}</div>
        <Link href={`/projects/${project.slug}`}>Весь кейс <ArrowUpRight aria-hidden="true" /></Link>
      </div>
      <div className="workbench-viewer"><div key={`${scene.slug}-${step}`} className={`workbench-frame${phone ? " is-phone" : ""}`}>
        {!phone && <div className="gallery-shot-bar" aria-hidden="true"><i /><i /><i /><span>{scene.labels[step]}</span></div>}
        <Image src={item.src} alt={item.alt} width={phone ? 390 : 1440} height={phone ? 844 : 900} sizes="(max-width: 860px) 90vw, 900px" />
      </div></div>
    </div>
    <div className="workbench-bottom"><p aria-live="polite">{item.caption}</p><span className="workbench-stack">{project.stack.slice(0, 3).join(" · ")}</span><div>
      <button type="button" aria-label="Предыдущий этап" title="Предыдущий этап" onClick={() => setStep((step + 2) % 3)}><ArrowLeft /></button>
      <button type="button" aria-label="Следующий этап" title="Следующий этап" onClick={() => setStep((step + 1) % 3)}><ArrowRight /></button>
    </div></div>
  </section>;
}
