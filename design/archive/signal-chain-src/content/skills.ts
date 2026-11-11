import type { SkillGroup } from "./types";

/**
 * Skills grouped by layer of the stack. `usedIn` points at project ids or experience ids
 * so every skill can be shown with evidence instead of self-ratings.
 */
export const skillGroups: SkillGroup[] = [
  {
    id: "interface",
    label: "Interface",
    layer: "Interface",
    description: "Responsive, component-driven interfaces for web and mobile.",
    skills: [
      { name: "React 19", usedIn: ["maruti-flex", "drone-intelligence", "lifesync", "livora"] },
      { name: "Next.js", usedIn: ["maruti-flex", "resumai", "markvault"] },
      { name: "Tailwind CSS", usedIn: ["resumai", "markvault"] },
      { name: "Framer Motion", usedIn: ["resumai", "markvault", "livora"] },
      { name: "React Native", usedIn: ["audify-ai"] },
      { name: "HTML5 & CSS3", usedIn: ["campus-connect", "sudoku-solver"] },
      { name: "Bootstrap", usedIn: [] },
    ],
  },
  {
    id: "api",
    label: "Server & APIs",
    layer: "API",
    description: "Business logic, REST APIs, realtime channels and automation.",
    skills: [
      { name: "Spring Boot", usedIn: ["dyashin"] },
      { name: "Hibernate & JDBC", usedIn: ["dyashin"] },
      { name: "Node.js & Express", usedIn: ["audify-ai", "bookmyvenue", "smart-ambulance", "campus-connect"] },
      { name: "FastAPI", usedIn: ["drone-intelligence", "resumai"] },
      { name: "Flask", usedIn: ["brain-tumor-detection"] },
      { name: "REST APIs", usedIn: ["maruti-flex", "dyashin", "drone-intelligence"] },
      { name: "WebSockets & Socket.IO", usedIn: ["drone-intelligence", "smart-ambulance"] },
      { name: "Google Apps Script", usedIn: ["maruti-flex"] },
      { name: "JWT & OAuth 2.0", usedIn: ["bookmyvenue", "resumai", "audify-ai"] },
    ],
  },
  {
    id: "data",
    label: "Data",
    layer: "Data",
    description: "Relational, document and vector stores — and spreadsheets as real-world data layers.",
    skills: [
      { name: "PostgreSQL", usedIn: ["resumai", "markvault", "campus-connect"] },
      { name: "MySQL", usedIn: ["dyashin"] },
      { name: "MongoDB", usedIn: ["maruti-flex"] },
      { name: "Supabase", usedIn: ["markvault"] },
      { name: "Firebase", usedIn: ["lifesync"] },
      { name: "ChromaDB", usedIn: ["drone-intelligence"] },
      { name: "Google Sheets & Drive", usedIn: ["maruti-flex", "audify-ai", "mcp-job-agent"] },
    ],
  },
  {
    id: "intelligence",
    label: "AI",
    layer: "Intelligence",
    description: "Retrieval-augmented generation, LLM integration, agents and deep learning.",
    skills: [
      { name: "RAG pipelines", usedIn: ["drone-intelligence", "lifesync"] },
      { name: "Google Gemini", usedIn: ["drone-intelligence", "lifesync"] },
      { name: "OpenAI API", usedIn: ["resumai", "markvault"] },
      { name: "Model Context Protocol", usedIn: ["mcp-job-agent", "drone-intelligence"] },
      { name: "TensorFlow & Keras", usedIn: ["brain-tumor-detection"] },
      { name: "CNNs & computer vision", usedIn: ["brain-tumor-detection", "accident-detection"] },
      { name: "Sentence Transformers", usedIn: ["drone-intelligence"] },
      { name: "Speech-to-text", usedIn: ["audify-ai"] },
    ],
  },
  {
    id: "infrastructure",
    label: "Cloud & Delivery",
    layer: "Infrastructure",
    description: "Shipping and running software: containers, cloud, CI and tooling.",
    skills: [
      { name: "Docker", usedIn: ["drone-intelligence", "smart-ambulance"] },
      { name: "AWS — EC2, S3, RDS", usedIn: ["techbyheart", "cloudscape"] },
      { name: "GitHub Actions", usedIn: ["bookmyvenue"] },
      { name: "Git & GitHub", usedIn: ["dyashin"] },
      { name: "Linux", usedIn: [] },
      { name: "Maven", usedIn: ["dyashin"] },
      { name: "Postman", usedIn: [] },
      { name: "Playwright", usedIn: ["mcp-job-agent"] },
    ],
  },
  {
    id: "languages",
    label: "Languages",
    layer: "Languages",
    description: "The languages underneath it all.",
    skills: [
      { name: "Java 21", usedIn: ["dyashin", "sudoku-solver"] },
      { name: "JavaScript", usedIn: ["maruti-flex", "bookmyvenue"] },
      { name: "TypeScript", usedIn: ["resumai", "audify-ai", "mcp-job-agent", "markvault"] },
      { name: "Python", usedIn: ["drone-intelligence", "brain-tumor-detection", "rooman"] },
      { name: "SQL", usedIn: ["dyashin", "resumai"] },
    ],
  },
];

/** Practices & ways of working (no self-ratings). */
export const practices = [
  "End-to-end ownership: UI → API → data → deployment",
  "Agile delivery with Git, pull requests and code review",
  "MVC and clean, modular architecture",
  "Testing, deployment and long-term maintenance",
];
