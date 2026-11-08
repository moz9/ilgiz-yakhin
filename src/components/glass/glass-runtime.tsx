"use client";

import { useEffect, useRef, type RefObject } from "react";
import type * as Kit from "@/lib/liquid-glass/liquid-glass-kit.js";

type KitModule = typeof Kit;
let kitPromise: Promise<KitModule> | null = null;

export const GLASS_DENSITY_KEY = "portfolio-glass-density";
export const GLASS_OPAQUE_KEY = "portfolio-glass-opaque";
export const DEFAULT_GLASS_DENSITY = 30;

/**
 * The kit touches window at import time, so it is only ever loaded on the client.
 * Loading it also starts the one runtime for the whole site: it decides the renderer
 * (lens / frosted / solid) before any lens is created, restores the saved density and
 * mounts every [data-lg] element, including the ones React adds after a route change.
 * Lenses created before the renderer is known would stay on the frosted path.
 */
export function loadGlassKit() {
  kitPromise ??= Promise.all([import("@/lib/liquid-glass/liquid-glass-kit.js"), import("@/lib/liquid-glass/liquid-glass.js")]).then(([kit, core]) => {
    let density = DEFAULT_GLASS_DENSITY;
    let opaque = false;
    try {
      const saved = localStorage.getItem(GLASS_DENSITY_KEY);
      if (saved !== null && Number.isFinite(Number(saved))) density = Number(saved);
      opaque = localStorage.getItem(GLASS_OPAQUE_KEY) === "1";
    } catch { /* Storage may be blocked: the calibrated default still applies. */ }
    kit.autoMount({ observe: true });
    if (opaque) core.setTier(0);
    kit.setDensity(density / 100);
    document.documentElement.dataset.lgkRenderer = kit.rendererKind();
    return kit;
  });
  return kitPromise;
}

/** Starts the glass runtime as soon as the app hydrates. */
export function GlassRuntime() {
  useEffect(() => { loadGlassKit(); }, []);
  return null;
}

/**
 * A liquid selection lens for a row of tabs, links or buttons that React owns.
 * The kit moves the lens; React keeps the real selected state and passes it in.
 */
export function useGlassTabs(ref: RefObject<HTMLElement | null>, selected: number, onChange?: (index: number) => void, remountKey: unknown = 0) {
  const controller = useRef<Kit.TabsController | null>(null);
  const change = useRef(onChange);
  useEffect(() => { change.current = onChange; });
  useEffect(() => {
    const track = ref.current;
    if (!track) return;
    let cancelled = false;
    loadGlassKit().then((kit) => {
      if (cancelled || !ref.current) return;
      controller.current = kit.mountTabs(track, { selected: Math.max(0, selected), onChange: (index) => change.current?.(index) });
    });
    return () => { cancelled = true; controller.current?.destroy(); controller.current = null; };
    // The selection is synced by the effect below; remounting on it would restart the lens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, remountKey]);
  useEffect(() => {
    if (selected >= 0 && controller.current && controller.current.index !== selected) controller.current.select(selected);
  }, [selected]);
}
