/**
 * The garden's data: Prajwal's public GitHub contribution calendar and public repos, as read by
 * scripts/garden-data.mjs at build time (./garden.json). Nothing here is written by hand.
 */
import raw from "./garden.json";

export type GardenDay = {
  date: string;
  count: number;
  level: number;
  week: number;
  weekday: number;
  future: boolean;
};
export type GardenSeason = {
  key: string;
  label: string;
  days: GardenDay[];
  weeks: number;
};
export type GardenRepo = {
  name: string;
  url: string;
  language: string | null;
  description: string | null;
  created: string;
  pushed: string;
  stars: number;
  /** KB, as GitHub reports it */
  size?: number;
  /** where it runs: its website field on GitHub or its GitHub Pages address, only if that answers */
  live?: string | null;
};
export type GardenStats = {
  total: number;
  bloom: number;
  busiest: GardenDay | null;
  /** the most recent day with the busiest count gets the ribbon */
  prize: string | null;
  streak: { days: number; from: string; to: string } | null;
};

type RawSeason = {
  key: string;
  label: string;
  days: [string, number, number][];
};
type Raw = {
  user: string;
  profile: string;
  fetched: string;
  seasons: RawSeason[];
  repos: GardenRepo[];
};
const data = raw as Raw;

const weekdayOf = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();

function season(s: RawSeason): GardenSeason {
  const start = s.days[0] ? weekdayOf(s.days[0][0]) : 0;
  const days = s.days.map(([date, count, level], i): GardenDay => {
    const k = start + i;
    return {
      date,
      count,
      level,
      week: Math.floor(k / 7),
      weekday: k % 7,
      future: date > data.fetched,
    };
  });
  return {
    key: s.key,
    label: s.label,
    days,
    weeks: days.length ? days[days.length - 1].week + 1 : 0,
  };
}

export const garden = {
  user: data.user,
  profile: data.profile,
  fetched: data.fetched,
  seasons: data.seasons.map(season),
  repos: data.repos,
};

export function statsOf(s: GardenSeason): GardenStats {
  const past = s.days.filter((d) => !d.future);
  const total = past.reduce((n, d) => n + d.count, 0);
  const bloom = past.filter((d) => d.count > 0).length;
  let busiest: GardenDay | null = null;
  for (const d of past)
    if (d.count > 0 && (!busiest || d.count >= busiest.count)) busiest = d;
  let best: GardenStats["streak"] = null;
  let run = 0;
  let from = "";
  for (const d of past) {
    if (d.count > 0) {
      if (!run) from = d.date;
      run++;
      if (!best || run > best.days) best = { days: run, from, to: d.date };
    } else run = 0;
  }
  return { total, bloom, busiest, prize: busiest?.date ?? null, streak: best };
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** "Sun 12 Oct 2026" */
export function dayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${DAYS[weekdayOf(iso)]} ${d} ${MONTHS[m - 1]} ${y}`;
}
/** "12 Oct" */
export const shortDate = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};
/** "Oct 2026" */
export const monthYear = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};
export const monthOf = (iso: string) => MONTHS[Number(iso.slice(5, 7)) - 1];
