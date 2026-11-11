import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile, site } from "@/content";
import { OG_SIZE } from "@/lib/og";
import {
  roughArrow,
  roughCircle,
  roughLine,
  roughRect,
  scribble,
} from "@/components/sketch/rough";

/**
 * The site's own lettering for the card: Bricolage Grotesque 800 (opsz 96, the display cut) and
 * Inter 600, Latin subsets from the Google Fonts CSS2 API (OFL), read at build time. The image
 * renderer needs TTF/OTF; the page's next/font files are woff2.
 */
function cardFonts() {
  const dir = join(process.cwd(), "src", "fonts", "og");
  return [
    {
      name: "Bricolage",
      data: readFileSync(join(dir, "bricolage-grotesque-800.ttf")),
      weight: 800 as const,
      style: "normal" as const,
    },
    {
      name: "Inter",
      data: readFileSync(join(dir, "inter-600.ttf")),
      weight: 600 as const,
      style: "normal" as const,
    },
  ];
}

const W = 1200;
const H = 630;
const C = {
  paper: "#F4F4EF",
  paper2: "#EAEAE3",
  card: "#FBFBF8",
  ink: "#0D0D0C",
  graphite: "#55554F",
  pencil: "#8A8A82",
  line: "#DDDDD5",
  lime: "#C8F53B",
  blue: "#3D5AFE",
  blueSoft: "#DDE3FF",
  tangerine: "#FF6A2B",
  tangerineSoft: "#FFE1D3",
};

/** A highlighted run of words (a flat highlighter block behind ink text). */
function Mark({ children, color }: { children: string; color: string }) {
  return (
    <span
      style={{
        display: "flex",
        backgroundColor: color,
        padding: "0 10px",
        margin: "0 -2px",
      }}
    >
      {children}
    </span>
  );
}

/** The motif: a pencil sketch of a window -> the crisp shipped window + a lime check (it is live). */
function Motif() {
  const s = {
    fill: "none",
    stroke: C.pencil,
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <div
      style={{
        position: "absolute",
        left: 742,
        top: 236,
        width: 420,
        height: 340,
        display: "flex",
      }}
    >
      {/* the idea */}
      <svg
        width={420}
        height={340}
        viewBox="0 0 420 340"
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <path
          d={roughRect(8, 14, 236, 168, { seed: "og-sketch", radius: 14 })}
          {...s}
        />
        <path
          d={roughLine([8, 48], [244, 48], { seed: "og-bar", passes: 1 })}
          {...s}
        />
        <path d={roughCircle(28, 31, 5, { seed: "og-d1", passes: 1 })} {...s} />
        <path d={roughCircle(46, 31, 5, { seed: "og-d2", passes: 1 })} {...s} />
        <path d={roughCircle(64, 31, 5, { seed: "og-d3", passes: 1 })} {...s} />
        <path
          d={roughRect(28, 66, 118, 22, {
            seed: "og-b1",
            radius: 6,
            passes: 1,
          })}
          {...s}
        />
        <path d={scribble(30, 104, 150, 50, { seed: "og-scrib" })} {...s} />
        <path
          d={roughArrow([44, 204], [124, 270], {
            seed: "og-arrow",
            bend: 0.32,
            head: 13,
          })}
          {...s}
          stroke={C.ink}
          strokeWidth={2.6}
        />
      </svg>
      {/* the shipped UI */}
      <div
        style={{
          position: "absolute",
          left: 138,
          top: 118,
          width: 270,
          height: 196,
          display: "flex",
          flexDirection: "column",
          backgroundColor: C.card,
          border: `1.5px solid ${C.line}`,
          borderRadius: 18,
          boxShadow: "0 26px 50px -24px rgba(13,13,12,0.38)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 38,
            padding: "0 14px",
            borderBottom: `1.5px solid ${C.line}`,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 9,
              height: 9,
              borderRadius: 9,
              backgroundColor: C.lime,
              marginRight: 6,
            }}
          />
          <div
            style={{
              display: "flex",
              width: 9,
              height: 9,
              borderRadius: 9,
              backgroundColor: C.blue,
              marginRight: 6,
            }}
          />
          <div
            style={{
              display: "flex",
              width: 9,
              height: 9,
              borderRadius: 9,
              backgroundColor: C.tangerine,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "18px 18px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 132,
              height: 22,
              borderRadius: 7,
              backgroundColor: C.ink,
            }}
          />
          <div
            style={{
              display: "flex",
              width: 196,
              height: 9,
              borderRadius: 9,
              backgroundColor: C.line,
              marginTop: 16,
            }}
          />
          <div
            style={{
              display: "flex",
              width: 160,
              height: 9,
              borderRadius: 9,
              backgroundColor: C.line,
              marginTop: 9,
            }}
          />
          <div style={{ display: "flex", marginTop: 16 }}>
            <div
              style={{
                display: "flex",
                width: 64,
                height: 42,
                borderRadius: 10,
                backgroundColor: C.paper2,
                marginRight: 10,
              }}
            />
            <div
              style={{
                display: "flex",
                width: 64,
                height: 42,
                borderRadius: 10,
                backgroundColor: C.paper2,
                marginRight: 10,
              }}
            />
            <div
              style={{
                display: "flex",
                width: 64,
                height: 42,
                borderRadius: 10,
                backgroundColor: C.lime,
              }}
            />
          </div>
        </div>
      </div>
      {/* live: a lime check (the SHIPPED stamp lives on the port's ship only, his ask 2026-11-10) */}
      <div
        style={{
          position: "absolute",
          left: 370,
          top: 272,
          width: 62,
          height: 62,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 62,
          backgroundColor: C.lime,
          border: `2.5px solid ${C.ink}`,
          boxShadow: "0 16px 28px -18px rgba(13,13,12,0.5)",
        }}
      >
        <svg width={30} height={30} viewBox="0 0 24 24">
          <path
            d="M4.5 12.8 9.6 17.6 19.5 6.6"
            fill="none"
            stroke={C.ink}
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

/** The 1200x630 social card: paper + dots, the name, the role, three highlighters, the motif. Static at build. */
export function ogCard() {
  const domain = site.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return new ImageResponse(
    <div
      style={{
        width: W,
        height: H,
        display: "flex",
        position: "relative",
        backgroundColor: C.paper,
        color: C.ink,
      }}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <defs>
          <pattern
            id="dots"
            width="18"
            height="18"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="9" cy="9" r="1.2" fill="rgba(138,138,130,0.42)" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#dots)" />
      </svg>

      <div
        style={{
          position: "absolute",
          left: 72,
          top: 70,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Bricolage",
            fontWeight: 800,
            fontSize: 132,
            lineHeight: 0.9,
            letterSpacing: -5,
          }}
        >
          {profile.name.toUpperCase()}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 34,
            fontFamily: "Bricolage",
            fontWeight: 800,
            fontSize: 58,
            letterSpacing: -1.8,
          }}
        >
          <Mark color={C.lime}>Full Stack</Mark>
          <span style={{ display: "flex", marginLeft: 16 }}>Developer</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 34,
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 30,
            letterSpacing: -0.4,
            color: C.ink,
          }}
        >
          <span style={{ display: "flex", marginRight: 10 }}>I turn</span>
          <Mark color={C.blueSoft}>ideas</Mark>
          <span style={{ display: "flex", margin: "0 10px" }}>into</span>
          <Mark color={C.tangerineSoft}>working software</Mark>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          bottom: 58,
          display: "flex",
          alignItems: "center",
          fontFamily: "Inter",
          fontWeight: 600,
          fontSize: 24,
          color: C.graphite,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 12,
            height: 12,
            borderRadius: 12,
            backgroundColor: C.tangerine,
            marginRight: 14,
          }}
        />
        {domain}
      </div>

      <Motif />
    </div>,
    { ...OG_SIZE, fonts: cardFonts() },
  );
}
