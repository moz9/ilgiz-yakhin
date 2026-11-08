export class Spring {
  constructor(value: number, config?: { response?: number; dampingRatio?: number });
  value: number;
  velocity: number;
  target: number;
  configure(config: { response?: number; dampingRatio?: number }): Spring;
  set(value: number): void;
}
export function springDriver(render: () => void): { add(...springs: Spring[]): void; kick(): void; stop(): void };
export function setTier(tier: number): void;
export function getTier(): number;
export function detectTier(): number;
export function prefersReducedMotion(): boolean;
export function isChromium(): boolean;
export const MOTION: Record<string, { response: number; dampingRatio: number }>;
