import type { ReactNode, SVGProps } from "react";

/**
 * Signal Chain icon set. Authored on a 24px grid, drawn with ONE stroke: 1.5px, square caps,
 * miter joins, non-scaling (so it stays 1.5px at any size, like a scope trace).
 * Icons inherit currentColor and size from font-size by default (1em), so they sit on the
 * baseline of the mono label they accompany. Decorative by default (aria-hidden): the visible
 * text or an aria-label on the control carries the meaning.
 *
 *   <ArrowUpRight />                 // inline, 1em
 *   <Github size={20} />             // explicit size
 *   <Mail title="Email" />           // standalone, announced
 */
export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number | string;
  /** Give a standalone icon an accessible name (otherwise it is hidden from assistive tech). */
  title?: string;
};

function Icon({ size = "1em", title, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      focusable="false"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <g vectorEffect="non-scaling-stroke">{children}</g>
    </svg>
  );
}

const nss = { vectorEffect: "non-scaling-stroke" as const };

export function ArrowRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12h15" {...nss} />
      <path d="M13.5 6.5 19 12l-5.5 5.5" {...nss} />
    </Icon>
  );
}

export function ArrowLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 12H5" {...nss} />
      <path d="M10.5 6.5 5 12l5.5 5.5" {...nss} />
    </Icon>
  );
}

export function ArrowDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4v15" {...nss} />
      <path d="M6.5 13.5 12 19l5.5-5.5" {...nss} />
    </Icon>
  );
}

export function ArrowUp(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20V5" {...nss} />
      <path d="M6.5 10.5 12 5l5.5 5.5" {...nss} />
    </Icon>
  );
}

/** External link (opens in a new tab). */
export function ArrowUpRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 17.5 17 7" {...nss} />
      <path d="M8.5 6.5H17.5V15.5" {...nss} />
    </Icon>
  );
}

export function Copy(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.5 8.5h11v11h-11z" {...nss} />
      <path d="M15.5 8.5V4.5h-11v11h4" {...nss} />
    </Icon>
  );
}

export function Check(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12.5 9.5 17.5 19.5 6.5" {...nss} />
    </Icon>
  );
}

export function Mail(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 5.5h17v13h-17z" {...nss} />
      <path d="m3.5 6.5 8.5 7 8.5-7" {...nss} />
    </Icon>
  );
}

/** GitHub: the cat head and tail, drawn as a single-stroke outline. */
export function Github(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.5 20.5v-3.2c0-1 .3-1.7.9-2.2-2.9-.4-5.4-1.6-5.4-5.6 0-1.2.4-2.2 1.1-3a3.8 3.8 0 0 1 .1-3s1-.3 3.2 1.2a10.8 10.8 0 0 1 5.6 0c2.2-1.5 3.2-1.2 3.2-1.2.5 1 .5 2 .1 3 .7.8 1.1 1.8 1.1 3 0 4-2.5 5.2-5.4 5.6.6.5.9 1.3.9 2.3v3.1" {...nss} />
      <path d="M8.5 18.2c-2.6.8-3.4-.6-4.3-1.9" {...nss} />
    </Icon>
  );
}

export function Linkedin(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 3.5h17v17h-17z" {...nss} />
      <path d="M8 10.5v6" {...nss} />
      <path d="M8 7.3v.2" {...nss} />
      <path d="M11.5 16.5v-6" {...nss} />
      <path d="M11.5 13.2c0-1.8 1.1-2.7 2.5-2.7s2.5.9 2.5 2.7v3.3" {...nss} />
    </Icon>
  );
}

/** X (formerly Twitter): the heavy stroke as an outline, the light stroke broken around it. */
export function XLogo(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 4h4.6l11.4 16h-4.6z" {...nss} />
      <path d="M19.5 4l-6.4 7.2" {...nss} />
      <path d="M10.9 12.8 4.5 20" {...nss} />
    </Icon>
  );
}

export function Instagram(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" {...nss} />
      <circle cx="12" cy="12" r="3.8" {...nss} />
      <path d="M17.2 6.8v.1" {...nss} />
    </Icon>
  );
}

/** Menu: two graticule lines. */
export function Menu(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9h16" {...nss} />
      <path d="M4 15h16" {...nss} />
    </Icon>
  );
}

export function Close(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12" {...nss} />
      <path d="M18 6 6 18" {...nss} />
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
