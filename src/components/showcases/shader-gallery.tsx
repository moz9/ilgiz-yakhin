"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clapperboard, Code2, ImagePlus } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useGlassTabs } from "@/components/glass/glass-runtime";
import type { ShowcaseProps } from "./registry";

type Slide = { src: string; title: string };
// Frames of the portfolio's own cases: same origin, so WebGL may read them as textures.
const DEFAULT_SLIDES: Slide[] = [
  { src: "/cases/chessrise-desktop.webp", title: "ChessRise" },
  { src: "/cases/liquid-glass-kit-product.webp", title: "Liquid Glass Kit" },
  { src: "/cases/globe-routes-focus.webp", title: "Перелёты" },
  { src: "/cases/pioner.webp", title: "ТРЦ «Пионер»" },
  { src: "/cases/gradient-studio-sunset.webp", title: "Градиентная студия" },
  { src: "/cases/glassrates-cover.webp", title: "GlassRates" },
];
const EFFECTS = ["Рябь", "Растворение", "Жидкость", "Срез"] as const;

const VERT = `#version 300 es
in vec2 p; out vec2 uv; void main(){ uv = p * 0.5 + 0.5; uv.y = 1.0 - uv.y; gl_Position = vec4(p, 0.0, 1.0); }`;

// One fragment shader, four transitions from texture a to texture b, driven by progress and amount.
const FRAG = `#version 300 es
precision highp float;
in vec2 uv; out vec4 color;
uniform sampler2D a, b;
uniform float progress, aspect, aspectA, aspectB, t, amount;
uniform int effect;
uniform vec2 origin;
vec2 cover(vec2 p, float img) { float r = aspect / img; return r > 1.0 ? vec2(p.x, (p.y - 0.5) / r + 0.5) : vec2((p.x - 0.5) * r + 0.5, p.y); }
vec4 A(vec2 p) { return texture(a, cover(p, aspectA)); }
vec4 B(vec2 p) { return texture(b, cover(p, aspectB)); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
void main() {
  float pr = progress;
  vec2 q = uv;
  if (effect == 0) {
    vec2 d = (q - origin) * vec2(aspect, 1.0);
    float dist = length(d), front = pr * 1.8;
    float wave = sin((dist - front) * 40.0) * exp(-abs(dist - front) * 12.0) * (1.0 - pr);
    vec2 offs = normalize(d + 1e-5) * wave * 0.05 * amount;
    color = mix(B(q + offs), A(q + offs), smoothstep(front - 0.05, front + 0.05, dist));
  } else if (effect == 1) {
    float n = noise(q * vec2(aspect, 1.0) * (3.0 + amount * 8.0)) * 0.7 + noise(q * 30.0) * 0.3;
    float w = 0.02 + amount * 0.05;
    float edge = smoothstep(pr - w, pr, n) - smoothstep(pr, pr + w, n);
    color = (n < pr ? B(q) : A(q)) + vec4(1.0, 0.55, 0.25, 0.0) * edge * 2.0 * (1.0 - abs(pr - 0.5) * 1.6);
  } else if (effect == 2) {
    vec2 flow = vec2(noise(q * 4.0 + t * 0.3), noise(q * 4.0 + 7.3 - t * 0.3)) - 0.5;
    float s = sin(pr * 3.14159) * amount * 1.6;
    color = mix(A(q + flow * s * 0.35 * pr), B(q - flow * s * 0.35 * (1.0 - pr)), smoothstep(0.2, 0.8, pr + flow.x * 0.4 * s));
  } else {
    float row = floor(q.y * (4.0 + amount * 20.0));
    float lp = clamp((pr - hash(vec2(row, 3.0)) * 0.35) / 0.65, 0.0, 1.0);
    lp = lp * lp * (3.0 - 2.0 * lp);
    color = mix(A(q + vec2(lp * 0.15, 0.0)), B(q - vec2((1.0 - lp) * 0.15, 0.0)), step(1.0 - lp, q.x));
  }
}`;

type Api = { go: (to: number, origin?: [number, number]) => boolean; load: (slides: Slide[]) => void; record: () => Promise<Blob | null> };

/**
 * A transition studio: frames flip with WebGL transitions — a ripple from the click point, a
 * burning dissolve, a liquid flow and sliced bands. Drop in your own pictures, tune duration
 * and strength, record a transition to a video file or copy the shader for your own project.
 */
export default function ShaderGallery({ mode }: ShowcaseProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [index, setIndex] = useState(0);
  const [effect, setEffect] = useState(0);
  const [duration, setDuration] = useState(1.5);
  const [amount, setAmount] = useState(0.6);
  const [failed, setFailed] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [dropping, setDropping] = useState(false);
  const api = useRef<Api | null>(null);
  const touched = useRef(false);
  const live = useRef({ effect, duration, amount, index });
  useEffect(() => { live.current = { effect, duration, amount, index }; }, [effect, duration, amount, index]);
  useGlassTabs(tabs, effect, (i) => { touched.current = true; setEffect(i); });

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext("webgl2", { preserveDrawingBuffer: true });
    if (!gl) { setFailed(true); return; }
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const program = gl.createProgram()!;
    gl.attachShader(program, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { setFailed(true); return; }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(program, n);
    gl.uniform1i(u("a"), 0);
    gl.uniform1i(u("b"), 1);

    let textures: WebGLTexture[] = [];
    let aspects: number[] = [];
    const state = { from: 0, to: 0, progress: 1, origin: [0.5, 0.5] as [number, number], busy: false };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const draw = () => {
      if (!textures.length) return;
      gl.uniform1f(u("progress"), state.progress);
      gl.uniform1f(u("aspect"), el.width / el.height);
      gl.uniform1f(u("aspectA"), aspects[state.from] ?? 1.6);
      gl.uniform1f(u("aspectB"), aspects[state.to] ?? 1.6);
      gl.uniform1f(u("t"), (performance.now() - start) / 1000);
      gl.uniform1f(u("amount"), live.current.amount);
      gl.uniform1i(u("effect"), live.current.effect);
      gl.uniform2f(u("origin"), state.origin[0], state.origin[1]);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, textures[state.from]);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, textures[state.to]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      el.width = Math.round(el.clientWidth * dpr); el.height = Math.round(el.clientHeight * dpr);
      gl.viewport(0, 0, el.width, el.height); draw();
    };
    const go = (to: number, origin?: [number, number]) => {
      if (state.busy || to === state.to || !textures[to]) return false;
      state.from = state.to; state.to = to; state.progress = 0; state.busy = true;
      state.origin = origin ?? [0.5, 0.5];
      setIndex(to);
      gsap.to(state, { progress: 1, duration: reduced ? 0 : live.current.duration, ease: "power2.inOut", onUpdate: draw, onComplete: () => { state.busy = false; draw(); } });
      return true;
    };
    api.current = {
      go,
      load: (list) => {
        textures.forEach((tx) => gl.deleteTexture(tx));
        textures = list.map(() => gl.createTexture()!);
        aspects = list.map(() => 1.6);
        state.from = state.to = 0; state.progress = 1; state.busy = false;
        setIndex(0);
        list.forEach((slide, i) => {
          const image = new Image();
          image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, textures[i]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            aspects[i] = image.naturalWidth / image.naturalHeight;
            draw();
          };
          image.src = slide.src;
        });
      },
      // Record the next transition from the canvas stream: half a second of rest, the move, half a second after.
      record: () => new Promise((resolve) => {
        if (typeof MediaRecorder === "undefined" || !el.captureStream) { resolve(null); return; }
        const stream = el.captureStream(60);
        const type = ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
        const recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 8_000_000 });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
        recorder.onstop = () => resolve(new Blob(chunks, { type: type.split(";")[0] || "video/webm" }));
        recorder.start();
        // The canvas only emits frames when it is drawn: keep drawing while recording.
        let frame = 0;
        const tick = () => { draw(); frame = requestAnimationFrame(tick); };
        tick();
        setTimeout(() => go((state.to + 1) % textures.length, [0.5, 0.5]), 500);
        setTimeout(() => { cancelAnimationFrame(frame); recorder.stop(); }, 1000 + live.current.duration * 1000 + 500);
      }),
    };
    api.current.load(DEFAULT_SLIDES);
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    // Until the reader acts, the gallery turns by itself while it is on screen.
    let visible = false;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(el);
    const timer = reduced ? 0 : window.setInterval(() => {
      if (!visible || touched.current || state.busy) return;
      setEffect((e) => (e + 1) % EFFECTS.length);
      requestAnimationFrame(() => go((state.to + 1) % textures.length, [0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4]));
    }, 3600);
    return () => { clearInterval(timer); io.disconnect(); ro.disconnect(); textures.forEach((tx) => gl.deleteTexture(tx)); gl.deleteProgram(program); gl.deleteBuffer(buffer); api.current = null; };
  }, []);

  const flash = (text: string) => { setNote(text); setTimeout(() => setNote(""), 2600); };
  const step = (delta: number) => { touched.current = true; api.current?.go((index + delta + slides.length) % slides.length); };
  const onCanvas = (event: React.PointerEvent) => {
    touched.current = true;
    const box = canvas.current!.getBoundingClientRect();
    api.current?.go((index + 1) % slides.length, [(event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height]);
  };
  const takeFiles = (files: FileList | null) => {
    const images = [...(files ?? [])].filter((f) => f.type.startsWith("image/")).slice(0, 12);
    if (images.length < 2) { flash("Нужно хотя бы две картинки"); return; }
    touched.current = true;
    slides.forEach((s) => { if (s.src.startsWith("blob:")) URL.revokeObjectURL(s.src); });
    const next = images.map((f) => ({ src: URL.createObjectURL(f), title: f.name.replace(/\.[^.]+$/, "") }));
    setSlides(next);
    api.current?.load(next);
    flash(`Загружено ${next.length} — картинки остаются на вашем устройстве`);
  };
  const record = async () => {
    if (!api.current || busy) return;
    touched.current = true;
    setBusy(true);
    const blob = await api.current.record();
    setBusy(false);
    if (!blob) { flash("Этот браузер не умеет записывать видео с canvas"); return; }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `переход-${EFFECTS[effect].toLowerCase()}.${blob.type.includes("mp4") ? "mp4" : "webm"}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    flash("Видео сохранено");
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(FRAG); flash(`GLSL скопирован · эффект ${effect}: «${EFFECTS[effect]}»`); } catch { flash("Буфер обмена недоступен"); }
  };

  return <div className={`sg sg-${mode}`} data-dropping={dropping || undefined}
    onDragOver={(e) => { e.preventDefault(); setDropping(true); }} onDragLeave={() => setDropping(false)}
    onDrop={(e) => { e.preventDefault(); setDropping(false); takeFiles(e.dataTransfer.files); }}>
    <canvas ref={canvas} className="sg-canvas" onPointerDown={onCanvas} role="img" aria-label={`Кадр: ${slides[index]?.title}`} />
    {failed && <p className="gs-failed">Браузер не дал WebGL2 — переходы здесь не рисуются.</p>}
    <p className="sg-title" aria-live="polite"><small>{String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</small>{slides[index]?.title}</p>
    {dropping && <p className="sg-drop" aria-hidden="true"><ImagePlus />Отпустите — картинки станут кадрами</p>}

    <aside className="sg-studio" data-lg="surface" aria-label="Настройки перехода">
      <label>Длительность <b>{duration.toFixed(1).replace(".", ",")} с</b><input type="range" min="0.5" max="3" step="0.1" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></label>
      <label>Сила <b>{Math.round(amount * 100)}%</b><input type="range" min="0" max="1" step="0.05" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></label>
      <div className="sg-actions">
        <button type="button" onClick={() => file.current?.click()}><ImagePlus aria-hidden="true" />Свои картинки</button>
        <button type="button" onClick={record} disabled={busy}><Clapperboard aria-hidden="true" />{busy ? "Пишу…" : "Записать видео"}</button>
        <button type="button" onClick={copy}><Code2 aria-hidden="true" />Код шейдера</button>
      </div>
      <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => takeFiles(e.target.files)} />
      {note && <p className="sg-note" role="status">{note}</p>}
    </aside>

    <div className="sg-bar" data-lg="surface">
      <button type="button" className="sg-arrow" onClick={() => step(-1)} aria-label="Предыдущий кадр"><ChevronLeft aria-hidden="true" /></button>
      <div className="sg-tabs" ref={tabs} role="tablist" aria-label="Переход">
        {EFFECTS.map((item, i) => <button key={item} type="button" role="tab" aria-selected={effect === i} tabIndex={effect === i ? 0 : -1}>{item}</button>)}
      </div>
      <button type="button" className="sg-arrow" onClick={() => step(1)} aria-label="Следующий кадр"><ChevronRight aria-hidden="true" /></button>
    </div>
  </div>;
}
