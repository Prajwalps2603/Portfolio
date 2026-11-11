import type { JourneyStep } from "./types";

/**
 * THE REQUEST JOURNEYS: what happens at each step of a featured project's `flow`, in the same
 * order (journeys[id][i] explains projects[id].flow[i]; the step names themselves live only in
 * `flow`, so the two can never disagree). Read by the case-study "How it works" journey and, for
 * its handwritten notes, by the lazy architecture diagram (src/components/diagram/projects.ts). It
 * is imported directly ("@/content/journeys"), never from the barrel, so it stays out of the home
 * page's initial bundle.
 *
 * Provenance (2026-11-06): every line restates the project's public README, fetched raw from
 * https://raw.githubusercontent.com/Prajwalps2603/<repo>/HEAD/README.md
 * - Drone Intelligence: "AI Chat Workflow (RAG Pipeline)", "RAG Pipeline > How It Works", the API
 *   endpoints table (POST /api/chat/message) and the response shape { answer, sources[], ... }.
 * - Brain Tumor Detection: "How It Works" (5 steps; steps 4 and 5 are the one "Prediction shown"
 *   flow step), "Model Details" and "Tech Stack".
 * - ResumAI: "Features" (diagnostic engine, split-screen studio, synchronized documents, career
 *   vault) and "Tech Stack" (FastAPI + OpenAI API backend, vector PDF export).
 * - Audify AI: "Key Features" and "Architecture & Pipeline" (scanner, call-log matching, Drive
 *   upload, multi-provider STT, Sheets CRM row, retry queue).
 * - BookMyVenue: "What you can do", "How it fits together" and "Business rules".
 * - MCP Job Agent: "Key Components" (LinkedIn MCP server, JD parsing and gating, LaTeX tailoring,
 *   form automation with review-only validation, Sheets / Drive tracking, login-wall handling).
 * `layer` follows each project's `architecture` in projects.ts; `tech` is a name the README uses.
 * Notes are short paraphrases of `does` (Caveat in the diagram), never new claims.
 */
export const journeys: Record<string, JourneyStep[]> = {
  "drone-intelligence": [
    {
      layer: "Interface",
      tech: "POST /api/chat/message",
      does: "You ask in plain language in the React chat, and it posts the message to the FastAPI chat route.",
      note: "ask in plain language",
    },
    {
      layer: "Intelligence",
      tech: "all-MiniLM-L6-v2",
      does: "The RAG service embeds the question locally with MiniLM-L6-v2, the same model that indexed the knowledge base, so no API call is needed.",
      note: "embedded locally, no API call",
    },
    {
      layer: "Data",
      tech: "ChromaDB",
      does: "A semantic similarity search in ChromaDB returns the five most relevant document chunks.",
      note: "the five closest chunks",
    },
    {
      layer: "Intelligence",
      tech: "Gemini 2.0 Flash",
      does: "The chunks and the question become one structured prompt for Gemini 2.0 Flash. If Gemini fails or runs out of quota, the answer is taken from the retrieved context instead.",
      note: "answers from those chunks",
    },
    {
      layer: "Interface",
      tech: "{ answer, sources[] }",
      does: "The API returns the answer with its sources, and the chat shows it with source citations.",
      note: "an answer, with citations",
    },
  ],

  "brain-tumor-detection": [
    {
      layer: "Interface",
      tech: "HTML · CSS · JavaScript",
      does: "You upload an MRI image on the web page.",
      note: "upload an MRI image",
    },
    {
      layer: "Intelligence",
      tech: "Python",
      does: "The image is preprocessed and resized before the model sees it.",
      note: "cleaned up and resized",
    },
    {
      layer: "Intelligence",
      tech: "TensorFlow · Keras",
      does: "A convolutional neural network, trained on 12,000+ MRI images, analyses the scan.",
      note: "the CNN reads the scan",
    },
    {
      layer: "Interface",
      tech: "Flask web app",
      does: "The system predicts whether a tumour is present and shows the result on the web page in real time.",
      note: "tumour or no tumour",
    },
  ],

  resumai: [
    {
      layer: "Interface",
      tech: "Next.js 14 studio",
      does: "The target job description goes into the split-screen studio, beside a live A4 preview.",
      note: "the job you're aiming for",
    },
    {
      layer: "Intelligence",
      tech: "ATS diagnostic engine",
      does: "The ATS diagnostic engine finds keyword gaps and formatting flaws against the job description.",
      note: "find the keyword gaps",
    },
    {
      layer: "Intelligence",
      tech: "FastAPI · OpenAI API",
      does: "From the profile saved once in the career vault, it generates a matching résumé, cover letter and recruiter pitch together.",
      note: "résumé, letter, pitch: in sync",
    },
    {
      layer: "Infrastructure",
      tech: "Vector PDF export",
      does: "The A4 preview is exported as a printable vector PDF.",
      note: "a print-ready PDF",
    },
  ],

  "audify-ai": [
    {
      layer: "Interface",
      tech: "MediaStore · SAF scanner",
      does: "On the phone, the media scanner finds call recordings in Android storage and in folders picked through the Storage Access Framework.",
      note: "find the recordings",
    },
    {
      layer: "Interface",
      tech: "Call log resolver",
      does: "Each recording is matched to its call-log entry (time, duration, direction, contact) inside a fuzzy time window.",
      note: "match each call",
    },
    {
      layer: "Data",
      tech: "Google Drive API",
      does: "The audio is uploaded to an organised folder in your Google Drive, with duplicate checks.",
      note: "into your Drive",
    },
    {
      layer: "Intelligence",
      tech: "Google STT v2 · Whisper · Deepgram · AssemblyAI",
      does: "The speech-to-text provider chosen in Settings transcribes the call with speaker diarization and confidence scores.",
      note: "who said what",
    },
    {
      layer: "Data",
      tech: "Google Sheets API",
      does: "A structured row (summary, sentiment, duration, audio link and transcript) lands in the Google Sheets CRM. Failed stages retry with exponential backoff.",
      note: "a row in the CRM sheet",
    },
  ],

  bookmyvenue: [
    {
      layer: "Interface",
      tech: "React 18 + Vite",
      does: "Filter venues by event type, city, guests, price and amenities, and sort them by rating or price.",
      note: "find the right venue",
    },
    {
      layer: "API",
      tech: "Express API",
      does: "The availability calendar crosses out booked dates, and the API checks the date and the guest count against the venue's capacity.",
      note: "is the date still free?",
    },
    {
      layer: "API",
      tech: "HMAC-signed demo payment",
      does: "The server recomputes the price, takes the 50% advance through a simulated, HMAC-signed payment and rechecks the date at that moment, so it can never be booked twice.",
      note: "advance paid, date rechecked",
    },
    {
      layer: "Interface",
      tech: "My Bookings",
      does: "The booking is confirmed with a printable ticket in My Bookings and a one-click Add to calendar (.ics).",
      note: "your ticket, printable",
    },
  ],

  "mcp-job-agent": [
    {
      layer: "API",
      tech: "LinkedIn MCP server",
      does: "The custom MCP server queries LinkedIn jobs, scrapes each job's details and extracts its requirements.",
      note: "query LinkedIn jobs",
    },
    {
      layer: "Intelligence",
      tech: "JD parser · eligibility gate",
      does: "The job description is parsed, the overlap with the candidate's skills is evaluated, and hard eligibility rules decide whether it goes on.",
      note: "skills match? eligible?",
    },
    {
      layer: "Intelligence",
      tech: "LaTeX · Overleaf / pdflatex",
      does: "A targeted LaTeX résumé is generated for the job and compiled via Overleaf or pdflatex.",
      note: "a résumé for this job",
    },
    {
      layer: "Infrastructure",
      tech: "Playwright",
      does: "Playwright detects the application form, maps its questions from the profile, attaches the résumé and stops at review-only validation before anything is submitted. Login and SSO walls are handled gracefully and logged.",
      note: "filled, then held for review",
    },
    {
      layer: "Data",
      tech: "Google Sheets · Drive",
      does: "Jobs, application records, résumé versions and audit logs are tracked in Google Sheets and Drive.",
      note: "every run on record",
    },
  ],
};
