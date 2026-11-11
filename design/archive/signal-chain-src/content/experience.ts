import type { ExperienceItem } from "./types";

export const experience: ExperienceItem[] = [
  {
    id: "maruti-flex",
    role: "Full Stack Developer",
    company: "Maruti Flex Traders LLP",
    start: "2025-12",
    end: null,
    periodLabel: "Dec 2025 – Present",
    type: "Full-time",
    current: true,
    summary:
      "Building and maintaining the end-to-end production applications that run TVS showroom and Maruti Flex operations.",
    highlights: [
      "Develop and maintain end-to-end production applications for TVS showroom & Maruti Flex operations using JavaScript, React/Next.js, Google Apps Script, Google Sheets and MongoDB.",
      "Build responsive user interfaces and integrate them with backend services, APIs and data-management workflows.",
      "Write backend business logic and automation in Google Apps Script that supports day-to-day operational processes.",
    ],
    stack: ["React", "Next.js", "JavaScript", "MongoDB", "Google Apps Script", "Google Sheets", "REST APIs"],
  },
  {
    id: "dyashin",
    role: "Java Full Stack Developer Intern",
    company: "Dyashin Technosoft Pvt Ltd",
    location: "Bengaluru · On-site",
    start: "2025-02",
    end: "2025-10",
    periodLabel: "Feb 2025 – Oct 2025",
    durationLabel: "9 months",
    type: "Internship",
    current: false,
    summary:
      "Trained in Core Java, Spring Boot, Hibernate, REST APIs and frontend technologies; built and deployed full-stack web applications.",
    highlights: [
      "Developed and deployed full-stack web applications with Java, Spring Boot, React and MySQL.",
      "Built RESTful APIs and integrated frontend applications with backend services.",
      "Worked in an Agile team with Git version control, pull requests and code reviews.",
    ],
    stack: ["Java", "Spring Boot", "Hibernate", "React", "MySQL", "REST APIs", "Git"],
  },
  {
    id: "rooman",
    role: "Machine Learning Intern",
    company: "Rooman Technologies",
    location: "Dakshina Kannada · Hybrid",
    start: "2024-09",
    end: "2025-05",
    periodLabel: "Sep 2024 – May 2025",
    durationLabel: "9 months",
    type: "Internship",
    current: false,
    summary:
      "Hands-on machine learning: data analysis, preprocessing and building and evaluating predictive models in Python.",
    highlights: [
      "Built, evaluated and tuned predictive models with Python ML libraries.",
      "Performed exploratory data analysis, preprocessing and model evaluation.",
    ],
    stack: ["Python", "Machine Learning", "Data Analysis"],
  },
  {
    id: "techbyheart",
    role: "Cloud & Cybersecurity Intern",
    company: "Techbyheart (TBH)",
    location: "Sullia · On-site",
    start: "2023-10",
    end: "2023-11",
    periodLabel: "Oct 2023 – Nov 2023",
    durationLabel: "2 months",
    type: "Internship",
    current: false,
    summary:
      "AWS cloud training (EC2, S3, RDS, deployment) and cybersecurity fundamentals — network security, threat detection and vulnerability assessment.",
    highlights: [
      "Provisioned and managed AWS infrastructure including EC2 instances, S3 and RDS.",
      "Studied network security, threat detection and vulnerability assessment.",
    ],
    stack: ["AWS EC2", "S3", "RDS", "Network Security"],
  },
];
