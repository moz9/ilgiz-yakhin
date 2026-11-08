// Types for the vendored Liquid Glass web kit (see liquid-glass-kit.js).
export type Controller = { destroy(): void };
export type TabsController = Controller & { readonly index: number; select(index: number): void; render(): void };
export type LensShape = { x: number; y: number; w: number; h: number; r?: number; lift?: number; strength?: number; bezel?: number; magnify?: number; blur?: number; fill?: number; tint?: string };
export type Lens = { el: HTMLSpanElement; set(shape: LensShape): void; destroy(): void };
export function autoMount(options?: { root?: Document | Element; observe?: boolean; tier?: "auto" | number }): () => void;
export function mountTabs(track: HTMLElement, options?: { selected?: number; onChange?: (index: number) => void; items?: HTMLElement[]; lift?: number; draggable?: boolean }): TabsController;
export function mountSurface(el: HTMLElement, options?: { variant?: string }): Controller;
export function mountButton(el: HTMLElement, options?: { variant?: string }): Controller;
export function mountSlider(input: HTMLInputElement, options?: { thumb?: number; lifted?: number }): Controller;
export function mountSwitch(input: HTMLInputElement, options?: Record<string, unknown>): Controller;
export function mountMenu(trigger: HTMLElement, panel: HTMLElement | null, options?: { onOpen?: () => void; onClose?: () => void }): Controller & { readonly open: boolean; close(): void };
export function mountDensity(input: HTMLInputElement, options?: { storageKey?: string; defaultValue?: number; reset?: HTMLElement | null; slider?: boolean }): Controller;
export function createLens(host: HTMLElement, options?: { className?: string }): Lens;
export function setDensity(value: number): void;
export function getDensity(): number;
export function onGlassChange(fn: () => void): () => void;
export function rendererKind(): "lens" | "frosted" | "solid";
export function glassDiagnostics(): Record<string, unknown>;
