"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("portfolio-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextDark = stored ? stored === "dark" : prefersDark;
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    const frame = window.requestAnimationFrame(() => setDark(nextDark));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("portfolio-theme", next ? "dark" : "light");
  };

  return (
    <button className="icon-button" type="button" onClick={toggle} aria-label={dark ? "Включить светлую тему" : "Включить темную тему"} title={dark ? "Светлая тема" : "Темная тема"}>
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  );
}
