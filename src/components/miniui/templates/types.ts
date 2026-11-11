import type { Project } from "@/content";

export type MiniUISize = "sm" | "md" | "lg";

export type TemplateProps = {
  /** The project (from src/content). Undefined only if the id is unknown: templates degrade gracefully. */
  p: Project | undefined;
  size: MiniUISize;
};
