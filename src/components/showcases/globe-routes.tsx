"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import land110 from "world-atlas/land-110m.json";
import { ArrowLeftRight, Plane, X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import type { ShowcaseProps } from "./registry";

type Airport = { code: string; city: string; lat: number; lon: number; tz: number };
// Real airports and their standard UTC offsets (no daylight saving).
const AIRPORTS: Airport[] = [
  { code: "SVO", city: "Москва", lat: 55.97, lon: 37.41, tz: 3 }, { code: "LED", city: "Санкт-Петербург", lat: 59.8, lon: 30.26, tz: 3 },
  { code: "KZN", city: "Казань", lat: 55.61, lon: 49.28, tz: 3 }, { code: "SVX", city: "Екатеринбург", lat: 56.74, lon: 60.8, tz: 5 },
  { code: "OVB", city: "Новосибирск", lat: 55.01, lon: 82.65, tz: 7 }, { code: "IKT", city: "Иркутск", lat: 52.27, lon: 104.39, tz: 8 },
  { code: "YKS", city: "Якутск", lat: 62.09, lon: 129.77, tz: 9 }, { code: "VVO", city: "Владивосток", lat: 43.4, lon: 132.15, tz: 10 },
  { code: "AER", city: "Сочи", lat: 43.45, lon: 39.96, tz: 3 }, { code: "KGD", city: "Калининград", lat: 54.89, lon: 20.59, tz: 2 },
  { code: "MMK", city: "Мурманск", lat: 68.78, lon: 32.75, tz: 3 }, { code: "IST", city: "Стамбул", lat: 41.26, lon: 28.74, tz: 3 },
  { code: "DXB", city: "Дубай", lat: 25.25, lon: 55.36, tz: 4 }, { code: "EVN", city: "Ереван", lat: 40.15, lon: 44.4, tz: 4 },
  { code: "TBS", city: "Тбилиси", lat: 41.67, lon: 44.95, tz: 4 }, { code: "ALA", city: "Алматы", lat: 43.35, lon: 77.04, tz: 5 },
  { code: "TAS", city: "Ташкент", lat: 41.26, lon: 69.28, tz: 5 }, { code: "PEK", city: "Пекин", lat: 40.08, lon: 116.58, tz: 8 },
  { code: "PVG", city: "Шанхай", lat: 31.14, lon: 121.81, tz: 8 }, { code: "HND", city: "Токио", lat: 35.55, lon: 139.78, tz: 9 },
  { code: "ICN", city: "Сеул", lat: 37.46, lon: 126.44, tz: 9 }, { code: "DEL", city: "Дели", lat: 28.56, lon: 77.1, tz: 5.5 },
  { code: "BKK", city: "Бангкок", lat: 13.69, lon: 100.75, tz: 7 }, { code: "SIN", city: "Сингапур", lat: 1.36, lon: 103.99, tz: 8 },
  { code: "MLE", city: "Мале", lat: 4.19, lon: 73.53, tz: 5 }, { code: "CAI", city: "Каир", lat: 30.12, lon: 31.41, tz: 2 },
  { code: "ADD", city: "Аддис-Абеба", lat: 8.98, lon: 38.8, tz: 3 }, { code: "JNB", city: "Йоханнесбург", lat: -26.14, lon: 28.25, tz: 2 },
  { code: "LHR", city: "Лондон", lat: 51.47, lon: -0.45, tz: 0 }, { code: "CDG", city: "Париж", lat: 49.01, lon: 2.55, tz: 1 },
  { code: "BER", city: "Берлин", lat: 52.36, lon: 13.5, tz: 1 }, { code: "FCO", city: "Рим", lat: 41.8, lon: 12.25, tz: 1 },
  { code: "MAD", city: "Мадрид", lat: 40.47, lon: -3.57, tz: 1 }, { code: "KEF", city: "Рейкьявик", lat: 63.99, lon: -22.62, tz: 0 },
  { code: "JFK", city: "Нью-Йорк", lat: 40.64, lon: -73.78, tz: -5 }, { code: "LAX", city: "Лос-Анджелес", lat: 33.94, lon: -118.41, tz: -8 },
  { code: "ANC", city: "Анкоридж", lat: 61.17, lon: -150, tz: -9 }, { code: "MEX", city: "Мехико", lat: 19.44, lon: -99.07, tz: -6 },
  { code: "HAV", city: "Гавана", lat: 22.99, lon: -82.41, tz: -5 }, { code: "GRU", city: "Сан-Паулу", lat: -23.43, lon: -46.47, tz: -3 },
  { code: "EZE", city: "Буэнос-Айрес", lat: -34.82, lon: -58.54, tz: -3 }, { code: "SYD", city: "Сидней", lat: -33.94, lon: 151.18, tz: 10 },
  { code: "AKL", city: "Окленд", lat: -37.01, lon: 174.79, tz: 12 },
];
const HUBS = ["SVO", "IST", "DXB", "LHR", "JFK", "SIN"];
const R = 1;
const EARTH = 6371;
const rad = Math.PI / 180;

/** Great-circle distance in km (haversine). */
function distance(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH * Math.asin(Math.sqrt(h));
}
/** Length of the rhumb line: the straight line on a Mercator map, constant compass bearing. */
function rhumb(a: Airport, b: Airport) {
  const p1 = a.lat * rad, p2 = b.lat * rad;
  const dp = p2 - p1;
  let dl = (b.lon - a.lon) * rad;
  if (Math.abs(dl) > Math.PI) dl = dl > 0 ? -(2 * Math.PI - dl) : 2 * Math.PI + dl;
  const dPsi = Math.log(Math.tan(Math.PI / 4 + p2 / 2) / Math.tan(Math.PI / 4 + p1 / 2));
  const q = Math.abs(dPsi) > 1e-12 ? dp / dPsi : Math.cos(p1);
  return Math.sqrt(dp * dp + q * q * dl * dl) * EARTH;
}
/** Block time: about 820 km/h cruise plus half an hour for climb, descent and taxi. */
const flightTime = (km: number) => { const m = Math.round((km / 820) * 60 + 30); return `${Math.floor(m / 60)} ч ${String(m % 60).padStart(2, "0")} мин`; };
const km = (v: number) => `${Math.round(v).toLocaleString("ru-RU")} км`;

/** A demo network: every airport links to its three nearest neighbours and to the hubs within reach. */
const NETWORK = (() => {
  const set = new Set<string>();
  for (const a of AIRPORTS) {
    const near = AIRPORTS.filter((b) => b !== a).sort((x, y) => distance(a, x) - distance(a, y)).slice(0, 3);
    for (const b of near) set.add([a.code, b.code].sort().join("-"));
    for (const h of HUBS) { const hub = AIRPORTS.find((x) => x.code === h)!; if (hub !== a && distance(a, hub) < 9000) set.add([a.code, h].sort().join("-")); }
  }
  return [...set].map((key) => key.split("-") as [string, string]);
})();
const byCode = new Map(AIRPORTS.map((a) => [a.code, a]));

const toVec = (lat: number, lon: number, r = R) => {
  const phi = (90 - lat) * rad, theta = (lon + 180) * rad;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
};
const toLatLon = (v: THREE.Vector3) => {
  const n = v.clone().normalize();
  const lat = 90 - Math.acos(n.y) / rad;
  let lon = Math.atan2(n.z, -n.x) / rad - 180;
  if (lon < -180) lon += 360;
  return { lat, lon };
};
/** Where the sun is overhead right now (approximate solar declination and the UTC hour). */
function subsolar(date: Date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = (date.getTime() - start) / 86400000;
  const lat = -23.44 * Math.cos((2 * Math.PI / 365) * (day + 10));
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60;
  return { lat, lon: (12 - hours) * 15 };
}
/** A great-circle arc lifted above the surface, sampled as a curve. */
function arc(a: Airport, b: Airport) {
  const va = toVec(a.lat, a.lon).normalize(), vb = toVec(b.lat, b.lon).normalize();
  const angle = va.angleTo(vb);
  const points = Array.from({ length: 96 }, (_, i) => {
    const t = i / 95;
    const p = va.clone().multiplyScalar(Math.sin((1 - t) * angle)).add(vb.clone().multiplyScalar(Math.sin(t * angle))).divideScalar(Math.sin(angle) || 1);
    return p.normalize().multiplyScalar(R * (1.004 + Math.sin(t * Math.PI) * Math.min(0.32, angle * 0.16)));
  });
  return new THREE.CatmullRomCurve3(points);
}

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
  return (lat: number, lon: number) => data[(Math.min(359, Math.floor((90 - lat) * 2)) * 720 + Math.min(719, Math.floor((lon + 180) * 2))) * 4] > 128;
}

type Api = { focus: (a: Airport) => void; show: (from: Airport | null, to: Airport | null) => void };

/**
 * «Перелёты»: a flight explorer on a three.js globe. Tap anywhere and the nearest airport
 * becomes a point of the route; the great-circle arc draws and a plane flies it, while the
 * panel gives distance, block time, the time-zone shift and how much shorter the curved path
 * is than the straight line on a flat map. The night side follows the real sun right now.
 */
export default function GlobeRoutes({ mode }: ShowcaseProps) {
  const host = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const [from, setFrom] = useState<Airport | null>(byCode.get("SVO")!);
  const [to, setTo] = useState<Airport | null>(null);
  const [query, setQuery] = useState("");
  const pick = useRef<(a: Airport) => void>(() => {});
  const route = from && to ? { d: distance(from, to), r: rhumb(from, to) } : null;
  const directs = useMemo(() => (from ? NETWORK.filter((p) => p.includes(from.code)).map((p) => byCode.get(p[0] === from.code ? p[1] : p[0])!).sort((a, b) => distance(from, a) - distance(from, b)) : []), [from]);
  const initial = useRef({ from, to });

  // A tap fills "from" first, then "to"; a tap after a full route starts a new one from that airport.
  useEffect(() => {
    pick.current = (a) => {
      if (!from || (from && to)) { setFrom(a); setTo(null); }
      else if (a.code !== from.code) setTo(a);
    };
  }, [from, to]);
  useEffect(() => { api.current?.show(from, to); }, [from, to]);

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
    // The stage moves the globe and its atmosphere together; the globe alone rotates inside it.
    const stage = new THREE.Group();
    scene.add(stage);
    const globe = new THREE.Group();
    stage.add(globe);
    const home = toVec(50, 50);
    globe.rotation.set(Math.atan2(home.y, Math.hypot(home.x, home.z)), Math.atan2(-home.x, home.z), 0);

    // The sun, in globe coordinates; recomputed every minute.
    const sun = new THREE.Vector3();
    const setSun = () => { const s = subsolar(new Date()); sun.copy(toVec(s.lat, s.lon)).normalize(); };
    setSun();
    const sunTimer = window.setInterval(setSun, 60000);

    const ocean = new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 64, 64), new THREE.ShaderMaterial({
      uniforms: { sun: { value: sun } },
      vertexShader: "varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform vec3 sun; varying vec3 p; void main(){ float d = smoothstep(-0.12, 0.25, dot(p, sun)); gl_FragColor = vec4(mix(vec3(0.012,0.016,0.04), vec3(0.04,0.07,0.16), d), 1.0); }",
    }));
    globe.add(ocean);
    stage.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.16, 64, 64), new THREE.ShaderMaterial({
      side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      vertexShader: "varying vec3 n; void main(){ n = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "varying vec3 n; void main(){ float i = pow(0.62 - dot(n, vec3(0,0,1.0)), 4.0); gl_FragColor = vec4(0.36,0.48,1.0,1.0) * i * 1.1; }",
    })));

    // Land dots: lit by the sun by day; on the night side a share of them glow warm like city lights.
    const onLand = landMask();
    const dots: number[] = [], seeds: number[] = [];
    const N = 30000;
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const lat = Math.asin(y) / rad, lon = ((i * 137.508) % 360) - 180;
      if (onLand(lat, lon)) { const v = toVec(lat, lon, R * 1.001); dots.push(v.x, v.y, v.z); seeds.push(Math.random()); }
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.Float32BufferAttribute(dots, 3));
    dotGeo.setAttribute("seed", new THREE.Float32BufferAttribute(seeds, 1));
    const dotMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { size: { value: 2.6 * renderer.getPixelRatio() }, sun: { value: sun }, time: { value: 0 } },
      vertexShader: "uniform float size; uniform vec3 sun; attribute float seed; varying float day; varying float s; void main(){ day = smoothstep(-0.1, 0.18, dot(normalize(position), sun)); s = seed; gl_PointSize = size; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform float time; varying float day; varying float s; void main(){ vec2 c = gl_PointCoord - 0.5; if (dot(c,c) > 0.25) discard; vec3 dayCol = vec3(0.6,0.72,1.0); float city = step(0.86, s) * (0.75 + 0.25 * sin(time * 2.0 + s * 40.0)); vec3 nightCol = mix(vec3(0.16,0.2,0.36), vec3(1.0,0.78,0.42), city); gl_FragColor = vec4(mix(nightCol, dayCol, day), mix(0.55 + city * 0.45, 0.95, day)); }",
    });
    globe.add(new THREE.Points(dotGeo, dotMat));

    // Airports: a core dot each; the two route ends get a breathing ring.
    const coreGeo = new THREE.CircleGeometry(0.009, 16);
    const airports = AIRPORTS.map((a) => {
      const pos = toVec(a.lat, a.lon, R * 1.003);
      const core = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: 0xdfe6ff, transparent: true, opacity: 0.85 }));
      core.position.copy(pos); core.lookAt(pos.clone().multiplyScalar(2));
      globe.add(core);
      return { a, core };
    });
    const ringMat = (color: number) => new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide });
    const rings = [new THREE.Mesh(new THREE.RingGeometry(0.016, 0.024, 32), ringMat(0x2fd3a0)), new THREE.Mesh(new THREE.RingGeometry(0.016, 0.024, 32), ringMat(0xff8a3d))];
    rings.forEach((r) => { r.visible = false; globe.add(r); });

    // The network: thin arcs; the routes of the chosen airport light up with a running pulse.
    const lineMat = (color: number) => new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { time: { value: 0 }, offset: { value: Math.random() }, on: { value: 0 }, color: { value: new THREE.Color(color) } },
      vertexShader: "varying float vt; void main(){ vt = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform float time, offset, on; uniform vec3 color; varying float vt; void main(){ float head = fract(time*0.3 + offset); float d = vt - head; float pulse = smoothstep(-0.2, 0.0, d) * (1.0 - smoothstep(0.0, 0.02, d)); float a = 0.07 + on * (0.35 + pulse * 1.2); gl_FragColor = vec4(color * (0.6 + pulse * on * 1.5), a); }",
    });
    const network = NETWORK.map(([x, y]) => {
      const material = lineMat(0x5b7bff);
      globe.add(new THREE.Mesh(new THREE.TubeGeometry(arc(byCode.get(x)!, byCode.get(y)!), 64, 0.0022, 4, false), material));
      return { x, y, material };
    });

    // The chosen flight: a bright arc that draws itself and a plane that flies it.
    const flightMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { drawn: { value: 0 } },
      vertexShader: "varying float vt; void main(){ vt = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform float drawn; varying float vt; void main(){ if (vt > drawn) discard; vec3 c = mix(vec3(0.18,0.83,0.63), vec3(1.0,0.54,0.24), vt); gl_FragColor = vec4(c * 1.4, 0.95); }",
    });
    let flight: THREE.Mesh | null = null;
    let curve: THREE.CatmullRomCurve3 | null = null;
    const plane = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    plane.geometry.rotateX(Math.PI / 2);
    plane.visible = false;
    globe.add(plane);
    const flightState = { t: 0 };

    // Drag spins with inertia; a tap (little movement) picks the nearest airport to that point.
    const spin = { vx: 0, vy: reduced ? 0 : 0.0012, dragging: false, x: 0, y: 0, idle: true, sx: 0, sy: 0 };

    // Turn the globe so a point of the surface faces the viewer (Ry first, then Rx).
    const face = (v: THREE.Vector3, duration = 1.4) => {
      const m = v.clone().normalize();
      const target = { x: Math.atan2(m.y, Math.hypot(m.x, m.z)), y: Math.atan2(-m.x, m.z) };
      let dy = target.y - globe.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      spin.idle = false; spin.vx = 0; spin.vy = 0;
      gsap.to(globe.rotation, { x: Math.max(-1.1, Math.min(1.1, target.x)), y: globe.rotation.y + dy, duration: reduced ? 0 : duration, ease: "power3.inOut" });
    };

    api.current = {
      focus: (a) => face(toVec(a.lat, a.lon)),
      show: (a, b) => {
        [a, b].forEach((p, i) => { rings[i].visible = Boolean(p); if (p) { const pos = toVec(p.lat, p.lon, R * 1.004); rings[i].position.copy(pos); rings[i].lookAt(pos.clone().multiplyScalar(2)); } });
        network.forEach((n) => { n.material.uniforms.on.value = a && !b && (n.x === a.code || n.y === a.code) ? 1 : 0; });
        if (flight) { globe.remove(flight); flight.geometry.dispose(); flight = null; }
        plane.visible = false;
        if (a && b) {
          curve = arc(a, b);
          flight = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.0055, 8, false), flightMat);
          globe.add(flight);
          const va = toVec(a.lat, a.lon), vb = toVec(b.lat, b.lon);
          const mid = va.clone().add(vb);
          face(mid.lengthSq() < 0.01 ? va : mid);
          flightMat.uniforms.drawn.value = 0;
          gsap.to(flightMat.uniforms.drawn, { value: 1, duration: reduced ? 0 : 1.6, ease: "power2.inOut", delay: reduced ? 0 : 0.3 });
          flightState.t = 0;
          plane.visible = true;
        } else if (a) face(toVec(a.lat, a.lon));
      },
    };

    const mouse = new THREE.Vector2(9, 9);
    const ray = new THREE.Raycaster();
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest(".gr-panel")) return;
      spin.dragging = true; spin.idle = false; spin.x = spin.sx = e.clientX; spin.y = spin.sy = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    // A touch tap has no pointermove before it: the point is read from the event itself.
    const aim = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      mouse.set(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || spin.dragging) aim(e);
      if (!spin.dragging) return;
      spin.vy = (e.clientX - spin.x) * 0.0045; spin.vx = (e.clientY - spin.y) * 0.0045;
      globe.rotation.y += spin.vy; globe.rotation.x = Math.max(-1.1, Math.min(1.1, globe.rotation.x + spin.vx));
      spin.x = e.clientX; spin.y = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (!spin.dragging) return;
      spin.dragging = false;
      if (Math.hypot(e.clientX - spin.sx, e.clientY - spin.sy) > 6) return;
      spin.vx = 0; spin.vy = 0;
      aim(e);
      ray.setFromCamera(mouse, camera);
      const hit = ray.intersectObject(ocean)[0];
      // On touch the hover label must not stay pinned to the last tap.
      if (e.pointerType !== "mouse") requestAnimationFrame(() => mouse.set(9, 9));
      if (!hit) return;
      const tapped = toLatLon(globe.worldToLocal(hit.point.clone()));
      pick.current(AIRPORTS.reduce((best, a) => (distance(tapped, a) < distance(tapped, best) ? a : best)));
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const portrait = w / h < 0.8;
      camera.position.set(0, 0, portrait ? 4.4 / Math.max(0.45, w / h) : 4.3);
      camera.updateProjectionMatrix();
      // The panel sits on the right on wide stages and at the bottom on narrow ones.
      stage.position.set(portrait ? 0 : -0.5, portrait ? 0.62 : 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const tmp = new THREE.Vector3();
    let frame = 0, visible = true;
    const clock = new THREE.Clock();
    const loop = () => {
      const dt = clock.getDelta(), t = clock.elapsedTime;
      if (!spin.dragging) {
        globe.rotation.y += spin.vy;
        if (!spin.idle) { globe.rotation.x = Math.max(-1.1, Math.min(1.1, globe.rotation.x + spin.vx)); spin.vy *= 0.94; spin.vx *= 0.94; }
      }
      dotMat.uniforms.time.value = t;
      network.forEach((n) => { n.material.uniforms.time.value = reduced ? 0.5 : t; });
      rings.forEach((r, i) => { const k = reduced ? 0.4 : (t * 0.7 + i * 0.5) % 1; r.scale.setScalar(1 + k * 1.4); (r.material as THREE.MeshBasicMaterial).opacity = 1 - k; });
      if (plane.visible && curve) {
        flightState.t = reduced ? 0.5 : (flightState.t + dt * 0.12) % 1;
        plane.position.copy(curve.getPointAt(flightState.t));
        plane.lookAt(globe.localToWorld(curve.getPointAt(Math.min(1, flightState.t + 0.01))));
      }
      // Hover label on desktop: the nearest front-facing airport under the pointer.
      ray.setFromCamera(mouse, camera);
      let best = 0.05, hit: (typeof airports)[number] | null = null;
      for (const c of airports) {
        c.core.getWorldPosition(tmp);
        if (tmp.z < 0.15) continue;
        const d = ray.ray.distanceToPoint(tmp);
        if (d < best) { best = d; hit = c; }
      }
      const tag = label.current;
      if (tag) {
        if (hit) {
          hit.core.getWorldPosition(tmp).project(camera);
          tag.textContent = `${hit.a.city} · ${hit.a.code}`;
          tag.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * el.clientWidth}px, ${(-tmp.y * 0.5 + 0.5) * el.clientHeight}px)`;
          tag.dataset.on = "true";
        } else delete tag.dataset.on;
      }
      renderer.render(scene, camera);
      frame = visible ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !frame) { clock.getDelta(); frame = requestAnimationFrame(loop); } });
    io.observe(el);
    frame = requestAnimationFrame(loop);
    api.current.show(initial.current.from, initial.current.to);

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(sunTimer);
      io.disconnect(); ro.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose(); (m.material as THREE.Material | undefined)?.dispose?.(); });
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, []);

  const found = query.trim().length >= 2 ? AIRPORTS.filter((a) => `${a.city} ${a.code}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 5) : [];
  const choose = (a: Airport) => { pick.current(a); setQuery(""); api.current?.focus(a); };
  const tzShift = from && to ? to.tz - from.tz : 0;
  const saved = route ? route.r - route.d : 0;

  return <div className={`gr gr-${mode}`} ref={host}>
    <div className="gr-label" ref={label} aria-hidden="true" />
    <div className="gr-panel" data-lg="surface">
      <p className="gr-head"><Plane aria-hidden="true" />Перелёты<small>Нажмите на глобус — ближайший аэропорт станет точкой маршрута</small></p>
      <div className="gr-ends">
        <button type="button" className="gr-end" data-on={!from || undefined} onClick={() => { setFrom(null); setTo(null); }} aria-label={`Откуда: ${from ? from.city : "не выбрано"}. Нажмите, чтобы выбрать заново`}><i style={{ background: "#2fd3a0" }} /><span>Откуда</span><b>{from ? `${from.city} · ${from.code}` : "нажмите на глобус"}</b></button>
        <button type="button" className="gr-swap" aria-label="Поменять местами" disabled={!from || !to} onClick={() => { setFrom(to); setTo(from); }}><ArrowLeftRight aria-hidden="true" /></button>
        <button type="button" className="gr-end" data-on={Boolean(from && !to) || undefined} onClick={() => setTo(null)} aria-label={`Куда: ${to ? to.city : "не выбрано"}`}><i style={{ background: "#ff8a3d" }} /><span>Куда</span><b>{to ? `${to.city} · ${to.code}` : from ? "нажмите на глобус" : "—"}</b></button>
      </div>
      <label className="gr-search"><span className="sr-only">Найти аэропорт</span>
        <input value={query} placeholder="Город или код: Токио, JFK…" onChange={(e) => setQuery(e.target.value)} />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Очистить поиск"><X aria-hidden="true" /></button>}
      </label>
      {found.length > 0 && <ul className="gr-found">{found.map((a) => <li key={a.code}><button type="button" onClick={() => choose(a)}><b>{a.city}</b><span>{a.code}</span></button></li>)}</ul>}

      {route && from && to ? <div className="gr-result" aria-live="polite">
        <p className="gr-big">{km(route.d)}</p>
        <dl>
          <div><dt>В пути</dt><dd>≈ {flightTime(route.d)}</dd></div>
          <div><dt>Часовые пояса</dt><dd>{tzShift === 0 ? "то же время" : `${tzShift > 0 ? "+" : "−"}${String(Math.abs(tzShift)).replace(".", ",")} ч`}</dd></div>
        </dl>
        <p className="gr-fact">{saved > 30
          ? <>Прямая линия на плоской карте была бы <b>на {km(saved)} длиннее</b>. Поэтому самолёты летят дугой — по большому кругу.</>
          : <>Маршрут почти совпадает с прямой на карте: города лежат близко к одной широте или меридиану.</>}</p>
      </div> : from ? <div className="gr-result">
        <p className="gr-sub">Прямые рейсы из {from.city} · {directs.length}</p>
        <ul className="gr-list">{directs.map((a) => <li key={a.code}><button type="button" onClick={() => setTo(a)}><span>{a.city}</span><b>{km(distance(from, a))}</b></button></li>)}</ul>
      </div> : <p className="gr-sub">Выберите точку отправления на глобусе или в поиске.</p>}
      <p className="gr-note">Ночная сторона — по положению Солнца сейчас. Аэропорты настоящие, сеть рейсов демонстрационная.</p>
    </div>
  </div>;
}
