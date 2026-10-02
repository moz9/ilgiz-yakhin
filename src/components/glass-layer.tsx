"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createGlassMap } from "@/lib/glass-optics";

export function GlassLayer() {
  const ref = useRef<HTMLSpanElement>(null);
  const id = `glass-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [map, setMap] = useState({ href: "", width: 0, height: 0 });
  useEffect(() => {
    const element = ref.current;
    // SVG backdrop displacement is pixel-verified in Chromium. Other engines keep T1.
    if (!element || !/Chrome\//.test(navigator.userAgent)) return;
    let frame = 0;
    const update = () => {
      const width = element.offsetWidth, height = element.offsetHeight;
      if (!width || !height) return;
      const radius = Math.min(parseFloat(getComputedStyle(element).borderRadius) || 28, height / 2, width / 2);
      const href = createGlassMap(width, height, radius);
      setMap((old) => old.width === width && old.height === height ? old : { href, width, height });
    };
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    });
    observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  return <span ref={ref} className="glass-layer" aria-hidden="true" data-optics={map.href ? "refraction" : "blur"} style={{ "--glass-refraction": map.href ? `url(#${id})` : "" } as CSSProperties}>
    {map.href && <svg width="0" height="0" className="glass-defs"><defs><filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feImage href={map.href} x="0" y="0" width={map.width} height={map.height} preserveAspectRatio="none" result="map" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="26" xChannelSelector="R" yChannelSelector="G" />
    </filter></defs></svg>}
  </span>;
}
