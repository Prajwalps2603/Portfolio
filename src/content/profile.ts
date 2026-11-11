import type { Profile } from "./types";

export const profile: Profile = {
  name: "Prajwal M P",
  firstName: "Prajwal",
  lastName: "M P",
  // Current role (Maruti Flex Traders LLP, Dec 2025 – present).
  title: "Full Stack Developer",
  location: "Bengaluru, India",
  email: "prajwalnair2603@gmail.com",
  statement:
    "I turn ideas into complete, working software: interface, APIs, data, AI and deployment, end to end.",
  // Old portfolio's hero line (kept: it is his own wording).
  tagline: "I build scalable web applications, AI-powered systems, and digital products.",
  summary:
    "Full Stack Developer with hands-on experience building end-to-end production applications using JavaScript, React, Next.js, MongoDB and REST APIs. Experienced across frontend, backend, database integration, testing, deployment and maintenance, with a strong foundation in Java, Spring Boot, PostgreSQL and AI-based application development — focused on clean, scalable solutions.",
  inHisWords:
    "I enjoy turning ideas into complete applications — from designing responsive frontend interfaces and developing backend APIs to integrating databases, implementing business logic, deploying applications, and continuously improving them.",
  // Draft copy written from his résumé, cover letter and GitHub profile, in his voice. He may edit it.
  about: [
    "I'm a Full Stack Developer who likes owning the whole path, from a rough idea on paper to software people use every day: the interface, the API, the data, the AI and the deployment.",
    "Right now I build the production software behind TVS showroom and Maruti Flex operations at Maruti Flex Traders: React and Next.js interfaces, Google Apps Script automation, and MongoDB and Google Sheets data workflows.",
    "Outside work I build AI products: RAG platforms on Gemini and ChromaDB, an MCP server, speech-to-text pipelines. My final-year brain-tumour detection model (97% accuracy) took first place at KVGCE.",
  ],
  route: [
    { place: "Koppa", region: "Malnad, Karnataka", chapter: "Schooling", years: "2009 – 2021" },
    { place: "Sullia", region: "Dakshina Kannada", chapter: "BE, Electronics & Communication", years: "2021 – 2025" },
    { place: "Bengaluru", region: "Karnataka", chapter: "Full Stack Developer", years: "2025 – now" },
  ],
  currentFocus: ["Full stack development", "AI-powered systems", "Spring Boot & cloud"],
  learning: ["Spring Security", "Microservices", "Python backends", "Cloud & DevOps", "Agentic AI"],
  availability: "Open to new opportunities",
  // His words (2026-11-09): "I am ready to work anywhere in the world, in any software development role".
  openTo: "Ready to work anywhere in the world, in any software development role.",
  socials: [
    { kind: "github", label: "GitHub", handle: "Prajwalps2603", href: "https://github.com/Prajwalps2603" },
    { kind: "linkedin", label: "LinkedIn", handle: "prajwal-m-p", href: "https://www.linkedin.com/in/prajwal-m-p-190131246" },
    { kind: "x", label: "X", handle: "@PrajwalNair2603", href: "https://x.com/PrajwalNair2603" },
    { kind: "instagram", label: "Instagram", handle: "prajwal_shobha", href: "https://www.instagram.com/prajwal_shobha/" },
  ],
  resume: {
    label: "Résumé",
    href: "https://drive.google.com/file/d/1Q2PdoT5zwjvTVzYTgNlgHAexpmRiYH3k/view?usp=sharing",
  },
  // More work, in his words (2026-11-09: "I have HRMS, Smart Restaurant Management System (SRMS),
  // Support ticket system ..."; then "wedding card generation: no need"). Names only until he gives
  // details.
  alsoBuilt: [
    { name: "HRMS", note: "Human resource management system." },
    { name: "SRMS", note: "Smart Restaurant Management System." },
    { name: "Support Ticket System" },
  ],
  // His LinkedIn newsletter (published weekly); the link is LinkedIn's own "Subscribe" link.
  newsletter: {
    label: "Newsletter",
    title: "AI & Software Insights",
    about: "Weekly insights on AI, software engineering, developer tools, emerging technologies and the future of work.",
    href: "https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7473321654379499520",
  },
};
