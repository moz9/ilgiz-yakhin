"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { useGlassTabs } from "@/components/glass/glass-runtime";

const BUILDS = {
  white: { name: "Светлая сторона", parts: "JONSBO TK-5 White · Core Ultra 9 · RTX 5090", url: "/cases/pcstudio-desk-white.glb", label: "Светлая" },
  dark: { name: "Тёмная сторона", parts: "Fractal North · Ryzen 7 7800X3D · RX 7800 XT", url: "/cases/pcstudio-desk.glb", label: "Тёмная" },
} as const;
type Build = keyof typeof BUILDS;
const VIEWS = ["Стол", "Компьютер"] as const;

/**
 * The PCStudio home scene, live inside the case gallery: both showcase workplaces from the
 * product's own GLB files. Drag turns the desk (with inertia), the fans spin, the build and
 * the camera view switch with buttons. Nothing loads until the frame comes near the screen.
 *
 * `bare` is the same scene with no controls, for the home chapter: it sits inside a link and
 * a 3D-transformed layer, where glass cannot live, shows the dark build only and swallows the
 * click that ends a drag so that turning the desk does not open the case.
 */
export default function PcstudioDeskViewer({ bare = false }: { bare?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const first: Build = bare ? "dark" : "white";
  const [build, setBuild] = useState<Build>(first);
  const [view, setView] = useState(0);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const api = useRef<{ show: (b: Build) => void; view: (v: number) => void } | null>(null);
  const buildTabs = useRef<HTMLDivElement>(null), viewTabs = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer | null = null;
    let cleanup = () => {};

    const start = () => {
      try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { setState("failed"); return; }
      const r = renderer;
      setState("loading");
      r.setPixelRatio(Math.min(devicePixelRatio, 2));
      r.toneMapping = THREE.ACESFilmicToneMapping;
      el.prepend(r.domElement);
      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(r);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      const key = new THREE.DirectionalLight(0xffffff, 1.5);
      key.position.set(-2, 4, 3);
      const ambient = new THREE.AmbientLight(0x8090b0, 0.35);
      scene.add(key, ambient);
      const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
      // The desk turns around a pivot: the room's centre at the wide view, the computer up close.
      const turntable = new THREE.Group(), content = new THREE.Group();
      turntable.add(content);
      scene.add(turntable);

      // A soft contact shadow under the desk.
      const sc = document.createElement("canvas");
      sc.width = sc.height = 128;
      const g = sc.getContext("2d")!;
      const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
      grad.addColorStop(0, "rgba(0,0,0,0.5)"); grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0.002;
      content.add(floor);

      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      const cache: Partial<Record<Build, Promise<THREE.Object3D>>> = {};
      const load = (b: Build) => (cache[b] ??= loader.loadAsync(BUILDS[b].url).then((gltf) => gltf.scene));
      let current: THREE.Object3D | null = null;
      let rotors: THREE.Object3D[] = [];
      const focus = new THREE.Vector3(0.5, 0.9, 0), pivot = new THREE.Vector3(), lookWide = new THREE.Vector3(0.1, 0.7, 0);
      let disposed = false;
      let wanted: Build = first;

      const show = (b: Build) => {
        wanted = b;
        load(b).then((root) => {
          if (disposed || wanted !== b) return;
          if (current) content.remove(current);
          current = root;
          // Measured before it joins the turning group, so the box is in the scene's own frame.
          root.updateMatrixWorld(true);
          const computer = root.getObjectByName("computer");
          if (computer) new THREE.Box3().setFromObject(computer).getCenter(focus);
          content.add(root);
          rotors = [];
          root.traverse((o) => { if (/_rotor$/.test(o.name)) rotors.push(o); });
          (floor.material as THREE.MeshBasicMaterial).opacity = b === "white" ? 0.45 : 1;
          r.toneMappingExposure = b === "white" ? 0.95 : 1.1;
          ambient.intensity = b === "white" ? 0.5 : 0.3;
          setState("ready");
          // The other build loads quietly in the background, so the switch is instant.
          if (!bare) load(b === "white" ? "dark" : "white");
        }, () => setState("failed"));
      };
      show(first);

      let viewTarget = 0, viewNow = 0;
      // Choosing a view hands the turn back to the scene, so the computer comes round to face you.
      api.current = { show, view: (v) => { viewTarget = v; spin.idle = -1e9; if (reduced) { viewNow = v; spin.yaw = v ? 1.6 : 1.15; } } };

      // Drag turns the desk; a short idle later it drifts on its own again.
      const spin = { yaw: 1.2, pitch: 0, v: 0, dragging: false, x: 0, y: 0, idle: -1e9, travelled: 0 };
      const down = (e: PointerEvent) => {
        if ((e.target as HTMLElement).closest("button, [data-lg]")) return;
        spin.dragging = true; spin.x = e.clientX; spin.y = e.clientY; spin.travelled = 0;
        el.setPointerCapture(e.pointerId);
      };
      const move = (e: PointerEvent) => {
        if (!spin.dragging) return;
        spin.travelled += Math.abs(e.clientX - spin.x) + Math.abs(e.clientY - spin.y);
        spin.v = (e.clientX - spin.x) * 0.006;
        spin.yaw += spin.v;
        spin.pitch = Math.max(-0.25, Math.min(0.35, spin.pitch + (e.clientY - spin.y) * 0.003));
        spin.x = e.clientX; spin.y = e.clientY;
        spin.idle = performance.now();
      };
      const up = () => { spin.dragging = false; spin.idle = performance.now(); };
      el.addEventListener("pointerdown", down);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
      // Inside a link, a drag must not count as a click on it.
      const click = (e: MouseEvent) => { if (spin.travelled > 6) { e.preventDefault(); e.stopPropagation(); } };
      el.addEventListener("click", click, true);

      const resize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        r.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      const look = new THREE.Vector3(), pos = new THREE.Vector3();
      let frame = 0, visible = true, last = performance.now();
      const loop = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!spin.dragging) {
          spin.v *= 0.94;
          spin.yaw += spin.v;
          // Left alone, the desk sways around the side that shows the glass panel and the parts.
          if (!reduced && now - spin.idle > 4000) {
            const home = viewTarget ? 1.6 + Math.sin(now / 4000) * 0.25 : 1.15 + Math.sin(now / 5000) * 0.5;
            const turns = Math.round((spin.yaw - home) / (Math.PI * 2)) * Math.PI * 2;
            spin.yaw += (home + turns - spin.yaw) * Math.min(1, dt * 1.5);
          }
        }
        pivot.set(0, 0, 0).lerp(focus, viewNow);
        turntable.position.copy(pivot);
        content.position.copy(pivot).negate();
        turntable.rotation.y = spin.yaw;
        viewNow += (viewTarget - viewNow) * (reduced ? 1 : 0.08);
        if (!reduced) rotors.forEach((o) => o.rotateZ(dt * 9));
        const portrait = camera.aspect < 0.9;
        const far = portrait ? 1.6 : bare ? 0.72 : 1;
        const wide = new THREE.Vector3(2.4 * far, 2.0 * Math.sqrt(far) + spin.pitch * 2.4, 2.9 * far);
        const close = focus.clone().add(new THREE.Vector3(portrait ? 1.7 : 1.15, 0.35 + spin.pitch * 1.2, portrait ? 2.1 : 1.4));
        pos.lerpVectors(wide, close, viewNow);
        look.lerpVectors(lookWide, focus, viewNow);
        camera.position.copy(pos);
        camera.lookAt(look);
        r.render(scene, camera);
        frame = visible ? requestAnimationFrame(loop) : 0;
      };
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !frame) { last = performance.now(); frame = requestAnimationFrame(loop); } });
      io.observe(el);
      frame = requestAnimationFrame(loop);

      cleanup = () => {
        disposed = true;
        cancelAnimationFrame(frame);
        io.disconnect(); ro.disconnect();
        el.removeEventListener("pointerdown", down);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
        el.removeEventListener("click", click, true);
        Object.values(cache).forEach((p) => p?.then((root) => root.traverse((o) => {
          const m = o as THREE.Mesh;
          m.geometry?.dispose();
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => (x as THREE.Material | undefined)?.dispose?.());
        })).catch(() => {}));
        pmrem.dispose();
        r.dispose();
        r.domElement.remove();
        api.current = null;
      };
    };

    // The two models weigh about 4 MB together: nothing loads until the frame is close.
    const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { near.disconnect(); start(); } }, { rootMargin: "400px 0px" });
    near.observe(el);
    return () => { near.disconnect(); cleanup(); };
  }, [bare, first]);

  const pick = (b: Build) => { setBuild(b); api.current?.show(b); };
  const look = (v: number) => { setView(v); api.current?.view(v); };
  const keys = Object.keys(BUILDS) as Build[];
  useGlassTabs(buildTabs, keys.indexOf(build), (i) => pick(keys[i]));
  useGlassTabs(viewTabs, view, look);

  if (bare) return <div className="dv dv-bare" data-build={build} data-state={state} ref={host}>
    {state === "ready" && <p className="dv-hint">Тяните, чтобы повернуть</p>}
  </div>;
  return <div className="dv" data-build={build} data-state={state} ref={host}>
    {state !== "ready" && <p className="dv-state">{state === "failed" ? "3D не загрузилось: браузер не дал WebGL." : "Загружаю 3D-сцену…"}</p>}
    <p className="dv-hint">Тяните, чтобы повернуть</p>
    <div className="dv-switch" data-lg="surface">
      <div className="dv-tabs" ref={buildTabs} role="tablist" aria-label="Сборка">
        {keys.map((b) => <button key={b} type="button" role="tab" aria-selected={build === b} tabIndex={build === b ? 0 : -1}><i data-b={b} aria-hidden="true" />{BUILDS[b].label}</button>)}
      </div>
    </div>
    <div className="dv-tag" data-lg="surface"><small>Компьютер и рабочее место</small><b>{BUILDS[build].name}</b><span>{BUILDS[build].parts}</span></div>
    <div className="dv-views" data-lg="surface">
      <div className="dv-tabs" ref={viewTabs} role="tablist" aria-label="Вид">
        {VIEWS.map((v, i) => <button key={v} type="button" role="tab" aria-selected={view === i} tabIndex={view === i ? 0 : -1}>{v}</button>)}
      </div>
    </div>
  </div>;
}
