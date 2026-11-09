"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Shuffle } from "lucide-react";
import { useGlassTabs } from "@/components/glass/glass-runtime";
import type { ShowcaseProps } from "./registry";

type Preset = { name: string; colors: [string, string, string, string] };
const PRESETS: Preset[] = [
  { name: "Аврора", colors: ["#0b1e4a", "#2fd3a0", "#5b7bff", "#b46bff"] },
  { name: "Закат", colors: ["#2a0a2e", "#ff5f6d", "#ffc371", "#ff8fb1"] },
  { name: "Океан", colors: ["#021526", "#03346e", "#6eacda", "#e2e2b6"] },
  { name: "Неон", colors: ["#07010f", "#ff2fd1", "#00f0ff", "#7a5cff"] },
];

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
  const [preset, setPreset] = useState(0);
  const [colors, setColors] = useState(PRESETS[0].colors);
  const [speed, setSpeed] = useState(60);
  const [warp, setWarp] = useState(55);
  const [grain, setGrain] = useState(35);
  const [failed, setFailed] = useState(false);
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
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      ro.disconnect();
      el.parentElement?.removeEventListener("pointermove", onMove);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    };
  }, []);

  const shuffle = () => {
    const hue = () => `#${Array.from({ length: 3 }, () => Math.floor(40 + Math.random() * 215).toString(16).padStart(2, "0")).join("")}`;
    setColors(["#08060f", hue(), hue(), hue()]);
  };
  const save = () => {
    const link = document.createElement("a");
    link.download = "gradient.png";
    link.href = canvas.current!.toDataURL("image/png");
    link.click();
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
            <input type="range" min="0" max="100" value={value} onChange={(event) => set(Number(event.target.value))} />
          </label>)}
      </div>
      <div className="gs-actions">
        <button type="button" className="button" data-lg="button" onClick={shuffle}><Shuffle aria-hidden="true" />Случайные цвета</button>
        <button type="button" className="button button-primary" data-lg="button" data-lg-variant="prominent" onClick={save}><Download aria-hidden="true" />Сохранить PNG</button>
      </div>
    </div>
  </div>;
}
