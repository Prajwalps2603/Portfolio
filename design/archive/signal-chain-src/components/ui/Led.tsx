type LedProps = {
  /** on: steady. off: hollow. blink: 2Hz (AUTO / searching); stops with reduced motion. */
  state?: "on" | "off" | "blink";
  /** CSS colour (default currentColor). Use bone for "you"/status, a channel colour for a layer. */
  color?: string;
  size?: number;
  className?: string;
};

/** Status LED: the RUN light on the current role, the TRIG'D dot, menu "you are here". Decorative. */
export function Led({ state = "on", color = "currentColor", size = 7, className }: LedProps) {
  return (
    <i
      aria-hidden="true"
      className={`inline-block flex-none rounded-full ${state === "blink" ? "animate-blink reduced:animate-none motion-reduce:animate-none" : ""} ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background: state === "off" ? "transparent" : color,
        boxShadow: state === "off" ? `inset 0 0 0 1px ${color}` : undefined,
      }}
    />
  );
}
