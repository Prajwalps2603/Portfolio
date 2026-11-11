const TONE = { tangerine: "bg-tangerine", lime: "bg-lime", blue: "bg-blue" } as const;

type LiveDotProps = {
  /** tangerine = live / now (default) · lime = building · blue = in progress. */
  tone?: keyof typeof TONE;
  /** A ring that pulses three times after load, then rests (off with reduced motion). */
  pulse?: boolean;
  /** Diameter in px. Default 8. */
  size?: number;
  className?: string;
};

/**
 * The status dot ("live", "now", "current"). Decorative: always pair it with text that says the
 * same thing ("Now: Full Stack Developer at ...").
 */
export function LiveDot({ tone = "tangerine", pulse = false, size = 8, className }: LiveDotProps) {
  return (
    <span aria-hidden="true" className={`relative inline-flex shrink-0${className ? ` ${className}` : ""}`} style={{ width: size, height: size }}>
      {pulse ? <span className={`absolute inset-0 rounded-full ${TONE[tone]} animate-live`} /> : null}
      <span className={`relative size-full rounded-full ${TONE[tone]}`} />
    </span>
  );
}
