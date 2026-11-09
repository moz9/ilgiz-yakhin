"use client";

import { useEffect, useRef } from "react";

/**
 * A silent loop of the live product laid over its cover screenshot. It loads only when
 * it comes near the screen, plays only while visible and never plays under reduced
 * motion: the cover underneath stays as the still frame in every one of those cases.
 */
export function CaseVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      if (visible && !still.matches && !document.hidden) {
        if (video.preload !== "auto") { video.preload = "auto"; video.load(); }
        video.play().catch(() => {});
      } else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { rootMargin: "200px 0px" });
    observer.observe(video);
    const onShown = () => { video.dataset.shown = "true"; };
    video.addEventListener("playing", onShown);
    still.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      video.removeEventListener("playing", onShown);
      still.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return <video ref={ref} className="case-video" muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1}>
    <source src={`${src}.mp4`} type="video/mp4" />
  </video>;
}
