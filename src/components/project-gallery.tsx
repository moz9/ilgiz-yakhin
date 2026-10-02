"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Expand, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ProjectMedia } from "@/lib/projects";

export function ProjectGallery({ media }: { media: ProjectMedia[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const current = media[active ?? 0];
  const isOpen = active !== null;

  useEffect(() => {
    if (!isOpen) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      trigger.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  function move(direction: number) {
    setActive((index) => ((index ?? 0) + direction + media.length) % media.length);
    setZoom(false);
  }

  return <>
    <section className="redesign-case-gallery editorial-gallery" aria-label="Интерфейс проекта">
      {media.map((item, index) => <figure key={item.src} data-presentation={item.presentation ?? "browser"}>
        <button type="button" className={`gallery-shot shot-${item.presentation ?? "browser"}`} aria-label={`Рассмотреть: ${item.label}`} onClick={(event) => { trigger.current = event.currentTarget; setZoom(false); setActive(index); }}>
          <span className="gallery-shot-bar" aria-hidden="true"><i /><i /><i /><span>{item.label}</span></span>
          <Image src={item.src} alt={item.alt} width={1440} height={900} sizes={index === 0 ? "(max-width: 900px) 90vw, 1300px" : "(max-width: 900px) 90vw, 700px"} />
          <span className="gallery-expand" aria-hidden="true"><Expand /></span>
        </button>
        <figcaption><strong>{item.label}</strong><span>{item.caption}</span></figcaption>
      </figure>)}
    </section>
    <dialog className="media-lightbox" ref={dialog} aria-label="Просмотр интерфейса" onClose={() => setActive(null)} onClick={(event) => { if (event.target === event.currentTarget) setActive(null); }} onKeyDown={(event) => {
      if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
    }}>
      <div className="lightbox-toolbar">
        <span aria-live="polite">{(active ?? 0) + 1} / {media.length} <strong>{current.label}</strong></span>
        <button type="button" onClick={() => setZoom(!zoom)} aria-label={zoom ? "Вписать изображение" : "Увеличить изображение"} title={zoom ? "Вписать изображение" : "Увеличить изображение"}>{zoom ? <ZoomOut /> : <ZoomIn />}</button>
        <button type="button" onClick={() => setActive(null)} aria-label="Закрыть просмотр" title="Закрыть"><X /></button>
      </div>
      <div className={`lightbox-image${zoom ? " is-zoomed" : ""}`}>
        {/* Native dimensions are intentional in the inspectable, full-resolution viewer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.src} alt={current.alt} />
      </div>
      <div className="lightbox-footer"><p>{current.caption}</p><div>
        <button type="button" onClick={() => move(-1)} aria-label="Предыдущее изображение" title="Предыдущее изображение" disabled={media.length < 2}><ArrowLeft /></button>
        <button type="button" onClick={() => move(1)} aria-label="Следующее изображение" title="Следующее изображение" disabled={media.length < 2}><ArrowRight /></button>
      </div></div>
    </dialog>
  </>;
}
