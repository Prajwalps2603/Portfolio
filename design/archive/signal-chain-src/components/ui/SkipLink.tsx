/** First focusable element on every page. Jumps keyboard focus past the top bar into <main>. */
export function SkipLink() {
  return (
    <a
      href="#main"
      data-skip=""
      className="type-button fixed top-3 left-3 z-(--z-skip) -translate-y-[200%] bg-bone px-4 py-3 text-ink transition-transform duration-200 ease-panel focus-visible:translate-y-0 focus-visible:outline-ink"
    >
      Skip to content
    </a>
  );
}
