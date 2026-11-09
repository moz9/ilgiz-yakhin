"use client";

import { useEffect, useRef, useState } from "react";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { gsap, SplitText } from "@/lib/gsap";
import { useGlassTabs } from "@/components/glass/glass-runtime";
import type { ShowcaseProps } from "./registry";

gsap.registerPlugin(ScrambleTextPlugin);

const PRESETS = ["Волна", "Разлёт", "Маска", "Шифр", "Флип"] as const;
const PALETTES = [
  { name: "Ночь", bg: "#07080f", ink: "#f4f6ff", accent: "#5b7bff" },
  { name: "Кислота", bg: "#0d0f06", ink: "#e9ff6b", accent: "#ff2fd1" },
  { name: "Бумага", bg: "#efe9dc", ink: "#16130f", accent: "#ff5f3a" },
];

/**
 * Kinetic type: a poster that moves. Type any phrase, pick a motion and a palette; every
 * motion is a looping GSAP timeline over the phrase split into characters (SplitText),
 * rebuilt whenever the text changes. Without motion the poster stays a still composition.
 */
export default function KineticType({ mode }: ShowcaseProps) {
  const [text, setText] = useState("Движение — это смысл");
  const [preset, setPreset] = useState(0);
  const [palette, setPalette] = useState(0);
  const [speed, setSpeed] = useState(1);
  const word = useRef<HTMLParagraphElement>(null);
  const echo = useRef<HTMLDivElement>(null);
  const presetTabs = useRef<HTMLDivElement>(null);
  const paletteTabs = useRef<HTMLDivElement>(null);
  useGlassTabs(presetTabs, preset, setPreset);
  useGlassTabs(paletteTabs, palette, setPalette);

  useEffect(() => {
    const el = word.current;
    if (!el) return;
    el.textContent = text.trim() || " ";
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => { el.textContent = ""; };
    const split = SplitText.create(el, { type: "words,chars", charsClass: "kt-char", aria: "none" });
    const chars = split.chars as HTMLElement[];
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4, defaults: { ease: "power3.inOut" } });
    switch (PRESETS[preset]) {
      case "Волна":
        tl.to(chars, { yPercent: -38, rotate: -6, duration: 0.5, stagger: { each: 0.05, yoyo: true, repeat: 1 }, ease: "sine.inOut" })
          .to(chars, { scaleY: 1.25, transformOrigin: "50% 100%", duration: 0.35, stagger: { each: 0.03, yoyo: true, repeat: 1 } }, "-=0.6");
        break;
      case "Разлёт":
        tl.from(chars, { x: () => gsap.utils.random(-500, 500), y: () => gsap.utils.random(-300, 300), rotate: () => gsap.utils.random(-180, 180), opacity: 0, scale: 0.2, duration: 1.1, stagger: { each: 0.02, from: "random" }, ease: "expo.out" })
          .to({}, { duration: 1 })
          .to(chars, { y: () => gsap.utils.random(200, 420), rotate: () => gsap.utils.random(-90, 90), opacity: 0, duration: 0.7, stagger: { each: 0.015, from: "edges" }, ease: "power2.in" });
        break;
      case "Маска":
        tl.fromTo(chars, { yPercent: 110, clipPath: "inset(0 0 100% 0)" }, { yPercent: 0, clipPath: "inset(0 0 0% 0)", duration: 0.7, stagger: 0.03, ease: "expo.out" })
          .to(chars, { color: "var(--kt-accent)", duration: 0.25, stagger: { each: 0.03, yoyo: true, repeat: 1 } }, "+=0.2")
          .to(chars, { yPercent: -110, clipPath: "inset(100% 0 0 0)", duration: 0.6, stagger: 0.02, ease: "expo.in" }, "+=0.6");
        break;
      case "Шифр":
        split.revert();
        tl.to(el, { duration: 1.6, scrambleText: { text: el.textContent ?? "", chars: "01#%&*+=?АБВГДЕЖЗИКЛМНОПРСТ", revealDelay: 0.3, speed: 0.6 } })
          .to(el, { color: "var(--kt-accent)", duration: 0.2, yoyo: true, repeat: 3 }, "+=0.4")
          .to({}, { duration: 0.8 });
        break;
      case "Флип":
        gsap.set(el, { perspective: 800 });
        tl.from(chars, { rotateX: -100, opacity: 0, transformOrigin: "50% 50% -40px", duration: 0.8, stagger: 0.04, ease: "back.out(1.6)" })
          .to(chars, { rotateY: 360, duration: 1, stagger: { each: 0.04, from: "center" }, ease: "power2.inOut" }, "+=0.5")
          .to(chars, { rotateX: 100, opacity: 0, duration: 0.6, stagger: 0.03, ease: "power2.in" }, "+=0.4");
        break;
    }
    tl.timeScale(speed);
    // The echo rows behind the poster drift on their own slow loop.
    const drift = echo.current ? gsap.to(echo.current.children, { xPercent: (i) => (i % 2 ? 12 : -12), duration: 6, ease: "sine.inOut", yoyo: true, repeat: -1 }) : null;
    return () => { tl.kill(); drift?.kill(); split.revert(); gsap.set(el, { clearProps: "all" }); };
  }, [text, preset, speed]);

  const colors = PALETTES[palette];
  return <div className={`kt kt-${mode}`} style={{ "--kt-bg": colors.bg, "--kt-ink": colors.ink, "--kt-accent": colors.accent } as React.CSSProperties}>
    <div className="kt-echo" ref={echo} aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <span key={i}>{text}</span>)}</div>
    {/* SplitText rewrites this node, so React never renders text into it; readers get the copy below. */}
    <p className="kt-word" ref={word} aria-hidden="true" />
    <p className="sr-only">{text}</p>
    <div className="kt-panel" data-lg="surface">
      <label className="kt-input"><span>Текст</span>
        <input value={text} maxLength={28} onChange={(event) => setText(event.target.value)} />
      </label>
      <div className="kt-tabs" ref={presetTabs} role="tablist" aria-label="Движение">
        {PRESETS.map((item, index) => <button key={item} type="button" role="tab" aria-selected={preset === index} tabIndex={preset === index ? 0 : -1}>{item}</button>)}
      </div>
      <div className="kt-row">
        <div className="kt-tabs kt-palettes" ref={paletteTabs} role="tablist" aria-label="Палитра">
          {PALETTES.map((item, index) => <button key={item.name} type="button" role="tab" aria-selected={palette === index} tabIndex={palette === index ? 0 : -1}>
            <i style={{ background: item.accent, boxShadow: `0 0 0 3px ${item.bg}, 0 0 0 4px ${item.ink}` }} aria-hidden="true" />{item.name}
          </button>)}
        </div>
        <label className="kt-speed"><span>Темп {speed.toFixed(1)}×</span>
          <input type="range" min="0.4" max="2" step="0.1" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
        </label>
      </div>
    </div>
  </div>;
}
