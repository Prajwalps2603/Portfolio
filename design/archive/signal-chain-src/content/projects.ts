import type { Project } from "./types";

/**
 * Projects, ordered by showcase priority.
 * `featured` projects get full case-study treatment; the rest appear in the archive index.
 *
 * Provenance (fact-checked 2026-11-06 against each public README, fetched with
 * `curl -H "Accept: application/vnd.github.raw" https://api.github.com/repos/Prajwalps2603/<repo>/readme`):
 * - `year` is the year the GitHub repository was created (API `created_at`), not a build date. Re-checked
 *   2026-11-06 for every repository below with `curl https://api.github.com/repos/Prajwalps2603/<repo>`
 *   (all 15 matched again on 2026-11-06). Shown only next to the category in the Also built index;
 *   the datasheets do not print it, since a creation date is not a build or ship date.
 * - Stacks, versions, counts and internals of the six featured projects are stated by their READMEs.
 *   Anything a README does not state was dropped (e.g. ResumAI's "98%+ ATS pass rate" marketing line,
 *   the Brain Tumor project's React/OpenCV/NumPy, the "Claude" client on the MCP agent).
 * - Next.js versions are per README: ResumAI 14, MarkVault 16 (create-next-app 16.1.6).
 * Links verified 2026-11-05.
 */
export const projects: Project[] = [
  {
    id: "drone-intelligence",
    title: "Drone Intelligence System",
    shortTitle: "Drone Intelligence",
    year: "2026",
    category: "AI platform · Full stack",
    featured: true,
    tagline: "A RAG-powered knowledge hub for India's drone ecosystem.",
    summary:
      "A full-stack AI platform for Indian drone regulations, analytics and operational insight — ask questions of DGCA rules in plain language, check flight compliance, and model flight time and ROI.",
    approach:
      "A retrieval-augmented generation pipeline: the question is embedded locally, ChromaDB returns the five closest chunks, and Gemini 2.0 Flash answers from them with sources. If Gemini fails or runs out of quota, the answer is extracted from the retrieved context instead.",
    highlights: [
      "RAG chatbot built on Google Gemini, ChromaDB and Sentence Transformers, answering with source citations.",
      "Document upload and vector-indexing pipeline so users can add their own knowledge sources.",
      "Drone compliance checker, flight-time calculator and ROI calculator exposed as FastAPI REST endpoints.",
      "A live KPI dashboard on a WebSocket (simulated mission data), Docker Compose with Nginx, and an MCP server for Claude Desktop.",
    ],
    metrics: [],
    stack: ["React 19", "FastAPI", "Python", "ChromaDB", "Gemini 2.0 Flash", "Sentence Transformers", "WebSockets", "MCP", "Docker", "Nginx"],
    architecture: [
      { layer: "Interface", items: ["React 19 dashboard", "Claude Desktop"] },
      { layer: "API", items: ["FastAPI", "WebSocket manager", "MCP server"] },
      { layer: "Intelligence", items: ["MiniLM-L6-v2", "Gemini 2.0 Flash", "Context fallback"] },
      { layer: "Data", items: ["ChromaDB", "CSV datasets"] },
      { layer: "Infrastructure", items: ["Docker Compose", "Nginx"] },
    ],
    flow: ["Question", "Embed the query", "Retrieve top 5", "Gemini answers", "Answer with sources"],
    links: { repo: "https://github.com/Prajwalps2603/Drone-Intelligence-System" },
  },
  {
    id: "brain-tumor-detection",
    title: "Human Brain Tumor Detection",
    shortTitle: "Brain Tumor Detection",
    year: "2025",
    category: "Deep learning · Web",
    featured: true,
    tagline: "A CNN that reads MRI scans — first place, final-year project.",
    summary:
      "A deep-learning system that classifies brain MRI scans as tumour or non-tumour, served through a web app where a user uploads a scan and gets a real-time prediction.",
    approach:
      "A convolutional neural network trained on 12,000+ MRI images, using data preprocessing, image augmentation and hyperparameter tuning, and served by a Flask web application with an upload page.",
    highlights: [
      "Convolutional Neural Network trained on 12,000+ MRI images, reaching ~97% accuracy.",
      "Data preprocessing, image augmentation and hyperparameter tuning.",
      "Flask web application: upload an MRI scan and see the result on the page.",
      "End-to-end deployment of the model behind a web interface.",
    ],
    metrics: [
      { value: "97%", label: "prediction accuracy" },
      { value: "12,000+", label: "MRI images" },
    ],
    award: "1st Place — BE Final Year Project, KVGCE 2025",
    stack: ["Python", "TensorFlow", "Keras", "Flask", "HTML", "CSS", "JavaScript"],
    architecture: [
      { layer: "Interface", items: ["Upload page"] },
      { layer: "API", items: ["Flask app"] },
      { layer: "Intelligence", items: ["Preprocess and resize", "CNN"] },
      { layer: "Data", items: ["12,000+ MRI images"] },
    ],
    flow: ["Upload scan", "Preprocess and resize", "CNN analyses", "Prediction shown"],
    links: { repo: "https://github.com/Prajwalps2603/Human_Brain_Tumor_Detection" },
  },
  {
    id: "resumai",
    title: "ResumAI: AI Resume Builder",
    shortTitle: "ResumAI",
    year: "2026",
    category: "AI product · Full stack",
    featured: true,
    tagline: "Resume intelligence that reverse-engineers the job description.",
    summary:
      "An AI resume studio that analyses job descriptions, diagnoses ATS issues and generates a tailored résumé, cover letter and recruiter pitch together — with a live split-screen A4 editor.",
    highlights: [
      "ATS diagnostic engine that detects keyword gaps and formatting flaws against a target job description.",
      "Live split-screen studio with real-time A4 preview and six curated ATS-safe templates.",
      "Generates synchronized résumé, cover letter and recruiter outreach from one profile.",
      "\"6-second glance\" heatmap simulating what recruiters notice first; printable vector PDF export.",
    ],
    metrics: [{ value: "6", label: "ATS-safe templates" }],
    // README tech-stack line: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion;
    // FastAPI, Python, PostgreSQL, JWT, OpenAI API.
    stack: ["Next.js 14", "React 18", "TypeScript", "Tailwind CSS", "Framer Motion", "FastAPI", "PostgreSQL", "JWT", "OpenAI API"],
    architecture: [
      { layer: "Interface", items: ["Next.js 14 app", "Split-screen A4 studio"] },
      { layer: "API", items: ["FastAPI", "JWT auth"] },
      { layer: "Intelligence", items: ["OpenAI API", "ATS diagnostics"] },
      { layer: "Data", items: ["PostgreSQL"] },
      { layer: "Infrastructure", items: ["Vector PDF export"] },
    ],
    flow: ["Job description", "Diagnose gaps", "Tailor documents", "Export PDF"],
    links: { repo: "https://github.com/Prajwalps2603/AI-Resume-Builder" },
  },
  {
    id: "audify-ai",
    title: "Audify AI",
    shortTitle: "Audify AI",
    year: "2026",
    category: "Mobile · Voice AI",
    featured: true,
    tagline: "Record, transcribe, organise — call intelligence for telecallers.",
    summary:
      "An Android app for telecallers that discovers call recordings, matches them to call logs, backs them up to Google Drive, transcribes them with speaker diarization and syncs summaries into Google Sheets.",
    highlights: [
      "Discovers recordings on-device and matches them to call metadata with fuzzy time-window matching.",
      "Pluggable speech-to-text: Google Cloud STT v2, OpenAI Whisper, Deepgram Nova-2 and AssemblyAI, with diarization.",
      "Backs up audio to Google Drive and syncs structured call summaries to Google Sheets.",
      "A four-stage pipeline with a retry queue and exponential backoff, behind an HTTPS Express backend (Let's Encrypt).",
    ],
    metrics: [{ value: "4", label: "speech-to-text providers" }],
    stack: ["React Native", "TypeScript", "Node.js", "Express", "Google Drive API", "Google Sheets API", "OAuth 2.0", "Speech-to-Text"],
    architecture: [
      { layer: "Interface", items: ["React Native app", "Audio scanner", "Call log resolver"] },
      { layer: "API", items: ["Express backend"] },
      { layer: "Intelligence", items: ["Speech-to-text provider"] },
      { layer: "Data", items: ["Google Drive", "Google Sheets CRM"] },
      { layer: "Infrastructure", items: ["Let's Encrypt (Greenlock)"] },
    ],
    flow: ["Discover recording", "Match call log", "Back up to Drive", "Transcribe", "Sync to Sheets"],
    links: { repo: "https://github.com/Prajwalps2603/Audify-AI" },
  },
  {
    id: "bookmyvenue",
    title: "BookMyVenue",
    shortTitle: "BookMyVenue",
    year: "2026",
    category: "Full stack · Live",
    featured: true,
    tagline: "Find it. Lock the date. Celebrate.",
    summary:
      "A full-stack venue booking platform for weddings, parties and corporate events — browse venues, see free dates, pay an advance and get a ticket, with the server guaranteeing no two people can book the same day.",
    highlights: [
      "Server-side guarantee against double-booking a venue date.",
      "JWT authentication with bcrypt password hashing.",
      "Live demo runs a mini API in the browser so every feature works on static hosting.",
      "20 passing tests; deployed automatically with GitHub Actions.",
    ],
    metrics: [{ value: "20", label: "passing tests" }],
    stack: ["React 18", "Vite", "Express", "JWT", "bcrypt", "GitHub Actions"],
    architecture: [
      { layer: "Interface", items: ["React 18 + Vite"] },
      { layer: "API", items: ["Express API", "JWT + bcrypt", "Demo payment"] },
      { layer: "Data", items: ["JSON database"] },
      { layer: "Infrastructure", items: ["GitHub Actions", "GitHub Pages"] },
    ],
    flow: ["Browse venues", "Check dates", "Pay advance", "Get ticket"],
    links: {
      repo: "https://github.com/Prajwalps2603/BookMyVenue",
      live: "https://prajwalps2603.github.io/BookMyVenue/",
    },
  },
  {
    id: "mcp-job-agent",
    title: "Custom MCP Server & Auto Job Agent",
    shortTitle: "MCP Job Agent",
    year: "2026",
    category: "Agentic AI · Automation",
    featured: true,
    tagline: "A Model Context Protocol server that powers an end-to-end job-application agent.",
    summary:
      "An automation system built on the Model Context Protocol: it discovers and parses job descriptions, gates eligibility, tailors LaTeX résumés, fills application forms with Playwright, and tracks everything in Google Sheets and Drive.",
    highlights: [
      "Custom MCP server for querying LinkedIn jobs, scraping job details and extracting requirements.",
      "Job-description parsing, skill-overlap scoring and hard eligibility gating.",
      "Generates tailored LaTeX résumés compiled via Overleaf / pdflatex.",
      "Playwright form automation with review-only pre-submission validation and full audit logs in Google Sheets.",
    ],
    metrics: [],
    stack: ["TypeScript", "Node.js", "Model Context Protocol", "Playwright", "Google Sheets API", "Google Drive API", "LaTeX"],
    architecture: [
      { layer: "Interface", items: ["MCP client"] },
      { layer: "API", items: ["Custom MCP server"] },
      { layer: "Intelligence", items: ["JD parsing and gate", "Résumé tailoring"] },
      { layer: "Data", items: ["Google Sheets", "Google Drive"] },
      { layer: "Infrastructure", items: ["Playwright forms", "Overleaf / pdflatex"] },
    ],
    flow: ["Discover job", "Parse and gate", "Tailor résumé", "Fill the form", "Audit log"],
    links: { repo: "https://github.com/Prajwalps2603/Custom-MCP-Server" },
  },

  // ——— Archive ———
  {
    id: "markvault",
    title: "MarkVault",
    shortTitle: "MarkVault",
    year: "2026",
    category: "Full stack · Realtime",
    featured: false,
    tagline: "A smart bookmark manager with realtime sync and AI summaries.",
    summary:
      "Full-stack bookmark manager with Supabase auth, realtime sync and row-level security, AI summaries, reminders, collaborative folders, tags and Ctrl+K fuzzy search.",
    highlights: [],
    metrics: [],
    stack: ["Next.js 16", "Supabase", "PostgreSQL", "Tailwind CSS v4", "Framer Motion", "OpenAI API"],
    architecture: [
      { layer: "Interface", items: ["Next.js 16"] },
      { layer: "API", items: ["Supabase Auth & Realtime"] },
      { layer: "Data", items: ["PostgreSQL + RLS"] },
    ],
    links: { repo: "https://github.com/Prajwalps2603/MarkVault-Smart-BooKMark-App" },
  },
  {
    id: "lifesync",
    title: "LifeSync AI",
    shortTitle: "LifeSync AI",
    year: "2026",
    category: "AI · Productivity",
    featured: false,
    tagline: "An intelligent life operating system with Gemini-powered RAG.",
    summary:
      "Tasks, goals, notes, habits and finances in one workspace, with an AI companion grounded in your own data via Gemini RAG, plus role-based access control.",
    highlights: [],
    metrics: [],
    stack: ["React 19", "TypeScript", "Vite", "Express 5", "Gemini", "Firebase"],
    architecture: [
      { layer: "Interface", items: ["React 19"] },
      { layer: "API", items: ["Express 5", "RBAC"] },
      { layer: "Intelligence", items: ["Gemini RAG"] },
      { layer: "Data", items: ["Firebase"] },
    ],
    links: { repo: "https://github.com/Prajwalps2603/LifeSync" },
  },
  {
    id: "smart-ambulance",
    title: "Smart Ambulance Traffic Clearance",
    shortTitle: "Smart Ambulance",
    year: "2025",
    category: "IoT · Realtime",
    featured: false,
    tagline: "Clearing the road ahead of an ambulance with MQTT, ESP32s and live tracking.",
    summary:
      "IoT prototype: a mobile app streams ambulance location to a Node.js backend that publishes MQTT alerts to roadside smart poles and pre-empts traffic lights on the route, with a live Socket.IO control centre.",
    highlights: [],
    metrics: [],
    stack: ["Node.js", "Express", "Socket.IO", "MQTT", "ESP32", "Flutter", "Docker"],
    architecture: [
      { layer: "Interface", items: ["Flutter app", "Control centre"] },
      { layer: "API", items: ["Express", "Socket.IO"] },
      { layer: "Data", items: ["MQTT topics"] },
      { layer: "Infrastructure", items: ["ESP32 firmware", "Mosquitto", "Docker"] },
    ],
    links: { repo: "https://github.com/Prajwalps2603/smart-ambulance-traffic-clearance" },
  },
  {
    id: "buddy",
    title: "Buddy",
    shortTitle: "Buddy",
    year: "2026",
    category: "Web app · Live",
    featured: false,
    tagline: "Expenses, budgets, calendar and documents — encrypted in your own Google Drive.",
    summary:
      "A personal organiser that keeps expenses, budgets, calendar and documents organised and encrypted in the user's own Google Drive.",
    highlights: [],
    metrics: [],
    stack: ["JavaScript", "Google Drive API"],
    architecture: [
      { layer: "Interface", items: ["Web app"] },
      { layer: "Data", items: ["User's Google Drive (encrypted)"] },
    ],
    links: { live: "https://prajwalps2603.github.io/Buddy/", repo: "https://github.com/Prajwalps2603/Buddy" },
  },
  {
    id: "livora",
    title: "Livora",
    shortTitle: "Livora",
    year: "2026",
    category: "Web · Motion",
    featured: false,
    tagline: "A studio website where the software builds itself in front of you.",
    summary:
      "Website for LIVORA, a studio building custom web apps, Android apps and internal business software — with a self-assembling system hero, a 3D tech keyboard and motion that explains something.",
    highlights: [],
    metrics: [],
    stack: ["React 19", "Vite", "Framer Motion"],
    architecture: [{ layer: "Interface", items: ["React 19 + Vite", "Framer Motion"] }],
    links: { live: "https://prajwalps2603.github.io/Livora/" },
  },
  {
    id: "campus-connect",
    title: "Campus Connect",
    shortTitle: "Campus Connect",
    year: "2025",
    category: "Full stack · Social",
    featured: false,
    tagline: "A social and learning platform for college students.",
    summary:
      "Social feed, follows and notifications plus an EduHub for sharing notes and projects, with JWT auth, file uploads and PostgreSQL persistence.",
    highlights: [],
    metrics: [],
    stack: ["JavaScript", "Node.js", "Express", "PostgreSQL", "JWT"],
    architecture: [
      { layer: "Interface", items: ["HTML / CSS / JS"] },
      { layer: "API", items: ["Express", "JWT"] },
      { layer: "Data", items: ["PostgreSQL"] },
    ],
    links: { repo: "https://github.com/Prajwalps2603/Campus_Connect" },
  },
  {
    id: "accident-detection",
    title: "Road Accident Detection & Alert",
    shortTitle: "Accident Detection",
    year: "2025",
    category: "Computer vision",
    featured: false,
    tagline: "Computer vision that detects road accidents and triggers an emergency response.",
    summary:
      "Detects accidents from video with OpenCV, sounds an alert, captures a timestamped screenshot of the scene and lets authorised personnel call an ambulance via Twilio.",
    highlights: [],
    metrics: [],
    stack: ["Python", "OpenCV", "Twilio"],
    architecture: [
      { layer: "Intelligence", items: ["OpenCV detection"] },
      { layer: "API", items: ["Twilio"] },
    ],
    links: { repo: "https://github.com/Prajwalps2603/Vechile-Accident-System" },
  },
  {
    id: "sudoku-solver",
    title: "Sudoku Solver",
    shortTitle: "Sudoku Solver",
    year: "2026",
    category: "Java · Algorithms",
    featured: false,
    tagline: "Backtracking and recursion, made playable.",
    summary: "Java Sudoku generation, validation and backtracking solver with an interactive web grid.",
    highlights: [],
    metrics: [],
    stack: ["Java", "Backtracking", "HTML", "CSS"],
    architecture: [
      { layer: "Interface", items: ["Web grid"] },
      { layer: "Intelligence", items: ["Backtracking solver (Java)"] },
    ],
    links: { repo: "https://github.com/Prajwalps2603/Sudoku-Solver-DSA" },
  },
  {
    id: "cloudscape",
    title: "CloudScape — AWS Web Hosting",
    shortTitle: "CloudScape",
    year: "2025",
    category: "Cloud",
    featured: false,
    tagline: "Web hosting on AWS with EC2 and S3.",
    summary: "Deploys a web application with Amazon EC2 for the server and Amazon S3 for static assets.",
    highlights: [],
    metrics: [],
    stack: ["AWS EC2", "Amazon S3"],
    architecture: [{ layer: "Infrastructure", items: ["EC2", "S3"] }],
    links: { repo: "https://github.com/Prajwalps2603/AWS-Web-Hosting" },
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
export const archiveProjects = projects.filter((p) => !p.featured);

/* ======================================================================================
   The bench: typed connections, probes' traffic vocabulary, one what-if and facts per
   featured system. One record drives the board, the connection list, the scope and the
   datasheet block diagram, so they cannot drift. Everything here is stated by the
   project's public README (fetched 2026-11-06); `source` names the README section.
   Traffic "shapes" are a visual vocabulary for the KIND of traffic on a connection
   (request/response, server push, pipeline stages...), never measured data.
   ====================================================================================== */

export type TrafficShape =
  | "reqres"
  | "rows"
  | "query"
  | "embed"
  | "gen"
  | "fail"
  | "fallback"
  | "stdio"
  | "push"
  | "stages"
  | "upload"
  | "triple";

/** Scope channel (the layer the traffic is about): 1 Interface, 2 Services, 3 Data, 4 Intelligence; "sigma" = delivery, drawn but not probed. */
export type ScopeChannel = 1 | 2 | 3 | 4 | "sigma";

export type Connection = {
  id: string;
  /** Architecture item that the traffic leaves (exact `architecture[].items` string). */
  from: string;
  /** Architecture item that it reaches. */
  to: string;
  channel: ScopeChannel;
  /** What is on the wire: an endpoint, a topic, an operation. */
  label: string;
  protocol: string;
  /** Traffic shape drawn on the scope. */
  shape: TrafficShape;
  /** One line naming the kind of traffic. */
  kind: string;
  /** README-backed detail shown when the connection is probed. */
  note: string;
  /** README section this connection is documented in. */
  source: string;
  /** Drawn dashed and flat on the scope until a what-if wakes it. */
  idle?: boolean;
};

export type ConnectionChange = Partial<Pick<Connection, "label" | "protocol" | "shape" | "kind" | "note" | "idle">>;

export type WhatIfOption = {
  id: string;
  label: string;
  /** What this branch means, from the README. */
  effect: string;
  connections?: Record<string, ConnectionChange>;
  /** Display-name swaps for chips, keyed by architecture item. */
  nodes?: Record<string, string>;
};

export type WhatIf = {
  question: string;
  source: string;
  /** The first option is the default and the documented base case. */
  options: WhatIfOption[];
};

export type SystemRecord = {
  readme: string;
  connections: Connection[];
  whatIf: WhatIf;
  facts: { label: string; value: string }[];
  /**
   * The 3-4 key facts the bench shows for this system, by label, picked from the combined record
   * (award, then metrics, then facts). The datasheet shows all of them. Checked by validateSystems().
   */
  bench: string[];
  /** For each stage of `Project.flow`, the connection ids that carry it. */
  stages: string[][];
};

const gh = (repo: string) => `https://github.com/Prajwalps2603/${repo}#readme`;

export const systems: Record<string, SystemRecord> = {
  "drone-intelligence": {
    readme: gh("Drone-Intelligence-System"),
    connections: [
      {
        id: "chat", from: "React 19 dashboard", to: "FastAPI", channel: 1,
        label: "POST /api/chat/message", protocol: "HTTP / JSON", shape: "reqres", kind: "request, then response",
        note: "The chat page sends { message }; the answer returns with source citations.",
        source: "README: Data Flow, RAG Chat",
      },
      {
        id: "kpi", from: "WebSocket manager", to: "React 19 dashboard", channel: 2,
        label: "/ws/kpi", protocol: "WebSocket", shape: "push", kind: "server push every 3-8 s",
        note: "Pushes a kpi_update with missions, active drones, compliance and alerts. The mission data is simulated.",
        source: "README: WebSocket, Real-Time Updates",
      },
      {
        id: "query", from: "FastAPI", to: "ChromaDB", channel: 3,
        label: "query, top 5", protocol: "in-process", shape: "query", kind: "query, then 5 ranked chunks",
        note: "Semantic search over the knowledge base returns the five closest chunks.",
        source: "README: RAG Pipeline",
      },
      {
        id: "gen", from: "FastAPI", to: "Gemini 2.0 Flash", channel: 4,
        label: "generate_content", protocol: "HTTPS / Gemini API", shape: "gen", kind: "prompt, then answer",
        note: "The prompt is the top five chunks plus the question; the reply is { answer, sources }.",
        source: "README: RAG Pipeline, Step 3",
      },
      {
        id: "csv", from: "FastAPI", to: "CSV datasets", channel: 3,
        label: "/drones, /regulations", protocol: "HTTP / CSV", shape: "rows", kind: "request, then rows",
        note: "The drone and regulation routes serve rows from the CSV datasets.",
        source: "README: Backend, FastAPI routers",
      },
      {
        id: "embed", from: "ChromaDB", to: "MiniLM-L6-v2", channel: 4,
        label: "embed the query", protocol: "in-process", shape: "embed", kind: "text, then 384-dim vector",
        note: "The same local model embeds documents at ingestion and queries at search time. No API call.",
        source: "README: Vector Database",
      },
      {
        id: "fb", from: "FastAPI", to: "Context fallback", channel: 4, idle: true,
        label: "context-only answer", protocol: "in-process", shape: "fallback", kind: "runs only when Gemini fails",
        note: "If Gemini fails or the quota is exceeded (HTTP 429), the answer is extracted from the retrieved documents.",
        source: "README: RAG Pipeline, Fallback Chain",
      },
      {
        id: "mcp", from: "Claude Desktop", to: "MCP server", channel: 2,
        label: "stdio, 4 tools", protocol: "MCP", shape: "stdio", kind: "tool call, then result",
        note: "A separate process exposing calculate_flight_time, calculate_roi, check_compliance and select_drone.",
        source: "README: MCP Server, Claude Desktop Integration",
      },
      {
        id: "deploy", from: "Docker Compose", to: "Nginx", channel: "sigma",
        label: "frontend container", protocol: "Docker Compose", shape: "stdio", kind: "delivery",
        note: "Two services: the FastAPI backend and the Nginx frontend.",
        source: "README: Docker Deployment",
      },
    ],
    whatIf: {
      question: "What if Gemini is unavailable?",
      source: "README: RAG Pipeline, Fallback Chain",
      options: [
        {
          id: "ok", label: "Gemini answers",
          effect: "Gemini 2.0 Flash writes the answer from the five retrieved chunks and returns it with sources.",
        },
        {
          id: "down", label: "Gemini unavailable",
          effect: "The request still gets an answer: the context fallback extracts it from the retrieved documents, no LLM involved.",
          connections: {
            gen: { shape: "fail", kind: "HTTP 429, then nothing", label: "generate_content fails" },
            fb: { idle: false, kind: "answer built from retrieved context" },
          },
        },
      ],
    },
    // README: Overview, Vector Database, WebSocket, MCP Server. "74 documents" is the README's own count.
    facts: [
      { label: "Retrieval", value: "ChromaDB, top 5 chunks, local all-MiniLM-L6-v2" },
      { label: "Generation", value: "Gemini 2.0 Flash" },
      { label: "Live data", value: "/ws/kpi push every 3-8 s (simulated)" },
      { label: "Agent tools", value: "4 MCP tools over stdio" },
      { label: "Knowledge base", value: "74 vector-indexed documents" },
    ],
    bench: ["Retrieval", "Generation", "Live data"],
    stages: [["chat"], ["embed"], ["query"], ["gen"], ["chat"]],
  },

  "brain-tumor-detection": {
    readme: gh("Human_Brain_Tumor_Detection"),
    connections: [
      {
        id: "upload", from: "Upload page", to: "Flask app", channel: 1,
        label: "MRI image upload", protocol: "HTTP", shape: "reqres", kind: "upload, then result",
        note: "The user uploads an MRI image on the web interface.",
        source: "README: How It Works, step 1",
      },
      {
        id: "prep", from: "Flask app", to: "Preprocess and resize", channel: 2,
        label: "preprocess and resize", protocol: "in-process", shape: "stages", kind: "pipeline stages",
        note: "The image is preprocessed and resized before it reaches the model.",
        source: "README: How It Works, step 2",
      },
      {
        id: "train", from: "12,000+ MRI images", to: "CNN", channel: 3, idle: true,
        label: "training set", protocol: "offline", shape: "stages", kind: "training, not serving",
        note: "The model was trained on 12,000+ MRI images with data preprocessing, image augmentation and hyperparameter tuning.",
        source: "README: Model Details",
      },
      {
        id: "infer", from: "Preprocess and resize", to: "CNN", channel: 4,
        label: "CNN analyses the image", protocol: "TensorFlow / Keras", shape: "embed", kind: "one inference",
        note: "The convolutional network classifies the scan as tumour or non-tumour.",
        source: "README: How It Works, step 3",
      },
      {
        id: "result", from: "CNN", to: "Flask app", channel: 4,
        label: "tumour / non-tumour", protocol: "in-process", shape: "reqres", kind: "prediction",
        note: "The prediction is shown on the web interface.",
        source: "README: How It Works, steps 4-5",
      },
    ],
    whatIf: {
      question: "What if it is training, not serving?",
      source: "README: Model Details",
      options: [
        { id: "serve", label: "Serving a scan", effect: "A scan is uploaded, preprocessed, classified by the CNN and the result is shown." },
        {
          id: "train", label: "Training the model",
          effect: "The 12,000+ MRI images feed the CNN; the serving path sits idle. This shows the dataset's role, not a trace of training code.",
          connections: {
            train: { idle: false },
            upload: { idle: true },
            prep: { idle: true },
            infer: { idle: true },
            result: { idle: true },
          },
        },
      ],
    },
    // README: Model Details, Features. The award is from the résumé (not in the README).
    facts: [
      { label: "Output", value: "tumour or non-tumour" },
      { label: "Techniques", value: "preprocessing, augmentation, hyperparameter tuning" },
    ],
    bench: ["Award", "prediction accuracy", "MRI images"],
    stages: [["upload"], ["prep"], ["infer"], ["result"]],
  },

  resumai: {
    readme: gh("AI-Resume-Builder"),
    connections: [
      {
        id: "ui", from: "Next.js 14 app", to: "FastAPI", channel: 1,
        label: "REST calls", protocol: "HTTP / JSON", shape: "reqres", kind: "request, then response",
        note: "The frontend talks to separate FastAPI routers for auth, resumes and AI.",
        source: "README: Project Structure",
      },
      {
        id: "preview", from: "Split-screen A4 studio", to: "Next.js 14 app", channel: 1,
        label: "live A4 preview", protocol: "in-app", shape: "rows", kind: "edit, then preview",
        note: "Real-time A4 resume preview with customizable accent colours and instant keyword match indicators.",
        source: "README: Features, Live Split-Screen Studio",
      },
      {
        id: "auth", from: "FastAPI", to: "JWT auth", channel: 2,
        label: "token check", protocol: "JWT", shape: "reqres", kind: "request, then verdict",
        note: "JWT authentication guards the backend.",
        source: "README: Tech Stack",
      },
      {
        id: "db", from: "FastAPI", to: "PostgreSQL", channel: 3,
        label: "resumes and profile", protocol: "SQL", shape: "rows", kind: "query, then rows",
        note: "PostgreSQL holds the data; the backend ships migration scripts in sql/.",
        source: "README: Tech Stack, Project Structure",
      },
      {
        id: "diag", from: "FastAPI", to: "ATS diagnostics", channel: 4,
        label: "keyword gaps, formatting flaws", protocol: "in-process", shape: "stages", kind: "pipeline stages",
        note: "The diagnostic engine detects keyword gaps and formatting flaws against the target job description.",
        source: "README: Features, ATS Optimization",
      },
      {
        id: "tailor", from: "FastAPI", to: "OpenAI API", channel: 4,
        label: "tailor the documents", protocol: "HTTPS / OpenAI API", shape: "triple", kind: "prompt, then three documents",
        note: "Generates matching ATS resumes, tailored cover letters and recruiter pitches simultaneously.",
        source: "README: Features, Synchronized Career Documents",
      },
      {
        id: "export", from: "Split-screen A4 studio", to: "Vector PDF export", channel: "sigma",
        label: "print to vector PDF", protocol: "PDF", shape: "upload", kind: "delivery",
        note: "Pixel-perfect printable vector PDF generation.",
        source: "README: Tech Stack, Exporting",
      },
    ],
    whatIf: {
      question: "What if you change the template?",
      source: "README: Features, 6 Curated ATS-Safe Templates",
      options: [
        "Tech Titan", "Executive Onyx", "Silicon Gradient", "Harvard Classic", "Creative Portfolio", "Cloud Architect",
      ].map((name, i) => ({
        id: `t${i}`,
        label: name,
        effect: `${name} is one of six curated ATS-safe layouts. The studio previews it live on A4.`,
        nodes: { "Split-screen A4 studio": `A4 studio: ${name}` },
        connections: { preview: { label: `live A4 preview: ${name}` } },
      })),
    },
    // README: Features, Tech Stack. Marketing claims (98%+ pass rate) deliberately not repeated.
    facts: [
      { label: "Documents", value: "résumé, cover letter, recruiter pitch, together" },
      { label: "Recruiter view", value: "6-second glance heatmap" },
      { label: "Export", value: "printable vector PDF" },
      { label: "Frontend", value: "Next.js 14, React 18, TypeScript" },
    ],
    bench: ["Documents", "ATS-safe templates", "Export"],
    stages: [["ui"], ["diag"], ["tailor"], ["export"]],
  },

  "audify-ai": {
    readme: gh("Audify-AI"),
    connections: [
      {
        id: "scan", from: "Audio scanner", to: "React Native app", channel: 1,
        label: "MediaStore + SAF discovery", protocol: "on device", shape: "rows", kind: "scan, then recordings",
        note: "Discovers recordings across internal storage and custom directories via the Storage Access Framework.",
        source: "README: Key Features, Automated Recording Discovery",
      },
      {
        id: "match", from: "Audio scanner", to: "Call log resolver", channel: 1,
        label: "fuzzy time-window match", protocol: "on device", shape: "query", kind: "recording, then call metadata",
        note: "Correlates call logs (duration, timestamp, direction, contact) with audio files using fuzzy time-window matching.",
        source: "README: Key Features, Call Metadata Matching",
      },
      {
        id: "api", from: "React Native app", to: "Express backend", channel: 2,
        label: "HTTPS to the backend", protocol: "HTTPS", shape: "reqres", kind: "request, then response",
        note: "Production runs HTTPS with Let's Encrypt; local development uses a self-signed certificate. Health check: GET /api/health.",
        source: "README: Key Features, HTTPS; Getting Started",
      },
      {
        id: "drive", from: "React Native app", to: "Google Drive", channel: 3,
        label: "multipart audio upload", protocol: "Drive REST v3", shape: "upload", kind: "one long upload",
        note: "Uploads recordings to an organised Drive folder, with duplicate checks.",
        source: "README: Key Features, Google Drive Backup",
      },
      {
        id: "sheets", from: "React Native app", to: "Google Sheets CRM", channel: 3,
        label: "structured call summary row", protocol: "Sheets REST v4", shape: "rows", kind: "request, then row",
        note: "Exports structured call summaries, sentiment, duration, audio links and transcripts into Sheets.",
        source: "README: Key Features, Google Sheets CRM Sync",
      },
      {
        id: "stt", from: "React Native app", to: "Speech-to-text provider", channel: 4,
        label: "transcribe with diarization", protocol: "provider API", shape: "gen", kind: "audio, then diarized text",
        note: "Pluggable speech-to-text with speaker diarization and confidence scores.",
        source: "README: Key Features, Multi-Provider AI Transcription",
      },
      {
        id: "cert", from: "Let's Encrypt (Greenlock)", to: "Express backend", channel: "sigma",
        label: "certificate auto-renewal", protocol: "ACME", shape: "stdio", kind: "delivery",
        note: "Certificates renew automatically in production.",
        source: "README: Key Features, HTTPS with Auto-Renewal",
      },
    ],
    whatIf: {
      question: "What if you switch the speech-to-text provider?",
      source: "README: Key Features, Multi-Provider AI Transcription",
      options: ["Google Cloud STT v2", "OpenAI Whisper", "Deepgram Nova-2", "AssemblyAI"].map((name, i) => ({
        id: `p${i}`,
        label: name,
        effect: `Settings has a provider picker. ${name} returns the transcript with speaker diarization; the rest of the pipeline is unchanged.`,
        nodes: { "Speech-to-text provider": name },
        connections: { stt: { label: `transcribe with ${name}` } },
      })),
    },
    // README: Architecture & Pipeline, Key Features.
    facts: [
      { label: "Pipeline", value: "discovery, Drive upload, transcription, CRM sync" },
      { label: "Resilience", value: "retry queue with exponential backoff" },
      { label: "Platform", value: "Android, React Native" },
    ],
    bench: ["speech-to-text providers", "Pipeline", "Resilience"],
    stages: [["scan"], ["match"], ["drive"], ["stt"], ["sheets"]],
  },

  bookmyvenue: {
    readme: gh("BookMyVenue"),
    connections: [
      {
        id: "spa", from: "React 18 + Vite", to: "Express API", channel: 1,
        label: "/api (proxy)", protocol: "HTTP / JSON", shape: "reqres", kind: "request, then response",
        note: "The browser is never trusted: the API recomputes prices, checks capacity and dates.",
        source: "README: How it fits together",
      },
      {
        id: "pay", from: "Express API", to: "Demo payment", channel: 2,
        label: "verify payment signature", protocol: "HMAC", shape: "reqres", kind: "payment, then verdict",
        note: "A test-mode payment gateway, HMAC-signed and verified by the server. It is a simulation.",
        source: "README: How it fits together; Before you take this to production",
      },
      {
        id: "db", from: "Express API", to: "JSON database", channel: 3,
        label: "availability and bookings", protocol: "file I/O", shape: "rows", kind: "read, then write",
        note: "One booking per venue per date. The server rechecks the date at the moment you pay, so no two people book the same day.",
        source: "README: The idea; Business rules",
      },
      {
        id: "auth", from: "Express API", to: "JWT + bcrypt", channel: 2,
        label: "sign in, hash, verify", protocol: "JWT", shape: "stdio", kind: "credentials, then token",
        note: "JWT authentication with bcrypt password hashing.",
        source: "README: Live demo vs. full version",
      },
      {
        id: "deploy", from: "GitHub Actions", to: "GitHub Pages", channel: "sigma",
        label: "build from main, deploy", protocol: "GitHub Actions", shape: "stdio", kind: "delivery",
        note: "The live demo is rebuilt automatically from main on every push.",
        source: "README: Live demo vs. full version",
      },
    ],
    whatIf: {
      question: "What if there is no server?",
      source: "README: Live demo vs. full version",
      options: [
        {
          id: "full", label: "Full version",
          effect: "A real Express server with JWT and bcrypt; data saved in server/data/db.json, shared by everyone.",
        },
        {
          id: "pages", label: "Live demo (GitHub Pages)",
          effect: "GitHub Pages hosts only static files, so a mini API runs in your browser and data stays private to you. Every feature works in both.",
          nodes: { "Express API": "Mini API in the browser", "JSON database": "Your browser only" },
          connections: { spa: { label: "in-page calls", protocol: "JavaScript" } },
        },
      ],
    },
    // README: badges, Business rules, Scripts.
    facts: [
      { label: "Booking rule", value: "one booking per venue per date" },
      { label: "Advance", value: "50% of the total, plus a 5% service fee" },
      { label: "Refund", value: "full advance back if cancelled 15+ days ahead" },
    ],
    bench: ["Booking rule", "passing tests", "Advance"],
    stages: [["spa"], ["db"], ["pay"], ["db"]],
  },

  "mcp-job-agent": {
    readme: gh("Custom-MCP-Server"),
    connections: [
      {
        id: "query", from: "MCP client", to: "Custom MCP server", channel: 1,
        label: "query jobs, job details", protocol: "Model Context Protocol", shape: "stdio", kind: "tool call, then result",
        note: "A custom MCP server for querying LinkedIn jobs, scraping job details and extracting requirements.",
        source: "README: Key Components, LinkedIn MCP Integration",
      },
      {
        id: "parse", from: "Custom MCP server", to: "JD parsing and gate", channel: 2,
        label: "extract requirements", protocol: "in-process", shape: "stages", kind: "pipeline stages",
        note: "Technical job-description parsing, skill-overlap evaluation and hard eligibility gating.",
        source: "README: Auto Job Application Agent, Job Discovery & Matching",
      },
      {
        id: "versions", from: "Résumé tailoring", to: "Google Drive", channel: 3,
        label: "résumé versions", protocol: "Drive API", shape: "upload", kind: "one upload per version",
        note: "Jobs, application records, résumé versions and audit logs are tracked in Sheets and Drive.",
        source: "README: Google Sheets & Drive Integration",
      },
      {
        id: "audit", from: "Playwright forms", to: "Google Sheets", channel: 3,
        label: "application record, audit log", protocol: "Sheets API", shape: "rows", kind: "request, then row",
        note: "Real-time tracking of applications and audit logs.",
        source: "README: Google Sheets & Drive Integration",
      },
      {
        id: "tailor", from: "JD parsing and gate", to: "Résumé tailoring", channel: 4,
        label: "tailored LaTeX résumé", protocol: "in-process", shape: "gen", kind: "profile + JD, then résumé",
        note: "Generates targeted LaTeX résumés matching the candidate profile to the job description.",
        source: "README: Dynamic Resume Tailoring",
      },
      {
        id: "fill", from: "Résumé tailoring", to: "Playwright forms", channel: 2,
        label: "attach résumé, map questions", protocol: "Playwright", shape: "stages", kind: "pipeline stages",
        note: "Form detection, question mapping from profile repositories, résumé attachment and safe review-only pre-submission validation.",
        source: "README: Multi-Portal Form Automation",
      },
      {
        id: "compile", from: "Résumé tailoring", to: "Overleaf / pdflatex", channel: "sigma",
        label: "compile LaTeX", protocol: "Overleaf / pdflatex", shape: "upload", kind: "delivery",
        note: "Résumés are compiled via Overleaf or pdflatex.",
        source: "README: Dynamic Resume Tailoring",
      },
    ],
    whatIf: {
      question: "What if the portal wants a login?",
      source: "README: Candidate Authentication Detection",
      options: [
        { id: "form", label: "Open application form", effect: "The agent maps questions, attaches the résumé and stops at review-only validation." },
        {
          id: "wall", label: "ATS login wall",
          effect: "Login and SSO walls are handled gracefully: the run stops and is logged as CANDIDATE_AUTH_REQUIRED.",
          connections: {
            fill: { shape: "fail", kind: "stops at the wall", label: "blocked by a login wall" },
            audit: { label: "CANDIDATE_AUTH_REQUIRED logged" },
          },
        },
      ],
    },
    // README: Key Components.
    facts: [
      { label: "Discovery", value: "LinkedIn jobs through a custom MCP server" },
      { label: "Gate", value: "skill overlap and hard eligibility" },
      { label: "Résumés", value: "targeted LaTeX, Overleaf or pdflatex" },
      { label: "Submission", value: "review-only pre-submission validation" },
    ],
    bench: ["Discovery", "Gate", "Submission"],
    stages: [["query"], ["parse"], ["tailor"], ["fill"], ["audit"]],
  },
};

/** Build-time consistency check: every wire ends on a real chip; every flow stage has wires. */
function validateSystems() {
  for (const p of projects) {
    const sys = systems[p.id];
    if (!sys) {
      if (p.featured) throw new Error(`projects: featured "${p.id}" has no bench record`);
      continue;
    }
    const nodes = new Set(p.architecture.flatMap((l) => l.items));
    const ids = new Set(sys.connections.map((c) => c.id));
    for (const c of sys.connections) {
      if (!nodes.has(c.from) || !nodes.has(c.to)) throw new Error(`projects: ${p.id}/${c.id} ends on an unknown chip`);
    }
    if (sys.stages.length !== (p.flow?.length ?? 0)) throw new Error(`projects: ${p.id} stages do not match flow`);
    sys.stages.forEach((s) =>
      s.forEach((id) => {
        if (!ids.has(id)) throw new Error(`projects: ${p.id} stage uses unknown "${id}"`);
      }),
    );
    const known = new Set([...(p.award ? ["Award"] : []), ...p.metrics.map((m) => m.label), ...sys.facts.map((f) => f.label)]);
    if (sys.bench.length < 3 || sys.bench.length > 4) throw new Error(`projects: ${p.id} bench needs 3-4 key facts`);
    sys.bench.forEach((l) => {
      if (!known.has(l)) throw new Error(`projects: ${p.id} bench fact "${l}" is not in the record`);
    });
    for (const o of sys.whatIf.options) {
      Object.keys(o.connections ?? {}).forEach((id) => {
        if (!ids.has(id)) throw new Error(`projects: ${p.id} what-if uses unknown "${id}"`);
      });
      Object.keys(o.nodes ?? {}).forEach((n) => {
        if (!nodes.has(n)) throw new Error(`projects: ${p.id} what-if renames unknown chip "${n}"`);
      });
    }
  }
}
validateSystems();
