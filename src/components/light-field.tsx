"use client";

import { useEffect, useRef } from "react";
import { THEME_EVENT } from "@/lib/theme";

/**
 * The living light behind the whole site: a slow domain-warped gradient on WebGL that
 * leans toward the pointer. Sections ask for their own colours with
 * `data-field="#hexA #hexB intensity"`; the field blends toward whichever of them holds
 * the middle of the viewport, so the light repaints itself as each case arrives.
 * Liquid Glass refracts this canvas, which is why the glass reads as glass everywhere.
 *
 * Reduced motion freezes time (the field still answers scrolling, without drifting).
 * No WebGL → the canvas stays hidden and the CSS fallback gradient on <body> shows.
 */

const vertex = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
const fragment = `precision mediump float;
uniform vec2 r;uniform float t;uniform vec2 m;uniform vec3 bg;uniform vec3 ca;uniform vec3 cb;uniform vec3 cc;uniform float k;uniform float lite;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r;float asp=r.x/r.y;vec2 p=vec2(uv.x*asp,uv.y);
  vec2 mm=vec2(m.x*asp,m.y);
  vec2 d=p-mm;float pull=exp(-dot(d,d)*3.2);
  p+=d*pull*-.18;
  vec2 q=vec2(fbm(p*1.4+vec2(0.,t*.045)),fbm(p*1.4+vec2(5.2,1.3)-vec2(t*.035,0.)));
  vec2 w=vec2(fbm(p*1.2+q*1.8+vec2(1.7,9.2)+t*.02),fbm(p*1.2+q*1.8+vec2(8.3,2.8)-t*.025));
  float f=fbm(p*1.1+w*1.9);
  vec3 col=mix(ca,cb,smoothstep(.2,.8,w.x));
  col=mix(col,cc,smoothstep(.5,.95,q.y)*.55);
  float mask=smoothstep(.3,.95,f*1.15+w.y*.25);
  mask=mask*k+pull*.42*k;
  vec3 o=mix(bg,col,clamp(mask,0.,1.));
  float v=smoothstep(.45,1.2,length((uv-.5)*vec2(1.1,1.35)));
  o=mix(o,bg,v*(.75-lite*.35));
  o+=(h(gl_FragCoord.xy+fract(t))-.5)*(.035-lite*.015);
  gl_FragColor=vec4(o,1.);
}`;

type Rgb = [number, number, number];
const hex = (value: string): Rgb => {
  const s = value.trim().replace("#", "");
  const full = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  const int = parseInt(full, 16);
  return Number.isFinite(int) ? [(int >> 16 & 255) / 255, (int >> 8 & 255) / 255, (int & 255) / 255] : [0.4, 0.4, 0.9];
};

const base = { a: "#2f45ff", b: "#8a6bff", k: 0.34 };
const third = { dark: "#ff6b8b", light: "#3ba8ff" };
const backgrounds = { dark: "#06070b", light: "#eef1f6" };

export function LightField() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const gl = element.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: "low-power" });
    if (!gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = { r: u("r"), t: u("t"), m: u("m"), bg: u("bg"), ca: u("ca"), cb: u("cb"), cc: u("cc"), k: u("k"), lite: u("lite") };

    const root = document.documentElement;
    root.dataset.field = "on";
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const theme = () => (root.dataset.theme === "light" ? "light" : "dark");
    // Current and target state; the render loop eases one toward the other.
    const now = { a: hex(base.a), b: hex(base.b), c: hex(third[theme()]), bg: hex(backgrounds[theme()]), k: base.k, lite: theme() === "light" ? 1 : 0, mx: 0.7, my: 0.6 };
    const goal = { ...now, a: [...now.a] as Rgb, b: [...now.b] as Rgb, c: [...now.c] as Rgb, bg: [...now.bg] as Rgb };
    let time = Math.random() * 40;
    let last = performance.now();
    let frame = 0;
    let running = false;

    const resize = () => {
      // The field is soft, so a quarter of the pixels is plenty and keeps it cheap.
      const scale = Math.min(0.5, 900 / Math.max(innerWidth, 1));
      element.width = Math.max(2, Math.round(innerWidth * scale));
      element.height = Math.max(2, Math.round(innerHeight * scale));
      gl.viewport(0, 0, element.width, element.height);
    };

    const pickSection = () => {
      const middle = innerHeight * 0.5;
      let chosen: string | null = null;
      for (const section of document.querySelectorAll<HTMLElement>("[data-field]")) {
        const box = section.getBoundingClientRect();
        if (box.top <= middle && box.bottom >= middle) chosen = section.dataset.field ?? null;
      }
      const [a, b, k] = (chosen ?? `${base.a} ${base.b} ${base.k}`).split(/\s+/);
      goal.a = hex(a); goal.b = hex(b ?? a); goal.k = Number(k ?? base.k) || base.k;
      const mode = theme();
      goal.c = hex(third[mode]);
      goal.bg = hex(backgrounds[mode]);
      goal.lite = mode === "light" ? 1 : 0;
    };

    const draw = (ms: number) => {
      const dt = Math.min(0.05, (ms - last) / 1000);
      last = ms;
      if (!reduced.matches) time += dt;
      const ease = 1 - Math.exp(-dt * 2.6);
      const mix3 = (from: Rgb, to: Rgb) => { for (let i = 0; i < 3; i++) from[i] += (to[i] - from[i]) * ease; };
      mix3(now.a, goal.a); mix3(now.b, goal.b); mix3(now.c, goal.c); mix3(now.bg, goal.bg);
      now.k += (goal.k - now.k) * ease;
      now.lite += (goal.lite - now.lite) * ease;
      now.mx += (goal.mx - now.mx) * ease * 1.6;
      now.my += (goal.my - now.my) * ease * 1.6;
      gl.uniform2f(uniforms.r, element.width, element.height);
      gl.uniform1f(uniforms.t, time);
      gl.uniform2f(uniforms.m, now.mx, now.my);
      gl.uniform3fv(uniforms.bg, now.bg);
      gl.uniform3fv(uniforms.ca, now.a);
      gl.uniform3fv(uniforms.cb, now.b);
      gl.uniform3fv(uniforms.cc, now.c);
      gl.uniform1f(uniforms.k, now.k * (now.lite > 0.5 ? 0.85 : 1));
      gl.uniform1f(uniforms.lite, now.lite);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const settled = () => Math.abs(goal.k - now.k) < 0.002 && Math.abs(goal.lite - now.lite) < 0.002
      && goal.a.every((v, i) => Math.abs(v - now.a[i]) < 0.003) && goal.b.every((v, i) => Math.abs(v - now.b[i]) < 0.003)
      && goal.bg.every((v, i) => Math.abs(v - now.bg[i]) < 0.003) && Math.abs(goal.mx - now.mx) < 0.002 && Math.abs(goal.my - now.my) < 0.002;

    const loop = (ms: number) => {
      draw(ms);
      // With reduced motion the loop runs only until the colours have settled.
      if (document.hidden || (reduced.matches && settled())) { running = false; return; }
      frame = requestAnimationFrame(loop);
    };
    const wake = () => {
      if (running || document.hidden) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };

    let pick = 0;
    const onScroll = () => { cancelAnimationFrame(pick); pick = requestAnimationFrame(() => { pickSection(); wake(); }); };
    const onPointer = (event: PointerEvent) => {
      goal.mx = event.clientX / innerWidth;
      goal.my = 1 - event.clientY / innerHeight;
      wake();
    };
    const onTheme = () => { pickSection(); wake(); };
    const onResize = () => { resize(); wake(); };
    const onVisibility = () => wake();
    const observer = new MutationObserver(onScroll);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-field"] });

    resize();
    pickSection();
    Object.assign(now, { k: goal.k });
    now.a = [...goal.a]; now.b = [...goal.b];
    element.dataset.ready = "true";
    wake();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize);
    addEventListener("pointermove", onPointer, { passive: true });
    addEventListener(THEME_EVENT, onTheme);
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pick);
      observer.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      removeEventListener("pointermove", onPointer);
      removeEventListener(THEME_EVENT, onTheme);
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onVisibility);
      delete root.dataset.field;
    };
  }, []);

  return <canvas ref={canvas} className="light-field" aria-hidden="true" />;
}
