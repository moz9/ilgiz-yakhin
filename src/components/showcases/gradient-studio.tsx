"use client";

import { useEffect, useRef, useState } from "react";
import { Clapperboard, Download, Link2, Shuffle } from "lucide-react";
import { useGlassTabs, GlassRange } from "@/components/glass/glass-runtime";
import type { ShowcaseProps } from "./registry";

type Preset = { name: string; colors: [string, string, string, string] };
const PRESETS: Preset[] = [
  { name: "Аврора", colors: ["#0b1e4a", "#2fd3a0", "#5b7bff", "#b46bff"] },
  { name: "Закат", colors: ["#2a0a2e", "#ff5f6d", "#ffc371", "#ff8fb1"] },
  { name: "Океан", colors: ["#021526", "#03346e", "#6eacda", "#e2e2b6"] },
  { name: "Неон", colors: ["#07010f", "#ff2fd1", "#00f0ff", "#7a5cff"] },
];

const FORMATS = [
  { name: "Экран", w: 1920, h: 1080 }, { name: "Сторис", w: 1080, h: 1920 }, { name: "Квадрат", w: 1080, h: 1080 }, { name: "4K", w: 3840, h: 2160 },
];
type Look = { colors: [string, string, string, string]; speed: number; warp: number; grain: number };
/** A look travels in the link: #g=<colors without #>-<speed>-<warp>-<grain>. */
const encode = (l: Look) => `g=${l.colors.map((c) => c.slice(1)).join(".")}-${l.speed}-${l.warp}-${l.grain}`;
function decode(hash: string): Look | null {
  const m = hash.match(/g=([0-9a-f.]{27})-(\d+)-(\d+)-(\d+)/i);
  if (!m) return null;
  return { colors: m[1].split(".").map((c) => `#${c}`) as Look["colors"], speed: Number(m[2]), warp: Number(m[3]), grain: Number(m[4]) };
}

const VERT = `#version 300 es
in vec2 p; out vec2 uv;
void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

// A mesh gradient: four colours mixed by domain-warped noise, pulled toward the pointer, with film grain.
const FRAG = `#version 300 es
precision highp float;
in vec2 uv; out vec4 color;
uniform float t, warp, grain, aspect;
uniform vec2 pointer;
uniform vec3 c0, c1, c2, c3;
vec2 hash(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash(i), f), dot(hash(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
             mix(dot(hash(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash(i + vec2(1, 1)), f - vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; } return v; }
void main() {
  vec2 q = vec2(uv.x * aspect, uv.y);
  vec2 m = vec2(pointer.x * aspect, pointer.y);
  float d = distance(q, m);
  q += (m - q) * 0.18 * exp(-d * 3.0);
  vec2 w = vec2(fbm(q * 1.4 + t * 0.07), fbm(q * 1.4 - t * 0.05 + 3.1));
  float n = fbm(q * 1.2 + w * warp * 2.2 + t * 0.03);
  float k = fbm(q * 0.9 - w * warp + 7.0);
  vec3 col = mix(c0, c1, smoothstep(-0.35, 0.45, n));
  col = mix(col, c2, smoothstep(-0.15, 0.55, k));
  col = mix(col, c3, smoothstep(0.25, 0.75, n * k * 2.0 + 0.3));
  col += (fract(sin(dot(uv * 1000.0 + t, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * grain;
  color = vec4(col, 1.0);
}`;

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

/**
 * Gradient studio: a living mesh gradient drawn by a WebGL2 shader. Presets, speed, warp
 * and grain are live controls; the gradient bends toward the pointer and can be saved as
 * a PNG. The control panel is the site's glass kit over the shader.
 */
export default function GradientStudio({ mode }: ShowcaseProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  // A shared link opens with its look; the demo renders on the client only, so the hash is readable here.
  const [shared] = useState(() => decode(location.hash));
  const [preset, setPreset] = useState(shared ? -1 : 0);
  const [colors, setColors] = useState(shared?.colors ?? PRESETS[0].colors);
  const [speed, setSpeed] = useState(shared?.speed ?? 60);
  const [warp, setWarp] = useState(shared?.warp ?? 55);
  const [grain, setGrain] = useState(shared?.grain ?? 35);
  const [failed, setFailed] = useState(false);
  const [format, setFormat] = useState(0);
  const formatTabs = useRef<HTMLDivElement>(null);
  useGlassTabs(formatTabs, format, setFormat);
  const [note, setNote] = useState("");
  const [recording, setRecording] = useState(false);
  const api = useRef<{ snapshot: (w: number, h: number) => string; record: (w: number, h: number, seconds: number) => Promise<Blob | null> } | null>(null);

  // The render loop reads the latest controls from a ref, so it never restarts on a change.
  const state = useRef({ colors, speed, warp, grain });
  useEffect(() => { state.current = { colors, speed, warp, grain }; }, [colors, speed, warp, grain]);
  useGlassTabs(tabs, preset, (index) => { setPreset(index); setColors(PRESETS[index].colors); });

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });
    if (!gl) { setFailed(true); return; }
    const shader = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const program = gl.createProgram()!;
    gl.attachShader(program, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { setFailed(true); return; }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = { t: u("t"), warp: u("warp"), grain: u("grain"), aspect: u("aspect"), pointer: u("pointer"), c: [u("c0"), u("c1"), u("c2"), u("c3")] };

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const shown = { current: [...state.current.colors].map(rgb) };
    let time = 7;
    let last = performance.now();
    let frame = 0;
    let visible = true;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 1.75);
      el.width = Math.round(el.clientWidth * dpr);
      el.height = Math.round(el.clientHeight * dpr);
      gl.viewport(0, 0, el.width, el.height);
    };
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = state.current;
      if (!reduced) time += dt * (s.speed / 50);
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      // Colours glide to the chosen preset instead of jumping.
      const target = s.colors.map(rgb);
      shown.current = shown.current.map((c, i) => c.map((v, j) => v + (target[i][j] - v) * 0.06));
      gl.uniform1f(uniforms.t, time);
      gl.uniform1f(uniforms.warp, s.warp / 50);
      gl.uniform1f(uniforms.grain, s.grain / 600);
      gl.uniform1f(uniforms.aspect, el.width / el.height);
      gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
      shown.current.forEach((c, i) => gl.uniform3f(uniforms.c[i], c[0], c[1], c[2]));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const loop = (now: number) => { draw(now); frame = visible ? requestAnimationFrame(loop) : 0; };
    const onMove = (event: PointerEvent) => {
      const box = el.getBoundingClientRect();
      pointer.tx = (event.clientX - box.left) / box.width;
      pointer.ty = 1 - (event.clientY - box.top) / box.height;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) { last = performance.now(); frame = requestAnimationFrame(loop); }
    });
    const ro = new ResizeObserver(resize);
    resize();
    ro.observe(el);
    observer.observe(el);
    el.parentElement?.addEventListener("pointermove", onMove);
    frame = requestAnimationFrame(loop);

    // Exports render at the chosen size into the same canvas, then give it back its screen size.
    const atSize = (w: number, h: number) => { el.width = w; el.height = h; gl.viewport(0, 0, w, h); };
    api.current = {
      snapshot: (w, h) => {
        atSize(w, h);
        draw(performance.now());
        const url = el.toDataURL("image/png");
        resize();
        return url;
      },
      record: (w, h, seconds) => new Promise((resolve) => {
        if (typeof MediaRecorder === "undefined" || !el.captureStream) { resolve(null); return; }
        // Browsers encode video up to about 1080p reliably: larger formats are scaled down to fit.
        const k = Math.min(1, 1920 / Math.max(w, h));
        atSize(Math.round(w * k / 2) * 2, Math.round(h * k / 2) * 2);
        const type = ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
        const recorder = new MediaRecorder(el.captureStream(30), { mimeType: type, videoBitsPerSecond: 10_000_000 });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
        recorder.onstop = () => { resize(); resolve(new Blob(chunks, { type: type.split(";")[0] || "video/webm" })); };
        recorder.start();
        setTimeout(() => recorder.stop(), seconds * 1000);
      }),
    };
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      ro.disconnect();
      el.parentElement?.removeEventListener("pointermove", onMove);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      api.current = null;
    };
  }, []);

  const shuffle = () => {
    const hue = () => `#${Array.from({ length: 3 }, () => Math.floor(40 + Math.random() * 215).toString(16).padStart(2, "0")).join("")}`;
    setColors(["#08060f", hue(), hue(), hue()]);
  };
  const flash = (text: string) => { setNote(text); setTimeout(() => setNote(""), 2600); };
  const size = FORMATS[format];
  const save = () => {
    const url = api.current?.snapshot(size.w, size.h);
    if (!url) return;
    const link = document.createElement("a");
    link.download = `градиент-${size.w}x${size.h}.png`;
    link.href = url;
    link.click();
    flash(`PNG ${size.w}×${size.h} сохранён`);
  };
  const video = async () => {
    if (!api.current || recording) return;
    setRecording(true);
    const blob = await api.current.record(size.w, size.h, 6);
    setRecording(false);
    if (!blob) { flash("Этот браузер не умеет записывать видео с canvas"); return; }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `градиент-6с.${blob.type.includes("mp4") ? "mp4" : "webm"}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    flash("Видео на 6 секунд сохранено");
  };
  const share = async () => {
    const url = `${location.origin}/demos/lab/gradient-studio#${encode({ colors, speed, warp, grain })}`;
    try { await navigator.clipboard.writeText(url); flash("Ссылка на этот градиент скопирована"); } catch { flash(url); }
  };

  return <div className={`gs gs-${mode}`}>
    <canvas ref={canvas} className="gs-canvas" aria-label="Живой градиент" role="img" />
    {failed && <p className="gs-failed">Браузер не дал WebGL2 — градиент здесь не рисуется.</p>}
    <div className="gs-panel" data-lg="surface">
      <div className="gs-presets" ref={tabs} role="tablist" aria-label="Палитра">
        {PRESETS.map((item, index) => <button key={item.name} type="button" role="tab" aria-selected={preset === index} tabIndex={preset === index ? 0 : -1}>
          <span className="gs-swatch" style={{ background: `linear-gradient(135deg, ${item.colors.slice(1).join(", ")})` }} aria-hidden="true" />{item.name}
        </button>)}
      </div>
      <div className="gs-sliders">
        {([["Скорость", speed, setSpeed], ["Изгиб", warp, setWarp], ["Зерно", grain, setGrain]] as const).map(([label, value, set]) =>
          <label key={label}><span>{label}<output>{value}</output></span>
            <GlassRange min="0" max="100" value={value} onChange={(event) => set(Number(event.target.value))} />
          </label>)}
      </div>
      <div className="gs-formats" ref={formatTabs} role="tablist" aria-label="Размер для экспорта">
        {FORMATS.map((f, i) => <button key={f.name} type="button" role="tab" aria-selected={format === i} tabIndex={format === i ? 0 : -1}>{f.name}<small>{f.w}×{f.h}</small></button>)}
      </div>
      <div className="gs-actions">
        <button type="button" className="button button-primary" data-lg="button" data-lg-variant="prominent" onClick={save}><Download aria-hidden="true" />PNG</button>
        <button type="button" className="button" data-lg="button" onClick={video} disabled={recording}><Clapperboard aria-hidden="true" />{recording ? "Пишу 6 с…" : "Видео 6 с"}</button>
        <button type="button" className="button" data-lg="button" onClick={shuffle} aria-label="Случайные цвета"><Shuffle aria-hidden="true" /></button>
        <button type="button" className="button" data-lg="button" onClick={share} aria-label="Скопировать ссылку на градиент"><Link2 aria-hidden="true" /></button>
      </div>
      {note && <p className="gs-note" role="status">{note}</p>}
    </div>
  </div>;
}
