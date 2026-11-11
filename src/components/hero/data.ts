import { capabilities, featuredProjects, type Project } from "@/content";
import type { HighlightColor } from "@/components/ui";

/**
 * Hero data, all derived from src/content.
 *
 * CYCLE: the four projects the stage window plays (DIRECTION section 3, "01 Hero"). Ids that are
 * not featured projects are dropped, so a content change can never break the stage.
 */
const CYCLE_IDS = ["resumai", "drone-intelligence", "audify-ai", "bookmyvenue"] as const;

export const CYCLE: Project[] = CYCLE_IDS.map((id) => featuredProjects.find((p) => p.id === id)).filter((p): p is Project => !!p);

/**
 * "Things I build:" - the sticky note's four lines. Each one is the short, handwritten name of a
 * real capability row in "What I build" (src/content/capabilities.ts); a line whose capability
 * disappears is dropped. Colours rotate lime, blue, tangerine, lime (DIRECTION "Combination ideas").
 */
const NOTE: { text: string; capability: string; color: HighlightColor }[] = [
  { text: "Web apps", capability: "web-apps", color: "lime" },
  { text: "AI systems", capability: "ai-apps", color: "blue" },
  { text: "APIs & data", capability: "backend-apis", color: "tangerine" },
  { text: "Automation", capability: "automation", color: "lime" },
];

export const NOTE_LINES = NOTE.filter((l) => capabilities.some((c) => c.id === l.capability));

/** The build stages shown as chips under the window, in order. The last one is the stamp. */
export const STAGES = ["idea", "sketch", "ui", "api", "data", "deploy", "shipped"] as const;
export const SHIPPED_STEP = STAGES.length - 1;
