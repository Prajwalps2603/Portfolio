export * from "./types";
export { profile } from "./profile";
export { experience } from "./experience";
export { projects, featuredProjects, archiveProjects } from "./projects";
export { skillGroups, practices } from "./skills";
export { education, certifications } from "./education";
export { capabilities } from "./capabilities";
export type { Capability } from "./capabilities";

export const site = {
  /** Deployment origin (metadataBase). Paths add the base path themselves. */
  origin: "https://prajwalps2603.github.io",
  url: "https://prajwalps2603.github.io/Portfolio/",
  title: "Prajwal M P — Full Stack Developer",
  description:
    "Prajwal M P is a Full Stack Developer in Bengaluru building complete systems end-to-end — React and Next.js interfaces, Spring Boot, Node and FastAPI services, data, AI and deployment.",
  keywords: [
    "Prajwal M P",
    "Full Stack Developer",
    "Bengaluru",
    "React",
    "Next.js",
    "Spring Boot",
    "Java",
    "FastAPI",
    "RAG",
    "AI developer",
  ],
} as const;
