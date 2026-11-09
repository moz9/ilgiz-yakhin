"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import land110 from "world-atlas/land-110m.json";
import { gsap } from "@/lib/gsap";
import type { ShowcaseProps } from "./registry";

type City = { name: string; lat: number; lon: number };
const CITIES: City[] = [
  { name: "Москва", lat: 55.75, lon: 37.62 }, { name: "Казань", lat: 55.79, lon: 49.12 }, { name: "Санкт-Петербург", lat: 59.94, lon: 30.31 },
  { name: "Екатеринбург", lat: 56.84, lon: 60.6 }, { name: "Новосибирск", lat: 55.03, lon: 82.92 }, { name: "Владивосток", lat: 43.12, lon: 131.89 },
  { name: "Стамбул", lat: 41.01, lon: 28.98 }, { name: "Дубай", lat: 25.2, lon: 55.27 }, { name: "Алматы", lat: 43.24, lon: 76.89 },
  { name: "Пекин", lat: 39.9, lon: 116.4 }, { name: "Берлин", lat: 52.52, lon: 13.4 }, { name: "Ереван", lat: 40.18, lon: 44.51 },
];
const ROUTES: [string, string, number][] = [
  ["Москва", "Казань", 18], ["Москва", "Санкт-Петербург", 26], ["Казань", "Екатеринбург", 11], ["Москва", "Новосибирск", 9], ["Новосибирск", "Владивосток", 6],
  ["Москва", "Стамбул", 14], ["Казань", "Дубай", 7], ["Москва", "Алматы", 8], ["Новосибирск", "Пекин", 5], ["Санкт-Петербург", "Берлин", 4], ["Москва", "Ереван", 10],
];
const R = 1;

const toVec = (lat: number, lon: number, r = R) => {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
};

/** Land as a 720×360 equirectangular mask, read back to keep only the dots that sit on land. */
function landMask() {
  const topo = land110 as unknown as Topology<{ land: GeometryCollection }>;
  const geo = feature(topo, topo.objects.land) as unknown as GeoJSON.FeatureCollection<GeoJSON.MultiPolygon | GeoJSON.Polygon>;
  const canvas = document.createElement("canvas");
  canvas.width = 720; canvas.height = 360;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#fff";
  for (const f of geo.features) {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) {
      ctx.beginPath();
      for (const ring of poly) ring.forEach(([lon, lat], i) => { const x = (lon + 180) * 2, y = (90 - lat) * 2; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.fill("evenodd");
    }
  }
  const data = ctx.getImageData(0, 0, 720, 360).data;
  return (lat: number, lon: number) => data[(Math.floor((90 - lat) * 2) * 720 + Math.floor((lon + 180) * 2)) * 4] > 128;
}

/**
 * Routes: a dotted globe in three.js. Land comes from Natural Earth, routes rise as glowing
 * arcs with a running pulse, cities breathe. Drag to spin with inertia, hover a city to read
 * it, pick a route in the panel and the globe turns to it. Demo data, real geography.
 */
export default function GlobeRoutes({ mode }: ShowcaseProps) {
  const host = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const focusRef = useRef<(index: number) => void>(() => {});
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.2, 3.6);
    // The stage moves the globe and its atmosphere together; the globe alone rotates inside it.
    const stage = new THREE.Group();
    scene.add(stage);
    const globe = new THREE.Group();
    // Start facing the network (around 50°N 60°E): Ry brings it to the centre line, Rx lifts it.
    const home = toVec(48, 62);
    globe.rotation.set(Math.atan2(home.y, Math.hypot(home.x, home.z)), Math.atan2(-home.x, home.z), 0);
    stage.add(globe);

    // The ocean: a dark sphere so back-facing dots and arcs are hidden.
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 64, 64), new THREE.MeshBasicMaterial({ color: 0x070a18 })));
    // The atmosphere: a fresnel rim drawn on a slightly larger back-facing sphere.
    stage.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.18, 64, 64), new THREE.ShaderMaterial({
      side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      vertexShader: "varying vec3 n; void main(){ n = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "varying vec3 n; void main(){ float i = pow(0.62 - dot(n, vec3(0,0,1.0)), 4.0); gl_FragColor = vec4(0.36,0.48,1.0,1.0) * i * 1.1; }",
    })));

    // Land dots on a Fibonacci sphere.
    const onLand = landMask();
    const dots: number[] = [];
    const N = 26000;
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const lat = Math.asin(y) * 180 / Math.PI;
      const lon = ((i * 137.508) % 360) - 180;
      if (onLand(lat, lon)) { const v = toVec(lat, lon, R * 1.001); dots.push(v.x, v.y, v.z); }
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.Float32BufferAttribute(dots, 3));
    globe.add(new THREE.Points(dotGeo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { size: { value: 2.6 * renderer.getPixelRatio() } },
      vertexShader: "uniform float size; varying float f; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); f = smoothstep(-0.2, 0.6, normalize((modelMatrix*vec4(position,0.0)).xyz).z); gl_PointSize = size; gl_Position = projectionMatrix * mv; }",
      fragmentShader: "varying float f; void main(){ vec2 c = gl_PointCoord - 0.5; if (dot(c,c) > 0.25) discard; gl_FragColor = vec4(mix(vec3(0.25,0.32,0.55), vec3(0.62,0.72,1.0), f), 0.55 + f*0.45); }",
    })));

    // Cities: a core dot and a breathing ring.
    const byName = new Map(CITIES.map((c) => [c.name, c]));
    const rings: THREE.Mesh[] = [];
    const cityMeshes = CITIES.map((city) => {
      const pos = toVec(city.lat, city.lon, R * 1.003);
      const core = new THREE.Mesh(new THREE.CircleGeometry(0.012, 20), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      core.position.copy(pos); core.lookAt(pos.clone().multiplyScalar(2));
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.016, 0.022, 32), new THREE.MeshBasicMaterial({ color: 0x2fd3a0, transparent: true }));
      ring.position.copy(pos); ring.lookAt(pos.clone().multiplyScalar(2));
      globe.add(core, ring);
      rings.push(ring);
      return { city, core };
    });

    // Routes: arcs lifted by their length, drawn with a pulse that runs along them.
    const arcs = ROUTES.map(([from, to, weight], index) => {
      const a = byName.get(from)!, b = byName.get(to)!;
      const va = toVec(a.lat, a.lon), vb = toVec(b.lat, b.lon);
      const lift = 1.08 + va.distanceTo(vb) * 0.7;
      const mid = va.clone().add(vb).normalize().multiplyScalar(lift);
      const curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
      // A thin tube rather than a line: WebGL lines are one pixel wide on most GPUs. uv.x runs along it.
      const geo = new THREE.TubeGeometry(curve, 96, 0.0045, 6, false);
      const material = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { time: { value: 0 }, offset: { value: index * 0.37 }, hi: { value: 0 }, color: { value: new THREE.Color(index % 2 ? 0x2fd3a0 : 0x5b7bff) } },
        vertexShader: "varying float vt; void main(){ vt = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: "uniform float time, offset, hi; uniform vec3 color; varying float vt; void main(){ float head = fract(time*0.35 + offset); float d = vt - head; float pulse = smoothstep(-0.25, 0.0, d) * (1.0 - smoothstep(0.0, 0.02, d)); float base = 0.42 + hi*0.45; gl_FragColor = vec4(color * (base + pulse*1.6 + hi*0.6), base + pulse); }",
      });
      globe.add(new THREE.Mesh(geo, material));
      return { material, weight, mid: mid.clone().normalize() };
    });

    // Drag to spin, with inertia; idle auto-rotation.
    const spin = { vx: 0, vy: reduced ? 0 : 0.0016, dragging: false, x: 0, y: 0, idle: true };
    // Presses on the route list are clicks, not drags: capturing them would swallow the click.
    const down = (e: PointerEvent) => { if ((e.target as HTMLElement).closest(".gr-panel")) return; spin.dragging = true; spin.idle = false; spin.x = e.clientX; spin.y = e.clientY; el.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      mouse.set(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1);
      if (!spin.dragging) return;
      spin.vy = (e.clientX - spin.x) * 0.0045; spin.vx = (e.clientY - spin.y) * 0.0045;
      globe.rotation.y += spin.vy; globe.rotation.x = Math.max(-1.1, Math.min(1.1, globe.rotation.x + spin.vx));
      spin.x = e.clientX; spin.y = e.clientY;
    };
    const up = () => { spin.dragging = false; };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);

    // Turn the globe so a route's midpoint faces the viewer.
    focusRef.current = (index) => {
      spin.idle = false; spin.vx = 0; spin.vy = 0;
      arcs.forEach((arc, i) => { arc.material.uniforms.hi.value = i === index ? 1 : 0; });
      // Euler XYZ applies Ry first, then Rx: Ry brings the point to x = 0, Rx then lifts it to the centre.
      const m = arcs[index].mid;
      const target = { x: Math.atan2(m.y, Math.hypot(m.x, m.z)), y: Math.atan2(-m.x, m.z) };
      let dy = target.y - globe.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      gsap.to(globe.rotation, { x: target.x, y: globe.rotation.y + dy, duration: reduced ? 0 : 1.4, ease: "power3.inOut" });
    };

    const mouse = new THREE.Vector2(9, 9);
    const ray = new THREE.Raycaster();
    const tmp = new THREE.Vector3();
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const portrait = w / h < 0.8;
      camera.position.z = portrait ? 4.2 / Math.max(0.42, w / h) : 4.4;
      // The route list sits on the right on wide stages and at the bottom on narrow ones.
      stage.position.x = portrait ? 0 : -0.45;
      stage.position.y = portrait ? 0.55 : 0;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let frame = 0, visible = true;
    const clock = new THREE.Clock();
    const loop = () => {
      const t = clock.getElapsedTime();
      if (!spin.dragging) {
        if (spin.idle) globe.rotation.y += spin.vy;
        else { globe.rotation.y += spin.vy; globe.rotation.x = Math.max(-1.1, Math.min(1.1, globe.rotation.x + spin.vx)); spin.vy *= 0.95; spin.vx *= 0.95; }
      }
      arcs.forEach((arc) => { arc.material.uniforms.time.value = reduced ? 0.5 : t; });
      rings.forEach((ring, i) => { const k = reduced ? 0.5 : (t * 0.8 + i * 0.13) % 1; ring.scale.setScalar(1 + k * 1.6); (ring.material as THREE.MeshBasicMaterial).opacity = 1 - k; });
      // Hover: the nearest front-facing city under the pointer gets a label.
      ray.setFromCamera(mouse, camera);
      let hit: (typeof cityMeshes)[number] | null = null;
      let best = 0.06;
      for (const c of cityMeshes) {
        c.core.getWorldPosition(tmp);
        if (tmp.z < 0.2) continue;
        const d = ray.ray.distanceToPoint(tmp);
        if (d < best) { best = d; hit = c; }
      }
      const tag = label.current;
      if (tag) {
        if (hit) {
          hit.core.getWorldPosition(tmp).project(camera);
          tag.textContent = hit.city.name;
          tag.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * el.clientWidth}px, ${(-tmp.y * 0.5 + 0.5) * el.clientHeight}px)`;
          tag.dataset.on = "true";
        } else delete tag.dataset.on;
      }
      renderer.render(scene, camera);
      frame = visible ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !frame) frame = requestAnimationFrame(loop); });
    io.observe(el);
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect(); ro.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose(); (m.material as THREE.Material | undefined)?.dispose?.(); });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className={`gr gr-${mode}`} ref={host}>
    <div className="gr-label" ref={label} aria-hidden="true" />
    <div className="gr-panel" data-lg="surface">
      <p className="gr-head">Маршруты<small>Демонстрационные данные</small></p>
      <ul>
        {ROUTES.map(([from, to, weight], index) => <li key={`${from}-${to}`}>
          <button type="button" aria-pressed={active === index} onClick={() => { setActive(index); focusRef.current(index); }}>
            <span>{from} → {to}</span><b>{weight} рейс.</b>
          </button>
        </li>)}
      </ul>
    </div>
  </div>;
}
