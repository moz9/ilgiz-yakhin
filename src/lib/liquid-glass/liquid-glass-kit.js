/*
 * Liquid Glass kit for real products (ES module, zero dependencies).
 *
 * The demo controllers in reference/web draw their own backdrop on a canvas, so they
 * cannot be dropped onto a product page. This kit mounts the same experiences on the
 * product's existing markup and refracts the LIVE page underneath:
 *
 *   import { autoMount } from './liquid-glass-kit.js';
 *   const dispose = autoMount();   // scans [data-lg] and wires everything below
 *
 * data-lg values (each is also exported as mountX(el, options) -> controller):
 *   surface   static glass panel/toolbar/dock/sidebar (.lg + edge refraction)
 *   button    glass button with press swell, touch light and springy release
 *   tabs      tab bar / segmented control: one liquid lens moves between items
 *   slider    wraps <input type="range">: resting thumb lifts into a clear lens
 *   switch    wraps <input type="checkbox">: thumb becomes a lens, drag to toggle
 *   menu      trigger morphs into its panel (data-lg-panel="#id")
 *   density   wraps <input type="range" min=0 max=100>: the "Liquid Glass" setting
 *
 * Renderer per engine (html[data-lgk-renderer]):
 *   lens      Chromium: SVG displacement inside backdrop-filter, refracts real DOM pixels
 *   frosted   Safari/Firefox/weak device: blur + rim + motion, no refraction (state it)
 *   solid     Reduce Transparency / forced colors / no backdrop-filter: opaque
 *
 * Code and comments in English, docs in Russian (repository rule).
 */
import {
  MOTION, Spring, springDriver, enhance, morphOpen, initLiquidGlass,
  refractionProfile, isChromium, getTier, prefersReducedMotion, rubberBand,
} from './liquid-glass.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const hasWindow = typeof window !== 'undefined';
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mq = (q) => hasWindow && matchMedia(q).matches;
const opaquePreferred = () => mq('(prefers-reduced-transparency: reduce)') || mq('(forced-colors: active)');

// ---------------------------------------------------------------------------
// Shared state: renderer, density, preference changes
// ---------------------------------------------------------------------------
const listeners = new Set();
let density = 0.5;
export const getDensity = () => density;
export function onGlassChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notify() { listeners.forEach((fn) => fn()); }

/** 'lens' | 'frosted' | 'solid' — what actually renders, decided per engine. */
export function rendererKind() {
  if (!hasWindow) return 'frosted';
  if (opaquePreferred() || getTier() === 0) return 'solid';
  if (getTier() >= 2 && isChromium()) return 'lens';
  return 'frosted';
}
function syncRendererAttr() {
  if (hasWindow) document.documentElement.dataset.lgkRenderer = rendererKind();
}

export function setDensity(value, { root = hasWindow ? document.documentElement : null } = {}) {
  density = clamp(Number(value));
  root?.style.setProperty('--lg-density', density.toFixed(3));
  notify();
}

// ---------------------------------------------------------------------------
// Displacement maps: cached by quantized geometry, stretched to the exact size.
// One map bakes edge refraction (Snell, convex bezel) and optional center
// magnification; feDisplacementMap scale carries the strength, so animating
// strength never regenerates a map.
// ---------------------------------------------------------------------------
const MAP_CACHE = new Map();
const MAP_LIMIT = 96;
const LUT = refractionProfile({ ior: 1.5, profile: 3 });

function sdRoundRect(px, py, hw, hh, r) {
  const qx = Math.abs(px) - hw + r;
  const qy = Math.abs(py) - hh + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
}

function lensMap(w, h, r, bezel, magnify) {
  const W = Math.max(4, Math.round(w / 6) * 6);
  const H = Math.max(4, Math.round(h / 6) * 6);
  const R = Math.min(Math.round(r), W / 2, H / 2);
  const B = Math.max(2, Math.round(bezel));
  const M = Math.round(magnify * 100) / 100;
  const key = `${W}|${H}|${R}|${B}|${M}`;
  const hit = MAP_CACHE.get(key);
  if (hit) { MAP_CACHE.delete(key); MAP_CACHE.set(key, hit); return hit; }
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const hw = W / 2, hh = H / 2, n = LUT.length - 1;
  // Magnification offset is radial and grows to the rim; normalize both terms to 1.
  const mag = M > 1 ? 1 - 1 / M : 0;
  const magMax = mag * Math.hypot(hw, hh);
  const norm = Math.max(1, magMax / Math.max(1, B)); // edge term is in "bezel" units
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5 - hw, py = y + 0.5 - hh;
      const d = sdRoundRect(px, py, hw, hh, R);
      let dx = 0, dy = 0;
      if (d < 0) {
        if (d > -B) {
          const k = LUT[Math.round((-d / B) * n)];
          let nx = sdRoundRect(px + 0.5, py, hw, hh, R) - sdRoundRect(px - 0.5, py, hw, hh, R);
          let ny = sdRoundRect(px, py + 0.5, hw, hh, R) - sdRoundRect(px, py - 0.5, hw, hh, R);
          const len = Math.hypot(nx, ny) || 1;
          dx = (-nx / len) * k; dy = (-ny / len) * k;
        }
        // Magnify only the flat core and fade it out across the bezel: pulling core
        // content into the rim band folds the mapping and shows a doubled label.
        if (mag) {
          const core = smooth(0, 1, -d / B);
          dx -= (px * mag * core) / B; dy -= (py * mag * core) / B;
        }
      }
      const i = (y * W + x) * 4;
      img.data[i] = Math.round(clamp(0.5 + (dx / norm) * 0.5) * 255);
      img.data[i + 1] = Math.round(clamp(0.5 + (dy / norm) * 0.5) * 255);
      img.data[i + 2] = 128; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const entry = { href: canvas.toDataURL('image/png'), norm };
  MAP_CACHE.set(key, entry);
  if (MAP_CACHE.size > MAP_LIMIT) MAP_CACHE.delete(MAP_CACHE.keys().next().value);
  return entry;
}

let defs = null;
let seq = 0;
function ensureDefs() {
  if (defs?.isConnected) return defs;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  defs = document.createElementNS(SVG_NS, 'defs');
  svg.append(defs);
  document.body.append(svg);
  return defs;
}

// ---------------------------------------------------------------------------
// createLens(host): one moving glass shape over the live page
// ---------------------------------------------------------------------------
/**
 * createLens(host, { className }) -> { el, set(shape), destroy() }
 * shape: { x, y, w, h, r, lift 0..1, strength px, bezel px, magnify >= 1, blur px,
 *          fill 0..1 (opaque rest fill, e.g. a white slider thumb), tint css color }
 * x/y = top-left in host px. The host must be position:relative (kit CSS does it).
 */
export function createLens(host, { className = '' } = {}) {
  const el = document.createElement('span');
  el.className = `lgk-lens ${className}`.trim();
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="lgk-lens__shadow"></span><span class="lgk-lens__glass"></span><span class="lgk-lens__rim"></span>';
  host.append(el);
  const glass = el.children[1];
  const id = `lgk-lens-${++seq}`;
  let filter = null, image = null, disp = null, flip = false, lastHref = '';

  function ensureFilter() {
    if (filter?.[0]?.isConnected) return; // filter is a pair: [A, B]
    // Two filters swapped on every map change: Chromium re-resolves a url()
    // backdrop-filter only when the reference itself changes.
    filter = [0, 1].map((k) => {
      const f = document.createElementNS(SVG_NS, 'filter');
      f.setAttribute('id', `${id}-${k}`);
      f.setAttribute('x', '0'); f.setAttribute('y', '0');
      f.setAttribute('width', '100%'); f.setAttribute('height', '100%');
      f.setAttribute('color-interpolation-filters', 'sRGB');
      f.innerHTML = '<feImage x="0" y="0" preserveAspectRatio="none" result="map"/><feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G"/>';
      ensureDefs().append(f);
      return f;
    });
    image = filter.map((f) => f.firstElementChild);
    disp = filter.map((f) => f.lastElementChild);
  }

  function set(s) {
    const kind = rendererKind();
    const w = Math.max(1, s.w), h = Math.max(1, s.h);
    const r = Math.min(s.r ?? Math.min(w, h) / 2, w / 2, h / 2);
    el.style.transform = `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px)`;
    el.style.width = `${w.toFixed(2)}px`;
    el.style.height = `${h.toFixed(2)}px`;
    el.style.borderRadius = `${r.toFixed(2)}px`;
    el.style.setProperty('--lgk-lift', (s.lift ?? 0).toFixed(3));
    el.style.setProperty('--lgk-fill', clamp(s.fill ?? 0).toFixed(3));
    el.style.setProperty('--lgk-blur', `${(s.blur ?? 0).toFixed(2)}px`);
    if (s.tint) el.style.setProperty('--lgk-tint', s.tint); else el.style.removeProperty('--lgk-tint');
    el.dataset.renderer = kind;
    const strength = s.strength ?? 0;
    if (kind !== 'lens' || strength < 0.25) {
      glass.style.removeProperty('--lgk-refract');
      lastHref = '';
      return;
    }
    ensureFilter();
    const bezel = Math.min(s.bezel ?? clamp(Math.min(w, h) * 0.32, 6, 22), Math.min(w, h) / 2);
    const map = lensMap(w, h, r, bezel, s.magnify ?? 1);
    const k = flip ? 1 : 0;
    if (map.href !== lastHref) {
      flip = !flip;
      const n = flip ? 1 : 0;
      image[n].setAttribute('href', map.href);
      image[n].setAttribute('width', String(w));
      image[n].setAttribute('height', String(h));
      disp[n].setAttribute('scale', (2 * strength * map.norm).toFixed(2));
      glass.style.setProperty('--lgk-refract', `url(#${id}-${n})`);
      lastHref = map.href;
    } else {
      image[k].setAttribute('width', String(w));
      image[k].setAttribute('height', String(h));
      disp[k].setAttribute('scale', (2 * strength * map.norm).toFixed(2));
    }
  }

  return {
    el,
    set,
    destroy() { el.remove(); filter?.forEach((f) => f.remove()); },
  };
}

// ---------------------------------------------------------------------------
// Helpers shared by controllers
// ---------------------------------------------------------------------------
function reducedNow() { return prefersReducedMotion(); }
function relRect(el, host) {
  const a = el.getBoundingClientRect(), b = host.getBoundingClientRect();
  return { x: a.left - b.left - host.clientLeft, y: a.top - b.top - host.clientTop, w: a.width, h: a.height };
}

// ---------------------------------------------------------------------------
// Tabs / segmented control
// ---------------------------------------------------------------------------
/**
 * mountTabs(track, { selected, onChange(index), items, lift, draggable })
 * Items: [role=tab] | [data-lg-item] | direct <button>/<a> children.
 * Rest: a quiet lens over the selected item (labels inside stay sharp: flat core).
 * Press/drag: the lens lifts (bigger, stronger refraction, magnified labels),
 * leading edge runs ahead, trailing edge catches up, lands on release.
 */
export function mountTabs(track, opts = {}) {
  const items = opts.items ?? (() => {
    const found = [...track.querySelectorAll('[role="tab"], [data-lg-item]')];
    return found.length ? found : [...track.children].filter((c) => c.matches('button, a'));
  })();
  if (!items.length) return { destroy() {}, select() {} };
  track.classList.add('lgk-track');
  if (!track.getAttribute('role') && items[0].getAttribute('role') === 'tab') track.setAttribute('role', 'tablist');
  items.forEach((it) => it.classList.add('lg-hit-target', 'lgk-item'));
  const lens = createLens(track, { className: 'lgk-lens--tab' });
  const left = new Spring(0, MOTION.trail), right = new Spring(0, MOTION.lead), lift = new Spring(0, MOTION.press);
  const liftScale = opts.lift ?? 1;
  let index = clamp(opts.selected ?? items.findIndex((i) => i.getAttribute('aria-selected') === 'true' || i.getAttribute('aria-current')), 0, items.length - 1);
  if (index < 0) index = 0;
  let geom = items.map(() => ({ x: 0, y: 0, w: 0, h: 0 }));
  let drag = null, suppressClick = false, releaseTimer = 0;

  const measure = () => { geom = items.map((it) => relRect(it, track)); };
  function render() {
    const g = geom[index] ?? geom[0];
    const up = reducedNow() ? 0 : clamp(lift.value, 0, 1.08) * liftScale;
    const baseW = g.w, baseH = g.h;
    const w = clamp(right.value - left.value, baseW * 0.82, baseW * 1.3) + up * Math.min(16, baseW * 0.18);
    const h = baseH + up * Math.min(18, baseH * 0.36);
    const cx = (left.value + right.value) / 2;
    const speed = Math.abs(left.velocity) + Math.abs(right.velocity);
    const stretch = 1 + Math.min(0.14, speed * 0.00012) * (up > 0.05 ? 1 : 0.5);
    const lw = w * stretch, lh = h / Math.sqrt(stretch);
    lens.set({
      x: cx - lw / 2, y: g.y + baseH / 2 - lh / 2, w: lw, h: lh, r: Math.min(lw, lh) / 2,
      lift: up,
      strength: mix(5, 26, up),
      bezel: mix(Math.min(12, baseH * 0.3), Math.min(20, baseH * 0.42), up),
      magnify: 1 + up * 0.16,
      blur: up * 0.4,
    });
  }
  const driver = springDriver(render);
  driver.add(left, right, lift);
  function raise(held) {
    clearTimeout(releaseTimer);
    lift.configure(held ? { response: 0.2, dampingRatio: 0.86 } : { response: 0.34, dampingRatio: 0.88 }).target = reducedNow() ? 0 : Number(held);
    if (reducedNow()) { lift.set(0); render(); } else driver.kick();
  }
  function target(xLeft, width, interactive = false) {
    const movingRight = xLeft + width / 2 >= (left.value + right.value) / 2;
    left.configure(interactive ? MOTION.interactive : movingRight ? MOTION.trail : MOTION.lead).target = xLeft;
    right.configure(interactive ? MOTION.interactive : movingRight ? MOTION.lead : MOTION.trail).target = xLeft + width;
    if (reducedNow()) { left.set(left.target); right.set(right.target); render(); } else driver.kick();
  }
  function apply(i, { animate = true, notifyChange = false } = {}) {
    const prev = index;
    index = clamp(i, 0, items.length - 1);
    items.forEach((it, j) => {
      if (it.getAttribute('role') === 'tab') { it.setAttribute('aria-selected', String(j === index)); it.tabIndex = j === index ? 0 : -1; }
      it.toggleAttribute('data-lg-selected', j === index);
    });
    const g = geom[index];
    if (!animate) { left.set(g.x); right.set(g.x + g.w); lift.set(0); render(); }
    else {
      target(g.x, g.w);
      raise(true);
      releaseTimer = setTimeout(() => raise(false), 180);
    }
    if (notifyChange && prev !== index) opts.onChange?.(index);
  }
  const nearest = (x) => geom.reduce((best, g, i) => Math.abs(g.x + g.w / 2 - x) < Math.abs(geom[best].x + geom[best].w / 2 - x) ? i : best, 0);

  const onClick = (e) => {
    const i = items.indexOf(e.target.closest('.lgk-item'));
    if (i < 0) return;
    if (suppressClick && e.detail !== 0) { e.preventDefault(); return; }
    apply(i, { notifyChange: true });
  };
  const onKey = (e) => {
    if (items[0].getAttribute('role') !== 'tab') return;
    const next = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: items.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault(); apply(next, { notifyChange: true }); items[index].focus();
  };
  const onDown = (e) => {
    if (opts.draggable === false || e.button !== 0 || !e.isPrimary || drag) return;
    suppressClick = false;
    drag = { id: e.pointerId, start: e.clientX, origin: left.value, width: right.value - left.value, from: index, moved: false };
    raise(true);
  };
  const onMove = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (e.buttons === 0) { end(e, true); return; }
    const dx = e.clientX - drag.start;
    if (!drag.moved && Math.abs(dx) < 6) return;
    if (!drag.moved) { drag.moved = true; suppressClick = true; track.setPointerCapture?.(e.pointerId); }
    const max = geom[geom.length - 1].x + geom[geom.length - 1].w - drag.width;
    const min = geom[0].x;
    let x = drag.origin + dx;
    if (x < min) x = min + rubberBand(x - min, drag.width * 0.6);
    if (x > max) x = max + rubberBand(x - max, drag.width * 0.6);
    target(x, drag.width, true);
  };
  function end(e, cancel = false) {
    if (!drag || (e.pointerId !== undefined && drag.id !== e.pointerId)) return;
    const d = drag; drag = null;
    if (cancel) apply(d.from, { notifyChange: false });
    else if (d.moved) apply(nearest((left.target + right.target) / 2), { notifyChange: true });
    raise(false);
    if (track.hasPointerCapture?.(d.id)) track.releasePointerCapture(d.id);
    if (!cancel) setTimeout(() => { suppressClick = false; }, 0);
  }
  const onUp = (e) => end(e, false);
  const onCancel = (e) => end(e, true);
  const onLost = (e) => { if (e.target === track) end(e, true); };
  const onBlur = () => { if (drag) end({ pointerId: drag.id }, true); else raise(false); };
  track.addEventListener('click', onClick, true);
  track.addEventListener('keydown', onKey);
  track.addEventListener('pointerdown', onDown);
  track.addEventListener('pointermove', onMove);
  track.addEventListener('lostpointercapture', onLost);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);
  window.addEventListener('blur', onBlur);
  const ro = new ResizeObserver(() => { if (drag) onBlur(); measure(); apply(index, { animate: false }); });
  ro.observe(track);
  items.forEach((it) => ro.observe(it));
  const offGlass = onGlassChange(render);
  measure(); apply(index, { animate: false });
  document.fonts?.ready.then(() => { measure(); apply(index, { animate: false }); });

  return {
    get index() { return index; },
    select: (i) => apply(i, { notifyChange: false }),
    render,
    destroy() {
      clearTimeout(releaseTimer); driver.stop(); ro.disconnect(); offGlass(); lens.destroy();
      track.removeEventListener('click', onClick, true);
      track.removeEventListener('keydown', onKey);
      track.removeEventListener('pointerdown', onDown);
      track.removeEventListener('pointermove', onMove);
      track.removeEventListener('lostpointercapture', onLost);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('blur', onBlur);
      track.classList.remove('lgk-track');
      items.forEach((it) => it.classList.remove('lgk-item'));
    },
  };
}

// ---------------------------------------------------------------------------
// Slider: native <input type=range> keeps value, keyboard and a11y
// ---------------------------------------------------------------------------
/**
 * mountSlider(input, { thumb = 28, lifted = 1.9 })
 * Rest: opaque white capsule thumb (iOS). Grab: it lifts into a clear lens that
 * follows the value with a soft spring, stretches with speed and lands on release.
 */
export function mountSlider(input, opts = {}) {
  const wrap = document.createElement('span');
  wrap.className = 'lgk-slider';
  input.before(wrap);
  wrap.innerHTML = '<span class="lgk-slider__track"><span class="lgk-slider__fill"></span></span>';
  wrap.append(input);
  input.classList.add('lgk-slider__input', 'lg-hit-target');
  const fill = wrap.querySelector('.lgk-slider__fill');
  const lens = createLens(wrap, { className: 'lgk-lens--thumb' });
  const size = opts.thumb ?? 28;
  const liftedScale = opts.lifted ?? 1.9;
  const frac = () => {
    const min = Number(input.min || 0), max = Number(input.max || 100);
    return max > min ? clamp((Number(input.value) - min) / (max - min)) : 0;
  };
  const pos = new Spring(frac(), { response: 0.13, dampingRatio: 1 });
  const lift = new Spring(0, { response: 0.18, dampingRatio: 0.88 });
  let pointer = null;
  function render() {
    const W = wrap.clientWidth, H = wrap.clientHeight;
    const up = reducedNow() ? 0 : clamp(lift.value);
    const s = size * mix(1, liftedScale, up);
    const stretch = 1 + Math.min(0.22, Math.abs(pos.velocity) * 0.06) * up;
    const w = s * 1.32 * stretch, h = s / Math.sqrt(stretch);
    const inset = size * 0.66;
    const cx = mix(inset, W - inset, pos.value);
    fill.style.width = `${(frac() * 100).toFixed(2)}%`;
    lens.set({
      x: cx - w / 2, y: H / 2 - h / 2, w, h, r: h / 2, lift: up,
      fill: 1 - smooth(0, 0.6, up), // white thumb at rest, clear lens when lifted
      strength: mix(0, 18, up), bezel: Math.min(16, h * 0.34), magnify: 1 + up * 0.18, blur: 0,
    });
  }
  const driver = springDriver(render);
  driver.add(pos, lift);
  const raise = (down, amount = 1) => {
    lift.configure({ response: down ? 0.18 : 0.34, dampingRatio: 0.88 }).target = reducedNow() ? 0 : down ? amount : 0;
    if (reducedNow()) { lift.set(0); render(); } else driver.kick();
  };
  const onInput = () => { pos.target = frac(); if (reducedNow()) { pos.set(pos.target); render(); } else driver.kick(); };
  const onDown = (e) => { if (!e.isPrimary || e.button !== 0) return; pointer = e.pointerId; raise(true, e.pointerType === 'touch' ? 1 : 0.8); };
  const release = (e) => { if (pointer === null || (e?.pointerId !== undefined && e.pointerId !== pointer)) return; pointer = null; raise(false); };
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
  const onKeyDown = (e) => { if (keys.includes(e.key)) raise(true, 0.4); };
  const onKeyUp = () => raise(false);
  const onBlurInput = () => { release(); raise(false); };
  input.addEventListener('input', onInput);
  input.addEventListener('change', onInput);
  input.addEventListener('pointerdown', onDown);
  input.addEventListener('keydown', onKeyDown);
  input.addEventListener('keyup', onKeyUp);
  input.addEventListener('blur', onBlurInput);
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  const ro = new ResizeObserver(() => { pos.set(frac()); render(); });
  ro.observe(wrap);
  const offGlass = onGlassChange(render);
  render();
  return {
    render,
    sync: onInput,
    destroy() {
      driver.stop(); ro.disconnect(); offGlass(); lens.destroy();
      for (const [t, f] of [['input', onInput], ['change', onInput], ['pointerdown', onDown], ['keydown', onKeyDown], ['keyup', onKeyUp], ['blur', onBlurInput]]) input.removeEventListener(t, f);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      input.classList.remove('lgk-slider__input');
      wrap.replaceWith(input);
    },
  };
}

// ---------------------------------------------------------------------------
// Switch: native checkbox (role=switch) keeps state and a11y
// ---------------------------------------------------------------------------
export function mountSwitch(input, opts = {}) {
  input.setAttribute('role', 'switch');
  const wrap = document.createElement('span');
  wrap.className = 'lgk-switch';
  input.before(wrap);
  wrap.innerHTML = '<span class="lgk-switch__track"></span>';
  wrap.append(input);
  input.classList.add('lgk-switch__input', 'lg-hit-target');
  const lens = createLens(wrap, { className: 'lgk-lens--thumb' });
  const pos = new Spring(Number(input.checked), { response: 0.24, dampingRatio: 0.9 });
  const lift = new Spring(0, { response: 0.18, dampingRatio: 0.88 });
  let drag = null, suppress = false, pulse = 0;
  function render() {
    const W = wrap.clientWidth, H = wrap.clientHeight;
    wrap.toggleAttribute('data-on', input.checked);
    const up = reducedNow() ? 0 : clamp(lift.value);
    const baseH = H - 4, baseW = baseH * 1.55;
    const stretch = 1 + Math.min(0.2, Math.abs(pos.velocity) * 0.05) * up;
    const w = baseW * mix(1, 1.45, up) * stretch, h = baseH * mix(1, 1.5, up) / Math.sqrt(stretch);
    const cx = mix(2 + baseW / 2, W - 2 - baseW / 2, pos.value);
    lens.set({
      x: cx - w / 2, y: H / 2 - h / 2, w, h, r: h / 2, lift: up,
      fill: 1 - smooth(0, 0.6, up), strength: mix(0, 14, up), bezel: Math.min(12, h * 0.34), magnify: 1 + up * 0.1,
    });
  }
  const driver = springDriver(render);
  driver.add(pos, lift);
  const raise = (down, amount = 1) => {
    clearTimeout(pulse);
    lift.configure({ response: down ? 0.18 : 0.34, dampingRatio: 0.88 }).target = reducedNow() ? 0 : down ? amount : 0;
    if (reducedNow()) { lift.set(0); render(); } else driver.kick();
  };
  function commit(next, withPulse = false) {
    if (input.checked !== next) { input.checked = next; input.dispatchEvent(new Event('change', { bubbles: true })); }
    pos.target = Number(next);
    if (reducedNow()) { pos.set(pos.target); render(); return; }
    if (withPulse) { raise(true, 0.8); pulse = setTimeout(() => raise(false), 180); }
    driver.kick();
  }
  const onClick = (e) => {
    if (suppress && e.detail !== 0) { e.preventDefault(); suppress = false; return; }
    // Native toggle already happened; animate to the new state.
    pos.target = Number(input.checked);
    if (reducedNow()) { pos.set(pos.target); render(); } else { raise(true, 0.8); pulse = setTimeout(() => raise(false), 180); driver.kick(); }
  };
  const onDown = (e) => {
    if (!e.isPrimary || e.button !== 0 || drag) return;
    suppress = false;
    drag = { id: e.pointerId, start: e.clientX, origin: pos.value, prev: input.checked, moved: false };
    raise(true, e.pointerType === 'touch' ? 1 : 0.8);
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (e.buttons === 0) { end(e, true); return; }
    const dx = e.clientX - drag.start;
    if (!drag.moved && Math.abs(dx) < 4) return;
    drag.moved = true; input.setPointerCapture?.(e.pointerId);
    const travel = Math.max(1, wrap.clientWidth - (wrap.clientHeight - 4) * 1.55 - 4);
    pos.target = clamp(drag.origin + dx / travel);
    if (reducedNow()) { pos.set(pos.target); render(); } else driver.kick();
  };
  function end(e, cancel = false) {
    if (!drag || (e?.pointerId !== undefined && e.pointerId !== drag.id)) return;
    const d = drag; drag = null;
    if (cancel || d.moved) { suppress = true; commit(cancel ? d.prev : pos.target >= 0.5); }
    raise(false);
    if (input.hasPointerCapture?.(d.id)) input.releasePointerCapture(d.id);
  }
  const onUp = (e) => end(e, false);
  const onCancel = (e) => end(e, true);
  const onChange = () => { pos.target = Number(input.checked); driver.kick(); render(); };
  input.addEventListener('click', onClick);
  input.addEventListener('change', onChange);
  input.addEventListener('pointerdown', onDown);
  input.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);
  const ro = new ResizeObserver(render);
  ro.observe(wrap);
  const offGlass = onGlassChange(render);
  render();
  return {
    render,
    destroy() {
      clearTimeout(pulse); driver.stop(); ro.disconnect(); offGlass(); lens.destroy();
      input.removeEventListener('click', onClick);
      input.removeEventListener('change', onChange);
      input.removeEventListener('pointerdown', onDown);
      input.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      input.classList.remove('lgk-switch__input');
      wrap.replaceWith(input);
    },
  };
}

// ---------------------------------------------------------------------------
// Menu / popover: the trigger's glass grows into the panel and back
// ---------------------------------------------------------------------------
export function mountMenu(trigger, panel, opts = {}) {
  if (!panel) return { destroy() {} };
  panel.classList.add('lg', 'lg-thick', 'lg-menu');
  panel.hidden = true;
  trigger.setAttribute('aria-haspopup', panel.getAttribute('role') === 'menu' ? 'menu' : 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  if (panel.id) trigger.setAttribute('aria-controls', panel.id);
  // Inside a glass bar the trigger is a plain item of that bar (no glass on glass);
  // standalone it becomes its own glass button.
  const nested = Boolean(trigger.parentElement?.closest('.lg'));
  let cleanupTrigger = () => {};
  if (nested) trigger.classList.add('lgk-plain', 'lg-hit-target');
  else if (!trigger.classList.contains('lg')) cleanupTrigger = mountButton(trigger).destroy;
  let open = null;
  const onClick = () => {
    if (open) { open.close(); return; }
    open = morphOpen(trigger, panel, { onClose: () => { open = null; opts.onClose?.(); } });
    opts.onOpen?.();
  };
  const onItem = (e) => { if (open && e.target.closest('[role="menuitem"], [data-lg-close]')) open.close(); };
  trigger.addEventListener('click', onClick);
  panel.addEventListener('click', onItem);
  const cleanupPanel = enhance(panel, { lens: true });
  return {
    get open() { return Boolean(open); },
    close: () => open?.close(),
    destroy() { open?.close(); trigger.removeEventListener('click', onClick); panel.removeEventListener('click', onItem); cleanupPanel(); cleanupTrigger(); trigger.classList.remove('lgk-plain'); },
  };
}

// ---------------------------------------------------------------------------
// Static surfaces and buttons
// ---------------------------------------------------------------------------
export function mountSurface(el, opts = {}) {
  el.classList.add('lg');
  if (opts.variant) el.classList.add(`lg-${opts.variant}`);
  return { destroy: enhance(el, { lens: true, interactive: false, ...opts }) };
}
export function mountButton(el, opts = {}) {
  el.classList.add('lg', 'lg-interactive', 'lg-hit-target');
  if (opts.variant) el.classList.add(`lg-${opts.variant}`);
  return { destroy: enhance(el, { lens: true, interactive: true, ...opts }) };
}

// ---------------------------------------------------------------------------
// The "Liquid Glass" appearance setting: transparent -> dense
// ---------------------------------------------------------------------------
/**
 * mountDensity(input, { storageKey, defaultValue = 50, reset })
 * Drives --lg-density for the whole app, saves it, and locks to the system when
 * Reduce Transparency / forced colors are on (the material is opaque then).
 */
export function mountDensity(input, opts = {}) {
  const key = opts.storageKey ?? 'liquidglass.density';
  const def = opts.defaultValue ?? 50;
  input.min = input.min || '0'; input.max = input.max || '100';
  try { const saved = localStorage.getItem(key); if (saved !== null && Number.isFinite(Number(saved))) input.value = saved; else input.value = String(def); } catch { input.value = String(def); }
  const apply = () => { setDensity(Number(input.value) / 100); input.setAttribute('aria-valuetext', `${input.value}%`); };
  const save = () => { try { localStorage.setItem(key, input.value); } catch { /* optional persistence */ } };
  const lock = () => { const opaque = opaquePreferred(); input.disabled = opaque; if (opts.reset) opts.reset.disabled = opaque; };
  const onReset = () => { input.value = String(def); apply(); save(); input.dispatchEvent(new Event('input', { bubbles: true })); };
  input.addEventListener('input', apply);
  input.addEventListener('change', save);
  opts.reset?.addEventListener('click', onReset);
  const queries = ['(prefers-reduced-transparency: reduce)', '(forced-colors: active)'].map((q) => matchMedia(q));
  queries.forEach((m) => m.addEventListener?.('change', lock));
  apply(); lock();
  // The setting itself uses the liquid slider unless the product draws its own.
  const slider = opts.slider === false || input.closest('.lgk-slider') ? null : mountSlider(input);
  return {
    destroy() {
      slider?.destroy();
      input.removeEventListener('input', apply); input.removeEventListener('change', save);
      opts.reset?.removeEventListener('click', onReset);
      queries.forEach((m) => m.removeEventListener?.('change', lock));
    },
  };
}

// ---------------------------------------------------------------------------
// autoMount: the one call a product needs
// ---------------------------------------------------------------------------
const MOUNTERS = {
  surface: (el) => mountSurface(el, { variant: el.dataset.lgVariant }),
  button: (el) => mountButton(el, { variant: el.dataset.lgVariant }),
  tabs: (el) => mountTabs(el),
  slider: (el) => mountSlider(el),
  switch: (el) => mountSwitch(el),
  menu: (el) => mountMenu(el, document.querySelector(el.dataset.lgPanel)),
  density: (el) => mountDensity(el, { storageKey: el.dataset.lgStorage, reset: el.dataset.lgReset ? document.querySelector(el.dataset.lgReset) : null }),
};

/**
 * autoMount({ root = document, observe = false, tier = 'auto' }) -> dispose()
 * observe: also mount [data-lg] nodes added later (SPA without per-component hooks).
 */
export function autoMount({ root = document, observe = false, tier = 'auto' } = {}) {
  if (!hasWindow) return () => {};
  const disposeCore = initLiquidGlass({ root: document.createElement('div'), tier, guard: tier === 'auto' });
  const mounted = new Map();
  const mountOne = (el) => {
    if (mounted.has(el)) return;
    const fn = MOUNTERS[el.dataset.lg];
    if (!fn) { console.warn('[liquid-glass-kit] unknown data-lg:', el.dataset.lg, el); return; }
    mounted.set(el, fn(el));
  };
  const scan = (node) => {
    if (node.nodeType !== 1) return;
    if (node.matches('[data-lg]')) mountOne(node);
    node.querySelectorAll('[data-lg]').forEach(mountOne);
  };
  scan(root === document ? document.documentElement : root);
  syncRendererAttr();
  const prefs = ['(prefers-reduced-transparency: reduce)', '(forced-colors: active)', '(prefers-reduced-motion: reduce)', '(prefers-color-scheme: dark)'].map((q) => matchMedia(q));
  const onPref = () => { syncRendererAttr(); notify(); };
  prefs.forEach((m) => m.addEventListener?.('change', onPref));
  let mo = null;
  if (observe) {
    mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach(scan);
        r.removedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          for (const [el, ctl] of mounted) if (n === el || n.contains(el)) { ctl.destroy?.(); mounted.delete(el); }
        });
      }
    });
    mo.observe(root === document ? document.body : root, { childList: true, subtree: true });
  }
  return () => {
    mo?.disconnect();
    prefs.forEach((m) => m.removeEventListener?.('change', onPref));
    for (const ctl of mounted.values()) ctl.destroy?.();
    mounted.clear();
    disposeCore();
  };
}

/** What is really rendering — copy this into bug reports instead of guessing. */
export function glassDiagnostics() {
  return {
    renderer: rendererKind(),
    tier: getTier(),
    chromium: isChromium(),
    backdropFilter: hasWindow && (CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)')),
    reducedTransparency: mq('(prefers-reduced-transparency: reduce)'),
    reducedMotion: mq('(prefers-reduced-motion: reduce)'),
    density,
    lenses: hasWindow ? document.querySelectorAll('.lgk-lens').length : 0,
  };
}
