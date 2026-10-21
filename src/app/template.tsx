/**
 * Wraps every page so a navigation reads as a move, not a jump.
 * The template remounts on each route change, which is exactly the moment the motion belongs to.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
