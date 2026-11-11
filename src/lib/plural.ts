/** The Russian noun form for a count: 1 проект, 2 проекта, 5 проектов, 21 проект, 24 проекта. */
export function plural(n: number, one: string, few: string, many: string) {
  const tens = Math.abs(n) % 100, units = tens % 10;
  return tens >= 11 && tens <= 14 ? many : units === 1 ? one : units >= 2 && units <= 4 ? few : many;
}
