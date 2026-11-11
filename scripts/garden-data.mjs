// The garden's data (src/content/garden.json): Prajwal's public GitHub contribution calendar
// (the last 12 months, and each calendar year since the account was opened) and his public repos.
// Runs before every build (package.json "build"), so a deploy replants the garden with fresh data.
// GitHub's calendar cannot be read from the browser (no CORS), so it is read here, at build time.
// If GitHub cannot be reached, the last snapshot is kept and the build goes on.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const USER = "Prajwalps2603";
const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "content",
  "garden.json",
);
const UA = {
  "User-Agent": "portfolio-garden-build",
  Accept: "text/html,application/json",
};

async function get(url, json = false) {
  const res = await fetch(url, {
    headers: UA,
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return json ? res.json() : res.text();
}

/** [[date, count, level], ...] from the calendar's HTML (each day's tooltip holds its count). */
function parseCalendar(html) {
  const ids = new Map();
  for (const m of html.matchAll(
    /data-date="(\d{4}-\d{2}-\d{2})" id="(contribution-day-component-\d+-\d+)"[^>]*data-level="(\d)"/g,
  ))
    ids.set(m[2], [m[1], Number(m[3])]);
  const days = [];
  for (const m of html.matchAll(
    /<tool-tip[^>]*for="(contribution-day-component-\d+-\d+)"[^>]*>([^<]*)<\/tool-tip>/g,
  )) {
    const day = ids.get(m[1]);
    if (!day) continue;
    const n = /^(\d+) contributions?/.exec(m[2].trim());
    days.push([day[0], n ? Number(n[1]) : 0, day[1]]);
  }
  days.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  if (days.length < 300) throw new Error(`only ${days.length} days parsed`);
  return days;
}

const old = fs.existsSync(OUT)
  ? JSON.parse(fs.readFileSync(OUT, "utf8"))
  : null;
const now = new Date();
let seasons = old?.seasons ?? null;
let repos = old?.repos ?? null;
let fresh = false;

// the repositories (the REST API): each part is fetched on its own, so one failing keeps the other
try {
  repos = (
    await get(
      `https://api.github.com/users/${USER}/repos?per_page=100&sort=created`,
      true,
    )
  )
    .filter((r) => !r.fork && r.name.toLowerCase() !== USER.toLowerCase())
    .map((r) => ({
      name: r.name,
      url: r.html_url,
      language: r.language,
      description: r.description,
      created: r.created_at.slice(0, 10),
      pushed: r.pushed_at.slice(0, 10),
      stars: r.stargazers_count,
      size: r.size,
      // where it runs, if anywhere: its website field on GitHub, else its GitHub Pages address
      live:
        r.homepage ||
        (r.has_pages
          ? r.name.toLowerCase() === `${USER.toLowerCase()}.github.io`
            ? `https://${USER.toLowerCase()}.github.io/`
            : `https://${USER.toLowerCase()}.github.io/${r.name}/`
          : null),
    }))
    .sort((a, b) => (a.created < b.created ? 1 : -1));
  // a live address is kept only if it answers (Pages can be switched on with nothing built)
  await Promise.all(
    repos.map(async (r) => {
      if (!r.live) return;
      try {
        const res = await fetch(r.live, {
          redirect: "follow",
          signal: AbortSignal.timeout(15000),
        });
        r.live = res.ok ? res.url || r.live : null;
      } catch {
        r.live = null;
      }
    }),
  );
  fresh = true;
} catch (e) {
  console.warn(
    `garden-data: repos not reachable (${e.message}); keeping the last snapshot`,
  );
}

// the contribution calendar (the last 12 months, and each year since the account was opened)
try {
  const user = await get(`https://api.github.com/users/${USER}`, true);
  const first = Number(String(user.created_at).slice(0, 4));
  const next = [
    {
      key: "last",
      label: "Last 12 months",
      days: parseCalendar(
        await get(`https://github.com/users/${USER}/contributions`),
      ),
    },
  ];
  for (let y = now.getUTCFullYear(); y >= first; y--) {
    const days = parseCalendar(
      await get(
        `https://github.com/users/${USER}/contributions?from=${y}-01-01&to=${y}-12-31`,
      ),
    );
    next.push({
      key: String(y),
      label: String(y),
      days: days.filter(([d]) => d.startsWith(String(y))),
    });
  }
  seasons = next;
  fresh = true;
} catch (e) {
  console.warn(
    `garden-data: calendar not reachable (${e.message}); keeping the last snapshot`,
  );
}

if (!seasons || !repos) {
  console.error("garden-data: GitHub not reachable and no snapshot exists");
  process.exit(1);
}
if (fresh) {
  fs.writeFileSync(
    OUT,
    JSON.stringify({
      user: USER,
      profile: `https://github.com/${USER}`,
      fetched: now.toISOString().slice(0, 10),
      seasons,
      repos,
    }) + String.fromCharCode(10),
  );
  console.log(
    `garden-data: ${repos.length} repos, ${seasons.length - 1} calendar years -> src/content/garden.json`,
  );
}
