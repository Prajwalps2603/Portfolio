/** The first focusable element on every page: jumps keyboard focus past the header into <main>. */
export function SkipLink() {
  return (
    <a
      href="#main"
      data-skip=""
      data-sketch-skip=""
      className="type-ui fixed top-3 left-3 z-(--z-skip) -translate-y-[160%] rounded-pill bg-ink px-5 py-3 font-semibold text-paper shadow-lift transition-transform duration-(--dur-ui) ease-arrive focus-visible:translate-y-0"
    >
      Skip to content
    </a>
  );
}
