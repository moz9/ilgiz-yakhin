"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useGlassTabs } from "@/components/glass/glass-runtime";
import type { ShowcaseProps } from "./registry";

// Frames of the portfolio's own cases: same origin, so WebGL may read them as textures.
const SLIDES = [
  { src: "/cases/chessrise-desktop.webp", title: "ChessRise" },
  { src: "/cases/liquid-glass-kit-product.webp", title: "Liquid Glass Kit" },
  { src: "/cases/globe-routes-europe.webp", title: "Маршруты на глобусе" },
  { src: "/cases/pioner.webp", title: "ТРЦ «Пионер»" },
  { src: "/cases/gradient-studio-sunset.webp", title: "Градиентная студия" },
  { src: "/cases/glassrates-cover.webp", title: "GlassRates" },
];
const EFFECTS = ["Рябь", "Растворение", "Жидкость", "Срез"] as const;

const VERT = `#version 300 es
in vec2 p; out vec2 uv; void main(){ uv = p * 0.5 + 0.5; uv.y = 1.0 - uv.y; gl_Position = vec4(p, 0.0, 1.0); }`;

// One fragment shader, four transitions between texture a and texture b driven by progress.
const FRAG = `#version 300 es
precision highp float;
in vec2 uv; out vec4 color;
uniform sampler2D a, b;
uniform float progress, aspect, imageAspect, t;
uniform int effect;
uniform vec2 origin;
vec2 cover(vec2 p) { float r = aspect / imageAspect; return r > 1.0 ? vec2(p.x, (p.y - 0.5) / r + 0.5) : vec2((p.x - 0.5) * r + 0.5, p.y); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
void main() {
  float pr = progress;
  vec2 q = uv;
  if (effect == 0) {
    vec2 d = (q - origin) * vec2(aspect, 1.0);
    float dist = length(d);
    float front = pr * 1.8;
    float wave = sin((dist - front) * 40.0) * exp(-abs(dist - front) * 12.0) * (1.0 - pr);
    vec2 offs = normalize(d + 1e-5) * wave * 0.03;
    float m = smoothstep(front - 0.05, front + 0.05, dist);
    color = mix(texture(b, cover(q + offs)), texture(a, cover(q + offs)), m);
  } else if (effect == 1) {
    float n = noise(q * vec2(aspect, 1.0) * 7.0) * 0.7 + noise(q * 30.0) * 0.3;
    float edge = smoothstep(pr - 0.04, pr, n) - smoothstep(pr, pr + 0.04, n);
    vec4 c = n < pr ? texture(b, cover(q)) : texture(a, cover(q));
    color = c + vec4(1.0, 0.55, 0.25, 0.0) * edge * 2.0 * (1.0 - abs(pr - 0.5) * 1.6);
  } else if (effect == 2) {
    vec2 flow = vec2(noise(q * 4.0 + t * 0.3), noise(q * 4.0 + 7.3 - t * 0.3)) - 0.5;
    float s = sin(pr * 3.14159);
    vec4 ca = texture(a, cover(q + flow * s * 0.35 * pr));
    vec4 cb = texture(b, cover(q - flow * s * 0.35 * (1.0 - pr)));
    color = mix(ca, cb, smoothstep(0.2, 0.8, pr + (flow.x) * 0.4 * s));
  } else {
    float bands = 12.0;
    float row = floor(q.y * bands);
    float delay = hash(vec2(row, 3.0)) * 0.35;
    float lp = clamp((pr - delay) / 0.65, 0.0, 1.0);
    lp = lp * lp * (3.0 - 2.0 * lp);
    vec4 ca = texture(a, cover(q + vec2(lp * 0.15, 0.0)));
    vec4 cb = texture(b, cover(q - vec2((1.0 - lp) * 0.15, 0.0)));
    color = mix(ca, cb, step(1.0 - lp, q.x));
  }
}`;

/**
 * Shader gallery: frames of the portfolio's cases flip with WebGL transitions — a ripple
 * from the click point, a burning dissolve, a liquid flow and sliced bands. One fragment
 * shader holds all four; progress is tweened by GSAP. Autoplay stops once the reader acts.
 */
export default function ShaderGallery({ mode }: ShowcaseProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [effect, setEffect] = useState(0);
  const [failed, setFailed] = useState(false);
  const go = useRef<(to: number, origin?: [number, number]) => void>(() => {});
  const touched = useRef(false);
  const effectRef = useRef(effect);
  useEffect(() => { effectRef.current = effect; }, [effect]);
  useGlassTabs(tabs, effect, (i) => { touched.current = true; setEffect(i); });

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext("webgl2");
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

    const textures = SLIDES.map(() => gl.createTexture()!);
    const aspects = SLIDES.map(() => 1.6);
    SLIDES.forEach((slide, i) => {
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

    const state = { from: 0, to: 0, progress: 1, origin: [0.5, 0.5] as [number, number], busy: false };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const draw = () => {
      gl.uniform1f(u("progress"), state.progress);
      gl.uniform1f(u("aspect"), el.width / el.height);
      gl.uniform1f(u("imageAspect"), aspects[state.to]);
      gl.uniform1f(u("t"), (performance.now() - start) / 1000);
      gl.uniform1i(u("effect"), effectRef.current);
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
    go.current = (to, origin) => {
      if (state.busy || to === state.to) return;
      state.from = state.to; state.to = to; state.progress = 0; state.busy = true;
      state.origin = origin ?? [0.5, 0.5];
      setIndex(to);
      gsap.to(state, { progress: 1, duration: reduced ? 0 : 1.5, ease: "power2.inOut", onUpdate: draw, onComplete: () => { state.busy = false; draw(); } });
    };
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
      requestAnimationFrame(() => go.current((state.to + 1) % SLIDES.length, [0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4]));
    }, 3600);
    return () => { clearInterval(timer); io.disconnect(); ro.disconnect(); textures.forEach((tx) => gl.deleteTexture(tx)); gl.deleteProgram(program); gl.deleteBuffer(buffer); };
  }, []);

  const step = (delta: number) => { touched.current = true; go.current((index + delta + SLIDES.length) % SLIDES.length); };
  const onCanvas = (event: React.PointerEvent) => {
    touched.current = true;
    const box = canvas.current!.getBoundingClientRect();
    go.current((index + 1) % SLIDES.length, [(event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height]);
  };

  return <div className={`sg sg-${mode}`}>
    <canvas ref={canvas} className="sg-canvas" onPointerDown={onCanvas} role="img" aria-label={`Кадр кейса: ${SLIDES[index].title}`} />
    {failed && <p className="gs-failed">Браузер не дал WebGL2 — переходы здесь не рисуются.</p>}
    <p className="sg-title" aria-live="polite"><small>{String(index + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}</small>{SLIDES[index].title}</p>
    <div className="sg-bar" data-lg="surface">
      <button type="button" className="sg-arrow" onClick={() => step(-1)} aria-label="Предыдущий кадр"><ChevronLeft aria-hidden="true" /></button>
      <div className="sg-tabs" ref={tabs} role="tablist" aria-label="Переход">
        {EFFECTS.map((item, i) => <button key={item} type="button" role="tab" aria-selected={effect === i} tabIndex={effect === i ? 0 : -1}>{item}</button>)}
      </div>
      <button type="button" className="sg-arrow" onClick={() => step(1)} aria-label="Следующий кадр"><ChevronRight aria-hidden="true" /></button>
    </div>
  </div>;
}
