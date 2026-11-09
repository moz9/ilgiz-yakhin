"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Link2, Pause, Play, Trash2 } from "lucide-react";
import type { ShowcaseProps } from "./registry";

const TRACKS = [
  { id: "kick", name: "Бочка", color: "#ff6b3d" },
  { id: "snare", name: "Малый", color: "#ffc23d" },
  { id: "clap", name: "Клэп", color: "#ff5fa2" },
  { id: "hat", name: "Хэт", color: "#2fd3a0" },
  { id: "open", name: "Открытый", color: "#3ba8ff" },
  { id: "tom", name: "Том", color: "#b46bff" },
] as const;
type TrackId = (typeof TRACKS)[number]["id"];
type Pattern = Record<TrackId, boolean[]>;
const bits = (s: string) => [...s].map((c) => c === "x");
const PRESETS: { name: string; tempo: number; swing: number; p: Record<TrackId, string> }[] = [
  { name: "Хаус", tempo: 124, swing: 0, p: { kick: "x...x...x...x...", snare: "................", clap: "....x.......x...", hat: "..x...x...x...x.", open: "......x.......x.", tom: "..............x." } },
  { name: "Хип-хоп", tempo: 90, swing: 35, p: { kick: "x......x..x.....", snare: "....x.......x...", clap: "............x...", hat: "x.x.x.x.x.x.x.x.", open: "...............x", tom: "..........x....." } },
  { name: "Брейк", tempo: 136, swing: 15, p: { kick: "x.........x.x...", snare: "....x..x.x..x..x", clap: "................", hat: "xxxxxxxxxxxxxxxx", open: "......x.........", tom: "...........x..x." } },
  { name: "Техно", tempo: 132, swing: 0, p: { kick: "x...x...x...x...", snare: "................", clap: "....x.......x..x", hat: "xx.xxx.xxx.xxx.x", open: "..x...x...x...x.", tom: "x.....x...x....." } },
];
const toPattern = (p: Record<TrackId, string>) => Object.fromEntries(TRACKS.map((t) => [t.id, bits(p[t.id])])) as Pattern;

/** Synthesised drums: no samples, every hit is built from oscillators and noise. */
function makeKit(ctx: BaseAudioContext, out: AudioNode) {
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const env = (t: number, peak: number, decay: number) => { const g = ctx.createGain(); g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.001, t + decay); g.connect(out); return g; };
  const hiss = (t: number, type: BiquadFilterType, freq: number, peak: number, decay: number) => {
    const src = ctx.createBufferSource(); src.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    src.connect(f); f.connect(env(t, peak, decay)); src.start(t); src.stop(t + decay + 0.05);
  };
  const tone = (t: number, from: number, to: number, peak: number, decay: number, type: OscillatorType = "sine") => {
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(to, t + decay * 0.8);
    o.connect(env(t, peak, decay)); o.start(t); o.stop(t + decay + 0.05);
  };
  return {
    kick: (t: number) => tone(t, 150, 42, 1, 0.45),
    snare: (t: number) => { hiss(t, "highpass", 1200, 0.5, 0.18); tone(t, 220, 160, 0.35, 0.1, "triangle"); },
    clap: (t: number) => [0, 0.012, 0.024].forEach((d, i) => hiss(t + d, "bandpass", 1500, i === 2 ? 0.6 : 0.35, i === 2 ? 0.16 : 0.02)),
    hat: (t: number) => hiss(t, "highpass", 8000, 0.28, 0.05),
    open: (t: number) => hiss(t, "highpass", 7000, 0.22, 0.32),
    tom: (t: number) => tone(t, 220, 110, 0.6, 0.3),
  } as Record<TrackId, (t: number) => void>;
}

/** A beat travels in the link: #b=<4 hex digits per track>-<tempo>-<swing>. */
const encodeBeat = (p: Pattern, tempo: number, swing: number) =>
  `b=${TRACKS.map((t) => parseInt(p[t.id].map((v) => (v ? "1" : "0")).join(""), 2).toString(16).padStart(4, "0")).join("")}-${tempo}-${swing}`;
function decodeBeat(hash: string) {
  const m = hash.match(/b=([0-9a-f]{24})-(\d{2,3})-(\d{1,2})/i);
  if (!m) return null;
  const pattern = Object.fromEntries(TRACKS.map((t, i) => [t.id, [...parseInt(m[1].slice(i * 4, i * 4 + 4), 16).toString(2).padStart(16, "0")].map((c) => c === "1")])) as Pattern;
  return { pattern, tempo: Math.min(170, Math.max(70, Number(m[2]))), swing: Math.min(60, Number(m[3])) };
}

/** Four bars of the beat rendered offline, faster than real time, into a 16-bit stereo WAV. */
async function renderWav(pattern: Pattern, tempo: number, swing: number, muted: Set<TrackId>) {
  const rate = 44100, sixteenth = 60 / tempo / 4, steps = 64;
  const length = Math.ceil((steps * sixteenth + 0.6) * rate);
  const ctx = new OfflineAudioContext(2, length, rate);
  const master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
  const kit = makeKit(ctx, master);
  for (let i = 0; i < steps; i++) {
    const at = 0.02 + i * sixteenth + (i % 2 ? sixteenth * (swing / 100) * 0.5 : 0);
    for (const t of TRACKS) if (pattern[t.id][i % 16] && !muted.has(t.id)) kit[t.id](at);
  }
  const audio = await ctx.startRendering();
  const view = new DataView(new ArrayBuffer(44 + length * 4));
  const text = (o: number, v: string) => [...v].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  text(0, "RIFF"); view.setUint32(4, 36 + length * 4, true); text(8, "WAVEfmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 2, true); view.setUint32(24, rate, true);
  view.setUint32(28, rate * 4, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, length * 4, true);
  const l = audio.getChannelData(0), r = audio.getChannelData(1);
  for (let i = 0; i < length; i++) {
    view.setInt16(44 + i * 4, Math.max(-1, Math.min(1, l[i])) * 0x7fff, true);
    view.setInt16(46 + i * 4, Math.max(-1, Math.min(1, r[i])) * 0x7fff, true);
  }
  return new Blob([view], { type: "audio/wav" });
}

/**
 * A 16-step drum machine on the Web Audio API. Six synthesised voices, tempo and swing,
 * mutes, patterns, and a spectrum visualiser. Hits are scheduled ahead on the audio clock
 * (a lookahead scheduler), so the groove stays tight even when the page is busy.
 */
export default function DrumMachine({ mode }: ShowcaseProps) {
  // A shared link opens with its beat; the demo renders on the client only, so the hash is readable here.
  const [shared] = useState(() => decodeBeat(location.hash));
  const [pattern, setPattern] = useState<Pattern>(() => shared?.pattern ?? toPattern(PRESETS[0].p));
  const [tempo, setTempo] = useState(shared?.tempo ?? PRESETS[0].tempo);
  const [swing, setSwing] = useState(shared?.swing ?? PRESETS[0].swing);
  const [note, setNote] = useState("");
  const [rendering, setRendering] = useState(false);
  const [muted, setMuted] = useState<Set<TrackId>>(new Set());
  const [playing, setPlaying] = useState(false);
  const [preset, setPreset] = useState(shared ? -1 : 0);
  const [step, setStep] = useState(-1);
  const canvas = useRef<HTMLCanvasElement>(null);
  const audio = useRef<{ ctx: AudioContext; kit: ReturnType<typeof makeKit>; analyser: AnalyserNode } | null>(null);
  const live = useRef({ pattern, tempo, swing, muted });
  useEffect(() => { live.current = { pattern, tempo, swing, muted }; }, [pattern, tempo, swing, muted]);

  // The scheduler: every 25 ms, queue the hits that fall in the next 100 ms of audio time.
  useEffect(() => {
    if (!playing || !audio.current) return;
    const { ctx, kit } = audio.current;
    let next = ctx.currentTime + 0.05;
    let index = 0;
    const queue: { step: number; time: number }[] = [];
    const timer = window.setInterval(() => {
      const { pattern: p, tempo: bpm, swing: sw, muted: m } = live.current;
      const sixteenth = 60 / bpm / 4;
      while (next < ctx.currentTime + 0.1) {
        const at = next + (index % 2 ? sixteenth * (sw / 100) * 0.5 : 0);
        for (const t of TRACKS) if (p[t.id][index] && !m.has(t.id)) kit[t.id](at);
        queue.push({ step: index, time: at });
        next += sixteenth;
        index = (index + 1) % 16;
      }
    }, 25);
    let frame = 0;
    const draw = () => {
      while (queue.length && queue[0].time <= ctx.currentTime) setStep(queue.shift()!.step);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { clearInterval(timer); cancelAnimationFrame(frame); };
  }, [playing]);

  // The visualiser reads the analyser while the machine plays and fades to rest when it stops.
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const g = el.getContext("2d")!;
    const bins = new Uint8Array(64);
    const level = new Float32Array(48);
    let frame = 0;
    const draw = () => {
      const w = (el.width = el.clientWidth * devicePixelRatio), h = (el.height = el.clientHeight * devicePixelRatio);
      if (audio.current && playing) audio.current.analyser.getByteFrequencyData(bins);
      g.clearRect(0, 0, w, h);
      const n = level.length, bw = w / n;
      for (let i = 0; i < n; i++) {
        const target = playing ? bins[Math.floor((i / n) * 40)] / 255 : 0.04 + 0.03 * Math.sin(i * 0.5 + performance.now() / 600);
        level[i] += (target - level[i]) * 0.3;
        const bh = Math.max(2 * devicePixelRatio, level[i] * h);
        g.fillStyle = `hsl(${20 + (i / n) * 300} 90% 60%)`;
        g.fillRect(i * bw + bw * 0.15, h - bh, bw * 0.7, bh);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const toggle = async () => {
    if (!audio.current) {
      const ctx = new AudioContext();
      const master = ctx.createGain(); master.gain.value = 0.8;
      const analyser = ctx.createAnalyser(); analyser.fftSize = 128;
      master.connect(analyser); analyser.connect(ctx.destination);
      audio.current = { ctx, kit: makeKit(ctx, master), analyser };
    }
    if (audio.current.ctx.state === "suspended") await audio.current.ctx.resume();
    if (playing) setStep(-1);
    setPlaying(!playing);
  };
  useEffect(() => () => { audio.current?.ctx.close(); }, []);

  const flip = (track: TrackId, i: number) => {
    setPattern((p) => ({ ...p, [track]: p[track].map((v, j) => (j === i ? !v : v)) }));
    // Preview the voice when a step is switched on, so building a beat is audible even when stopped.
    if (!pattern[track][i] && audio.current && !playing) audio.current.kit[track](audio.current.ctx.currentTime);
  };
  const flash = (text: string) => { setNote(text); setTimeout(() => setNote(""), 2600); };
  const share = async () => {
    const url = `${location.origin}/demos/lab/drum-machine#${encodeBeat(pattern, tempo, swing)}`;
    try { await navigator.clipboard.writeText(url); flash("Ссылка на бит скопирована — откроется ровно так"); } catch { flash(url); }
  };
  const wav = async () => {
    if (rendering) return;
    setRendering(true);
    try {
      const blob = await renderWav(pattern, tempo, swing, muted);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob); link.download = `ритм-16-${tempo}bpm.wav`; link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 2000);
      flash("4 такта сохранены в WAV");
    } finally { setRendering(false); }
  };
  const load = (i: number) => { setPreset(i); setPattern(toPattern(PRESETS[i].p)); setTempo(PRESETS[i].tempo); setSwing(PRESETS[i].swing); };

  return <div className={`dm dm-${mode}`} onKeyDown={(e) => { if (e.code === "Space" && (e.target as HTMLElement).tagName !== "INPUT") { e.preventDefault(); toggle(); } }}>
    <header className="dm-head">
      <h3>Ритм-16<small>Драм-машина в браузере · звук синтезируется на лету</small></h3>
      <div className="dm-presets" role="group" aria-label="Паттерн">
        {PRESETS.map((p, i) => <button key={p.name} type="button" aria-pressed={preset === i} onClick={() => load(i)}>{p.name}</button>)}
        <button type="button" onClick={() => { setPreset(-1); setPattern(toPattern(Object.fromEntries(TRACKS.map((t) => [t.id, "................"])) as Record<TrackId, string>)); }} aria-label="Очистить паттерн"><Trash2 aria-hidden="true" /></button>
      </div>
    </header>
    <canvas ref={canvas} className="dm-viz" aria-hidden="true" />
    <div className="dm-grid" role="grid" aria-label="Шаги паттерна">
      {TRACKS.map((t) => <div key={t.id} className="dm-row" role="row" style={{ "--c": t.color } as React.CSSProperties}>
        <button type="button" className="dm-track" aria-pressed={!muted.has(t.id)} onClick={() => setMuted((m) => { const n = new Set(m); if (n.has(t.id)) n.delete(t.id); else n.add(t.id); return n; })} aria-label={`${t.name}: ${muted.has(t.id) ? "выключен" : "включён"}`}>
          <i aria-hidden="true" />{t.name}
        </button>
        {pattern[t.id].map((on, i) => <button key={i} type="button" role="gridcell" className="dm-step" aria-selected={on} data-beat={i % 4 === 0 || undefined} data-now={step === i || undefined}
          aria-label={`${t.name}, шаг ${i + 1}`} onClick={() => flip(t.id, i)} />)}
      </div>)}
    </div>
    <footer className="dm-transport">
      <button type="button" className="dm-play" onClick={toggle} aria-pressed={playing}>{playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}{playing ? "Стоп" : "Играть"}</button>
      <label>Темп <b>{tempo}</b> BPM<input type="range" min="70" max="170" value={tempo} onChange={(e) => setTempo(Number(e.target.value))} /></label>
      <label>Свинг <b>{swing}%</b><input type="range" min="0" max="60" value={swing} onChange={(e) => setSwing(Number(e.target.value))} /></label>
      <div className="dm-out">
        <button type="button" onClick={wav} disabled={rendering}><Download aria-hidden="true" />{rendering ? "Свожу…" : "WAV"}</button>
        <button type="button" onClick={share}><Link2 aria-hidden="true" />Ссылка</button>
      </div>
      <p>{note || "Пробел — старт и стоп. Звук включится после нажатия «Играть»."}</p>
    </footer>
  </div>;
}
