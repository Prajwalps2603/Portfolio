/* Through-Line — content data. Every fact traces to the dossier (résumé, GitHub, READMEs re-checked 2026-11-05).
   null in a system's `layers` = the thread passes that layer through an empty grommet ("not part of this build"). */
window.TL_DATA = {
  layers: [
    { n: '01', name: 'Interface' },
    { n: '02', name: 'Logic' },
    { n: '03', name: 'Data' },
    { n: '04', name: 'Intelligence' },
    { n: '05', name: 'Delivery' },
  ],

  /* Threads per system. pts = where the thread pierces each plate (x, z in plate units). */
  systems: {
    maruti: {
      name: 'Maruti Flex operations', note: 'Now · in production',
      layers: ['React / Next.js interfaces', 'Google Apps Script + REST APIs', 'Google Sheets API + MongoDB', null, 'In production · TVS showroom & Maruti Flex ops'],
      pts: [[-0.95, 0.30], [-0.35, 0.05], [0.30, 0.40], [0.85, 0.10], [0.40, 0.45]],
    },
    drone: {
      name: 'Drone Intelligence System', note: 'RAG platform for DGCA drone rules',
      layers: ['React 19 dashboard', 'FastAPI + WebSockets', 'ChromaDB vectors', 'Gemini 2.0 Flash RAG + MCP server', 'Docker Compose'],
      pts: [[-0.90, 0.10], [-0.25, 0.45], [0.35, 0.05], [0.95, 0.40], [0.30, 0.15]],
    },
    mri: {
      name: 'Human Brain Tumor Detection', note: '1st place · BE final-year project, KVGCE 2025',
      layers: ['MRI upload web UI', 'Flask', '12,000+ MRI images · OpenCV', 'CNN · TensorFlow / Keras · ~97%', 'Deployed as a Flask web app'],
      pts: [[-1.05, 0.45], [-0.40, 0.10], [0.15, 0.50], [0.70, 0.15], [1.05, 0.45]],
    },
    audify: {
      name: 'Audify AI', note: 'Android app for telecallers',
      layers: ['React Native · Android', 'HTTPS Node / Express', 'Google Drive + Sheets CRM', 'Four speech-to-text providers', 'Let’s Encrypt auto-renewal'],
      pts: [[-0.70, 0.40], [-0.95, 0.05], [-0.20, 0.45], [0.55, 0.05], [0.95, 0.35]],
    },
    bmv: {
      name: 'BookMyVenue', note: 'Live demo · 20 passing tests',
      layers: ['React 18 + Vite', 'Express · JWT · bcrypt', 'JSON DB · no double booking', null, 'GitHub Actions → Pages'],
      pts: [[-0.80, 0.15], [-0.15, 0.45], [0.45, 0.10], [0.75, 0.45], [0.20, 0.30]],
    },
    ambulance: {
      name: 'Smart Ambulance Traffic Clearance', note: 'IoT prototype',
      layers: ['Flutter app', 'Express + Socket.IO', null, null, 'Mosquitto MQTT + ESP32 firmware · Docker'],
      pts: [[-1.00, 0.20], [-0.30, 0.40], [0.20, 0.10], [0.70, 0.40], [1.00, 0.15]],
    },
  },

  /* Layer sheets: every tool with the systems that prove it. "Listed on résumé" where no public system proves it. */
  tools: [
    [ // 01 Interface
      ['React 19', 'Drone Intelligence System · LifeSync AI · Livora'],
      ['Next.js', 'Maruti Flex operations · ResumAI · MarkVault'],
      ['TypeScript', 'Audify AI · Custom MCP Server · LifeSync AI'],
      ['Tailwind CSS', 'MarkVault · ResumAI'],
      ['Framer Motion', 'Livora · ResumAI'],
      ['React Native', 'Audify AI · LifeVault AI'],
      ['Flutter', 'Smart Ambulance Traffic Clearance'],
      ['Bootstrap', 'Listed on résumé'],
    ],
    [ // 02 Logic
      ['Java 21', 'Dyashin Technosoft internship · Sudoku Solver'],
      ['Spring Boot / MVC', 'Dyashin Technosoft internship'],
      ['Hibernate', 'Dyashin Technosoft internship'],
      ['JDBC', 'Listed on résumé'],
      ['Node.js / Express', 'Audify AI · BookMyVenue · Smart Ambulance · LifeSync AI'],
      ['FastAPI', 'Drone Intelligence System'],
      ['Flask', 'Human Brain Tumor Detection'],
      ['Google Apps Script', 'Maruti Flex operations'],
      ['REST APIs', 'Maruti Flex operations · Drone Intelligence System'],
      ['WebSockets', 'Drone Intelligence System'],
      ['Socket.IO', 'Smart Ambulance Traffic Clearance'],
      ['JWT', 'BookMyVenue'],
    ],
    [ // 03 Data
      ['PostgreSQL', 'Campus Connect · MarkVault (Supabase Postgres)'],
      ['MySQL', 'Dyashin Technosoft internship'],
      ['MongoDB', 'Maruti Flex operations'],
      ['Supabase', 'MarkVault'],
      ['Firebase', 'LifeSync AI'],
      ['ChromaDB', 'Drone Intelligence System'],
      ['Google Sheets', 'Maruti Flex operations · Audify AI · Custom MCP Server'],
    ],
    [ // 04 Intelligence
      ['RAG', 'Drone Intelligence System · LifeSync AI'],
      ['Google Gemini', 'Drone Intelligence System · LifeSync AI'],
      ['Claude / MCP', 'Drone Intelligence System · Custom MCP Server'],
      ['TensorFlow / Keras CNNs', 'Human Brain Tumor Detection'],
      ['Sentence Transformers', 'Drone Intelligence System'],
      ['Speech-to-text', 'Audify AI'],
      ['OpenCV', 'Human Brain Tumor Detection · Road Accident Detection'],
      ['OpenAI API', 'Listed on résumé'],
    ],
    [ // 05 Delivery
      ['Docker', 'Drone Intelligence System · Smart Ambulance Traffic Clearance'],
      ['AWS (EC2, S3, RDS)', 'Techbyheart internship · CloudScape'],
      ['GitHub Actions', 'BookMyVenue'],
      ['GitHub Pages', 'BookMyVenue · Livora · Buddy'],
      ['MQTT + ESP32 firmware', 'Smart Ambulance Traffic Clearance'],
      ['Git', 'Dyashin Technosoft internship · every repository'],
      ['Linux · Maven · Postman', 'Listed on résumé'],
    ],
  ],

  /* Plate decals: short tool lines printed on each paper plate. */
  plateTools: [
    'React 19 · Next.js · TypeScript · Tailwind · Framer Motion · React Native · Flutter',
    'Java 21 · Spring Boot · Node / Express · FastAPI · Flask · Apps Script · WebSockets',
    'PostgreSQL · MySQL · MongoDB · Supabase · Firebase · ChromaDB · Google Sheets',
    'RAG · Gemini · Claude / MCP · TensorFlow / Keras CNNs · speech-to-text · OpenCV',
    'Docker · AWS EC2 / S3 / RDS · GitHub Actions · GitHub Pages · MQTT + ESP32',
  ],

  features: 5, /* Drone, Brain Tumor, Audify, BookMyVenue, Smart Ambulance */
};
