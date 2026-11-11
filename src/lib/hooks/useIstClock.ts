"use client";

import { useEffect, useState } from "react";

const TZ = "Asia/Kolkata";

/** Live Bengaluru clock (IST). Empty until mounted so server and client markup match. */
export function useIstClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const d = new Date();
      setNow(d);
      t = setTimeout(
        tick,
        60_000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 50,
      );
    };
    tick();
    return () => clearTimeout(t);
  }, []);
  if (!now) return null;
  return {
    iso: now.toISOString(),
    time: new Intl.DateTimeFormat("en-IN", {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
      .format(now)
      .toUpperCase(),
    day: new Intl.DateTimeFormat("en-IN", {
      timeZone: TZ,
      weekday: "long",
    }).format(now),
  };
}
