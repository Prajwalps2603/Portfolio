/** The engraved ruler that marks the top edge of every bone sheet (8px minor, 80px major ticks). */
export function Ruler({ className }: { className?: string }) {
  return <div aria-hidden="true" className={`ruler ${className ?? ""}`} />;
}
