import type { ReactNode, SVGProps } from "react";

/**
 * Authored icon set (Sketch -> Ship). 24px grid, ONE stroke: 1.5px, round caps, round joins,
 * non-scaling (stays 1.5px at any size). Icons inherit currentColor and size from font-size
 * (1em) by default. Decorative by default (aria-hidden): the visible text or the control's
 * aria-label carries the meaning. Never use emoji or unicode glyphs as icons.
 *
 *   <ArrowUpRight />                 // inline, 1em, decorative
 *   <Github size={20} />             // explicit size
 *   <Mail title="Email" />           // standalone, announced
 *
 * Need another icon? Ask the foundation (src/components/icons is foundation-owned).
 */
export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number | string;
  /** Give a standalone icon an accessible name (otherwise it is hidden from assistive tech). */
  title?: string;
};

function Icon({ size = "1em", title, children, strokeWidth = 1.5, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Non-scaling stroke on every shape. */
const n = { vectorEffect: "non-scaling-stroke" as const };

// ---- arrows ---------------------------------------------------------------------------------

export function ArrowUpRight(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M7 17 17 7" {...n} />
      <path d="M9 7h8v8" {...n} />
    </Icon>
  );
}
export function ArrowRight(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4.5 12h15" {...n} />
      <path d="m13.5 6 6 6-6 6" {...n} />
    </Icon>
  );
}
export function ArrowLeft(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M19.5 12h-15" {...n} />
      <path d="m10.5 6-6 6 6 6" {...n} />
    </Icon>
  );
}
export function ArrowDown(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 4.5v15" {...n} />
      <path d="m6 13.5 6 6 6-6" {...n} />
    </Icon>
  );
}
export function ArrowUp(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 19.5v-15" {...n} />
      <path d="m6 10.5 6-6 6 6" {...n} />
    </Icon>
  );
}
export function ChevronDown(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m6 9 6 6 6-6" {...n} />
    </Icon>
  );
}
export function ChevronRight(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m9 6 6 6-6 6" {...n} />
    </Icon>
  );
}
/** Leaves the site (box + arrow). For inline "opens elsewhere" hints, ArrowUpRight is preferred. */
export function External(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M13.5 4.5h6v6" {...n} />
      <path d="m19.5 4.5-8.5 8.5" {...n} />
      <path d="M17.5 13.5V18a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V8A1.5 1.5 0 0 1 6 6.5h4.5" {...n} />
    </Icon>
  );
}

// ---- actions --------------------------------------------------------------------------------

export function Copy(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" {...n} />
      <path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" {...n} />
    </Icon>
  );
}
export function Check(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m5 12.5 4.5 4.5L19 7.5" {...n} />
    </Icon>
  );
}
export function Plus(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 5v14" {...n} />
      <path d="M5 12h14" {...n} />
    </Icon>
  );
}
export function Minus(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M5 12h14" {...n} />
    </Icon>
  );
}
export function Close(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m6 6 12 12" {...n} />
      <path d="M18 6 6 18" {...n} />
    </Icon>
  );
}
/** Two strokes, the lower one shorter (a quick note, not a hamburger). */
export function Menu(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4.5 8.5h15" {...n} />
      <path d="M4.5 15.5h10" {...n} />
    </Icon>
  );
}
export function Pause(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M9 5.5v13" {...n} />
      <path d="M15 5.5v13" {...n} />
    </Icon>
  );
}
export function Play(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M8 5.5v13l10.5-6.5z" {...n} />
    </Icon>
  );
}
export function Replay(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" {...n} />
      <path d="M19.5 4.5v4h-4" {...n} />
    </Icon>
  );
}
export function Download(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 4.5v11" {...n} />
      <path d="m7.5 11 4.5 4.5 4.5-4.5" {...n} />
      <path d="M5 19.5h14" {...n} />
    </Icon>
  );
}
export function Upload(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 15.5v-11" {...n} />
      <path d="M7.5 9 12 4.5 16.5 9" {...n} />
      <path d="M5 19.5h14" {...n} />
    </Icon>
  );
}
export function Send(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M20.5 3.5 10 14" {...n} />
      <path d="m20.5 3.5-6.5 17-4-6.5-6.5-4z" {...n} />
    </Icon>
  );
}
export function Search(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="10.5" cy="10.5" r="6.5" {...n} />
      <path d="m15.5 15.5 5 5" {...n} />
    </Icon>
  );
}
export function LinkIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" {...n} />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" {...n} />
    </Icon>
  );
}
export function Eye(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" {...n} />
      <circle cx="12" cy="12" r="3" {...n} />
    </Icon>
  );
}
/** The sketch layer (pencil). */
export function Pencil(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m4.5 19.5 1-4.5L16 4.5a2.1 2.1 0 0 1 3 3L8.5 18z" {...n} />
      <path d="m14 6.5 3 3" {...n} />
    </Icon>
  );
}

// ---- things ---------------------------------------------------------------------------------

export function Mail(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" {...n} />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" {...n} />
    </Icon>
  );
}
export function Clock(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8.5" {...n} />
      <path d="M12 7.5V12l3 2" {...n} />
    </Icon>
  );
}
export function MapPin(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" {...n} />
      <circle cx="12" cy="10" r="2.3" {...n} />
    </Icon>
  );
}
export function FileText(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z" {...n} />
      <path d="M14 3.5V8h4.5" {...n} />
      <path d="M9 12.5h6" {...n} />
      <path d="M9 16h4" {...n} />
    </Icon>
  );
}
export function Calendar(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" {...n} />
      <path d="M3.5 10h17" {...n} />
      <path d="M8 3v4" {...n} />
      <path d="M16 3v4" {...n} />
    </Icon>
  );
}
export function Mic(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="9" y="3.5" width="6" height="11" rx="3" {...n} />
      <path d="M6 11.5a6 6 0 0 0 12 0" {...n} />
      <path d="M12 17.5v3" {...n} />
    </Icon>
  );
}
export function Chat(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M6.5 4.5h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.5 3.5v-3.5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" {...n} />
    </Icon>
  );
}
export function ImageIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" {...n} />
      <circle cx="9" cy="9.5" r="1.8" {...n} />
      <path d="m20.5 15.5-5-5L5 19.5" {...n} />
    </Icon>
  );
}
export function Database(p: IconProps) {
  return (
    <Icon {...p}>
      <ellipse cx="12" cy="6" rx="7" ry="2.5" {...n} />
      <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" {...n} />
      <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" {...n} />
    </Icon>
  );
}
export function Layers(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 4 3.5 8.5 12 13l8.5-4.5z" {...n} />
      <path d="m3.5 12.5 8.5 4.5 8.5-4.5" {...n} />
      <path d="m3.5 16.5 8.5 4.5 8.5-4.5" {...n} />
    </Icon>
  );
}
/** An app window: a project's interface (the work stage's "Interface" side). */
export function AppWindowIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" {...n} />
      <path d="M3.5 9h17" {...n} />
      <path d="M7.5 13h5M7.5 16h3" {...n} />
    </Icon>
  );
}
/** Three parts wired together: a system / architecture diagram. */
export function Diagram(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="8.5" y="3" width="7" height="5" rx="1.5" {...n} />
      <rect x="3" y="16" width="7" height="5" rx="1.5" {...n} />
      <rect x="14" y="16" width="7" height="5" rx="1.5" {...n} />
      <path d="M12 8v2.5c0 1.4-1 2.3-2.4 2.6L8 13.4c-1.2.3-1.5 1.1-1.5 2.6M12 10.5c0 1.4 1 2.3 2.4 2.6l1.6.3c1.2.3 1.5 1.1 1.5 2.6" {...n} />
    </Icon>
  );
}
export function Terminal(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" {...n} />
      <path d="m7.5 9.5 3 2.5-3 2.5" {...n} />
      <path d="M12.5 15h4" {...n} />
    </Icon>
  );
}
export function Code(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M8.5 7.5 4 12l4.5 4.5" {...n} />
      <path d="m15.5 7.5 4.5 4.5-4.5 4.5" {...n} />
      <path d="m13.5 5.5-3 13" {...n} />
    </Icon>
  );
}
export function Globe(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8.5" {...n} />
      <path d="M3.5 12h17" {...n} />
      <path d="M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5S9.6 5.9 12 3.5z" {...n} />
    </Icon>
  );
}
/** AI / generated (a four-point spark). */
export function Sparkle(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3.5c.6 5.1 3.4 7.9 8.5 8.5-5.1.6-7.9 3.4-8.5 8.5-.6-5.1-3.4-7.9-8.5-8.5 5.1-.6 7.9-3.4 8.5-8.5z" {...n} />
    </Icon>
  );
}
export function Award(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="9" r="5.5" {...n} />
      <path d="M8.6 13.4 7 20.5l5-2.5 5 2.5-1.6-7.1" {...n} />
    </Icon>
  );
}
/** A shipped package. */
export function Package(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m12 3.5 8 4.5v8l-8 4.5L4 16V8z" {...n} />
      <path d="m4 8 8 4.5L20 8" {...n} />
      <path d="M12 12.5v8" {...n} />
    </Icon>
  );
}
export function GitBranch(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="6.5" cy="5.5" r="2" {...n} />
      <circle cx="6.5" cy="18.5" r="2" {...n} />
      <circle cx="17.5" cy="6.5" r="2" {...n} />
      <path d="M6.5 7.5v9" {...n} />
      <path d="M17.5 8.5V10a4 4 0 0 1-4 4h-3a4 4 0 0 0-4 2.5" {...n} />
    </Icon>
  );
}
export function GitCommit(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="3.5" {...n} />
      <path d="M3.5 12h5" {...n} />
      <path d="M15.5 12h5" {...n} />
    </Icon>
  );
}

// ---- brands (outlines, same stroke) ---------------------------------------------------------

export function Github(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M8.5 20.5v-3.2c0-1 .3-1.7.9-2.2-2.9-.4-5.4-1.6-5.4-5.6 0-1.2.4-2.2 1.1-3a3.8 3.8 0 0 1 .1-3s1-.3 3.2 1.2a10.8 10.8 0 0 1 5.6 0c2.2-1.5 3.2-1.2 3.2-1.2.5 1 .5 2 .1 3 .7.8 1.1 1.8 1.1 3 0 4-2.5 5.2-5.4 5.6.6.5.9 1.3.9 2.3v3.1" {...n} />
      <path d="M8.5 18.2c-2.6.8-3.4-.6-4.3-1.9" {...n} />
    </Icon>
  );
}
export function Linkedin(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" {...n} />
      <path d="M8 10.5v6" {...n} />
      <path d="M8 7.6v.01" {...n} />
      <path d="M11.5 16.5v-6" {...n} />
      <path d="M11.5 13.2c0-1.7 1-2.7 2.4-2.7s2.4 1 2.4 2.7v3.3" {...n} />
    </Icon>
  );
}
/** X (formerly Twitter): the heavy stroke as an outline, the light stroke broken around it. */
export function XLogo(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4.5 4.5h4l11 15h-4z" {...n} />
      <path d="m19 4.5-6.2 6.9" {...n} />
      <path d="M11.2 13.1 5 19.5" {...n} />
    </Icon>
  );
}
export function Instagram(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" {...n} />
      <circle cx="12" cy="12" r="3.8" {...n} />
      <path d="M17.2 6.8v.01" {...n} />
    </Icon>
  );
}

/** Map a profile.socials kind to its icon. */
export function SocialIcon({ kind, ...props }: IconProps & { kind: "github" | "linkedin" | "x" | "instagram" | "email" }) {
  switch (kind) {
    case "github":
      return <Github {...props} />;
    case "linkedin":
      return <Linkedin {...props} />;
    case "x":
      return <XLogo {...props} />;
    case "instagram":
      return <Instagram {...props} />;
    default:
      return <Mail {...props} />;
  }
}
