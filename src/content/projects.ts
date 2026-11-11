import type { Project } from "./types";

/**
 * Projects, ordered by showcase priority.
 * `featured` projects get full case-study treatment; the rest appear in the archive index.
 *
 * Provenance (fact-checked 2026-11-06 against each public README, fetched with
 * `curl -H "Accept: application/vnd.github.raw" https://api.github.com/repos/Prajwalps2603/<repo>/readme`):
 * - `year` is the year the GitHub repository was created (API `created_at`), not a build date. Re-checked
 *   2026-11-06 for every repository below with `curl https://api.github.com/repos/Prajwalps2603/<repo>`
 *   (all 15 matched again on 2026-11-06). Shown only as plain metadata next to the category (the
 *   Selected work index and the Also shipped list), never as a "shipped on" date.
 * - Stacks, versions, counts and internals of the six featured projects are stated by their READMEs.
 *   Anything a README does not state was dropped (e.g. ResumAI's "98%+ ATS pass rate" marketing line,
 *   the Brain Tumor project's React/OpenCV/NumPy, the "Claude" client on the MCP agent).
 * - Next.js versions are per README: ResumAI 14, MarkVault 16 (create-next-app 16.1.6).
 * - `approach` paragraphs restate README sections only (Data Flow / How it works / Key Features /
 *   Business rules / Live demo vs. full version), as recorded in the 2026-11-06 fact check.
 * - Second pass (2026-11-06, raw README fetch): every featured `approach`, `highlights` and `flow`
 *   re-read against its README. `problem` is set only where a README states one (BookMyVenue, "The
 *   idea"). Fixed: ResumAI "FastAPI endpoints" (the README's api/ folder), BookMyVenue's advance (50%
 *   of the total, which includes the 5% fee), MCP "skill overlap evaluation" and login walls "handled
 *   gracefully and logged", and Audify's pipeline: the README calls it an automated 4-stage pipeline
 *   (Discovery -> Drive Upload -> Transcription -> CRM Sync; its diagram opens the stages with the
 *   call-log match), so the five-step `flow` is that pipeline with discover + match split in two.
 * - `flow` arrays are read by index by the MiniUI templates (src/components/miniui): keep their
 *   length and order. What happens at each step lives in ./journeys.ts (same order).
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
    approach:
      "A Next.js 14 studio talks to FastAPI endpoints for auth, résumés and AI, behind JWT authentication, with PostgreSQL holding the data. The diagnostic engine checks the résumé against the target job description for keyword gaps and formatting flaws; the résumé, cover letter and recruiter pitch are then generated together through the OpenAI API, previewed live on A4 and exported as a printable vector PDF.",
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
    approach:
      "The React Native app runs the pipeline: it finds recordings through MediaStore and the Storage Access Framework, matches each one to its call-log entry inside a fuzzy time window, backs the audio up to an organised Google Drive folder with duplicate checks, transcribes it with speaker diarization through the provider picked in Settings, and writes the call summary to Google Sheets. A retry queue with exponential backoff retries what fails.",
    highlights: [
      "Discovers recordings on-device and matches them to call metadata with fuzzy time-window matching.",
      "Pluggable speech-to-text: Google Cloud STT v2, OpenAI Whisper, Deepgram Nova-2 and AssemblyAI, with diarization.",
      "Backs up audio to Google Drive and syncs structured call summaries to Google Sheets.",
      "An automated four-stage pipeline (discover and match, Drive upload, transcription, Sheets CRM sync) with retry queues and exponential backoff, plus an HTTPS Express backend with Let's Encrypt auto-renewal.",
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
    problem:
      "Planning an event usually means a dozen phone calls, a spreadsheet, and the fear that someone else grabbed your date.",
    summary:
      "A full-stack venue booking platform for weddings, parties and corporate events — browse venues, see free dates, pay an advance and get a ticket, with the server guaranteeing no two people can book the same day.",
    approach:
      "The browser is never trusted: the Express API recomputes prices, checks capacity and dates, and rechecks the date at the moment of payment, so a venue holds one booking per date. The advance, 50% of the total (the venue price plus a 5% service fee), goes through a simulated, HMAC-signed payment that the server verifies. On GitHub Pages a mini API runs in the browser, so every feature still works.",
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
    approach:
      "A custom MCP server queries LinkedIn jobs, scrapes their details and extracts the requirements. Each description is parsed, evaluated for skill overlap and checked against hard eligibility rules; a targeted LaTeX résumé is generated and compiled via Overleaf or pdflatex; then Playwright maps the form's questions, attaches the résumé and stops at review-only validation. Login and SSO walls are handled gracefully and written to the audit log.",
    highlights: [
      "Custom MCP server for querying LinkedIn jobs, scraping job details and extracting requirements.",
      "Job-description parsing, skill-overlap evaluation and hard eligibility gating.",
      "Generates tailored LaTeX résumés compiled via Overleaf / pdflatex.",
      "Playwright form automation with review-only pre-submission validation, tracked with audit logs in Google Sheets and Drive.",
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
