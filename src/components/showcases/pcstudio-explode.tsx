"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { ShowcaseProps } from "./registry";
import { useGlassTabs } from "@/components/glass/glass-runtime";

/** The parts of the dark showcase build, in the order they leave the case, with the check each one passes. */
const PARTS = [
  { key: "gpu", angle: -25, reach: 0.34, name: "Видеокарта", model: "Sapphire Pulse RX 7800 XT", check: "Длина 280 мм — в корпус входит", ok: true },
  { key: "cooler", angle: 72, reach: 0.3, name: "Кулер", model: "Thermalright PA120 SE", check: "Высота 155 мм — под стеклом остаётся запас", ok: true },
  { key: "ram", angle: 28, reach: 0.34, name: "Память", model: "Kingston Fury Beast DDR5-6000, 2 × 16 ГБ", check: "DDR5 — тип совпадает с платой", ok: true },
  { key: "cpu", angle: 128, reach: 0.3, name: "Процессор", model: "AMD Ryzen 7 7800X3D", check: "Сокет AM5 — совпадает с платой", ok: true },
  { key: "ssd", angle: 2, reach: 0.38, name: "SSD", model: "Samsung 990 Pro 2 ТБ", check: "M.2 NVMe — слот на плате есть", ok: true },
  { key: "mb", angle: 175, reach: 0.36, name: "Материнская плата", model: "MSI MAG B650 Tomahawk WiFi", check: "ATX — форм-фактор корпуса подходит", ok: true },
  { key: "psu", angle: -125, reach: 0.32, name: "Блок питания", model: "Corsair RM850e", check: "Разъёмы питания видеокарты — нет данных", ok: false },
] as const;
const CHAPTERS = ["Рабочее место", "Компьютер", "Детали"] as const;
const smooth = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

type Label = { key: string; x: number; y: number; on: number; side: "left" | "right" };

/**
 * PCStudio, act one: the dark showcase workplace from the product, in three.js. Scrolling
 * moves the camera from the desk to the computer, clears the side panel and takes the build
 * apart part by part; each part carries the compatibility check it passes. Dragging turns it.
 * The geometry is the product's own (parametric models, meshopt-compressed GLB).
 */
export default function PcstudioExplode({ mode }: ShowcaseProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  // Without motion the build is shown taken apart straight away.
  const [chapter, setChapter] = useState(() => (matchMedia("(prefers-reduced-motion: reduce)").matches ? 2 : 0));
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    const host = stageRef.current, sc = scroller.current;
    if (!host || !sc) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { queueMicrotask(() => setState("failed")); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    host.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-2, 4, 3);
    scene.add(key, new THREE.AmbientLight(0x8090b0, 0.35));
    const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
    const turntable = new THREE.Group();
    scene.add(turntable);

    // A soft floor shadow under the desk, drawn as a radial gradient.
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 128;
    const g = shadowCanvas.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, "rgba(0,0,0,0.55)"); grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.002;
    turntable.add(floor);

    type Part = { key: string; node: THREE.Object3D; home: THREE.Vector3; angle: number; reach: number; lag: number; half: number };
    let parts: Part[] = [];
    let caseMaterials: THREE.Material[] = [];
    let computer: THREE.Object3D | null = null;
    const focus = new THREE.Vector3(0.54, 0.95, -0.07);
    let disposed = false;
    // The desk top under the case: no part may sink below it, whichever way the camera looks.
    let floorY = -Infinity;

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load("/cases/pcstudio-desk.glb", (gltf) => {
      if (disposed) return;
      const root = gltf.scene;
      turntable.add(root);
      root.updateMatrixWorld(true);
      computer = root.getObjectByName("computer") ?? null;
      // GLTFLoader strips ":" from node names: "case:showcase-case" arrives as "caseshowcase-case".
      const named = (key: string) => computer?.children.find((n) => n.name.startsWith(`${key}showcase`));
      const caseNode = named("case");
      const caseBox = caseNode ? new THREE.Box3().setFromObject(caseNode) : new THREE.Box3();
      const caseCenter = caseBox.getCenter(new THREE.Vector3());
      focus.copy(caseCenter);
      floorY = caseBox.min.y;
      // The case keeps its frame but its panels become glass, so the parts read through it.
      caseNode?.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.material = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((m) => { const c = m.clone(); c.transparent = true; caseMaterials.push(c); return c; })[0];
      });
      // Each part bursts out along its own screen direction (see PARTS); the second memory stick trails the first.
      parts = PARTS.map((p) => {
        const node = named(p.key);
        return node ? { key: p.key, node, home: node.position.clone(), angle: p.angle * Math.PI / 180, reach: p.reach, lag: 0, half: node.getWorldPosition(new THREE.Vector3()).y - new THREE.Box3().setFromObject(node).min.y } : null;
      }).filter(Boolean) as Part[];
      const ram2 = computer?.children.find((n) => n.name === "ramshowcase-ram1");
      if (ram2) parts.push({ key: "ram2", node: ram2, home: ram2.position.clone(), angle: 28 * Math.PI / 180, reach: 0.4, lag: 0, half: 0.07 });
      setState("ready");
    }, undefined, () => setState("failed"));

    // Scroll progress inside the demo's own scroller drives everything.
    let progress = 0;
    const onScroll = () => {
      const max = sc.scrollHeight - sc.clientHeight;
      progress = max > 0 ? sc.scrollTop / max : 0;
      setChapter(progress < 0.22 ? 0 : progress < 0.42 ? 1 : 2);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    if (reduced) progress = 1;

    // Drag turns the turntable with inertia.
    const spin = { yaw: -0.35, v: 0, dragging: false, x: 0 };
    const down = (e: PointerEvent) => { spin.dragging = true; spin.x = e.clientX; host.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (!spin.dragging) return; spin.v = (e.clientX - spin.x) * 0.006; spin.yaw += spin.v; spin.x = e.clientX; };
    const up = () => { spin.dragging = false; };
    host.addEventListener("pointerdown", down);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerup", up);

    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const wide = { pos: new THREE.Vector3(2.4, 2.1, 2.9), look: new THREE.Vector3(0.1, 0.7, 0) };
    const tmp = new THREE.Vector3(), look = new THREE.Vector3(), pos = new THREE.Vector3(), right = new THREE.Vector3(), upward = new THREE.Vector3();
    let shown = 0;
    let frame = 0, visible = true, lastLabels = "";
    const loop = () => {
      shown += (progress - shown) * (reduced ? 1 : 0.12);
      const p = shown;
      if (!spin.dragging) { spin.v *= 0.94; spin.yaw += spin.v; }
      turntable.rotation.y = spin.yaw + (reduced ? 0 : Math.sin(performance.now() / 6000) * 0.05);
      // Camera: from the desk to the computer.
      const zoom = smooth(0.08, 0.38, p);
      const portrait = camera.aspect < 0.9;
      const close = { pos: focus.clone().add(new THREE.Vector3(portrait ? 1.9 : 1.35, 0.4, portrait ? 2.4 : 1.6)), look: focus.clone() };
      pos.lerpVectors(wide.pos, close.pos, zoom);
      look.lerpVectors(wide.look, close.look, zoom);
      camera.position.copy(pos);
      camera.lookAt(look);
      // The side panels clear, then the parts leave one by one.
      const glass = smooth(0.3, 0.44, p);
      caseMaterials.forEach((m) => { m.opacity = 1 - glass * 0.86; m.depthWrite = glass < 0.5; });
      // Offsets are taken in the camera's screen plane, so the fan stays readable while the case turns.
      camera.updateMatrixWorld();
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      upward.setFromMatrixColumn(camera.matrixWorld, 1);
      const labelsNow: Label[] = [];
      parts.forEach((part, i) => {
        const index = part.key === "ram2" ? PARTS.findIndex((x) => x.key === "ram") : i;
        const k = smooth(0.42 + index * 0.075, 0.56 + index * 0.075, p);
        const parent = part.node.parent!;
        const homeWorld = parent.localToWorld(part.home.clone());
        // A tall phone screen has less room to the sides: the fan narrows and stretches up and down.
        const wideK = portrait ? 0.62 : 1, tallK = portrait ? 1.25 : 0.85;
        const offset = right.clone().multiplyScalar(Math.cos(part.angle) * part.reach * wideK).addScaledVector(upward, Math.sin(part.angle) * part.reach * tallK);
        // A little towards the viewer as well, so parts clear the glass instead of sliding through it.
        offset.addScaledVector(camera.position.clone().sub(homeWorld).normalize(), 0.12);
        homeWorld.addScaledVector(offset, k);
        // `half` is how far the part reaches below its origin; that lowest point stays on the desk.
        homeWorld.y = Math.max(homeWorld.y, Math.min(parent.localToWorld(part.home.clone()).y, floorY + part.half + 0.01));
        part.node.position.copy(parent.worldToLocal(homeWorld));
        if (part.key === "ram2" || k < 0.05) return;
        new THREE.Box3().setFromObject(part.node).getCenter(tmp);
        tmp.project(camera);
        labelsNow.push({ key: part.key, x: (tmp.x * 0.5 + 0.5) * 100, y: (-tmp.y * 0.5 + 0.5) * 100, on: k, side: Math.cos(part.angle) < -0.2 ? "left" : "right" });
      });
      const signature = labelsNow.map((l) => `${l.key}${l.x.toFixed(1)}${l.y.toFixed(1)}${l.on.toFixed(2)}`).join();
      if (signature !== lastLabels) { lastLabels = signature; setLabels(labelsNow); }
      renderer.render(scene, camera);
      frame = visible ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !frame) frame = requestAnimationFrame(loop); });
    io.observe(host);
    frame = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      io.disconnect(); ro.disconnect();
      sc.removeEventListener("scroll", onScroll);
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerup", up);
      scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose(); (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => (x as THREE.Material | undefined)?.dispose?.()); });
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      caseMaterials = [];
    };
  }, []);

  const jump = (i: number) => {
    const sc = scroller.current;
    if (!sc) return;
    const max = sc.scrollHeight - sc.clientHeight;
    sc.scrollTo({ top: max * [0, 0.38, 1][i], behavior: "smooth" });
  };
  const chapterTabs = useRef<HTMLDivElement>(null);
  useGlassTabs(chapterTabs, chapter, jump);
  const passed = labels.filter((l) => l.on > 0.6 && PARTS.find((p) => p.key === l.key)?.ok).length;

  return <div className={`px px-${mode}`} ref={scroller} tabIndex={0} aria-label="Сборка PCStudio: листайте внутри блока, чтобы разобрать компьютер">
    <div className="px-track">
      <div className="px-stage" ref={stageRef}>
        {state === "loading" && <p className="px-state">Загружаю 3D-сцену…</p>}
        {state === "failed" && <p className="px-state">3D не загрузилось — браузер не дал WebGL.</p>}
        <header className="px-head">
          <p>PCStudio · тёмная сборка</p>
          <div className="px-chapters" data-lg="surface">
            <div className="px-tabs" ref={chapterTabs} role="tablist" aria-label="Перейти">
              {CHAPTERS.map((c, i) => <button key={c} type="button" role="tab" aria-selected={chapter === i} tabIndex={chapter === i ? 0 : -1}>{c}</button>)}
            </div>
          </div>
        </header>
        <div className="px-labels" aria-live="polite">
          {labels.map((l) => {
            const part = PARTS.find((p) => p.key === l.key)!;
            return <div key={l.key} className="px-label" data-ok={part.ok || undefined} data-side={l.side} style={{ left: `${l.x}%`, top: `${l.y}%`, opacity: Math.min(1, l.on * 1.6), transform: `translate(${l.side === "left" ? "calc(-100% - 46px)" : "46px"}, -50%) scale(${0.9 + l.on * 0.1})` }}>
              <b>{part.name}</b><span>{part.model}</span><small>{part.ok ? "✓" : "?"} {part.check}</small>
            </div>;
          })}
        </div>
        {/* On a narrow stage the checks gather in one list instead of cards beside the parts. */}
        <ul className="px-list" aria-hidden="true">
          {PARTS.filter((part) => labels.some((l) => l.key === part.key && l.on > 0.6)).map((part) => <li key={part.key} data-ok={part.ok || undefined}><b>{part.name}</b> {part.check}</li>)}
        </ul>
        <footer className="px-foot">
          <p className="px-score"><b>{passed}</b> из 7 проверок совместимости пройдено{labels.length === 7 && labels.every((l) => l.on > 0.6) ? " · 1 без данных · конфликтов нет" : ""}</p>
          <p className="px-hint">{chapter < 2 ? "Листайте внутри блока ↓ · тяните, чтобы повернуть" : "Тяните, чтобы повернуть · листайте вверх, чтобы собрать"}</p>
        </footer>
      </div>
    </div>
  </div>;
}
