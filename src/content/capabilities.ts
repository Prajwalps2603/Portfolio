/**
 * "What I build". The six capabilities from Prajwal's previous portfolio (components/sections/WhatIBuild.tsx
 * in github.com/Prajwalps2603/Portfolio), kept in his words, each tied to real work as evidence.
 */
export type Capability = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  /** Project or experience ids (src/content) that demonstrate it. */
  proof: string[];
  /** Short tags shown with the row. */
  tags: string[];
};

export const capabilities: Capability[] = [
  {
    id: "full-stack",
    title: "Full Stack Development",
    subtitle: "End-to-end software delivery",
    description:
      "Designing, developing, and deploying complete software products connecting interactive web clients with robust backend services and data layers.",
    proof: ["maruti-flex", "bookmyvenue", "resumai"],
    tags: ["React", "Next.js", "Spring Boot", "Node.js"],
  },
  {
    id: "web-apps",
    title: "Web Applications",
    subtitle: "Production-oriented clients",
    description:
      "Building responsive, modern, and accessible client interfaces optimized for performance, seamless UX, and cross-device consistency.",
    proof: ["maruti-flex", "markvault", "livora"],
    tags: ["React 19", "TypeScript", "Tailwind CSS"],
  },
  {
    id: "ai-apps",
    title: "AI-Powered Applications",
    subtitle: "Applied machine intelligence",
    description:
      "Integrating deep learning models (CNNs) and Retrieval-Augmented Generation (RAG) with Google Gemini AI to build smart, data-grounded systems.",
    proof: ["drone-intelligence", "brain-tumor-detection", "audify-ai"],
    tags: ["RAG", "Gemini", "TensorFlow", "MCP"],
  },
  {
    id: "backend-apis",
    title: "Backend & APIs",
    subtitle: "Service logic & controllers",
    description:
      "Engineering secure, scalable RESTful API services, request validation, business rules, and microservice communication endpoints.",
    proof: ["dyashin", "drone-intelligence", "audify-ai"],
    tags: ["REST", "FastAPI", "Express", "JWT"],
  },
  {
    id: "databases",
    title: "Database Integration",
    subtitle: "Structured & document stores",
    description:
      "Designing relational schemas, optimizing queries, and handling ORM mapping alongside flexible document datastores and vector collections.",
    proof: ["resumai", "maruti-flex", "drone-intelligence"],
    tags: ["PostgreSQL", "MongoDB", "MySQL", "ChromaDB"],
  },
  {
    id: "automation",
    title: "Automation & Digital Solutions",
    subtitle: "Operational workflow acceleration",
    description:
      "Streamlining business operations through automated scripts, Google Apps Script pipelines, and automated data synchronization.",
    proof: ["maruti-flex", "mcp-job-agent", "audify-ai"],
    tags: ["Apps Script", "Google Sheets", "Playwright"],
  },
];
