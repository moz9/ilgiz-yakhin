"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Expand, X, ZoomIn, ZoomOut } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import type { ProjectMedia } from "@/lib/projects";

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function useHydratedReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
}

/**
 * How far a tall capture may travel inside the 16:10 frame, as a share of its
 * own height. The frame is 0.625 of its width, so the slack is the difference.
 */
function liveTravel(item: ProjectMedia) {
  if (!item.width || !item.height) return 0;
  return Math.max(0, 100 - (item.width / item.height) * 62.5);
}

export function ProjectGallery({ media }: { media: ProjectMedia[] }) {
  const reduceMotion = useHydratedReducedMotion();
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
    setActive((index) => {
      const next = ((index ?? 0) + direction + media.length) % media.length;
      setZoom(media[next]?.presentation === "live");
      return next;
    });
  }

  function open(index: number) {
    setZoom(media[index]?.presentation === "live");
    setActive(index);
  }

  return <>
    <section className="redesign-case-gallery editorial-gallery" aria-label="Интерфейс проекта">
      {media.map((item, index) => {
        const live = item.presentation === "live";
        return <motion.figure
          key={item.src}
          data-presentation={item.presentation ?? "browser"}
          initial={false}
          whileInView={reduceMotion ? undefined : { opacity: [0.3, 1], y: [38, 0] }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, delay: reduceMotion ? 0 : Math.min(index, 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            type="button"
            className={`gallery-shot shot-${item.presentation ?? "browser"}${live ? " is-live" : ""}`}
            style={live ? { "--gallery-travel": `${liveTravel(item)}%` } as CSSProperties : undefined}
            aria-label={`Рассмотреть: ${item.label}`}
            onClick={(event) => { trigger.current = event.currentTarget; open(index); }}
          >
            <span className="gallery-shot-bar" aria-hidden="true"><i /><i /><i /><span>{item.label}</span>{live && <b className="gallery-live-dot" />}</span>
            <Image src={item.src} alt={item.alt} width={item.width ?? 1440} height={item.height ?? 900} sizes={index === 0 ? "(max-width: 900px) 90vw, 1300px" : "(max-width: 900px) 90vw, 700px"} />
            <span className="gallery-expand" aria-hidden="true"><Expand /></span>
          </button>
          <figcaption><strong>{item.label}</strong><span>{item.caption}</span></figcaption>
        </motion.figure>;
      })}
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
