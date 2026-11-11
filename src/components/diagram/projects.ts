import type { Project } from "@/content";
import { journeys } from "@/content/journeys";
import { buildSpec, type DiagramSpec, type PacketKind } from "./spec";

/**
 * A project's architecture as a living diagram: its `architecture` layers become lanes, its
 * `flow` becomes the journey a packet takes.
 *
 * The content lists the layers and the flow but not WHERE each flow step happens, so ROUTES maps
 * every step to the node it happens at (and the nodes it passes through). Each route restates
 * the project's own `approach` / `highlights` / `summary` in src/content/projects.ts (quoted in
 * the comments); `links` are relationships those texts state (drawn dashed, no packets).
 * Nothing here adds a fact: labels and step texts are read from the content at runtime, and a
 * route that no longer matches the content (a renamed item, a changed flow) is dropped, so the
 * diagram falls back to the layers alone rather than draw a wrong journey.
 *
 * Kinds: request (lime) going in, data (blue) between services, response (tangerine) coming back.
 */

type Route = {
  steps: readonly { at: string; via?: readonly string[]; kind: PacketKind }[];
  links?: readonly (readonly [string, string])[];
};

const ROUTES: Record<string, Route> = {
  // approach: "the question is embedded locally, ChromaDB returns the five closest chunks, and
  // Gemini 2.0 Flash answers from them with sources. If Gemini fails or runs out of quota, the
  // answer is extracted from the retrieved context instead." highlights: "...exposed as FastAPI
  // REST endpoints", "A live KPI dashboard on a WebSocket", "an MCP server for Claude Desktop".
  "drone-intelligence": {
    steps: [
      { at: "React 19 dashboard", kind: "request" }, // Question
      { at: "MiniLM-L6-v2", via: ["FastAPI"], kind: "request" }, // Embed the query
      { at: "ChromaDB", kind: "data" }, // Retrieve top 5
      { at: "Gemini 2.0 Flash", kind: "data" }, // Gemini answers
      { at: "React 19 dashboard", via: ["FastAPI"], kind: "response" }, // Answer with sources
    ],
    links: [
      ["Claude Desktop", "MCP server"],
      ["WebSocket manager", "React 19 dashboard"],
      ["Gemini 2.0 Flash", "Context fallback"],
    ],
  },
  // approach: "A convolutional neural network trained on 12,000+ MRI images ... served by a Flask
  // web application with an upload page." flow: Upload scan, Preprocess and resize, CNN analyses,
  // Prediction shown.
  "brain-tumor-detection": {
    steps: [
      { at: "Upload page", kind: "request" }, // Upload scan
      { at: "Preprocess and resize", via: ["Flask app"], kind: "request" }, // Preprocess and resize
      { at: "CNN", kind: "data" }, // CNN analyses
      { at: "Upload page", via: ["Flask app"], kind: "response" }, // Prediction shown
    ],
    links: [["CNN", "12,000+ MRI images"]],
  },
  // approach: "A Next.js 14 studio talks to separate FastAPI routers for auth, résumés and AI,
  // behind JWT authentication, with PostgreSQL holding the data. The diagnostic engine checks the
  // résumé against the target job description ...; the OpenAI API then generates the résumé,
  // cover letter and recruiter pitch together, previewed live on A4 and exported as a printable
  // vector PDF."
  resumai: {
    steps: [
      { at: "Next.js 14 app", kind: "request" }, // Job description
      { at: "ATS diagnostics", via: ["FastAPI"], kind: "request" }, // Diagnose gaps
      { at: "OpenAI API", kind: "data" }, // Tailor documents
      { at: "Vector PDF export", via: ["FastAPI", "Split-screen A4 studio"], kind: "response" }, // Export PDF
    ],
    links: [
      ["FastAPI", "JWT auth"],
      ["FastAPI", "PostgreSQL"],
    ],
  },
  // approach: "The React Native app runs the pipeline: it finds recordings through MediaStore ...,
  // matches each one to its call-log entry ..., backs the audio up to an organised Google Drive
  // folder ..., transcribes it with speaker diarization through the provider picked in Settings,
  // and writes the call summary to Google Sheets." highlights: "...behind an HTTPS Express backend
  // (Let's Encrypt)."
  "audify-ai": {
    steps: [
      { at: "Audio scanner", via: ["React Native app"], kind: "request" }, // Discover recording
      { at: "Call log resolver", kind: "request" }, // Match call log
      { at: "Google Drive", kind: "data" }, // Back up to Drive
      { at: "Speech-to-text provider", kind: "data" }, // Transcribe
      { at: "Google Sheets CRM", kind: "response" }, // Sync to Sheets
    ],
    links: [
      ["React Native app", "Express backend"],
      ["Express backend", "Let's Encrypt (Greenlock)"],
    ],
  },
  // approach: "the Express API recomputes prices, checks capacity and dates, and rechecks the date
  // at the moment of payment ... The advance ... goes through a simulated, HMAC-signed payment
  // that the server verifies." highlights: "JWT authentication with bcrypt password hashing",
  // "deployed automatically with GitHub Actions"; live on GitHub Pages.
  bookmyvenue: {
    steps: [
      { at: "React 18 + Vite", kind: "request" }, // Browse venues
      { at: "JSON database", via: ["Express API"], kind: "request" }, // Check dates
      { at: "Demo payment", via: ["Express API"], kind: "data" }, // Pay advance
      { at: "React 18 + Vite", via: ["Express API"], kind: "response" }, // Get ticket
    ],
    links: [
      ["Express API", "JWT + bcrypt"],
      ["GitHub Actions", "GitHub Pages"],
    ],
  },
  // approach: "A custom MCP server queries LinkedIn jobs, scrapes their details and extracts the
  // requirements. Each description is parsed, scored for skill overlap and checked against hard
  // eligibility rules; a targeted LaTeX résumé is generated and compiled via Overleaf or pdflatex;
  // then Playwright maps the form's questions, attaches the résumé ..." highlights: "...full audit
  // logs in Google Sheets."
  "mcp-job-agent": {
    steps: [
      { at: "Custom MCP server", via: ["MCP client"], kind: "request" }, // Discover job
      { at: "JD parsing and gate", kind: "data" }, // Parse and gate
      { at: "Résumé tailoring", kind: "data" }, // Tailor résumé
      { at: "Playwright forms", via: ["Overleaf / pdflatex"], kind: "data" }, // Fill the form
      { at: "Google Sheets", kind: "response" }, // Audit log
    ],
  },
};

const cache = new Map<string, DiagramSpec>();

/**
 * The project's diagram spec (cached). Always returns the layers; the journey (steps + route
 * edges) only when its route matches the content's architecture and flow.
 */
export function projectDiagram(project: Project): DiagramSpec {
  const hit = cache.get(project.id);
  if (hit) return hit;
  const lanes = project.architecture.map((l) => ({ layer: l.layer, items: l.items, note: l.note }));
  const flow = project.flow ?? [];
  const route = ROUTES[project.id];
  const journey = journeys[project.id];
  const notes = journey && journey.length === flow.length ? journey.map((j) => j.note) : undefined;
  let spec: DiagramSpec | null = null;
  if (route && route.steps.length === flow.length) {
    spec = buildSpec({
      id: project.id,
      name: project.shortTitle,
      lanes,
      // The case study's request journey says what happens at each step in his words: the same
      // handwritten notes, so the two diagrams tell one story (only when it matches the flow).
      steps: route.steps.map((s, i) => ({ ...s, text: flow[i], note: notes?.[i] })),
      links: route.links,
    });
    if (!spec && process.env.NODE_ENV !== "production") {
      console.info(`[diagram] the route for "${project.id}" no longer matches its architecture; showing the layers only.`);
    }
  }
  spec ??= buildSpec({ id: project.id, name: project.shortTitle, lanes }) as DiagramSpec;
  cache.set(project.id, spec);
  return spec;
}

/** True when the project has layers to draw. */
export function hasArchitecture(project: Project): boolean {
  return project.architecture.some((l) => l.items.length > 0);
}
