export const DEFAULT_GLASS_DENSITY = 12;

export function normalizeGlassDensity(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(100, Math.max(0, value)) : DEFAULT_GLASS_DENSITY;
}

export function roundedDistance(x: number, y: number, width: number, height: number, radius: number) {
  const qx = Math.abs(x) - width / 2 + radius;
  const qy = Math.abs(y) - height / 2 + radius;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - radius;
}

// Snell profile along a rounded edge. The center remains neutral, not a noise map.
export function edgeRefraction(t: number) {
  if (t >= 1) return 0;
  const height = (v: number) => Math.cbrt(1 - (1 - v) ** 3);
  const a = Math.max(0, t - .001);
  const b = Math.min(1, t + .001);
  const angle = t <= 0 ? Math.PI / 2 : Math.atan((height(b) - height(a)) / (b - a));
  return Math.tan(angle - Math.asin(Math.sin(angle) / 1.5)) / Math.tan(Math.PI / 2 - Math.asin(1 / 1.5));
}

const maps = new Map<string, string>();
export function createGlassMap(width: number, height: number, radius: number) {
  const key = `${width}:${height}:${radius}`;
  const cached = maps.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return "";
  const pixels = context.createImageData(width, height);
  const bezel = Math.min(16, height * .3);
  const profile = Array.from({ length: 129 }, (_, i) => edgeRefraction(i / 128));
  const distance = (x: number, y: number) => roundedDistance(x, y, width, height, radius);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const px = x + .5 - width / 2;
    const py = y + .5 - height / 2;
    const d = distance(px, py);
    let dx = 0, dy = 0;
    if (d < 0 && d > -bezel) {
      const nx = distance(px + .5, py) - distance(px - .5, py);
      const ny = distance(px, py + .5) - distance(px, py - .5);
      const magnitude = profile[Math.round(-d / bezel * 128)] / (Math.hypot(nx, ny) || 1);
      dx = -nx * magnitude;
      dy = -ny * magnitude;
    }
    const i = (y * width + x) * 4;
    pixels.data.set([Math.round((.5 + dx * .5) * 255), Math.round((.5 + dy * .5) * 255), 128, 255], i);
  }
  context.putImageData(pixels, 0, 0);
  const map = canvas.toDataURL();
  if (maps.size >= 24) maps.delete(maps.keys().next().value!);
  maps.set(key, map);
  return map;
}
