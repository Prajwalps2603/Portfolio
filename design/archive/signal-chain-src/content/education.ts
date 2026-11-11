import type { Certification, EducationItem } from "./types";

export const education: EducationItem[] = [
  {
    id: "kvgce",
    institution: "KVG College of Engineering",
    qualification: "Bachelor of Engineering",
    field: "Electronics & Communication Engineering",
    location: "Sullia, Karnataka",
    period: "2021 — 2025",
    grade: "7.9 CGPA",
    note: "1st Place — BE Final Year Project (Brain Tumor Detection)",
  },
  {
    id: "bharath-matha-pu",
    institution: "Bharath Matha PU College",
    qualification: "Pre-University (Science)",
    field: "Physics, Chemistry, Mathematics, Computer Science",
    location: "Koppa, Karnataka",
    period: "2019 — 2021",
    grade: "72%",
  },
  {
    id: "bharath-matha-school",
    institution: "Bharath Matha High School",
    qualification: "SSLC (Class X)",
    field: "Secondary school",
    location: "Koppa, Karnataka",
    period: "2019",
    grade: "75%",
  },
];

export const certifications: Certification[] = [
  {
    id: "oracle-agentic-ai",
    title: "Oracle Certified Foundations Associate — Agentic AI",
    issuer: "Oracle University",
    year: "2026",
    kind: "Certification",
    href: "https://catalog-education.oracle.com/ords/certview/sharebadge?id=9AAAC1F3B6368ADE76D13A16495BA0C0748267A7AC0DFD9677FB8A639833CC61",
  },
  {
    id: "github-foundations",
    title: "GitHub Foundations",
    issuer: "GitHub · Credly",
    year: "2025",
    kind: "Certification",
    href: "https://www.credly.com/badges/a810b47b-11af-4dad-88f9-7ea37720f30d/linked_in_profile",
  },
  {
    id: "dyashin-java-full-stack",
    title: "Java Full Stack Development",
    issuer: "Dyashin TechnoSoft",
    year: "2025",
    kind: "Certification",
    href: "https://drive.google.com/file/d/1jAL0CwQWRCJq0UhWTULsLI8yptZkW8EW/view?usp=sharing",
  },
  {
    id: "be-first-place",
    title: "1st Place — BE Final Year Project",
    issuer: "KVG College of Engineering",
    year: "2025",
    kind: "Award",
    note: "Human Brain Tumor Detection using Deep Learning",
  },
];
