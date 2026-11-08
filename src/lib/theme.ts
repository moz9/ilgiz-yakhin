/**
 * Site theme: dark by default (the cinema), light on request, or following the system.
 * The inline script in the layout applies the saved choice before the first paint, so
 * these helpers only change it later. `data-theme` is always explicit on <html>, which is
 * also what the Liquid Glass kit reads for its dark material.
 */
export type ThemePref = "dark" | "light" | "system";
export const THEME_KEY = "portfolio-theme";
export const THEME_EVENT = "portfolio-theme";
const colors = { dark: "#06070b", light: "#eef1f6" } as const;

export const themeScript = `(function(){var d=document.documentElement,p='dark';try{var s=localStorage.getItem('${THEME_KEY}');if(s==='light'||s==='dark'||s==='system')p=s}catch(e){}var t=p==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;d.dataset.theme=t;d.dataset.themePref=p;d.style.colorScheme=t})()`;

export function readThemePref(): ThemePref {
  const pref = document.documentElement.dataset.themePref;
  return pref === "light" || pref === "system" ? pref : "dark";
}

export function resolveTheme(pref: ThemePref): "dark" | "light" {
  if (pref !== "system") return pref;
  return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(pref: ThemePref, persist = true) {
  const root = document.documentElement;
  const theme = resolveTheme(pref);
  root.dataset.theme = theme;
  root.dataset.themePref = pref;
  root.style.colorScheme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", colors[theme]));
  if (persist) { try { localStorage.setItem(THEME_KEY, pref); } catch { /* storage may be blocked */ } }
  dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

/** Keeps a "system" choice in step with the OS while the page is open. */
export function watchSystemTheme() {
  const query = matchMedia("(prefers-color-scheme: light)");
  const onChange = () => { if (readThemePref() === "system") applyTheme("system", false); };
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
