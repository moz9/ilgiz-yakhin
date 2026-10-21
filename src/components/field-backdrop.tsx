/**
 * The decorative layer behind a page: light, depth and texture instead of a flat fill.
 * Purely presentational — it never intercepts the pointer and never carries text.
 */
export function FieldBackdrop({ tone = "ink" }: { tone?: "ink" | "teal" | "violet" }) {
  return (
    <div className={`field-backdrop field-tone-${tone}`} aria-hidden="true">
      <span className="field-aurora field-aurora-a" />
      <span className="field-aurora field-aurora-b" />
      <span className="field-aurora field-aurora-c" />
      <span className="field-lattice" />
      <span className="field-beam" />
    </div>
  );
}
