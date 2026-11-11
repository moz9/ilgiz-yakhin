"use client";

import { useEffect, useRef } from "react";

/**
 * A silent loop of the live product laid over its cover screenshot. It loads only when
 * it comes near the screen, plays only while visible and never plays under reduced
 * motion: the cover underneath stays as the still frame in every one of those cases.
 *
 * `preview` is for grids of many cases: with a mouse the loop plays only while its card
 * (the nearest link) is hovered or focused; on a touch screen, while the card holds the
 * middle of the screen. When it stops, the cover comes back and the loop rewinds.
 */
export function CaseVideo({ src, preview = false }: { src: string; preview?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const card = preview ? video.closest("a") : null;
    const hoverable = matchMedia("(hover: hover)").matches;
    let visible = false, wanted = !card || !hoverable;
    const sync = () => {
      if (visible && wanted && !still.matches && !document.hidden) {
        if (video.preload !== "auto") { video.preload = "auto"; video.load(); }
        video.play().catch(() => {});
      } else {
        video.pause();
        if (preview) { delete video.dataset.shown; video.currentTime = 0; }
      }
    };
    // In a grid on a touch screen only the card in the middle band of the screen plays.
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { rootMargin: preview && !hoverable ? "-35% 0px -35% 0px" : "200px 0px" });
    observer.observe(video);
    const on = () => { wanted = true; sync(); }, off = () => { wanted = false; sync(); };
    if (card && hoverable) {
      card.addEventListener("pointerenter", on); card.addEventListener("pointerleave", off);
      card.addEventListener("focus", on); card.addEventListener("blur", off);
    }
    const onShown = () => { video.dataset.shown = "true"; };
    video.addEventListener("playing", onShown);
    still.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      card?.removeEventListener("pointerenter", on); card?.removeEventListener("pointerleave", off);
      card?.removeEventListener("focus", on); card?.removeEventListener("blur", off);
      video.removeEventListener("playing", onShown);
      still.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [preview]);
  return <video ref={ref} className="case-video" muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1}>
    <source src={`${src}.mp4`} type="video/mp4" />
  </video>;
}
